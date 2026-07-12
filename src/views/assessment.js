/**
 * Assessment View — Step-by-step metric scoring wizard
 * v3.3: Hierarchy-aware — loads/saves per-element, shows inherited metrics
 */
import { METRICS, DIMENSIONS, CORE_PROCESSES, FRAMEWORK_META, PROCESS_GROUPS, METRIC_PROCESS_MAP, OVERRIDE_CONDITIONS, METRIC_QUALIFIER_DEFINITIONS, BINDING_ASSURANCE_QUALIFIERS } from '../data/se-tailoring-data.js';
import { runFullAssessment, getDriverAttribution, computeRigorBudgetStatus } from '../utils/assessment-engine.js';
import { getState, setState, showToast, getActiveNode, getElementBreadcrumbs, setElementScores, setElementAssessmentResult, markMetricManual } from '../state.js';
import { navigateTo } from '../router.js';
import { escapeHtml } from '../utils/safe-text.js';
import { assessMetricCompleteness, getM15ScopeOptions } from '../utils/assessment-integrity.js';
import { assessRule11Disposition, assessWarningDispositions, GENERAL_WARNING_OUTCOMES, RULE_11_OUTCOMES } from '../utils/rule-dispositions.js';
import { assessCsiResponse, CSI_RESPONSE_ACTIONS } from '../utils/csi-response.js';
import { assessCorrelatedEvidence, normalizeEvidenceContext, CORRELATED_EVIDENCE_METRICS } from '../utils/correlated-evidence.js';
import { assessOutputSufficiency } from '../utils/output-sufficiency.js';
import { propagateSafetyOverrides } from '../utils/inheritance-engine.js';

const STEPS = [
  { id: 'info', title: 'Project Info', icon: '📋' },
  { id: 'complexity', title: 'System Complexity', icon: '🔧' },
  { id: 'safety', title: 'Safety & Criticality', icon: '🛡️' },
  { id: 'constraints', title: 'Project Constraints', icon: '📏' },
  { id: 'stakeholder', title: 'Stakeholder Context', icon: '👥' },
  { id: 'results', title: 'Results', icon: '📊' }
];

let currentStep = 0;
let localScores = {};
let localProject = {};
let localMetricAssessments = {};
let localAssuranceObligations = [];
let localRuleDispositions = {};
let localCsiResponse = {};
const M15_SCOPE_OPTIONS = getM15ScopeOptions();

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
      <div class="ordinal-warning mb-lg" style="background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.35); border-radius: 10px; padding: 14px 18px;">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <span style="font-size: 18px;">⚠️</span>
          <div>
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">Ordinal Scale Warning</div>
            <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">Metric scores (1-5) and derived levels (B/S/C) are <strong>ordinal scales</strong>, not cardinal values. They indicate relative ranking within this project only. <strong>Do not compare scores or averages across different projects</strong>—use them only for determining appropriate tailoring levels for the current project.</div>
          </div>
        </div>
      </div>
      <div class="step-progress">
        ${STEPS.map((s, i) => `
          <button class="step-dot ${i <= currentStep ? 'active' : ''} ${i === currentStep ? 'current' : ''}" type="button" data-step="${i}" aria-label="Go to ${escapeHtml(s.title)} step" ${i === currentStep ? 'aria-current="step"' : ''}>
            <span class="step-icon">${s.icon}</span>
            <span class="step-label">${s.title}</span>
          </button>
        `).join('<div class="step-line"></div>')}
      </div>
      <div class="progress-bar mb-xl"><div class="progress-bar-fill" style="width:${((currentStep + 1) / STEPS.length) * 100}%"></div></div>
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
    .step-dot.active { opacity: 1; }
    .step-dot.current .step-icon { background: var(--accent-primary); transform: scale(1.15); }
    .step-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--bg-tertiary); font-size: 16px; transition: all 0.3s; }
    .step-label { font-size: 11px; color: var(--text-secondary); white-space: nowrap; }
    .step-line { width: 24px; height: 2px; background: var(--border-subtle); margin-bottom: 18px; }
    .step-content { min-height: 400px; }
    .step-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--border-subtle); }
    .metric-group { margin-bottom: 24px; }
    .metric-item { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 20px; margin-bottom: 12px; transition: all 0.2s; }
    .metric-item:hover { border-color: var(--border-medium); }
    .metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .metric-name { font-weight: 600; font-size: 15px; }
    .metric-id { font-size: 12px; font-weight: 700; color: var(--accent-primary-light); background: rgba(99,102,241,0.12); padding: 2px 8px; border-radius: 4px; }
    .metric-score-display { font-size: 24px; font-weight: 800; min-width: 40px; text-align: center; transition: color 0.2s; }
    .metric-anchors { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-tertiary); margin-top: 6px; padding: 0 2px; }
    .metric-description { font-size: 13px; color: var(--text-secondary); margin-top: 8px; padding: 6px 10px; background: rgba(99,102,241,0.05); border-radius: 6px; }
    .info-form { display: grid; gap: 16px; max-width: 500px; margin: 0 auto; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
    .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
    .result-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px; }
    .result-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .result-process { font-weight: 600; font-size: 14px; }
    .drivers-list { font-size: 12px; color: var(--text-secondary); }
    .driver-item { display: flex; gap: 6px; align-items: center; padding: 2px 0; }
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
      renderAssessment(container);
    } else {
      finalizeAssessment();
    }
  });
  container.querySelector('#btn-prev').addEventListener('click', () => {
    if (currentStep > 0) { currentStep--; renderAssessment(container); }
  });
  container.querySelectorAll('.step-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      currentStep = parseInt(dot.dataset.step);
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
          <input class="input" id="proj-date" type="date" value="${escapeHtml(localProject.date || new Date().toISOString().slice(0, 10))}">
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
    const val = localScores[m.id] || 3;
    const scoreColor = val >= 4 ? 'var(--level-comprehensive)' : val >= 3 ? 'var(--level-standard)' : 'var(--level-basic)';
    return `
        <div class="metric-item">
          <div class="metric-header">
            <div class="flex items-center gap-sm">
              <span class="metric-id">${m.id}</span>
              <span class="metric-name">${m.name}</span>
            </div>
            <div class="flex items-center gap-sm">
              ${m.guidedQuestions ? `<button class="btn btn-sm btn-outline wizard-btn" data-metric="${m.id}" style="font-size: 11px; padding: 2px 8px;">Help me choose</button>` : ''}
              <div class="metric-score-display" id="score-${m.id}" style="color:${scoreColor}">${val}</div>
            </div>
          </div>
          <input type="range" class="range-slider" id="slider-${m.id}" min="1" max="5" step="1" value="${val}" aria-label="Score ${m.id}: ${escapeHtml(m.name)}" aria-describedby="desc-${m.id}">
          <div class="metric-anchors">
            <span>${m.anchors[1]}</span>
            <span>${m.anchors[5]}</span>
          </div>
          <div class="metric-description" id="desc-${m.id}">${m.anchors[val] || ''}</div>
          <label class="text-xs mt-sm" style="display:flex;align-items:center;gap:7px;color:${['assessed', 'inherited-confirmed'].includes(localMetricAssessments[m.id]?.status) ? 'var(--accent-success)' : 'var(--text-secondary)'};">
            <span>Assessment state</span>
            <select class="select metric-assessment-status" data-metric="${m.id}" aria-label="Assessment state for ${m.id}: ${escapeHtml(m.name)}" style="max-width:310px;">
              <option value="" ${!localMetricAssessments[m.id]?.status ? 'selected' : ''}>Unanswered — score 3 preview only</option>
              <option value="assessed" ${['assessed', 'inherited-confirmed'].includes(localMetricAssessments[m.id]?.status) ? 'selected' : ''}>${localMetricAssessments[m.id]?.status === 'inherited-confirmed' ? 'Inherited score confirmed' : 'Assessed 1-5 score'}</option>
              <option value="unknown" ${localMetricAssessments[m.id]?.status === 'unknown' ? 'selected' : ''}>Unknown — insufficient evidence</option>
              ${localMetricAssessments[m.id]?.status === 'not-applicable' ? '<option value="not-applicable" selected disabled>Imported N/A — unsupported migration evidence</option>' : ''}
            </select>
          </label>
          ${localMetricAssessments[m.id]?.status === 'not-applicable' ? '<div class="text-xs mt-sm" style="color:var(--accent-warning);">Imported N/A cannot complete a current baseline. Choose an assessed 1-5 score or explicitly record Unknown.</div>' : ''}
          ${renderQualifierControls(m.id)}
          ${renderCorrelatedEvidenceControls(m.id)}
          ${m.id === 'M15' ? renderAssuranceObligationControls() : ''}
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
  bindQualifierControls(content);
  bindCorrelatedEvidenceControls(content);
  content.querySelectorAll('.metric-assessment-status').forEach(input => input.addEventListener('change', () => {
    const metricId = input.dataset.metric;
    if (input.value === 'assessed') {
      setMetricScore(metricId, localScores[metricId] || 3, content);
    } else if (input.value === 'unknown') {
      localMetricAssessments[metricId] = {
        ...(localMetricAssessments[metricId] || {}),
        score: null,
        status: 'unknown',
        definitionVersion: 2,
        qualifiers: localMetricAssessments[metricId]?.qualifiers || [],
        evidenceRefs: localMetricAssessments[metricId]?.evidenceRefs || []
      };
    } else {
      delete localMetricAssessments[metricId];
    }
    renderAssessment(container);
  }));
}

function renderCorrelatedEvidenceControls(metricId) {
  if (!CORRELATED_EVIDENCE_METRICS.includes(metricId)) return '';
  const context = normalizeEvidenceContext(localMetricAssessments[metricId]?.evidenceContext);
  return `<fieldset class="mt-md correlated-evidence-fields" data-metric="${metricId}" style="border:1px solid rgba(245,158,11,.35);border-radius:8px;padding:10px 12px;">
    <legend class="text-xs" style="font-weight:700;padding:0 4px;">Evidence family and consequence pathway</legend>
    <div class="text-xs text-secondary mb-sm">Shared evidence is allowed. Reused evidence must document a distinct ${metricId} consequence analysis to count as independent corroboration.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <input class="input evidence-context-input" data-field="familyId" aria-label="${metricId} evidence family ID" placeholder="Evidence family ID" value="${escapeHtml(context.familyId)}">
      <input class="input evidence-context-input" data-field="episodeId" aria-label="${metricId} evidence episode ID" placeholder="Evidence episode ID" value="${escapeHtml(context.episodeId)}">
      <input class="input evidence-context-input" data-field="eventRef" aria-label="${metricId} event reference" placeholder="Event / scenario reference" value="${escapeHtml(context.eventRef)}">
      <input class="input evidence-context-input" data-field="artifactRefs" aria-label="${metricId} artifact references" placeholder="Artifact references, comma separated" value="${escapeHtml(context.artifactRefs.join(', '))}">
      <input class="input evidence-context-input" data-field="assumptionsRef" aria-label="${metricId} assumptions reference" placeholder="Assumptions set / reference" value="${escapeHtml(context.assumptionsRef)}">
      <input class="input evidence-context-input" data-field="assessorId" aria-label="${metricId} assessor identity" placeholder="Assessor / assessment team" value="${escapeHtml(context.assessorId)}">
    </div>
    <textarea class="input evidence-context-input mt-sm" data-field="consequencePathway" aria-label="${metricId} distinct consequence pathway" rows="2" placeholder="Describe the distinct ${metricId} consequence pathway and analysis">${escapeHtml(context.consequencePathway)}</textarea>
  </fieldset>`;
}

function bindCorrelatedEvidenceControls(content) {
  content.querySelectorAll('.correlated-evidence-fields').forEach(fieldset => {
    const metricId = fieldset.dataset.metric;
    const update = () => {
      const raw = {};
      fieldset.querySelectorAll('.evidence-context-input').forEach(input => { raw[input.dataset.field] = input.value; });
      localMetricAssessments[metricId] = {
        ...(localMetricAssessments[metricId] || {}),
        score: localMetricAssessments[metricId]?.score ?? localScores[metricId] ?? 3,
        status: localMetricAssessments[metricId]?.status || 'assessed',
        definitionVersion: 2,
        qualifiers: localMetricAssessments[metricId]?.qualifiers || [],
        evidenceRefs: localMetricAssessments[metricId]?.evidenceRefs || [],
        evidenceContext: normalizeEvidenceContext(raw)
      };
    };
    fieldset.querySelectorAll('.evidence-context-input').forEach(input => input.addEventListener('input', update));
  });
}

function renderQualifierControls(metricId) {
  const definitions = METRIC_QUALIFIER_DEFINITIONS[metricId];
  if (!definitions) return '';
  const selected = new Set(localMetricAssessments[metricId]?.qualifiers || []);
  return `<fieldset class="mt-md" style="border:1px solid var(--border-subtle);border-radius:8px;padding:10px 12px;">
    <legend class="text-xs" style="font-weight:700;padding:0 4px;">${metricId === 'M8' ? 'Security consequence basis' : 'Governance/visibility qualifiers'}</legend>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:6px 12px;">
      ${definitions.map(definition => `<label class="text-xs" style="display:flex;gap:6px;align-items:flex-start;">
        <input type="checkbox" class="metric-qualifier" data-metric="${metricId}" value="${definition.id}" ${selected.has(definition.id) ? 'checked' : ''}>
        <span>${escapeHtml(definition.label)}${definition.floorEligible === false ? ' <span class="text-tertiary">(non-floor)</span>' : ''}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
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
  return `<fieldset class="mt-md" style="border:1px solid rgba(245,158,11,.35);border-radius:8px;padding:10px 12px;">
    <legend class="text-xs" style="font-weight:700;padding:0 4px;">Primary binding assurance obligation</legend>
    <div class="text-xs text-secondary mb-sm">M15≥4 activates assurance floors only when this record is confirmed, source-backed, and scoped to the affected process.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <select class="select" id="assurance-type">${floorTypes.map(item => `<option value="${item.id}" ${obligation.type === item.id ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}</select>
      <label class="text-xs" style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="assurance-confirmed" ${obligation.bindingStatus === 'confirmed' ? 'checked' : ''}> Binding status confirmed</label>
      <input class="input" id="assurance-authority" placeholder="Named authority" value="${escapeHtml(obligation.authority || '')}">
      <input class="input" id="assurance-source" placeholder="Instrument / source reference" value="${escapeHtml(obligation.sourceRef || '')}">
    </div>
    <div class="text-xs mt-sm" style="margin-bottom:5px;color:var(--text-secondary);">Scope the obligation to every affected process. “Floor-capable” can enforce Standard; “driver-only” participates in derivation; “rule-severity only” can make the matching support warning mandatory without adding a metric driver or floor.</div>
    <div class="text-xs" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px 14px;">
      ${M15_SCOPE_OPTIONS.map(option => `<label><input type="checkbox" class="assurance-scope" value="${option.processId}" ${(obligation.processScope || []).map(Number).includes(option.processId) ? 'checked' : ''}> ${escapeHtml(option.label)} <span class="text-tertiary">(${option.role}; ${option.floorCapable ? 'floor-capable' : option.ruleSeverityCapable ? 'rule-severity only' : 'driver-only'})</span></label>`).join('')}
    </div>
  </fieldset>`;
}

function bindQualifierControls(content) {
  content.querySelectorAll('.metric-qualifier').forEach(input => input.addEventListener('change', () => {
    const metricId = input.dataset.metric;
    const qualifiers = [...content.querySelectorAll(`.metric-qualifier[data-metric="${metricId}"]:checked`)].map(item => item.value);
    localMetricAssessments[metricId] = {
      ...(localMetricAssessments[metricId] || {}), score: localScores[metricId] || 3,
      status: 'assessed', definitionVersion: 2, qualifiers, evidenceRefs: localMetricAssessments[metricId]?.evidenceRefs || []
    };
  }));

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
      localMetricAssessments.M15 = { ...(localMetricAssessments.M15 || {}), score: localScores.M15 || 3, status: 'assessed', definitionVersion: 2, qualifiers: [...qualifiers], evidenceRefs: [] };
    };
    assuranceInputs.forEach(id => content.querySelector(`#${id}`)?.addEventListener('change', update));
    content.querySelectorAll('.assurance-scope').forEach(input => input.addEventListener('change', update));
  }
}

function setMetricScore(metricId, value, contentContainer) {
  const m = METRICS.find(x => x.id === metricId);
  localScores[metricId] = value;
  localMetricAssessments[metricId] = {
    ...(localMetricAssessments[metricId] || {}), score: value, status: 'assessed', definitionVersion: 2,
    qualifiers: localMetricAssessments[metricId]?.qualifiers || [], evidenceRefs: localMetricAssessments[metricId]?.evidenceRefs || []
  };
  const slider = contentContainer.querySelector(`#slider-${metricId}`);
  if (slider && slider.value != value) slider.value = value;

  const display = contentContainer.querySelector(`#score-${metricId}`);
  if (display) {
    display.textContent = value;
    display.style.color = value >= 4 ? 'var(--level-comprehensive)' : value >= 3 ? 'var(--level-standard)' : 'var(--level-basic)';
  }

  const desc = contentContainer.querySelector(`#desc-${metricId}`);
  if (desc) desc.textContent = m.anchors[value] || '';

  // Track as manually set for the active element
  const activeNode = getActiveNode();
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
  const outputSufficiency = assessOutputSufficiency(state.artifactHandoffs, [state.assessmentTree?.rootId || 'default']);
  content.innerHTML = `
    ${!completeness.complete ? `<div class="override-banner" style="background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.4);">
      <strong>⚠ Work-in-progress preview — not a baseline</strong>
      <div class="text-sm mt-sm">${completeness.incompleteMetricIds.length} metric judgment(s) remain unconfirmed: ${escapeHtml(completeness.incompleteMetricIds.join(', '))}. Default values may be used to preview behavior, but this profile cannot be reported or exported as complete.</div>
    </div>` : ''}
    ${correlatedEvidence.warningCount ? `<div class="override-banner" style="background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.4);">
      <strong>⚠ Correlated evidence review (${correlatedEvidence.warningCount})</strong>
      ${correlatedEvidence.warnings.map(warning => `<div class="text-sm mt-sm">${escapeHtml(warning.message)}</div>`).join('')}
      <div class="text-xs text-secondary mt-sm">Warning only: scores, recommended process levels, and closure are unchanged.</div>
    </div>` : ''}
    ${!outputSufficiency.complete ? `<div class="override-banner" style="background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.4);">
      <strong>⚠ Requirements-to-Architecture artifact handoff required</strong>
      <div class="text-sm mt-sm">The output-sufficiency acceptance gate is incomplete. Accept the required artifact evidence or record a complete, time-bounded governed review before baselining. This gate does not change process levels.</div>
      <button class="btn btn-secondary btn-sm mt-sm" id="btn-review-handoffs" type="button">Review Artifact Handoffs</button>
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
    <h3 class="mb-lg">📊 Assessment Results</h3>
    
    <div class="ordinal-warning-banner mb-lg" style="background: rgba(239,68,68,0.08); border: 2px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 14px 18px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">⚠️</span>
        <div>
          <div style="font-weight: 700; color: var(--accent-danger); font-size: 14px;">Ordinal Score Warning</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
            Metric scores are <strong>ordinal values</strong>, not cardinal. Total scores or averages <strong>cannot be compared between projects</strong>. 
            Scores indicate relative rigor within this assessment only.
          </div>
        </div>
      </div>
    </div>
    
    <div class="workflow-diagram mb-lg" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px;">
      <details>
        <summary style="cursor: pointer; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px;">
          <span>📋</span> Tailoring Workflow (click to expand)
        </summary>
        <div style="margin-top: 12px; font-size: 11px; font-family: monospace; line-height: 1.4; white-space: pre; overflow-x: auto;">
┌──────────────────────────────────────────────────────────────────────┐
│                      SE TAILORING WORKFLOW                            │
└──────────────────────────────────────────────────────────────────────┘

  Step 1: Score Metrics (§3.2-3.3)
  └──▶ Assess 16 metrics (1-5 scale), document rationale

  Step 2: Derive Process Levels (§3.4)
  └──▶ For each process: identify metrics → map to tiers → corroboration check
       (Comprehensive requires corroboration; single high trigger may cap at Standard)

  Step 3: Check Overrides (§3.4.4)
  └──▶ Does criticality override apply? ──[Yes]──▶ Apply minimum level
                    │
                   [No]
                    ▼
  Step 4: Apply Interdependencies (§6.5-6.6)
  └──▶ Hard constraint violated? ──[Yes]──▶ Elevate level
                    │
                   [No]
                    ▼
  Step 5: Review Trade-offs (§3.6)
  └──▶ Accepting trade-off? ──[Yes]──▶ Document in Trade-off Log
                    │
                   [No]
                    ▼
  Step 6: Generate Profile
  └──▶ Process Tailoring Profile with attribution and sign-off
        </div>
      </details>
    </div>
    
    <div class="metric-legend mb-lg" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px 16px;">
      <div class="text-xs text-secondary mb-sm" style="font-weight: 600;">Metric Legend (Override-Relevant)</div>
      <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px;">
        <span><strong style="color: var(--accent-primary);">M4</strong> – Multi-Contractor Integration</span>
        <span><strong style="color: var(--accent-primary);">M3</strong> – Technology Novelty</span>
        <span><strong style="color: var(--accent-primary);">M5</strong> – Safety Criticality</span>
        <span><strong style="color: var(--accent-primary);">M6</strong> – Mission / Operational Criticality</span>
        <span><strong style="color: var(--accent-primary);">M7</strong> – Environmental Criticality</span>
        <span><strong style="color: var(--accent-primary);">M8</strong> – Security Criticality / Consequence</span>
        <span><strong style="color: var(--accent-primary);">M15</strong> – Binding External Assurance Demand</span>
      </div>
    </div>
    
    <div class="workflow-diagram mb-lg" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 16px;">
      <div class="text-xs text-secondary mb-sm" style="font-weight: 600;">Tailoring Workflow</div>
      <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 11px;">
        <span style="background: rgba(99,102,241,0.15); padding: 4px 10px; border-radius: 4px; font-weight: 600;">1. Score Metrics</span>
        <span style="color: var(--text-tertiary);">→</span>
        <span style="background: rgba(99,102,241,0.15); padding: 4px 10px; border-radius: 4px; font-weight: 600;">2. Derive Levels</span>
        <span style="color: var(--text-tertiary);">→</span>
        <span style="background: rgba(245,158,11,0.15); padding: 4px 10px; border-radius: 4px; font-weight: 600;">3. Apply Overrides</span>
        <span style="color: var(--text-tertiary);">→</span>
        <span style="background: rgba(245,158,11,0.15); padding: 4px 10px; border-radius: 4px; font-weight: 600;">4. Check Consistency</span>
        <span style="color: var(--text-tertiary);">→</span>
        <span style="background: rgba(52,211,153,0.15); padding: 4px 10px; border-radius: 4px; font-weight: 600;">5. Final Profile</span>
      </div>
      <div style="margin-top: 10px; font-size: 10px; color: var(--text-tertiary);">
        Decision points: <span style="background: rgba(245,158,11,0.1); padding: 1px 4px; border-radius: 3px;">Criticality override?</span> 
        <span style="background: rgba(239,68,68,0.1); padding: 1px 4px; border-radius: 3px;">HC violated?</span> 
        <span style="background: rgba(52,211,153,0.1); padding: 1px 4px; border-radius: 3px;">Accepting trade-off?</span>
      </div>
    </div>
    
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
        <div class="text-xs text-secondary mt-sm mb-sm">PSI=${result.indices?.psi || '—'} (Scale) · CSI=${result.indices?.csi || '—'} (Constraints) · CRI=${result.indices?.cri || '—'} (Adoption Readiness)</div>
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
        <div class="text-sm mt-sm">PSI=${result.indices.psi} (Scale) · CSI=${result.indices.csi} (Constraints) · CRI=${result.indices.cri} (Adoption Readiness) — <span style="color: var(--accent-success);">No right-sizing proposals generated</span></div>
      </div>` : ''}

    ${result.adoptionRisks?.length ? `
      <div class="override-banner" style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.35);">
        <strong>🧭 Adoption Readiness Gaps (${result.adoptionRisks.length})</strong>
        <div class="text-xs text-secondary mt-sm mb-sm">Required rigor is preserved. CRI identifies implementation support needed for the organization to absorb the selected processes.</div>
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
    <div class="basic-exclusion-legend mb-lg" style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 12px 16px;">
      <div class="text-xs text-secondary mb-sm" style="font-weight: 600;">Basic Level Exclusion</div>
      <div class="text-sm">When criticality thresholds are exceeded, <strong style="color: var(--level-basic); text-decoration: line-through;">Basic</strong> is not available for affected processes. These processes show a <span style="background: rgba(239,68,68,0.15); padding: 1px 4px; border-radius: 3px; font-size: 11px;">🚫 B excluded</span> indicator.</div>
    </div>
    <div class="grid-3 mb-lg">
      <div class="card stat-card"><div class="stat-value" style="color:var(--level-basic)">${Object.values(result.levels).filter(l => l === 'basic').length}</div><div class="stat-label">Basic</div></div>
      <div class="card stat-card"><div class="stat-value" style="color:var(--level-standard)">${Object.values(result.levels).filter(l => l === 'standard').length}</div><div class="stat-label">Standard</div></div>
      <div class="card stat-card"><div class="stat-value" style="color:var(--level-comprehensive)">${Object.values(result.levels).filter(l => l === 'comprehensive').length}</div><div class="stat-label">Comprehensive</div></div>
    </div>
    ${Object.entries(groupByGroup).map(([group, procs]) => `
      <h4 class="mb-md mt-lg" style="color: ${PROCESS_GROUPS[group.toUpperCase()]?.color || '#fff'}">${PROCESS_GROUPS[group.toUpperCase()]?.icon || ''} ${PROCESS_GROUPS[group.toUpperCase()]?.name || group}</h4>
      <div class="results-grid">
        ${procs.map(p => {
    const level = result.levels[p.id] || 'basic';
    const detail = derivationDetails[p.id] || {};
    const drivers = getDriverAttribution(p.id, localScores, matrixMap, assessmentContext);
    const wasOverridden = result.overrides.some(o => o.processId === p.id);
    const wasFixed = result.fixes.some(f => f.processId === p.id);
    const basicExcluded = isBasicExcluded(p.id, localScores, assessmentContext);
    const triggerMetrics = Array.isArray(detail.triggerMetrics) && detail.triggerMetrics.length
      ? detail.triggerMetrics.join(', ')
      : '—';
    const confidence = result.confidence?.[p.id] || detail.confidence || 'high';
    const confidenceLabel = confidence === 'corroborated'
      ? (detail.triggerScore === 5 && detail.triggerMetrics?.some(metric => metric === 'M5' || metric === 'M7')
        ? 'Metric-derived: M5/M7 independently sufficient'
        : 'Corroborated')
      : confidence === 'available-with-justification'
        ? 'Available with justification'
        : confidence === 'floor-applied'
          ? 'Floor applied'
          : 'Supported by drivers/rules';
    return `
          <div class="result-card" style="border-left: 3px solid var(--level-${level})">
            <div class="result-card-header">
              <span class="result-process">${p.name}</span>
              <span class="level-badge ${level}">${level}</span>
            </div>
            ${basicExcluded.excluded ? `<div class="text-xs" style="color:var(--accent-danger)">🚫 B excluded (${basicExcluded.reason})</div>` : ''}
            ${wasOverridden ? '<div class="text-xs" style="color:var(--accent-warning)">⚠ Override applied</div>' : ''}
            ${wasFixed ? '<div class="text-xs" style="color:var(--accent-success)">✓ Consistency fix</div>' : ''}
            ${confidence === 'floor-applied' ? `<div class="text-xs" style="color:var(--accent-info)">Rule-driven floor applied</div>` : ''}
            ${confidence === 'available-with-justification' ? `<div class="text-xs" style="color:var(--accent-warning)">⚠ Comprehensive available with explicit justification</div>` : ''}
            <div class="text-xs text-secondary mt-sm">Trigger metric(s): <strong>${triggerMetrics}</strong>${detail.triggerScore ? ` (score ${detail.triggerScore})` : ''}</div>
            <div class="text-xs text-secondary">Evidence status: <strong>${confidenceLabel}</strong></div>
            <div class="drivers-list mt-sm">
              ${drivers.slice(0, 3).map(d => `
                <div class="driver-item">
                  <span class="driver-badge ${d.role === 'P' ? 'primary' : 'secondary'}">${d.role}</span>
                  <span>${d.metric}: ${d.value}</span>
                </div>`).join('')}
            </div>
          </div>`;
  }).join('')}
      </div>
    `).join('')}
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
    } else if (!outputSufficiency.complete) {
      completeButton.textContent = '💾 Save Work in Progress (artifact handoff required)';
    } else {
      completeButton.textContent = '✓ Complete Baseline';
    }
  };
  content.querySelector('#btn-review-handoffs')?.addEventListener('click', () => navigateTo('handoffs'));
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

function finalizeAssessment() {
  const state = getState();
  const matrixMap = state.matrixMap || METRIC_PROCESS_MAP;
  const assessmentContext = { ...localProject, metricAssessments: localMetricAssessments, assuranceObligations: localAssuranceObligations };
  const hierarchyInput = getHierarchyGuardedInput(state, localScores);
  const result = runFullAssessment(hierarchyInput.effectiveScores, matrixMap, assessmentContext);
  result.hierarchyWarnings = hierarchyInput.warnings;
  const completeness = assessMetricCompleteness(localScores, localMetricAssessments);
  const rule11Record = localRuleDispositions?.['11'];
  const elevatedPreview = assessRule11Disposition(result.violations, localRuleDispositions, { ...result.levels, 27: 'standard' });
  const applyRule11Elevation = rule11Record?.outcome === 'elevated-validation' && elevatedPreview.complete && result.levels?.[27] === 'basic';
  const effectiveLevels = applyRule11Elevation ? { ...result.levels, 27: 'standard' } : result.levels;
  const effectiveResult = applyRule11Elevation
    ? { ...result, levels: effectiveLevels, budgetStatus: computeRigorBudgetStatus(effectiveLevels, localScores) }
    : result;
  const rule11Disposition = assessRule11Disposition(result.violations, localRuleDispositions, effectiveLevels);
  const warningDispositions = assessWarningDispositions(result.violations, localRuleDispositions, effectiveLevels);
  const csiReadiness = assessCsiResponse(localScores, localCsiResponse);
  const correlatedEvidence = assessCorrelatedEvidence(localMetricAssessments);
  const outputSufficiency = assessOutputSufficiency(state.artifactHandoffs, [state.assessmentTree?.rootId || 'default']);
  const hierarchyReady = hierarchyInput.blockedMetrics.length === 0;
  const canBaseline = completeness.complete && warningDispositions.complete && csiReadiness.complete && outputSufficiency.complete && hierarchyReady;
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
    semanticMigration: canBaseline ? null : state.semanticMigration,
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
    normativeLevels: effectiveResult.normativeLevels || effectiveResult.levels,
    effectiveRightSizingApprovalCount: effectiveResult.effectiveRightSizingApprovalCount || 0,
    rightSizingActions: [],
    budgetStatus: effectiveResult.budgetStatus || null,
    adoptionRisks: effectiveResult.adoptionRisks || [],
    indices: effectiveResult.indices || {},
    violations: effectiveResult.violations,
    fixes: effectiveResult.fixes,
    confidence: effectiveResult.confidence || {},
    manualAdjustments,
    assessmentComplete: canBaseline,
    assessmentDisposition: canBaseline ? 'complete-baseline' : 'work-in-progress'
  });

  // Also store per-element (hierarchy)
  const activeNode = getActiveNode();
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
  }

  if (canBaseline) {
    showToast(`Assessment complete for "${activeNode?.name || 'Project'}"! Process levels calculated.`, 'success');
    currentStep = 0;
    navigateTo('report');
  } else {
    const remaining = [];
    if (!completeness.complete) remaining.push(`${completeness.incompleteMetricIds.length} metric judgment(s)`);
    if (!warningDispositions.complete) remaining.push(`${warningDispositions.incompleteRuleIds.length} warning disposition(s)`);
    if (!csiReadiness.complete) remaining.push(`the CSI ${csiReadiness.csi} response`);
    if (!outputSufficiency.complete) remaining.push('the Requirements-to-Architecture artifact handoff');
    if (!hierarchyReady) remaining.push(`${hierarchyInput.blockedMetrics.join('/')} child hierarchy disposition(s)`);
    showToast(`Work in progress saved. Complete ${remaining.join(' and ')} before baselining.`, 'warning');
    renderAssessment(document.querySelector('.assessment-container')?.parentElement || document.getElementById('main-content'));
  }
}
