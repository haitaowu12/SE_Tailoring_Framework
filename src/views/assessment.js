/**
 * Assessment View — Step-by-step metric scoring wizard
 * v3.3: Hierarchy-aware — loads/saves per-element, shows inherited metrics
 */
import { METRICS, DIMENSIONS, CORE_PROCESSES, FRAMEWORK_META, PROCESS_GROUPS, METRIC_PROCESS_MAP, CONDITIONAL_METRIC_PROCESS_DRIVERS, OVERRIDE_CONDITIONS, METRIC_QUALIFIER_DEFINITIONS, BINDING_ASSURANCE_QUALIFIERS, METRIC_DEFINITION_VERSION } from '../data/se-tailoring-data.js';
import { runFullAssessment, getDriverAttribution, computeRigorBudgetStatus } from '../utils/assessment-engine.js';
import { getState, setState, showToast, getActiveNode, getElementBreadcrumbs, setElementScores, setElementAssessmentResult, markMetricManual } from '../state.js';
import { getCurrentRouteContext, navigateTo, processDetailsHref } from '../router.js';
import { escapeHtml } from '../utils/safe-text.js';
import { assessMetricCompleteness, getM15ScopeOptions } from '../utils/assessment-integrity.js';
import { assessRule11Disposition, assessWarningDispositions, GENERAL_WARNING_OUTCOMES, RULE_11_OUTCOMES } from '../utils/rule-dispositions.js';
import { assessCsiResponse, CSI_RESPONSE_ACTIONS } from '../utils/csi-response.js';
import { assessCorrelatedEvidence } from '../utils/correlated-evidence.js';
import { propagateSafetyOverrides } from '../utils/inheritance-engine.js';
import { renderMetricSpiderwebSvg } from '../utils/report-visuals.js';
import { getLocalCalendarDate } from '../utils/date-validation.js';

const STEPS = [
  { id: 'info', title: 'Project Info', icon: '📋' },
  { id: 'complexity', title: 'System Complexity', icon: '🔧' },
  { id: 'safety', title: 'Safety & Criticality', icon: '🛡️' },
  { id: 'constraints', title: 'Project Constraints', icon: '📏' },
  { id: 'stakeholder', title: 'Stakeholder Context', icon: '👥' },
  { id: 'results', title: 'Results', icon: '📊' }
];

let currentStep = 0;
let visitedSteps = new Set([0]);
let localScores = {};
let localProject = {};
let localMetricAssessments = {};
let localAssuranceObligations = [];
let localRuleDispositions = {};
let localCsiResponse = {};
const M15_SCOPE_OPTIONS = getM15ScopeOptions();

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function makeMetricAssessment(metricId, updates = {}) {
  const existing = localMetricAssessments[metricId] || {};
  return {
    ...existing,
    ...updates,
    score: hasOwn(updates, 'score') ? updates.score : existing.score ?? localScores[metricId] ?? 3,
    status: updates.status || existing.status || 'assessed',
    definitionVersion: METRIC_DEFINITION_VERSION,
    qualifiers: Array.isArray(updates.qualifiers) ? updates.qualifiers : (existing.qualifiers || []),
    rationale: updates.rationale ?? existing.rationale ?? '',
    evidenceRefs: Array.isArray(updates.evidenceRefs) ? updates.evidenceRefs : (existing.evidenceRefs || [])
  };
}

function initializeMetricAssessments() {
  METRICS.forEach(metric => {
    if (!localMetricAssessments[metric.id]) {
      localMetricAssessments[metric.id] = makeMetricAssessment(metric.id);
    }
  });
}

function persistAssessmentDraft() {
  const metricAssessments = JSON.parse(JSON.stringify(localMetricAssessments));
  const assuranceObligations = JSON.parse(JSON.stringify(localAssuranceObligations));
  const scores = { ...localScores };
  const activeNode = getActiveNode();
  if (activeNode) {
    activeNode.metricAssessments = JSON.parse(JSON.stringify(metricAssessments));
    activeNode.assuranceObligations = JSON.parse(JSON.stringify(assuranceObligations));
    setElementScores(activeNode.id, scores);
  }
  setState({
    projectInfo: { ...localProject },
    scores,
    metricAssessments,
    assuranceObligations
  });
}

function metricDecisionPath(metricId) {
  if (metricId === 'M9' || metricId === 'M10') {
    return 'Feeds the Constraint Stress Index and feasibility response; it does not raise process levels directly.';
  }
  if (metricId === 'M16') {
    return 'Feeds the Adoption Readiness Index; it does not raise or lower process levels directly.';
  }

  const processIds = Object.entries(METRIC_PROCESS_MAP)
    .filter(([, mapping]) => Object.prototype.hasOwnProperty.call(mapping, metricId))
    .map(([processId]) => Number(processId));
  const processNames = processIds
    .map(processId => CORE_PROCESSES.find(process => process.id === processId)?.name)
    .filter(Boolean);
  const floorCount = OVERRIDE_CONDITIONS.filter(condition => condition.trigger?.metric === metricId).length;
  const conditionalCount = CONDITIONAL_METRIC_PROCESS_DRIVERS.filter(driver => driver.metric === metricId).length;
  const processScope = processNames.length
    ? `Informs ${processNames.length} mapped process recommendations, including ${processNames.slice(0, 2).join(' and ')}${processNames.length > 2 ? ' and others' : ''}.`
    : 'Does not directly drive a process recommendation.';
  const floorScope = floorCount
    ? ` It also participates in ${floorCount} threshold-based floor${floorCount === 1 ? '' : 's'}.`
    : '';
  const conditionalScope = conditionalCount
    ? ' Additional scoped assurance floors apply only when the related obligation is confirmed.'
    : '';
  return `${processScope}${floorScope}${conditionalScope}`;
}

function compareScore(lhs, op, rhs) {
  if (op === '>=') return lhs >= rhs;
  if (op === '=') return lhs === rhs;
  if (op === '<=') return lhs <= rhs;
  return false;
}

function isBasicExcluded(processId, scores, projectInfo = {}) {
  for (const ov of OVERRIDE_CONDITIONS) {
    const trigger = ov.trigger || {};
    let triggered = false;

    if (trigger.type === 'metric') {
      const score = typeof scores?.[trigger.metric] === 'number' ? scores[trigger.metric] : 3;
      triggered = compareScore(score, trigger.op, trigger.value);
    } else if (trigger.type === 'context') {
      triggered = projectInfo?.[trigger.field] === trigger.equals;
    } else if (trigger.type === 'binding-assurance') {
      const score = typeof scores?.[trigger.metric] === 'number' ? scores[trigger.metric] : 3;
      triggered = compareScore(score, trigger.op, trigger.value) && (projectInfo.assuranceObligations || []).some(obligation =>
        obligation.bindingStatus === 'confirmed' && BINDING_ASSURANCE_QUALIFIERS.includes(obligation.type) &&
        String(obligation.authority || '').trim() && String(obligation.sourceRef || '').trim() &&
        (obligation.processScope || []).map(Number).includes(Number(processId))
      );
    }

    if (triggered && ov.processes.includes(processId)) {
      return { excluded: true, reason: ov.label, minLevel: ov.minLevel };
    }
  }
  return { excluded: false, reason: null, minLevel: null };
}

export function renderAssessment(container) {
  const isFreshLoad = !container.querySelector('.assessment-container');
  if (isFreshLoad) {
    const state = getState();
    const activeNode = getActiveNode();
    // Load per-element scores if available, otherwise fall back to global
    const elementScores = activeNode?.scores || {};
    localScores = Object.keys(elementScores).length > 0
      ? { ...elementScores }
      : { ...state.scores };
    localProject = { securityCritical: false, ...state.projectInfo };
    localMetricAssessments = JSON.parse(JSON.stringify(activeNode?.metricAssessments || state.metricAssessments || {}));
    localAssuranceObligations = JSON.parse(JSON.stringify(activeNode?.assuranceObligations || state.assuranceObligations || []));
    localRuleDispositions = JSON.parse(JSON.stringify(activeNode?.ruleDispositions || state.ruleDispositions || {}));
    localCsiResponse = JSON.parse(JSON.stringify(activeNode?.csiResponse || state.csiResponse || {}));

    METRICS.forEach(m => {
      if (localScores[m.id] === undefined) {
        localScores[m.id] = 3;
      }
    });
    initializeMetricAssessments();
  }

  const activeNode = getActiveNode();
  const isHierarchical = activeNode && activeNode.id !== 'default';
  const crumbs = isHierarchical ? getElementBreadcrumbs(activeNode.id) : [];
  const activeNodeName = escapeHtml(activeNode?.name || '');
  const activeAssessmentType = ['full', 'quick', 'inherited'].includes(activeNode?.assessmentType) ? activeNode.assessmentType : 'full';
  const completeness = assessMetricCompleteness(localScores, localMetricAssessments);

  container.innerHTML = `
    <div class="assessment-container">
      ${isHierarchical ? `
      <div class="hierarchy-context-bar">
        <div class="hierarchy-crumbs">
          ${crumbs.map((c, i) => `<span class="h-crumb${c.id === activeNode.id ? ' active' : ''}">${escapeHtml(c.name)}</span>${i < crumbs.length - 1 ? ' <span class="h-sep">›</span> ' : ''}`).join('')}
        </div>
        <div class="hierarchy-badges">
          <span class="se-type-badge ${activeAssessmentType}">${activeAssessmentType}</span>
          <button class="btn btn-ghost btn-sm" id="btn-back-to-tree">← Back to Elements</button>
        </div>
      </div>` : ''}
      <div class="assessment-header">
        <h2>🎯 ${isHierarchical ? activeNodeName + ' — ' : ''}Assessment</h2>
        <p class="text-secondary">${isHierarchical
          ? `Scoring metrics for system element: ${activeNodeName} (${activeAssessmentType} assessment)`
          : 'Score 16 metrics to get process-specific tailoring recommendations'}</p>
      </div>
      <p class="assessment-guidance mb-lg">Set a 1–5 score for each metric. Scores drive the tailoring profile; optional justification notes are kept with the assessment record.</p>
      <div class="step-progress">
        ${STEPS.map((s, i) => `
          <button class="step-dot ${visitedSteps.has(i) ? 'visited' : ''} ${i === currentStep ? 'current' : ''}" type="button" data-step="${i}" aria-label="${i === currentStep ? 'Current step' : visitedSteps.has(i) ? 'Visited step' : 'Go to step'}: ${escapeHtml(s.title)}" ${i === currentStep ? 'aria-current="step"' : ''}>
            <span class="step-icon">${s.icon}</span>
            <span class="step-label">${s.title}</span>
          </button>
        `).join('<div class="step-line"></div>')}
      </div>
      <p class="step-progress-note text-xs text-secondary">The marker shows where you are; previously opened sections are marked as visited, not completed.</p>
      <div id="step-content" class="step-content"></div>
      <div class="step-actions">
        <button class="btn btn-secondary" id="btn-prev" ${currentStep === 0 ? 'disabled' : ''}>← Back</button>
        <span class="step-indicator text-sm text-secondary">Step ${currentStep + 1} of ${STEPS.length}</span>
        <button class="btn btn-primary" id="btn-next">${currentStep === STEPS.length - 1
          ? completeness.complete ? '✓ Complete Baseline' : `💾 Save Work in Progress (${completeness.completeCount}/16)`
          : 'Next →'}</button>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .assessment-container { max-width: 900px; margin: 0 auto; }
    .assessment-header { text-align: center; margin-bottom: 32px; }
    .step-progress { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 16px; flex-wrap: wrap; }
    .step-dot { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px; cursor: pointer; opacity: 0.4; transition: all 0.3s; border: 0; background: transparent; color: inherit; font: inherit; }
    .step-dot.visited { opacity: .75; }
    .step-dot.current { opacity: 1; }
    .step-dot.current .step-icon { background: var(--accent-primary); transform: scale(1.15); }
    .step-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--bg-tertiary); font-size: 16px; transition: all 0.3s; }
    .step-label { font-size: 11px; color: var(--text-secondary); white-space: nowrap; }
    .step-line { width: 24px; height: 2px; background: var(--border-subtle); margin-bottom: 18px; }
    .step-progress-note { text-align: center; margin: -6px 0 28px; }
    .step-content { min-height: 400px; }
    .step-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--border-subtle); }
    .metric-group { margin-bottom: 24px; }
    .metric-item { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 20px; margin-bottom: 12px; transition: all 0.2s; }
    .metric-item:hover { border-color: var(--border-medium); }
    .metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .metric-name { font-weight: 600; font-size: 15px; }
    .metric-id { font-size: 12px; font-weight: 700; color: var(--accent-primary-light); background: rgba(99,102,241,0.12); padding: 2px 8px; border-radius: 4px; }
    .metric-score-display { font-size: 24px; font-weight: 800; min-width: 40px; text-align: center; transition: color 0.2s; }
    .metric-anchors { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; font-size: 11px; color: var(--text-tertiary); margin-top: 6px; padding: 0 2px; }
    .metric-anchors span { max-width: 48%; line-height: 1.35; }
    .metric-anchors span:last-child { text-align: right; }
    .metric-description { font-size: 13px; color: var(--text-secondary); margin-top: 8px; padding: 6px 10px; background: rgba(99,102,241,0.05); border-radius: 6px; }
    .assessment-guidance { max-width: 680px; margin-inline: auto; color: var(--text-secondary); font-size: 13px; text-align: center; }
    .metric-assessment-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 12px; }
    .metric-status { display: inline-flex; align-items: center; gap: 6px; color: var(--accent-success); }
    .metric-status::before { content: '✓'; font-weight: 800; }
    .metric-status.unknown, .metric-status.needs-review { color: var(--accent-warning); }
    .metric-status.unknown::before, .metric-status.needs-review::before { content: '•'; }
    .metric-unknown-toggle { display: inline-flex; align-items: center; gap: 6px; color: var(--text-secondary); cursor: pointer; }
    .metric-unknown-toggle input { accent-color: var(--accent-warning); }
    .metric-impact { margin-top: 12px; padding: 9px 10px; border-left: 2px solid var(--accent-primary-dark); color: var(--text-secondary); font-size: 12px; line-height: 1.45; }
    .metric-impact span { display: block; margin-bottom: 2px; color: var(--accent-primary-light); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
    .metric-justification, .metric-advanced { border-top: 1px solid var(--border-subtle); padding-top: 10px; }
    .metric-justification > summary, .metric-advanced > summary { display: flex; justify-content: space-between; gap: 12px; cursor: pointer; color: var(--accent-primary-light); font-size: 12px; font-weight: 600; list-style: none; }
    .metric-justification > summary::-webkit-details-marker, .metric-advanced > summary::-webkit-details-marker { display: none; }
    .metric-justification > summary::after, .metric-advanced > summary::after { content: '+'; color: var(--text-tertiary); font-size: 16px; line-height: 1; }
    .metric-justification[open] > summary::after, .metric-advanced[open] > summary::after { content: '−'; color: var(--accent-primary-light); }
    .metric-justification label { display: block; margin-top: 10px; color: var(--text-secondary); }
    .metric-justification-input { min-height: 74px; resize: vertical; }
    .result-guidance { max-width: 760px; color: var(--text-secondary); font-size: 13px; }
    .info-form { display: grid; gap: 16px; max-width: 500px; margin: 0 auto; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
    .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
    .result-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px; }
    .result-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .result-process { font-weight: 600; font-size: 14px; }
    .drivers-list { font-size: 12px; color: var(--text-secondary); }
    .driver-item { display: flex; gap: 6px; align-items: center; padding: 2px 0; }
    .results-overview { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(240px, .75fr); gap: 16px; align-items: stretch; }
    .results-overview .spiderweb-figure { height: 100%; }
    .results-breakdown { margin-top: 24px; border: 1px solid var(--border-subtle); border-radius: 12px; background: var(--bg-card); }
    .results-breakdown > summary { padding: 16px 18px; cursor: pointer; color: var(--accent-primary-light); font-weight: 700; }
    .results-breakdown-body { padding: 0 18px 18px; }
    @media (max-width: 760px) { .results-overview { grid-template-columns: 1fr; } .step-line { width: 10px; } .step-label { white-space: normal; text-align: center; max-width: 70px; } }
    .override-banner { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; padding: 14px; margin-bottom: 16px; }
    .violation-banner { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 14px; margin-bottom: 16px; }
    .fix-banner { background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3); border-radius: 10px; padding: 14px; margin-bottom: 16px; }
    .hierarchy-context-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 14px; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); border-radius: 8px; margin-bottom: 16px; }
    .hierarchy-crumbs { display: flex; align-items: center; gap: 4px; font-size: 13px; }
    .h-crumb { color: var(--text-secondary); }
    .h-crumb.active { color: var(--accent-primary-light); font-weight: 600; }
    .h-sep { color: var(--text-tertiary); }
    .hierarchy-badges { display: flex; align-items: center; gap: 8px; }
    .se-type-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
    .se-type-badge.full { background: rgba(99,102,241,0.15); color: var(--accent-primary-light); }
    .se-type-badge.quick { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .se-type-badge.inherited { background: rgba(52,211,153,0.15); color: #34d399; }
    .metric-inherited-lock { opacity: 0.5; pointer-events: none; position: relative; }
    .metric-inherited-lock::after { content: '↑ Inherited'; position: absolute; top: 8px; right: 12px; font-size: 10px; color: #34d399; background: rgba(52,211,153,0.15); padding: 1px 6px; border-radius: 3px; }
  `;
  container.appendChild(style);

  renderStep(container);

  container.querySelector('#btn-next').addEventListener('click', () => {
    if (currentStep < STEPS.length - 1) {
      currentStep++;
      visitedSteps.add(currentStep);
      renderAssessment(container);
    } else {
      finalizeAssessment();
    }
  });
  container.querySelector('#btn-prev').addEventListener('click', () => {
    if (currentStep > 0) { currentStep--; visitedSteps.add(currentStep); renderAssessment(container); }
  });
  container.querySelectorAll('.step-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      currentStep = parseInt(dot.dataset.step);
      visitedSteps.add(currentStep);
      renderAssessment(container);
    });
  });
  // Back to elements tree (hierarchy context)
  container.querySelector('#btn-back-to-tree')?.addEventListener('click', () => navigateTo('elements'));
}

function renderStep(container) {
  const content = container.querySelector('#step-content');
  const step = STEPS[currentStep];

  if (step.id === 'info') {
    content.innerHTML = `
      <h3 class="mb-lg">Project Information</h3>
      <div class="alert alert-info mb-lg"><strong>Pilot privacy:</strong> use a non-identifying project code. Do not enter personal names, organization names, confidential project names, or sensitive operational information.</div>
      <div class="info-form">
        <div class="form-group">
          <label class="form-label" for="proj-name">Project code</label>
          <input class="input" id="proj-name" autocomplete="off" placeholder="e.g., PILOT-07" value="${escapeHtml(localProject.name || '')}">
        </div>
        <div class="form-group">
          <label class="form-label" for="proj-date">Date</label>
          <input class="input" id="proj-date" type="date" value="${escapeHtml(localProject.date || getLocalCalendarDate())}">
        </div>
        <div class="form-group">
          <label class="form-label" for="proj-team">Team code (optional)</label>
          <input class="input" id="proj-team" autocomplete="off" placeholder="e.g., COHORT-B" value="${escapeHtml(localProject.team || '')}">
        </div>
        <div class="form-group">
          <label class="form-label" for="proj-phase">Project Phase</label>
          <select class="select" id="proj-phase">
            <option value="">Select phase...</option>
            <option value="concept" ${localProject.phase === 'concept' ? 'selected' : ''}>Concept / Pre-project</option>
            <option value="development" ${localProject.phase === 'development' ? 'selected' : ''}>Development</option>
            <option value="production" ${localProject.phase === 'production' ? 'selected' : ''}>Production</option>
            <option value="operations" ${localProject.phase === 'operations' ? 'selected' : ''}>Operations & Support</option>
            <option value="disposal" ${localProject.phase === 'disposal' ? 'selected' : ''}>Retirement / Disposal</option>
          </select>
        </div>
      </div>
    `;
    ['proj-name', 'proj-date', 'proj-team', 'proj-phase'].forEach(id => {
      content.querySelector(`#${id}`).addEventListener('change', (e) => {
        const key = id.replace('proj-', '');
        localProject[key] = e.target.value;
      });
    });
    return;
  }
  if (step.id === 'results') {
    renderResults(content);
    return;
  }

  // Metric scoring step
  const dim = DIMENSIONS.find(d => d.id === step.id);
  const dimMetrics = METRICS.filter(m => m.dimension === step.id);
  content.innerHTML = `
    <div class="mb-lg">
      <h3 style="color: ${dim.color}">${step.icon} ${dim.name}</h3>
    </div>
    <div class="metric-group">
      ${dimMetrics.map(m => {
    const assessment = localMetricAssessments[m.id] || makeMetricAssessment(m.id);
    const val = localScores[m.id] ?? 3;
    const isUnknown = assessment.status === 'unknown';
    const isMigrationRequired = ['not-applicable', 'migration-required'].includes(assessment.status);
    const displayValue = isUnknown || isMigrationRequired ? '—' : val;
    const scoreColor = val >= 4 ? 'var(--level-comprehensive)' : val >= 3 ? 'var(--level-standard)' : 'var(--level-basic)';
    const statusText = isUnknown
      ? 'Unknown — preview only'
      : assessment.status === 'inherited-confirmed'
        ? 'Inherited score confirmed'
        : isMigrationRequired
          ? 'Reassessment required'
          : 'Assessed 1–5 score';
    return `
        <div class="metric-item">
          <div class="metric-header">
            <div class="flex items-center gap-sm">
              <span class="metric-id">${m.id}</span>
              <span class="metric-name">${m.name}</span>
            </div>
            <div class="flex items-center gap-sm">
              ${m.guidedQuestions ? `<button class="btn btn-sm btn-outline wizard-btn" data-metric="${m.id}" style="font-size: 11px; padding: 2px 8px;">Help me choose</button>` : ''}
              <div class="metric-score-display" id="score-${m.id}" style="color:${scoreColor}">${displayValue}</div>
            </div>
          </div>
          <input type="range" class="range-slider" id="slider-${m.id}" min="1" max="5" step="1" value="${val}" aria-label="Score ${m.id}: ${escapeHtml(m.name)}" aria-describedby="desc-${m.id}">
          <div class="metric-anchors">
            <span>${m.anchors[1]}</span>
            <span>${m.anchors[5]}</span>
          </div>
          <div class="metric-description" id="desc-${m.id}">${isUnknown ? 'Unknown — score 3 is used only to preview downstream behavior.' : isMigrationRequired ? 'Imported value needs a current 1–5 reassessment before it can be baselined.' : (m.anchors[val] || '')}</div>
          <div class="metric-assessment-meta mt-sm">
            <span class="metric-status ${isUnknown ? 'unknown' : isMigrationRequired ? 'needs-review' : 'confirmed'}">${statusText}</span>
            <label class="metric-unknown-toggle"><input type="checkbox" class="metric-unknown" data-metric="${m.id}" aria-label="Mark ${m.id} ${escapeHtml(m.name)} as Unknown" ${isUnknown ? 'checked' : ''}> Unknown</label>
          </div>
          ${assessment.status === 'not-applicable' ? '<div class="text-xs mt-sm" style="color:var(--accent-warning);">Imported N/A cannot complete a current baseline. Choose an assessed 1–5 score or explicitly record Unknown.</div>' : ''}
          <div class="metric-impact"><span>Decision path</span>${escapeHtml(metricDecisionPath(m.id))}</div>
          ${m.id === 'M15' ? renderAssuranceObligationControls() : ''}
          ${renderMetricJustificationControls(m.id)}
          <div class="metric-wizard hidden" id="wizard-${m.id}" style="display: none; margin-top: 12px; padding: 16px; background: rgba(99,102,241,0.05); border-radius: 8px; border: 1px solid var(--accent-primary-light);"></div>
        </div>`;
  }).join('')}
    </div>
  `;

  // Slider handlers
  dimMetrics.forEach(m => {
    const slider = content.querySelector(`#slider-${m.id}`);
    slider.addEventListener('input', (e) => {
      setMetricScore(m.id, parseInt(e.target.value), content);
    });

    const wizardBtn = content.querySelector(`.wizard-btn[data-metric="${m.id}"]`);
    if (wizardBtn) {
      wizardBtn.addEventListener('click', () => startWizard(m.id, content));
    }
  });
  bindAssuranceControls(content);
  content.querySelectorAll('.metric-unknown').forEach(input => input.addEventListener('change', () => {
    const metricId = input.dataset.metric;
    localMetricAssessments[metricId] = makeMetricAssessment(metricId, {
      score: input.checked ? null : (localScores[metricId] ?? 3),
      status: input.checked ? 'unknown' : 'assessed'
    });
    renderAssessment(container);
  }));
  content.querySelectorAll('.metric-justification-input').forEach(input => input.addEventListener('input', () => {
    const metricId = input.dataset.metric;
    localMetricAssessments[metricId] = makeMetricAssessment(metricId, { rationale: input.value });
    persistAssessmentDraft();
  }));
}

function renderMetricJustificationControls(metricId) {
  const assessment = localMetricAssessments[metricId] || {};
  const rationale = assessment.rationale || '';
  const hasRationale = Boolean(rationale.trim());
  const sharedEvidenceHint = assessment.evidenceContext
    ? '<div class="text-xs text-secondary mt-sm">If this metric shares imported evidence with M5, M6, or M8, use this note to record its distinct consequence analysis.</div>'
    : '';
  return `<details class="metric-justification mt-md">
    <summary><span>Justification note</span><span class="text-xs text-secondary">${hasRationale ? 'Recorded' : 'Optional'}</span></summary>
    <label class="text-xs" for="metric-note-${metricId}">Optional context for this score</label>
    ${sharedEvidenceHint}
    <textarea class="input mt-sm metric-justification-input" id="metric-note-${metricId}" data-metric="${metricId}" rows="3" placeholder="Capture the project fact, assumption, or decision behind this score.">${escapeHtml(rationale)}</textarea>
  </details>`;
}

function primaryAssuranceObligation() {
  return localAssuranceObligations[0] || {
    id: 'AO-1', type: 'regulatory-mandate', bindingStatus: 'unconfirmed', authority: '', sourceRef: '',
    processScope: [13, 14, 16, 25], rationale: ''
  };
}

function renderAssuranceObligationControls() {
  const obligation = primaryAssuranceObligation();
  const floorTypes = METRIC_QUALIFIER_DEFINITIONS.M15.filter(item => item.floorEligible);
  const hasExistingRecord = localAssuranceObligations.length > 0;
  return `<details class="metric-advanced mt-md"${hasExistingRecord ? ' open' : ''}>
    <summary><span>Binding assurance detail</span><span class="text-xs text-secondary">Only needed for scoped M15 floors</span></summary>
    <fieldset style="border:0;padding:12px 0 0;">
      <legend class="text-xs" style="font-weight:700;padding:0 4px;">Primary binding assurance obligation</legend>
      <div class="text-xs text-secondary mb-sm">M15≥4 activates assurance floors only when this record is confirmed, source-backed, and scoped to the affected process.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <label class="text-xs">Assurance type<select class="select" id="assurance-type" aria-label="Primary assurance type">${floorTypes.map(item => `<option value="${item.id}" ${obligation.type === item.id ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}</select></label>
        <label class="text-xs" style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="assurance-confirmed" ${obligation.bindingStatus === 'confirmed' ? 'checked' : ''}> Binding status confirmed</label>
        <label class="text-xs">Named authority<input class="input" id="assurance-authority" aria-label="Named assurance authority" placeholder="Named authority" value="${escapeHtml(obligation.authority || '')}"></label>
        <label class="text-xs">Source reference<input class="input" id="assurance-source" aria-label="Assurance source reference" placeholder="Instrument / source reference" value="${escapeHtml(obligation.sourceRef || '')}"></label>
      </div>
      <div class="text-xs mt-sm" style="margin-bottom:5px;color:var(--text-secondary);">Scope the obligation to every affected process. “Floor-capable” can enforce Standard; “driver-only” participates in derivation; “rule-severity only” can make the matching support warning mandatory without adding a metric driver or floor.</div>
      <div class="text-xs" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px 14px;">
        ${M15_SCOPE_OPTIONS.map(option => `<label><input type="checkbox" class="assurance-scope" value="${option.processId}" ${(obligation.processScope || []).map(Number).includes(option.processId) ? 'checked' : ''}> ${escapeHtml(option.label)} <span class="text-tertiary">(${option.role}; ${option.floorCapable ? 'floor-capable' : option.ruleSeverityCapable ? 'rule-severity only' : 'driver-only'})</span></label>`).join('')}
      </div>
    </fieldset>
  </details>`;
}

function bindAssuranceControls(content) {
  const assuranceInputs = ['assurance-type', 'assurance-confirmed', 'assurance-authority', 'assurance-source'];
  if (content.querySelector('#assurance-type')) {
    const update = () => {
      const existing = primaryAssuranceObligation();
      const obligation = {
        ...existing,
        type: content.querySelector('#assurance-type').value,
        bindingStatus: content.querySelector('#assurance-confirmed').checked ? 'confirmed' : 'unconfirmed',
        authority: content.querySelector('#assurance-authority').value.trim(),
        sourceRef: content.querySelector('#assurance-source').value.trim(),
        processScope: [...content.querySelectorAll('.assurance-scope:checked')].map(item => Number(item.value))
      };
      localAssuranceObligations = [obligation, ...localAssuranceObligations.slice(1)];
      const qualifiers = new Set(localMetricAssessments.M15?.qualifiers || []);
      qualifiers.add(obligation.type);
      localMetricAssessments.M15 = makeMetricAssessment('M15', { score: localScores.M15 ?? 3, status: 'assessed', qualifiers: [...qualifiers] });
    };
    assuranceInputs.forEach(id => content.querySelector(`#${id}`)?.addEventListener('change', update));
    content.querySelectorAll('.assurance-scope').forEach(input => input.addEventListener('change', update));
  }
}

function setMetricScore(metricId, value, contentContainer) {
  const m = METRICS.find(x => x.id === metricId);
  const activeNode = getActiveNode();
  localScores[metricId] = value;
  localMetricAssessments[metricId] = makeMetricAssessment(metricId, { score: value, status: 'assessed' });
  const slider = contentContainer.querySelector(`#slider-${metricId}`);
  if (slider && slider.value != value) slider.value = value;

  const display = contentContainer.querySelector(`#score-${metricId}`);
  if (display) {
    display.textContent = value;
    display.style.color = value >= 4 ? 'var(--level-comprehensive)' : value >= 3 ? 'var(--level-standard)' : 'var(--level-basic)';
  }

  const desc = contentContainer.querySelector(`#desc-${metricId}`);
  if (desc) desc.textContent = m.anchors[value] || '';

  const metricItem = slider?.closest('.metric-item');
  const status = metricItem?.querySelector('.metric-status');
  if (status) {
    status.className = 'metric-status confirmed';
    status.textContent = 'Assessed 1–5 score';
  }
  const unknownToggle = metricItem?.querySelector('.metric-unknown');
  if (unknownToggle) unknownToggle.checked = false;

  // Track as manually set for the active element
  if (activeNode) {
    markMetricManual(activeNode.id, metricId);
  }
}

function startWizard(metricId, contentContainer) {
  const metric = METRICS.find(m => m.id === metricId);
  const wizardDiv = contentContainer.querySelector(`#wizard-${metricId}`);
  if (!wizardDiv) return;

  if (wizardDiv.style.display === 'block') {
    wizardDiv.style.display = 'none'; // toggle off
    return;
  }

  wizardDiv.style.display = 'block';
  let currentQ = 0;

  const renderQ = () => {
    if (currentQ >= metric.guidedQuestions.length) {
      setMetricScore(metricId, 1, contentContainer);
      wizardDiv.innerHTML = `<div class="text-sm font-semibold mb-sm">Recommended Score: 1</div>
                             <div class="text-xs text-secondary mb-md">You answered 'No' to all key indicators.</div>
                             <button class="btn btn-sm btn-outline close-wizard">Done</button>`;
      wizardDiv.querySelector('.close-wizard').addEventListener('click', () => wizardDiv.style.display = 'none');
      return;
    }

    const q = metric.guidedQuestions[currentQ];
    wizardDiv.innerHTML = `
      <div class="text-xs text-secondary mb-sm">Question ${currentQ + 1} of ${metric.guidedQuestions.length}</div>
      <div class="text-sm font-semibold mb-md">${q.text}</div>
      <div class="flex gap-sm">
        <button class="btn btn-sm btn-primary yes-btn" style="min-width: 60px;">Yes</button>
        <button class="btn btn-sm btn-outline no-btn" style="min-width: 60px;">No</button>
      </div>
    `;

    wizardDiv.querySelector('.yes-btn').addEventListener('click', () => {
      setMetricScore(metricId, q.yesScore, contentContainer);
      wizardDiv.innerHTML = `<div class="text-sm font-semibold text-success mb-sm">Recommended Score: ${q.yesScore}</div>
                             <div class="text-xs text-secondary mb-md">Score automatically applied.</div>
                             <button class="btn btn-sm btn-outline close-wizard">Done</button>`;
      wizardDiv.querySelector('.close-wizard').addEventListener('click', () => wizardDiv.style.display = 'none');
    });

    wizardDiv.querySelector('.no-btn').addEventListener('click', () => {
      currentQ++;
      renderQ();
    });
  };

  renderQ();
}



function getHierarchyGuardedInput(state, scores) {
  const node = getActiveNode();
  const parent = node?.parentId ? state.assessmentTree?.nodes?.[node.parentId] : null;
  if (!node || !parent) return { effectiveScores: { ...scores }, blockedMetrics: [], warnings: [] };

  const check = propagateSafetyOverrides(
    parent.scores || {},
    scores,
    node.safetyAllocationDecision ?? (node.hasIndependentSafetyAnalysis === true ? true : null),
    node.securityHierarchyDisposition ?? (node.hasIndependentSecurityAnalysis === true ? true : null),
    node.assuranceHierarchyDisposition ?? (node.hasScopedAssuranceDecision === true ? true : null)
  );
  const effectiveScores = { ...scores };
  for (const metricId of check.blockedMetrics) effectiveScores[metricId] = parent.scores?.[metricId];
  return { effectiveScores, blockedMetrics: check.blockedMetrics, warnings: check.warnings };
}

function renderResults(content) {
  const state = getState();
  const matrixMap = state.matrixMap || METRIC_PROCESS_MAP;
  const activeNodeBeforeRun = getActiveNode();
  const assessmentContext = {
    ...localProject,
    metricAssessments: localMetricAssessments,
    assuranceObligations: localAssuranceObligations,
    rightSizingApprovalRecords: activeNodeBeforeRun?.rightSizingApprovalRecords || state.rightSizingApprovalRecords || [],
    activeElementId: activeNodeBeforeRun?.id || 'default',
    assessmentTree: state.assessmentTree,
    frameworkVersion: FRAMEWORK_META.version,
    metricDefinitionSet: FRAMEWORK_META.metricDefinitionSet
  };
  const hierarchyInput = getHierarchyGuardedInput(state, localScores);
  const result = runFullAssessment(hierarchyInput.effectiveScores, matrixMap, assessmentContext);
  result.hierarchyWarnings = hierarchyInput.warnings;
  const completeness = assessMetricCompleteness(localScores, localMetricAssessments);
  const derivationDetails = result.derivationDetails || {};
  const saTier = result.saTier;

  const tierColors = {
    'I': '#3b82f6',
    'II': '#f59e0b',
    'III': '#ef4444',
    'IV': '#7c3aed'
  };

  const groupByGroup = {};
  CORE_PROCESSES.forEach(p => {
    if (!groupByGroup[p.group]) groupByGroup[p.group] = [];
    groupByGroup[p.group].push(p);
  });

  const processName = (id) => CORE_PROCESSES.find(p => p.id === id)?.name || `Process ${id}`;

  const m5Val = localScores.M5 || 3;

  const rightSizingProposals = result.rightSizingProposals || [];
  const blockedRightSizingCandidates = result.blockedRightSizingCandidates || [];
  const legacyRightSizingActions = result.rightSizingActions || [];
  const activeFloors = result.activeFloors || [];
  const rule11Disposition = assessRule11Disposition(result.violations, localRuleDispositions, result.levels);
  const warningDispositions = assessWarningDispositions(result.violations, localRuleDispositions, result.levels);
  const generalWarningDispositions = warningDispositions.assessments.filter(assessment => assessment.ruleId !== '11');
  const rule11ElevatedPreview = assessRule11Disposition(result.violations, localRuleDispositions, { ...result.levels, 27: 'standard' });
  const canApplyRule11Elevation = localRuleDispositions?.['11']?.outcome === 'elevated-validation' && rule11ElevatedPreview.complete;
  const csiReadiness = assessCsiResponse(localScores, localCsiResponse);
  const correlatedEvidence = assessCorrelatedEvidence(localMetricAssessments);
  const processCard = (p) => {
    const level = result.levels[p.id] || 'basic';
    const detail = derivationDetails[p.id] || {};
    const drivers = getDriverAttribution(p.id, localScores, matrixMap, assessmentContext);
    const wasOverridden = result.overrides.some(o => o.processId === p.id);
    const wasFixed = result.fixes.some(f => f.processId === p.id);
    const basicExcluded = isBasicExcluded(p.id, localScores, assessmentContext);
    const triggerMetrics = Array.isArray(detail.triggerMetrics) && detail.triggerMetrics.length ? detail.triggerMetrics.join(', ') : '—';
    const confidence = result.confidence?.[p.id] || detail.confidence || 'high';
    const confidenceLabel = confidence === 'corroborated'
      ? (detail.triggerScore === 5 && detail.triggerMetrics?.some(metric => metric === 'M5' || metric === 'M7') ? 'Directly supported by a high-impact score' : 'Supported by more than one input')
      : confidence === 'available-with-justification' ? 'Needs a justification before using Comprehensive'
        : confidence === 'floor-applied' ? 'Minimum level set by a rule' : 'Supported by assessment inputs and rules';
    return `<div class="result-card" style="border-left:3px solid var(--level-${level})">
      <div class="result-card-header"><span class="result-process">${escapeHtml(p.name)}</span><span class="level-badge ${level}">${escapeHtml(level)}</span></div>
      ${basicExcluded.excluded ? `<div class="text-xs" style="color:var(--accent-danger)">Basic is unavailable (${escapeHtml(basicExcluded.reason)})</div>` : ''}
      ${wasOverridden ? '<div class="text-xs" style="color:var(--accent-warning)">Minimum level rule applied</div>' : ''}
      ${wasFixed ? '<div class="text-xs" style="color:var(--accent-success)">Dependency consistency adjustment applied</div>' : ''}
      ${confidence === 'available-with-justification' ? '<div class="text-xs" style="color:var(--accent-warning)">Review and justify before choosing Comprehensive</div>' : ''}
      <div class="text-xs text-secondary mt-sm">Key input${triggerMetrics.includes(',') ? 's' : ''}: <strong>${escapeHtml(triggerMetrics)}</strong>${detail.triggerScore ? ` (score ${detail.triggerScore})` : ''}</div>
      <div class="text-xs text-secondary">Support: <strong>${escapeHtml(confidenceLabel)}</strong></div>
      <div class="drivers-list mt-sm">${drivers.slice(0, 3).map(d => `<div class="driver-item"><span class="driver-badge ${d.role === 'P' ? 'primary' : 'secondary'}">${d.role === 'P' ? 'Main' : 'Also'}</span><span>${escapeHtml(d.metric)}: ${escapeHtml(d.value)}</span></div>`).join('')}</div>
      <a class="btn btn-secondary btn-sm mt-sm process-detail-link" href="${escapeHtml(processDetailsHref(p.id, level, 'assessment'))}" aria-label="View ${escapeHtml(p.name)} ${escapeHtml(FRAMEWORK_META.levelLabels[level] || level)} details">View guidance →</a>
    </div>`;
  };
  const priorityIds = new Set([
    ...result.overrides.map(item => item.processId),
    ...result.fixes.map(item => item.processId),
    ...result.violations.flatMap(item => [item.processId, ...(item.processes || [])]),
    ...CORE_PROCESSES.filter(p => result.levels[p.id] === 'comprehensive').map(p => p.id),
    ...CORE_PROCESSES.filter(p => result.confidence?.[p.id] === 'available-with-justification').map(p => p.id)
  ].filter(Boolean).map(Number));
  const priorityProcesses = CORE_PROCESSES.filter(p => priorityIds.has(p.id)).slice(0, 6);
  const fallbackPriorities = CORE_PROCESSES.filter(p => result.levels[p.id] !== 'basic').slice(0, 6);
  const reviewFirst = priorityProcesses.length ? priorityProcesses : fallbackPriorities;
  const metricNotesCount = METRICS.filter(metric => String(localMetricAssessments?.[metric.id]?.rationale || '').trim()).length;
  content.innerHTML = `
    ${!completeness.complete ? `<div class="override-banner" style="background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.4);">
      <strong>⚠ Work-in-progress preview — not a baseline</strong>
      <div class="text-sm mt-sm">${completeness.incompleteMetricIds.length} metric judgment(s) remain unresolved: ${escapeHtml(completeness.incompleteMetricIds.join(', '))}. Unknown or migrated values can preview behavior, but this profile cannot be baselined until they are resolved.</div>
    </div>` : ''}
    ${correlatedEvidence.warningCount ? `<div class="override-banner" style="background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.4);">
      <strong>⚠ Correlated evidence review (${correlatedEvidence.warningCount})</strong>
      ${correlatedEvidence.warnings.map(warning => `<div class="text-sm mt-sm">${escapeHtml(warning.message)}</div>`).join('')}
      <div class="text-xs text-secondary mt-sm">Warning only: scores, recommended process levels, and closure are unchanged. If shared evidence is appropriate, add a distinct consequence analysis in the affected metrics' optional Justification note.</div>
    </div>` : ''}
    ${rule11Disposition.required ? `<fieldset class="mb-lg" style="border:2px solid ${rule11Disposition.complete ? 'rgba(52,211,153,.45)' : 'rgba(245,158,11,.45)'};border-radius:10px;padding:14px 16px;">
      <legend style="font-weight:700;padding:0 6px;">Rule 11 / P12 disposition ${rule11Disposition.complete ? '✓' : 'required'}</legend>
      <div class="text-xs text-secondary mb-sm">Comprehensive Verification with Validation below Standard remains a warning, not an automatic elevation. Record the project disposition before baselining; the warning remains visible.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <select class="select" id="rule11-outcome" aria-label="Rule 11 disposition outcome">
          <option value="">Select disposition...</option>
          ${RULE_11_OUTCOMES.map(option => `<option value="${option.id}" ${localRuleDispositions?.['11']?.outcome === option.id ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
        </select>
        <input class="input" id="rule11-owner" aria-label="Rule 11 owner or approver" placeholder="Owner / approver" value="${escapeHtml(localRuleDispositions?.['11']?.ownerApprover || '')}">
        <input class="input" id="rule11-evidence" aria-label="Rule 11 evidence reference" placeholder="Evidence reference" value="${escapeHtml(localRuleDispositions?.['11']?.evidenceRef || '')}">
        <input class="input" id="rule11-date" aria-label="Rule 11 review date" type="date" value="${escapeHtml(localRuleDispositions?.['11']?.reviewDate || '')}">
      </div>
      <textarea class="input mt-sm" id="rule11-rationale" aria-label="Rule 11 disposition rationale" rows="3" placeholder="Rationale and compensating controls">${escapeHtml(localRuleDispositions?.['11']?.rationale || '')}</textarea>
      <div class="text-xs mt-sm" id="rule11-disposition-status" style="color:${rule11Disposition.complete || canApplyRule11Elevation ? 'var(--accent-success)' : 'var(--accent-warning)'};">${rule11Disposition.complete
        ? 'Disposition complete.'
        : canApplyRule11Elevation
          ? 'Ready: completing the baseline will create an explicit governed manual adjustment raising Process 27 to Standard. This is not automatic closure.'
        : `Incomplete: ${escapeHtml(rule11Disposition.missingFields.join(', '))}${rule11Disposition.missingFields.includes('validationLevel') ? '. Process 27 must actually be Standard or Comprehensive for the elevated-validation outcome.' : ''}`}</div>
    </fieldset>` : ''}
    ${generalWarningDispositions.length ? `<fieldset class="mb-lg" style="border:2px solid ${generalWarningDispositions.every(item => item.complete) ? 'rgba(52,211,153,.45)' : 'rgba(245,158,11,.45)'};border-radius:10px;padding:14px 16px;">
      <legend style="font-weight:700;padding:0 6px;">Other warning dispositions ${generalWarningDispositions.every(item => item.complete) ? '✓' : 'required'}</legend>
      <div class="text-xs text-secondary mb-sm">Every triggered, unsatisfied warning must be consciously dispositioned before baselining. A disposition records governance only: it does not suppress the warning or change a process level.</div>
      ${generalWarningDispositions.map(assessment => {
        const id = escapeHtml(assessment.ruleId);
        const record = localRuleDispositions?.[assessment.ruleId] || {};
        return `<details class="warning-disposition" data-rule-id="${id}" open style="border-top:1px solid rgba(245,158,11,.25);padding:10px 0;">
          <summary class="text-sm"><strong>Rule ${id}</strong>: ${escapeHtml(assessment.violation?.label || 'Triggered warning')} — <span class="warning-disposition-summary">${assessment.complete ? 'complete' : `missing ${escapeHtml(assessment.missingFields.join(', '))}`}</span></summary>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;" class="mt-sm">
            <select class="select warning-outcome" aria-label="Rule ${id} disposition outcome">
              <option value="">Select disposition...</option>
              ${GENERAL_WARNING_OUTCOMES.map(option => `<option value="${option.id}" ${record.outcome === option.id ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
            </select>
            <input class="input warning-owner" aria-label="Rule ${id} owner or approver" placeholder="Owner / approver" value="${escapeHtml(record.ownerApprover || '')}">
            <input class="input warning-evidence" aria-label="Rule ${id} evidence reference" placeholder="Evidence reference" value="${escapeHtml(record.evidenceRef || '')}">
            <input class="input warning-date" aria-label="Rule ${id} review date" type="date" value="${escapeHtml(record.reviewDate || '')}">
          </div>
          <textarea class="input mt-sm warning-rationale" aria-label="Rule ${id} rationale and controls" rows="2" placeholder="Rationale and compensating controls">${escapeHtml(record.rationale || '')}</textarea>
        </details>`;
      }).join('')}
    </fieldset>` : ''}
    ${csiReadiness.required ? `<fieldset class="mb-lg" style="border:2px solid ${csiReadiness.complete ? 'rgba(52,211,153,.45)' : 'rgba(245,158,11,.45)'};border-radius:10px;padding:14px 16px;">
      <legend style="font-weight:700;padding:0 6px;">CSI ${csiReadiness.csi} ${csiReadiness.expectedResponseType === 'sponsor-escalation' ? 'sponsor escalation' : 'feasibility review'} ${csiReadiness.complete ? '✓' : 'required'}</legend>
      <div class="text-xs text-secondary mb-sm">High schedule/budget pressure requires a governed feasibility response. This record cannot change process levels or accept right-sizing proposals.</div>
      <input type="hidden" id="csi-response-type" value="${csiReadiness.expectedResponseType}">
      <div class="text-xs mb-sm" style="font-weight:700;">Selected response actions</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px 12px;">
        ${CSI_RESPONSE_ACTIONS.map(action => `<label class="text-xs"><input type="checkbox" class="csi-action" value="${action.id}" ${(localCsiResponse.selectedActions || []).includes(action.id) ? 'checked' : ''}> ${escapeHtml(action.label)}</label>`).join('')}
      </div>
      <textarea class="input mt-sm" id="csi-protected-outputs" aria-label="CSI protected outputs and evidence" rows="2" placeholder="Protected outputs/evidence that must not be reduced">${escapeHtml(localCsiResponse.protectedOutputs || '')}</textarea>
      <textarea class="input mt-sm" id="csi-rationale" aria-label="CSI rationale and decision" rows="2" placeholder="Feasibility rationale and decision">${escapeHtml(localCsiResponse.rationaleDecision || '')}</textarea>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;" class="mt-sm">
        <input class="input" id="csi-owner" aria-label="CSI owner or approver" placeholder="${csiReadiness.csi >= 5 ? 'Sponsor / approver' : 'Owner / approver'}" value="${escapeHtml(localCsiResponse.ownerApprover || '')}">
        <input class="input" id="csi-evidence" aria-label="CSI evidence reference" placeholder="Evidence reference" value="${escapeHtml(localCsiResponse.evidenceRef || '')}">
        <input class="input" id="csi-date" aria-label="CSI review date" type="date" value="${escapeHtml(localCsiResponse.reviewDate || '')}">
      </div>
      <div class="text-xs mt-sm" id="csi-response-status" style="color:${csiReadiness.complete ? 'var(--accent-success)' : 'var(--accent-warning)'};">${csiReadiness.complete ? 'Constraint response complete.' : `Incomplete: ${escapeHtml(csiReadiness.missingFields.join(', '))}`}</div>
    </fieldset>` : ''}
    <h3 class="mb-sm">Assessment results</h3>
    <p class="result-guidance mb-lg">Start with the priorities below. Open the full breakdown afterward to inspect every process and its supporting inputs.</p>
    <div class="results-overview mb-lg">
      <div class="card">
        <h4 class="mb-md">What to review first</h4>
        <div class="grid-3">
          <div><div class="stat-value" style="color:var(--level-comprehensive)">${Object.values(result.levels).filter(l => l === 'comprehensive').length}</div><div class="stat-label">Comprehensive processes</div></div>
          <div><div class="stat-value" style="color:var(--accent-warning)">${result.violations.length}</div><div class="stat-label">Warnings to review</div></div>
          <div><div class="stat-value">${metricNotesCount}/${METRICS.length}</div><div class="stat-label">Optional notes added</div></div>
        </div>
        <p class="text-xs text-secondary mt-md">Notes are optional. Metrics without notes still use the score you selected, including the neutral default of 3.</p>
      </div>
      <div class="card">${renderMetricSpiderwebSvg(localScores, METRICS, DIMENSIONS, { title: 'Assessment shape', description: 'Your 16 scores across the four assessment areas.' })}</div>
    </div>
    ${reviewFirst.length ? `<h4 class="mb-md">Priority process guidance</h4><div class="results-grid mb-lg">${reviewFirst.map(processCard).join('')}</div>` : '<div class="card mb-lg"><strong>No elevated priorities.</strong><p class="text-sm text-secondary mt-sm">Open the full breakdown to review all Basic recommendations.</p></div>'}
    
    <div class="sa-tier-result mb-lg" style="background: ${tierColors[saTier.tier]}15; border: 2px solid ${tierColors[saTier.tier]}; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div class="text-sm text-secondary">Safety Assurance Criticality Tier (derived from M5: Safety Impact = ${m5Val})</div>
        <div style="font-size: 24px; font-weight: 800; color: ${tierColors[saTier.tier]}">Tier ${saTier.tier}: ${saTier.name}</div>
        <div class="text-sm">${saTier.description}</div>
      </div>
      <div style="text-align: right;">
        ${saTier.floor ? `<div class="text-xs" style="color: ${tierColors[saTier.tier]}">Min Floor: ${saTier.floor}</div>` : '<div class="text-xs text-secondary">No floor applied</div>'}
      </div>
    </div>
    
    ${rightSizingProposals.length ? `
      <div class="override-banner" style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3);">
        <strong>📐 Right-Sizing Proposals (${rightSizingProposals.length}; not applied)</strong>
        <div class="text-xs text-secondary mt-sm mb-sm">Project scale: ${result.indices?.psi || '—'} · Delivery pressure: ${result.indices?.csi || '—'} · Adoption readiness: ${result.indices?.cri || '—'}</div>
        <div class="text-xs text-secondary mb-sm">Each proposal requires an explicit accept/reject decision, rationale, approver, and residual-risk record. Final levels below remain unchanged.</div>
        ${rightSizingProposals.map(a => `<div class="text-sm mt-sm">• <strong>${escapeHtml(processName(a.processId))}</strong>: ${escapeHtml(a.from)} → proposed ${escapeHtml(a.proposedTo || a.to)} <span class="text-xs text-secondary">(${escapeHtml(a.reason)})</span></div>`).join('')}
      </div>` : ''}
    ${legacyRightSizingActions.length ? `<div class="override-banner" style="background:rgba(148,163,184,.08);border-color:rgba(148,163,184,.3);"><strong>Historical right-sizing records</strong><div class="text-xs text-secondary mt-sm">Imported pre-governance actions are retained for audit only and are not evidence of an approved v4 reduction.</div></div>` : ''}
    ${blockedRightSizingCandidates.length ? `<div class="override-banner" style="background:rgba(239,68,68,.06);border-color:rgba(239,68,68,.25);"><strong>Blocked Right-Sizing Candidates (${blockedRightSizingCandidates.length})</strong><div class="text-xs text-secondary mt-sm">These reductions are not approval candidates because mandatory closure would immediately restore the required level.</div></div>` : ''}
    ${result.budgetStatus && !result.budgetStatus.withinBudget ? `
      <div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 10px; padding: 12px 16px; margin-bottom: 16px;">
        <div class="text-xs" style="font-weight: 700; color: var(--accent-warning);">⚠ Final Rigor-Budget Exception</div>
        <div class="text-sm mt-sm">Mandatory floors or closure leave ${result.budgetStatus.comprehensiveExcess} Comprehensive and ${result.budgetStatus.standardExcess} Standard process(es) above configured PSI guidance. Governance review is required.</div>
      </div>` : !rightSizingProposals.length && result.indices ? `
      <div style="background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.25); border-radius: 10px; padding: 12px 16px; margin-bottom: 16px;">
        <div class="text-xs text-secondary" style="font-weight: 600;">📐 Right-Sizing Indices</div>
        <div class="text-sm mt-sm">Project scale: ${result.indices.psi} · Delivery pressure: ${result.indices.csi} · Adoption readiness: ${result.indices.cri} — <span style="color:var(--accent-success)">No right-sizing proposals generated</span></div>
      </div>` : ''}

    ${result.adoptionRisks?.length ? `
      <div class="override-banner" style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.35);">
        <strong>🧭 Adoption Readiness Gaps (${result.adoptionRisks.length})</strong>
        <div class="text-xs text-secondary mt-sm mb-sm">Required rigor is preserved. Adoption readiness identifies support the organization may need to use the selected processes.</div>
        ${result.adoptionRisks.slice(0, 8).map(r => `<div class="text-sm mt-sm">• <strong>${escapeHtml(processName(r.processId))}</strong>: ${escapeHtml(r.level)} <span class="text-xs text-secondary">(${escapeHtml(r.guidance)})</span></div>`).join('')}
        ${result.adoptionRisks.length > 8 ? `<div class="text-xs text-secondary mt-sm">+ ${result.adoptionRisks.length - 8} more readiness gaps in the report.</div>` : ''}
      </div>` : ''}

    ${result.overrides.length ? `
      <div class="override-banner">
        <strong>⚠️ Floor Elevations Applied (${result.overrides.length})</strong>
        ${result.overrides.map(o => `<div class="text-sm mt-sm">• <strong>${processName(o.processId)}</strong>: ${o.from} → ${o.to} (${o.reason})</div>`).join('')}
      </div>` : ''}
    ${activeFloors.length ? `<div class="override-banner" style="background:rgba(14,165,233,.08);border-color:rgba(14,165,233,.3);">
      <strong>↥ Active Mandatory Floors (${activeFloors.length})</strong>
      <div class="text-xs text-secondary mt-sm mb-sm">Triggered floors are recorded even when the metric-derived level already satisfied them; only actual elevations appear above. A mapped M5=5 or M7=5 may directly derive Comprehensive for processes beyond the named floor family; that metric attribution remains distinct from this floor record.</div>
      ${activeFloors.map(floor => {
        const elevated = result.overrides.some(override => override.processId === floor.processId && (override.overrideId === floor.overrideId || override.reason === floor.reason || override.reason === floor.label));
        return `<div class="text-sm mt-sm">• <strong>${escapeHtml(processName(floor.processId))}</strong>: ${escapeHtml(floor.minLevel || floor.requiredLevel || floor.to || 'minimum active')} — ${elevated ? 'elevated by floor' : 'already satisfied'} <span class="text-xs text-secondary">(${escapeHtml(floor.label || floor.reason || floor.condition || floor.overrideId || 'mandatory floor')})</span></div>`;
      }).join('')}
    </div>` : ''}
    ${result.fixes.length ? `
      <div class="fix-banner">
        <strong>✓ Consistency Fixes Applied (${result.fixes.length})</strong>
        ${result.fixes.map(f => `<div class="text-sm mt-sm">• <strong>${processName(f.processId)}</strong>: ${f.from} → ${f.to} (${f.reason})</div>`).join('')}
      </div>` : ''}
    ${result.violations.length ? `
      <div class="violation-banner">
        <strong>⚠ Remaining Warnings (${result.violations.length})</strong>
        ${result.violations.map(v => `<div class="text-sm mt-sm">• Rule ${v.ruleId} [${v.type}]: ${v.label}</div>`).join('')}
      </div>` : ''}
    <details class="results-breakdown">
      <summary>Review all ${CORE_PROCESSES.length} process recommendations</summary>
      <div class="results-breakdown-body">
        <p class="text-sm text-secondary mb-lg">Use this complete breakdown to verify every recommendation, supporting input, and detailed level guide.</p>
    ${Object.entries(groupByGroup).map(([group, procs]) => `
      <h4 class="mb-md mt-lg" style="color: ${PROCESS_GROUPS[group.toUpperCase()]?.color || '#fff'}">${PROCESS_GROUPS[group.toUpperCase()]?.icon || ''} ${PROCESS_GROUPS[group.toUpperCase()]?.name || group}</h4>
      <div class="results-grid">
        ${procs.map(processCard).join('')}
      </div>
    `).join('')}
      </div>
    </details>
  `;

  const completeButton = content.closest('.assessment-container')?.querySelector('#btn-next');
  let currentCsiReadiness = csiReadiness;
  let currentRule11Readiness = rule11Disposition;
  let currentWarningReadiness = warningDispositions;
  let currentRule11ElevationReady = canApplyRule11Elevation;
  const updateCompleteButton = () => {
    if (!completeButton || !completeness.complete) return;
    if (!currentCsiReadiness.complete) {
      completeButton.textContent = `💾 Save Work in Progress (CSI ${currentCsiReadiness.csi} response required)`;
    } else if (!currentRule11Readiness.complete) {
      completeButton.textContent = currentRule11ElevationReady && currentWarningReadiness.incompleteRuleIds.every(ruleId => ruleId === '11')
        ? '↥ Apply P27 Adjustment & Complete Baseline'
        : '💾 Save Work in Progress (Rule 11 disposition required)';
    } else if (!currentWarningReadiness.complete) {
      completeButton.textContent = `💾 Save Work in Progress (${currentWarningReadiness.incompleteRuleIds.length} warning disposition(s) required)`;
    } else {
      completeButton.textContent = '✓ Complete Baseline';
    }
  };
  content.querySelectorAll('.process-detail-link').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      finalizeAssessment(link.getAttribute('href'));
    });
  });
  const refreshRule11Record = () => {
    if (!rule11Disposition.required) return;
    localRuleDispositions = {
      ...localRuleDispositions,
      11: {
        ruleId: 11,
        propagationId: 'P12',
        outcome: content.querySelector('#rule11-outcome')?.value || '',
        rationale: content.querySelector('#rule11-rationale')?.value.trim() || '',
        ownerApprover: content.querySelector('#rule11-owner')?.value.trim() || '',
        evidenceRef: content.querySelector('#rule11-evidence')?.value.trim() || '',
        reviewDate: content.querySelector('#rule11-date')?.value || ''
      }
    };
    const status = assessRule11Disposition(result.violations, localRuleDispositions, result.levels);
    const elevatedPreview = assessRule11Disposition(result.violations, localRuleDispositions, { ...result.levels, 27: 'standard' });
    const readyToApplyElevation = localRuleDispositions?.['11']?.outcome === 'elevated-validation' && elevatedPreview.complete;
    currentRule11Readiness = status;
    currentRule11ElevationReady = readyToApplyElevation;
    currentWarningReadiness = assessWarningDispositions(result.violations, localRuleDispositions, result.levels);
    const statusNode = content.querySelector('#rule11-disposition-status');
    if (statusNode) {
      statusNode.style.color = status.complete || readyToApplyElevation ? 'var(--accent-success)' : 'var(--accent-warning)';
      statusNode.textContent = status.complete
        ? 'Disposition complete.'
        : readyToApplyElevation
          ? 'Ready: completing the baseline will create an explicit governed manual adjustment raising Process 27 to Standard. This is not automatic closure.'
        : `Incomplete: ${status.missingFields.join(', ')}${status.missingFields.includes('validationLevel') ? '. Process 27 must actually be Standard or Comprehensive for the elevated-validation outcome.' : ''}`;
    }
    updateCompleteButton();
  };
  for (const id of ['rule11-outcome', 'rule11-rationale', 'rule11-owner', 'rule11-evidence', 'rule11-date']) {
    const input = content.querySelector(`#${id}`);
    input?.addEventListener(id === 'rule11-rationale' ? 'input' : 'change', refreshRule11Record);
    if (id === 'rule11-owner' || id === 'rule11-evidence') input?.addEventListener('input', refreshRule11Record);
  }
  const refreshGeneralWarningRecord = (section) => {
    const ruleId = section.dataset.ruleId;
    localRuleDispositions = {
      ...localRuleDispositions,
      [ruleId]: {
        ruleId: /^\d+$/.test(ruleId) ? Number(ruleId) : ruleId,
        outcome: section.querySelector('.warning-outcome')?.value || '',
        rationale: section.querySelector('.warning-rationale')?.value.trim() || '',
        ownerApprover: section.querySelector('.warning-owner')?.value.trim() || '',
        evidenceRef: section.querySelector('.warning-evidence')?.value.trim() || '',
        reviewDate: section.querySelector('.warning-date')?.value || ''
      }
    };
    currentWarningReadiness = assessWarningDispositions(result.violations, localRuleDispositions, result.levels);
    const assessment = currentWarningReadiness.assessments.find(item => item.ruleId === ruleId);
    const summary = section.querySelector('.warning-disposition-summary');
    if (summary && assessment) summary.textContent = assessment.complete ? 'complete' : `missing ${assessment.missingFields.join(', ')}`;
    updateCompleteButton();
  };
  content.querySelectorAll('.warning-disposition').forEach(section => {
    section.querySelectorAll('select, input, textarea').forEach(input => {
      input.addEventListener(input.matches('select, input[type="date"]') ? 'change' : 'input', () => refreshGeneralWarningRecord(section));
    });
  });
  const refreshCsiResponse = () => {
    if (!csiReadiness.required) return;
    localCsiResponse = {
      responseType: content.querySelector('#csi-response-type')?.value || '',
      selectedActions: [...content.querySelectorAll('.csi-action:checked')].map(input => input.value),
      protectedOutputs: content.querySelector('#csi-protected-outputs')?.value.trim() || '',
      rationaleDecision: content.querySelector('#csi-rationale')?.value.trim() || '',
      ownerApprover: content.querySelector('#csi-owner')?.value.trim() || '',
      evidenceRef: content.querySelector('#csi-evidence')?.value.trim() || '',
      reviewDate: content.querySelector('#csi-date')?.value || ''
    };
    currentCsiReadiness = assessCsiResponse(localScores, localCsiResponse);
    const statusNode = content.querySelector('#csi-response-status');
    if (statusNode) {
      statusNode.style.color = currentCsiReadiness.complete ? 'var(--accent-success)' : 'var(--accent-warning)';
      statusNode.textContent = currentCsiReadiness.complete ? 'Constraint response complete.' : `Incomplete: ${currentCsiReadiness.missingFields.join(', ')}`;
    }
    updateCompleteButton();
  };
  content.querySelectorAll('.csi-action').forEach(input => input.addEventListener('change', refreshCsiResponse));
  for (const id of ['csi-protected-outputs', 'csi-rationale', 'csi-owner', 'csi-evidence', 'csi-date']) {
    const input = content.querySelector(`#${id}`);
    input?.addEventListener(id === 'csi-date' ? 'change' : 'input', refreshCsiResponse);
  }
  updateCompleteButton();
}

function finalizeAssessment(destinationHash = null) {
  const navigationOnly = typeof destinationHash === 'string' && destinationHash.startsWith('#');
  const state = getState();
  const activeNode = getActiveNode();
  const matrixMap = state.matrixMap || METRIC_PROCESS_MAP;
  const assessmentContext = {
    ...localProject,
    metricAssessments: localMetricAssessments,
    assuranceObligations: localAssuranceObligations,
    rightSizingApprovalRecords: activeNode?.rightSizingApprovalRecords || state.rightSizingApprovalRecords || []
  };
  const hierarchyInput = getHierarchyGuardedInput(state, localScores);
  const result = runFullAssessment(hierarchyInput.effectiveScores, matrixMap, assessmentContext);
  result.hierarchyWarnings = hierarchyInput.warnings;
  const completeness = assessMetricCompleteness(localScores, localMetricAssessments);
  const rule11Record = localRuleDispositions?.['11'];
  const elevatedPreview = assessRule11Disposition(result.violations, localRuleDispositions, { ...result.levels, 27: 'standard' });
  const applyRule11Elevation = !navigationOnly && rule11Record?.outcome === 'elevated-validation' && elevatedPreview.complete && result.levels?.[27] === 'basic';
  const effectiveLevels = applyRule11Elevation ? { ...result.levels, 27: 'standard' } : result.levels;
  const effectiveResult = applyRule11Elevation
    ? { ...result, levels: effectiveLevels, budgetStatus: computeRigorBudgetStatus(effectiveLevels, localScores) }
    : result;
  const rule11Disposition = assessRule11Disposition(result.violations, localRuleDispositions, effectiveLevels);
  const warningDispositions = assessWarningDispositions(result.violations, localRuleDispositions, effectiveLevels);
  const csiReadiness = assessCsiResponse(localScores, localCsiResponse);
  const correlatedEvidence = assessCorrelatedEvidence(localMetricAssessments);
  const hierarchyReady = hierarchyInput.blockedMetrics.length === 0;
  const canBaseline = effectiveResult.authoritative === true && completeness.complete && warningDispositions.complete && csiReadiness.complete && hierarchyReady;
  const manualAdjustments = applyRule11Elevation ? {
    ...(state.manualAdjustments || {}),
    27: {
      level: 'standard',
      justification: `Rule 11 disposition: ${rule11Record.rationale}`,
      source: 'rule-disposition',
      ruleId: 11,
      propagationId: 'P12',
      ownerApprover: rule11Record.ownerApprover,
      evidenceRef: rule11Record.evidenceRef,
      reviewDate: rule11Record.reviewDate
    }
  } : (state.manualAdjustments || {});

  // Store results globally (backward compat)
  setState({
    projectInfo: { ...localProject },
    scores: localScores,
    metricAssessments: localMetricAssessments,
    assuranceObligations: localAssuranceObligations,
    ruleDispositions: localRuleDispositions,
    csiResponse: localCsiResponse,
    correlatedEvidenceWarnings: correlatedEvidence.warnings,
    semanticMigration: !navigationOnly && canBaseline ? null : state.semanticMigration,
    saTier: effectiveResult.saTier,
    derived: effectiveResult.derived,
    derivationDetails: effectiveResult.derivationDetails || {},
    levels: effectiveResult.levels,
    overrides: effectiveResult.overrides,
    activeFloors: effectiveResult.activeFloors || [],
    rightSizingProposals: effectiveResult.rightSizingProposals || [],
    blockedRightSizingCandidates: effectiveResult.blockedRightSizingCandidates || [],
    proposedRightSizedLevels: effectiveResult.proposedRightSizedLevels || {},
    proposalClosureFixes: effectiveResult.proposalClosureFixes || [],
    proposalBudgetStatus: effectiveResult.proposalBudgetStatus || null,
    rightSizingApprovalRecords: assessmentContext.rightSizingApprovalRecords,
    rightSizingApprovalEvaluations: effectiveResult.rightSizingApprovalEvaluations || [],
    approvedRightSizedLevels: effectiveResult.approvedRightSizedLevels || {},
    normativeLevels: effectiveResult.normativeLevels || {},
    effectiveRightSizingApprovalCount: effectiveResult.effectiveRightSizingApprovalCount || 0,
    rightSizingActions: [],
    budgetStatus: effectiveResult.budgetStatus || null,
    adoptionRisks: effectiveResult.adoptionRisks || [],
    indices: effectiveResult.indices || {},
    violations: effectiveResult.violations,
    fixes: effectiveResult.fixes,
    confidence: effectiveResult.confidence || {},
    derivationStatus: effectiveResult.derivationStatus || effectiveResult.confidence || {},
    manualAdjustments,
    assessmentComplete: !navigationOnly && canBaseline,
    assessmentDisposition: !navigationOnly && canBaseline ? 'complete-baseline' : 'work-in-progress'
  });

  // Also store per-element (hierarchy)
  if (activeNode) {
    activeNode.metricAssessments = JSON.parse(JSON.stringify(localMetricAssessments ?? {}));
    activeNode.assuranceObligations = JSON.parse(JSON.stringify(localAssuranceObligations ?? []));
    activeNode.ruleDispositions = JSON.parse(JSON.stringify(localRuleDispositions ?? {}));
    activeNode.csiResponse = JSON.parse(JSON.stringify(localCsiResponse ?? {}));
    activeNode.correlatedEvidenceWarnings = JSON.parse(JSON.stringify(correlatedEvidence.warnings ?? []));
    activeNode.rightSizingApprovalRecords = JSON.parse(JSON.stringify(assessmentContext.rightSizingApprovalRecords ?? []));
    activeNode.manualAdjustments = JSON.parse(JSON.stringify(manualAdjustments ?? {}));
    setElementScores(activeNode.id, { ...localScores });
    setElementAssessmentResult(activeNode.id, effectiveResult);
    if (navigationOnly) {
      activeNode.status = 'draft';
      activeNode.assessmentDisposition = 'work-in-progress';
    }
  }

  if (navigationOnly) {
    showToast('Work in progress saved before opening process details.', 'info');
    const destination = getCurrentRouteContext(destinationHash);
    navigateTo(destination.path, destination.params);
  } else if (canBaseline) {
    showToast(`Assessment complete for "${activeNode?.name || 'Project'}"! Process levels calculated.`, 'success');
    currentStep = 0;
    visitedSteps = new Set([0]);
    navigateTo('report');
  } else {
    const remaining = [];
    if (!completeness.complete) remaining.push(`${completeness.incompleteMetricIds.length} metric judgment(s)`);
    if (!warningDispositions.complete) remaining.push(`${warningDispositions.incompleteRuleIds.length} warning disposition(s)`);
    if (!csiReadiness.complete) remaining.push(`the CSI ${csiReadiness.csi} response`);
    if (!hierarchyReady) remaining.push(`${hierarchyInput.blockedMetrics.join('/')} child hierarchy disposition(s)`);
    showToast(`Work in progress saved. Complete ${remaining.join(' and ')} before baselining.`, 'warning');
    renderAssessment(document.querySelector('.assessment-container')?.parentElement || document.getElementById('main-content'));
  }
}
