/**
 * Assessment View — Step-by-step metric scoring wizard
 * v3.3: Hierarchy-aware — loads/saves per-element, shows inherited metrics
 */
import { METRICS, DIMENSIONS, CORE_PROCESSES, FRAMEWORK_META, PROCESS_GROUPS, METRIC_PROCESS_MAP, OVERRIDE_CONDITIONS, METRIC_QUALIFIER_DEFINITIONS, BINDING_ASSURANCE_QUALIFIERS, METRIC_DEFINITION_VERSION } from '../data/se-tailoring-data.js';
import { runFullAssessment, getDriverAttribution, computeRigorBudgetStatus } from '../utils/assessment-engine.js';
import { getState, setState, showToast, getActiveNode, getElementBreadcrumbs } from '../state.js';
import { getCurrentRouteContext, navigateTo, processDetailsHref } from '../router.js';
import { escapeHtml } from '../utils/safe-text.js';
import { assessHierarchyCompleteness, assessMetricCompleteness, evaluateBaselineEligibility, getM15ScopeOptions } from '../utils/assessment-integrity.js';
import { assessRule11Disposition, assessWarningDispositions, GENERAL_WARNING_OUTCOMES, RULE_11_OUTCOMES } from '../utils/rule-dispositions.js';
import { assessCsiResponse, CSI_RESPONSE_ACTIONS } from '../utils/csi-response.js';
import { assessCorrelatedEvidence } from '../utils/correlated-evidence.js';
import { propagateSafetyOverrides } from '../utils/inheritance-engine.js';
import { renderMetricSpiderwebSvg } from '../utils/report-visuals.js';
import { applyManualAdjustmentsToLevels } from '../utils/export-import.js';
import { getLocalCalendarDate } from '../utils/date-validation.js';
import { ASSESSOR_GUIDANCE, ASSESSOR_GUIDANCE_META } from '../data/generated-assessor-guidance.js';

const STEPS = [
  { id: 'info', title: 'Project Info', shortTitle: 'Setup' },
  { id: 'complexity', title: 'System Complexity', shortTitle: 'Complexity' },
  { id: 'safety', title: 'Safety & Criticality', shortTitle: 'Criticality' },
  { id: 'constraints', title: 'Project Constraints', shortTitle: 'Constraints' },
  { id: 'stakeholder', title: 'Stakeholder Context', shortTitle: 'Context' },
  { id: 'results', title: 'Results', shortTitle: 'Review' }
];

let currentStep = 0;
let visitedSteps = new Set([0]);
let assessmentViewMode = 'assess';
let showNeutralPreview = false;
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
    status: updates.status || existing.status || 'unreviewed',
    definitionVersion: METRIC_DEFINITION_VERSION,
    qualifiers: Array.isArray(updates.qualifiers) ? updates.qualifiers : (existing.qualifiers || []),
    rationale: updates.rationale ?? existing.rationale ?? '',
    evidenceRefs: Array.isArray(updates.evidenceRefs) ? updates.evidenceRefs : (existing.evidenceRefs || [])
  };
}

function commitAssessmentDraft({ manualMetricId = null } = {}) {
  const metricAssessments = JSON.parse(JSON.stringify(localMetricAssessments));
  const assuranceObligations = JSON.parse(JSON.stringify(localAssuranceObligations));
  const ruleDispositions = JSON.parse(JSON.stringify(localRuleDispositions));
  const csiResponse = JSON.parse(JSON.stringify(localCsiResponse));
  const scores = { ...localScores };
  const activeNode = getActiveNode();
  if (activeNode) {
    activeNode.scores = { ...scores };
    activeNode.metricAssessments = JSON.parse(JSON.stringify(metricAssessments));
    activeNode.assuranceObligations = JSON.parse(JSON.stringify(assuranceObligations));
    activeNode.ruleDispositions = JSON.parse(JSON.stringify(ruleDispositions));
    activeNode.csiResponse = JSON.parse(JSON.stringify(csiResponse));
    if (manualMetricId && !(activeNode.manualMetrics || []).includes(manualMetricId)) {
      activeNode.manualMetrics = [...(activeNode.manualMetrics || []), manualMetricId];
    }
    activeNode.status = 'draft';
    activeNode.assessmentDisposition = 'work-in-progress';
  }
  setState({
    projectInfo: { ...localProject },
    scores,
    metricAssessments,
    assuranceObligations,
    ruleDispositions,
    csiResponse,
    assessmentComplete: false,
    assessmentDisposition: 'work-in-progress'
  });
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

export function renderAssessment(container, routeContext = null) {
  const isFreshLoad = !container.querySelector('.assessment-container');
  if (isFreshLoad) {
    assessmentViewMode = ['review', 'issues'].includes(routeContext?.assessmentMode)
      ? routeContext.assessmentMode
      : 'assess';
    if (assessmentViewMode !== 'assess') {
      currentStep = STEPS.length - 1;
      visitedSteps.add(currentStep);
    }
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
  const activeStep = STEPS[currentStep];
  const pageTitle = assessmentViewMode === 'review'
    ? 'Tailoring recommendations'
    : assessmentViewMode === 'issues'
      ? 'Decisions needed'
      : activeStep.id === 'info'
        ? 'Set up the assessment'
        : activeStep.id === 'results'
          ? 'Review the tailoring profile'
          : activeStep.title;
  const pageDescription = assessmentViewMode === 'review'
    ? 'Start with exceptions and priorities. Open a process only when you need its work aid or derivation detail.'
    : assessmentViewMode === 'issues'
      ? 'Resolve only the items that prevent this assessment from being completed.'
      : activeStep.id === 'info'
        ? 'Identify the project context. You can return and edit this later.'
        : activeStep.id === 'results'
          ? 'Use the assessment shape and process priorities to focus the tailoring conversation.'
          : 'Choose the closest anchor for each metric. Open scoring guidance only when you need help deciding.';

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
        <div>
          <p class="eyebrow">${assessmentViewMode === 'assess' ? 'Tailoring assessment' : assessmentViewMode === 'review' ? 'Recommendation review' : 'Completion review'}</p>
          <h2>${isHierarchical ? activeNodeName + ' — ' : ''}${pageTitle}</h2>
          <p class="text-secondary">${pageDescription}</p>
        </div>
        <div class="assessment-coverage" aria-label="${completeness.completeCount} of ${METRICS.length} metrics reviewed" aria-live="polite">
          <strong>${completeness.completeCount}/${METRICS.length}</strong>
          <span>reviewed</span>
        </div>
      </div>
      <nav class="step-progress" aria-label="Assessment sections">
        ${STEPS.map((s, i) => `
          <button class="step-dot ${visitedSteps.has(i) ? 'visited' : ''} ${i === currentStep ? 'current' : ''}" type="button" data-step="${i}" aria-label="Go to ${escapeHtml(s.title)} step" ${i === currentStep ? 'aria-current="step"' : ''}>
            <span class="step-index">${i + 1}</span>
            <span class="step-label">${s.shortTitle}</span>
          </button>
        `).join('')}
      </nav>
      <div id="step-content" class="step-content"></div>
      <div class="step-actions">
        <button class="btn btn-secondary" id="btn-prev" ${currentStep === 0 ? 'disabled' : ''}>← Back</button>
        <span class="step-indicator text-sm text-secondary">${activeStep.shortTitle} · ${currentStep + 1}/${STEPS.length}</span>
        <button class="btn btn-primary" id="btn-next">${currentStep === STEPS.length - 1
          ? completeness.complete ? 'Check Software Completeness' : `Save Work in Progress (${completeness.completeCount}/${METRICS.length})`
          : `Next: ${STEPS[currentStep + 1].shortTitle} →`}</button>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .assessment-container { max-width: 1040px; margin: 0 auto; }
    .assessment-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 20px; }
    .assessment-header h2 { margin-top: 3px; }
    .assessment-header p:last-child { max-width: 720px; margin-top: 6px; }
    .assessment-coverage { flex: 0 0 auto; display: grid; justify-items: end; padding-left: 20px; border-left: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
    .assessment-coverage strong { color: var(--text-primary); font-size: 22px; line-height: 1; letter-spacing: 0; }
    .step-progress { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 4px; margin-bottom: 28px; padding: 4px; border: 1px solid var(--border-subtle); border-radius: 10px; background: var(--bg-secondary); }
    .step-dot { display: flex; align-items: center; justify-content: center; gap: 7px; min-width: 0; padding: 8px 9px; cursor: pointer; border: 0; border-radius: 7px; background: transparent; color: var(--text-secondary); font: inherit; transition: color .15s ease, background .15s ease; }
    .step-dot:hover { color: var(--text-primary); background: var(--bg-tertiary); }
    .step-dot.current { color: var(--text-primary); background: color-mix(in srgb, var(--accent-primary) 14%, var(--bg-tertiary)); }
    .step-index { display: inline-flex; width: 18px; height: 18px; align-items: center; justify-content: center; border: 1px solid var(--border-medium); border-radius: 50%; color: inherit; font-size: 10px; font-weight: 800; }
    .step-dot.current .step-index { border-color: var(--accent-primary); background: var(--accent-primary); color: #fff; }
    .step-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; color: inherit; font-size: 11px; font-weight: 700; white-space: nowrap; }
    .step-content { min-height: 360px; }
    .step-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--border-subtle); }
    .metric-group { margin-bottom: 24px; }
    .dimension-context { display: flex; justify-content: space-between; gap: 16px; padding: 9px 0; border-top: 2px solid var(--dimension-color); color: var(--text-secondary); font-size: 12px; }
    .metric-item { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 0; margin-bottom: 10px; transition: border-color 0.2s; overflow: clip; }
    .metric-item:hover { border-color: var(--border-medium); }
    .metric-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin: 0; padding: 16px 18px; cursor: pointer; list-style: none; }
    .metric-header::-webkit-details-marker { display: none; }
    .metric-header::after { content: '+'; align-self: center; color: var(--text-tertiary); font-size: 18px; line-height: 1; }
    .metric-item[open] .metric-header { border-bottom: 1px solid var(--border-subtle); }
    .metric-item[open] .metric-header::after { content: '−'; color: var(--accent-primary-light); }
    .metric-body { padding: 16px 18px 18px; }
    .metric-name { font-weight: 600; font-size: 15px; }
    .metric-header .metric-status { display: block; margin-top: 3px; font-size: 11px; font-weight: 500; }
    .metric-id { font-size: 12px; font-weight: 700; color: var(--accent-primary-light); background: rgba(99,102,241,0.12); padding: 2px 8px; border-radius: 4px; }
    .metric-score-display { margin-left: auto; align-self: center; font-size: 20px; font-weight: 800; min-width: 32px; text-align: right; transition: color 0.2s; }
    .metric-definition { font-size: 13px; color: var(--text-secondary); line-height: 1.55; margin: 12px 0; }
    .metric-definition strong { color: var(--text-primary); }
    .metric-anchor-choices { border: 0; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr; gap: 6px; }
    .metric-anchor-card { position: relative; display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; align-items: start; gap: 10px; min-height: 44px; border: 1px solid var(--border-subtle); border-radius: 7px; padding: 9px 11px; cursor: pointer; background: var(--bg-secondary); }
    .metric-anchor-card:hover { border-color: var(--border-medium); }
    .metric-anchor-card:focus-within { outline: 3px solid color-mix(in srgb, var(--accent-primary) 35%, transparent); outline-offset: 2px; }
    .metric-anchor-card.selected { border-color: var(--accent-primary); background: color-mix(in srgb, var(--accent-primary) 8%, var(--bg-secondary)); }
    .metric-anchor-card.preview { border-style: dashed; }
    .metric-anchor-card input { width: 16px; height: 16px; margin: 2px 0 0; accent-color: var(--accent-primary); cursor: pointer; }
    .metric-anchor-number { display: inline; margin-right: 8px; color: var(--text-primary); font-size: 13px; font-weight: 800; line-height: 1.1; }
    .metric-anchor-text { display: inline; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
    .metric-anchor-tag { align-self: start; font-size: 8px; font-weight: 700; color: var(--accent-warning); text-transform: uppercase; letter-spacing: .04em; }
    .metric-description { min-height: 44px; font-size: 12px; color: var(--text-secondary); margin-top: 8px; padding: 8px 10px; border-left: 2px solid var(--border-medium); background: transparent; }
    .metric-assessment-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 12px; }
    .metric-status { display: inline-flex; align-items: center; gap: 6px; color: var(--accent-success); }
    .metric-status::before { content: '✓'; font-weight: 800; }
    .metric-status.unknown, .metric-status.needs-review { color: var(--accent-warning); }
    .metric-status.unknown::before, .metric-status.needs-review::before { content: '•'; }
    .metric-unknown-toggle { display: inline-flex; align-items: center; gap: 6px; color: var(--text-secondary); cursor: pointer; }
    .metric-unknown-toggle input { accent-color: var(--accent-warning); }
    .metric-secondary-actions { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-subtle); }
    .metric-justification, .metric-advanced, .assessor-guidance { flex: 1 1 240px; }
    .metric-justification > summary, .metric-advanced > summary, .assessor-guidance > summary { display: flex; justify-content: space-between; gap: 12px; cursor: pointer; color: var(--text-secondary); font-size: 12px; font-weight: 600; list-style: none; }
    .metric-justification > summary::-webkit-details-marker, .metric-advanced > summary::-webkit-details-marker { display: none; }
    .metric-justification > summary::after, .metric-advanced > summary::after, .assessor-guidance > summary::after { content: '+'; color: var(--text-tertiary); font-size: 16px; line-height: 1; }
    .metric-justification[open] > summary::after, .metric-advanced[open] > summary::after, .assessor-guidance[open] > summary::after { content: '−'; color: var(--accent-primary-light); }
    .metric-justification label { display: block; margin-top: 10px; color: var(--text-secondary); }
    .metric-justification-input { min-height: 74px; resize: vertical; }
    .assessor-guidance-grid { display: grid; gap: 9px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-subtle); font-size: 12px; color: var(--text-secondary); }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    .result-guidance { max-width: 760px; color: var(--text-secondary); font-size: 13px; }
    .empty-results-state { max-width: 680px; margin: 56px auto; padding: 36px 24px; text-align: center; border-block: 1px solid var(--border-subtle); }
    .empty-results-state h3 { margin-top: 8px; }
    .info-form { display: grid; gap: 16px; max-width: 500px; margin: 0 auto; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
    .setup-context { margin-top: 4px; border-top: 1px solid var(--border-subtle); padding-top: 12px; }
    .setup-context > summary { display: flex; justify-content: space-between; gap: 16px; cursor: pointer; color: var(--text-secondary); font-size: 12px; font-weight: 700; }
    .setup-context > summary span { color: var(--text-tertiary); font-weight: 500; }
    .setup-context-fields { display: grid; gap: 14px; margin-top: 16px; }
    .section-heading-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
    .section-heading-row .eyebrow { margin-bottom: 3px; }
    .status-count { flex: 0 0 auto; border: 1px solid var(--border-subtle); border-radius: 999px; padding: 3px 9px; color: var(--text-secondary); font-size: 11px; font-weight: 700; }
    .assessment-result-tabs { display: inline-flex; gap: 3px; margin-bottom: 24px; padding: 3px; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-secondary); }
    .assessment-result-tabs button { border: 0; border-radius: 6px; padding: 7px 11px; background: transparent; color: var(--text-secondary); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
    .assessment-result-tabs button.active { background: var(--bg-tertiary); color: var(--text-primary); }
    .issues-hidden { display: none; }
    .results-overview { display: grid; grid-template-columns: minmax(220px, .55fr) minmax(460px, 1.45fr); gap: 30px; align-items: stretch; border-block: 1px solid var(--border-subtle); padding: 22px 0; }
    .results-summary { padding-right: 24px; border-right: 1px solid var(--border-subtle); }
    .results-visual { min-width: 0; }
    .result-stat { display: flex; align-items: baseline; gap: 10px; padding: 11px 0; border-bottom: 1px solid var(--border-subtle); }
    .result-stat strong { min-width: 54px; color: var(--text-primary); font-size: 26px; line-height: 1; }
    .result-stat span { color: var(--text-secondary); font-size: 12px; }
    .priority-guidance { padding-top: 6px; }
    .process-guidance-list { margin-top: 14px; border-top: 1px solid var(--border-subtle); }
    .result-card { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px; align-items: center; padding: 15px 12px 15px 16px; border-bottom: 1px solid var(--border-subtle); border-left: 3px solid var(--recommendation-level); background: transparent; }
    .result-card-main { min-width: 0; }
    .result-card-header { display: flex; justify-content: space-between; align-items: center; gap: 14px; margin-bottom: 5px; }
    .result-process { font-weight: 700; font-size: 14px; }
    .result-process-id { margin-left: 7px; color: var(--text-tertiary); font-size: 10px; font-weight: 700; }
    .result-why { display: flex; gap: 6px 14px; flex-wrap: wrap; color: var(--text-secondary); font-size: 11px; }
    .result-signals { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 7px; }
    .result-signals span { border: 1px solid color-mix(in srgb, var(--accent-warning) 45%, var(--border-subtle)); border-radius: 999px; padding: 2px 7px; color: var(--accent-warning); font-size: 9px; font-weight: 700; }
    .drivers-list { display: flex; gap: 7px 12px; flex-wrap: wrap; margin-top: 7px; color: var(--text-secondary); font-size: 11px; }
    .driver-item { display: inline-flex; gap: 5px; align-items: center; }
    .result-derivation { margin-top: 7px; }
    .result-derivation > summary { cursor: pointer; color: var(--text-tertiary); font-size: 10px; font-weight: 700; }
    .baseline-guidance-empty { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 14px; padding: 16px 0; border-block: 1px solid var(--border-subtle); }
    .baseline-guidance-empty p { max-width: 650px; color: var(--text-secondary); font-size: 13px; }
    .results-breakdown { margin-top: 24px; border: 1px solid var(--border-subtle); border-radius: 12px; background: var(--bg-card); }
    .results-breakdown > summary { padding: 16px 18px; cursor: pointer; color: var(--accent-primary-light); font-weight: 700; }
    .results-breakdown-body { padding: 0 18px 18px; }
    .governance-detail { background: transparent; }
    .action-queue { border-block: 1px solid var(--border-subtle); padding: 14px 0; margin-bottom: 20px; }
    .action-queue-list { display: grid; gap: 8px; margin: 12px 0 0; padding: 0; list-style: none; }
    .action-queue-item { display: grid; grid-template-columns: minmax(160px,.7fr) auto minmax(220px,1.3fr); gap: 12px; align-items: start; padding: 9px 0; border-top: 1px solid var(--border-subtle); }
    .action-queue-item:first-child { border-top: 0; }
    .action-queue-status { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: var(--accent-warning); }
    .action-queue-status.passed { color: var(--accent-success); }
    .action-queue-status.neutral { color: var(--accent-primary-light); }
    .causality-grid { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: 6px; margin-top: 10px; }
    .causality-grid > div { padding: 7px; border: 1px solid var(--border-subtle); border-radius: 6px; background: var(--bg-secondary); }
    .causality-grid dt { color: var(--text-tertiary); font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .causality-grid dd { margin: 3px 0 0; font-size: 11px; font-weight: 700; }
    .decision-workspace { margin-top: 26px; padding-block: 20px; border-block: 1px solid var(--border-subtle); }
    .decision-item { border-top: 1px solid var(--border-subtle); }
    .decision-item:first-of-type { margin-top: 16px; }
    .decision-item > summary { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 14px 0; cursor: pointer; list-style: none; }
    .decision-item > summary::-webkit-details-marker { display: none; }
    .decision-item > summary > span:first-child { display: grid; gap: 2px; }
    .decision-item > summary small { color: var(--text-tertiary); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
    .decision-item > summary strong { font-size: 13px; }
    .decision-state { flex: 0 0 auto; border-radius: 999px; padding: 3px 8px; background: color-mix(in srgb, var(--accent-warning) 12%, transparent); color: var(--accent-warning); font-size: 10px; font-weight: 800; }
    .decision-state.complete { background: color-mix(in srgb, var(--accent-success) 12%, transparent); color: var(--accent-success); }
    .decision-body { max-width: 780px; padding: 0 0 18px; }
    .decision-record-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 11px; margin-top: 12px; }
    .decision-record-fields.is-pending { display: none; }
    .decision-field { display: grid; gap: 5px; color: var(--text-secondary); font-size: 11px; font-weight: 600; }
    .decision-field-wide { grid-column: 1 / -1; }
    .decision-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px 14px; border: 0; margin: 0; padding: 0; color: var(--text-secondary); font-size: 11px; }
    .decision-actions legend { grid-column: 1 / -1; margin-bottom: 4px; color: var(--text-primary); font-weight: 700; }
    .decision-feedback { margin-top: 10px; color: var(--text-secondary); font-size: 11px; }
    @media (max-width: 760px) { .assessment-header { align-items: flex-start; } .assessment-coverage { padding-left: 12px; } .step-progress { grid-template-columns: 1fr; } .step-dot { display: none; } .step-dot.current { display: flex; } .results-overview { grid-template-columns: 1fr; } .results-summary { padding-right: 0; border-right: 0; border-bottom: 1px solid var(--border-subtle); padding-bottom: 18px; } .result-card { grid-template-columns: 1fr; } .baseline-guidance-empty { align-items: flex-start; flex-direction: column; } .step-label { white-space: normal; text-align: center; } .action-queue-item { grid-template-columns: 1fr; gap: 3px; } .causality-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } .decision-record-fields, .decision-actions { grid-template-columns: 1fr; } .decision-field-wide { grid-column: auto; } }
    @media (max-width: 480px) { .assessment-header { display: grid; grid-template-columns: minmax(0,1fr); gap: 10px; } .assessment-coverage { grid-auto-flow: column; justify-content: start; justify-items: start; align-items: baseline; gap: 4px; padding-left: 0; border-left: 0; } .step-actions { gap: 8px; } .step-indicator { display: none; } .step-actions .btn { min-width: 0; padding-inline: 11px; } #btn-next { margin-left: auto; } }
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
      renderAssessmentAtTop(container);
    } else {
      finalizeAssessment();
    }
  });
  container.querySelector('#btn-prev').addEventListener('click', () => {
    if (currentStep > 0) { currentStep--; visitedSteps.add(currentStep); renderAssessmentAtTop(container); }
  });
  container.querySelectorAll('.step-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      currentStep = parseInt(dot.dataset.step);
      visitedSteps.add(currentStep);
      renderAssessmentAtTop(container);
    });
  });
  // Back to elements tree (hierarchy context)
  container.querySelector('#btn-back-to-tree')?.addEventListener('click', () => navigateTo('elements'));
}

function renderAssessmentAtTop(container) {
  renderAssessment(container);
  window.scrollTo(0, 0);
}

function renderStep(container) {
  const content = container.querySelector('#step-content');
  const step = STEPS[currentStep];

  if (step.id === 'info') {
    content.innerHTML = `
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
        <details class="setup-context">
          <summary>Workshop context <span>Optional</span></summary>
          <div class="setup-context-fields">
            <div class="form-group">
              <label class="form-label" for="proj-boundary">Assessed boundary</label>
              <input class="input" id="proj-boundary" autocomplete="off" placeholder="System, service, or element in scope" value="${escapeHtml(localProject.boundary || '')}">
            </div>
            <div class="form-group">
              <label class="form-label" for="proj-purpose">Tailoring decision</label>
              <input class="input" id="proj-purpose" autocomplete="off" placeholder="What this assessment will help decide" value="${escapeHtml(localProject.purpose || '')}">
            </div>
            <div class="form-group">
              <label class="form-label" for="proj-evidenceCutoff">Evidence cutoff</label>
              <input class="input" id="proj-evidenceCutoff" type="date" value="${escapeHtml(localProject.evidenceCutoff || '')}">
            </div>
            <div class="form-group">
              <label class="form-label" for="proj-facilitator">Facilitator</label>
              <input class="input" id="proj-facilitator" autocomplete="off" value="${escapeHtml(localProject.facilitator || '')}">
            </div>
            <div class="form-group">
              <label class="form-label" for="proj-owner">Accountable owner</label>
              <input class="input" id="proj-owner" autocomplete="off" value="${escapeHtml(localProject.owner || '')}">
            </div>
          </div>
        </details>
      </div>
    `;
    ['proj-name', 'proj-date', 'proj-team', 'proj-phase', 'proj-boundary', 'proj-purpose', 'proj-evidenceCutoff', 'proj-facilitator', 'proj-owner'].forEach(id => {
      const input = content.querySelector(`#${id}`);
      input.addEventListener(input.matches('select') ? 'change' : 'input', (e) => {
        const key = id.replace('proj-', '');
        localProject[key] = e.target.value;
        commitAssessmentDraft();
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
  const reviewedInDimension = dimMetrics.filter(metric =>
    ['assessed', 'inherited-confirmed'].includes(localMetricAssessments?.[metric.id]?.status)
  ).length;
  const firstUnresolvedMetricIndex = Math.max(0, dimMetrics.findIndex(metric =>
    !['assessed', 'inherited-confirmed'].includes(localMetricAssessments?.[metric.id]?.status)
  ));
  content.innerHTML = `
    <div class="dimension-context mb-md" style="--dimension-color:${dim.color}">
      <span>${dimMetrics.length} metrics</span>
      <span class="dimension-review-count" aria-live="polite">${reviewedInDimension}/${dimMetrics.length} reviewed in this section</span>
    </div>
    <div class="metric-group">
      ${dimMetrics.map((m, metricIndex) => {
    const assessment = localMetricAssessments[m.id] || makeMetricAssessment(m.id);
    const guidance = ASSESSOR_GUIDANCE[m.id];
    const val = localScores[m.id] ?? 3;
    const isUnknown = assessment.status === 'unknown';
    const isUnreviewed = assessment.status === 'unreviewed';
    const isMigrationRequired = ['not-applicable', 'migration-required'].includes(assessment.status);
    const displayValue = isUnknown || isMigrationRequired ? '—' : val;
    const statusText = isUnknown
      ? 'Cannot assess yet — preview only'
      : assessment.status === 'inherited-confirmed'
        ? 'Inherited score confirmed'
        : isMigrationRequired
          ? 'Reassessment required'
          : isUnreviewed
            ? `Unreviewed — preview ${val}`
            : 'Assessed 1–5 score';
    return `
        <details class="metric-item" name="assessment-metric" data-metric-id="${m.id}" ${metricIndex === firstUnresolvedMetricIndex ? 'open' : ''}>
          <summary class="metric-header">
            <div class="flex items-center gap-sm">
              <span class="metric-id">${m.id}</span>
              <span>
                <span class="metric-name">${m.name}</span>
                <span class="metric-status ${isUnknown || isUnreviewed ? 'unknown' : isMigrationRequired ? 'needs-review' : 'confirmed'}">${statusText}</span>
              </span>
            </div>
            <div class="metric-score-display" id="score-${m.id}">${displayValue}</div>
          </summary>
          <div class="metric-body">
          <fieldset class="metric-anchor-choices" aria-describedby="guide-${m.id} desc-${m.id}">
            <legend class="sr-only">Select one ordinal anchor for ${escapeHtml(m.id)} ${escapeHtml(m.name)}</legend>
            ${[1, 2, 3, 4, 5].map(score => {
              const selected = ['assessed', 'inherited-confirmed'].includes(assessment.status) && assessment.score === score;
              const preview = isUnreviewed && val === score;
              return `<label class="metric-anchor-card${selected ? ' selected' : ''}${preview ? ' preview' : ''}">
                <input type="radio" class="metric-anchor-radio" name="metric-${m.id}" value="${score}" aria-label="${escapeHtml(m.id)} score ${score}: ${escapeHtml(guidance.anchors[score])}" ${selected ? 'checked' : ''}>
                <span><span class="metric-anchor-number">${score}</span><span class="metric-anchor-text">${escapeHtml(guidance.anchors[score])}</span></span>
                ${preview ? '<span class="metric-anchor-tag">Preview</span>' : ''}
              </label>`;
            }).join('')}
          </fieldset>
          <div class="metric-description" id="desc-${m.id}">${isUnknown
            ? 'A neutral preview is shown for orientation. Resolve this metric before finalizing.'
            : isMigrationRequired
              ? 'Imported value needs a current 1–5 reassessment before software completeness can pass.'
              : isUnreviewed
                ? `<strong>Preview ${val}:</strong> ${escapeHtml(guidance.anchors[val])}`
                : `<strong>Anchor ${val}:</strong> ${escapeHtml(guidance.anchors[val])}`}</div>
          <div class="metric-assessment-meta mt-sm">
            <span class="text-xs text-secondary">Select the closest evidence-backed anchor.</span>
            <label class="metric-unknown-toggle"><input type="checkbox" class="metric-unknown" data-metric="${m.id}" aria-label="Mark ${m.id} ${escapeHtml(m.name)} as cannot assess yet" ${isUnknown ? 'checked' : ''}> Cannot assess yet</label>
          </div>
          ${assessment.status === 'not-applicable' ? '<div class="text-xs mt-sm" style="color:var(--accent-warning);">Imported N/A cannot pass software completeness. Choose an assessed 1–5 score or explicitly record Unknown.</div>' : ''}
          <div class="metric-secondary-actions">
            <details class="assessor-guidance">
              <summary>Provisional assessor guidance · manual ${escapeHtml(ASSESSOR_GUIDANCE_META.manualVersion)}</summary>
              <div class="assessor-guidance-grid" id="guide-${m.id}">
                <div class="metric-definition"><strong>Definition:</strong> ${escapeHtml(guidance.definition)}<br><strong>Excludes:</strong> ${escapeHtml(guidance.exclusions)}</div>
                <div><strong>Evidence examples:</strong> ${escapeHtml(guidance.evidenceExamples)}</div>
                <div><strong>Counterexample:</strong> ${escapeHtml(guidance.counterexample)}</div>
                <div><strong>Reassess when:</strong> ${escapeHtml(guidance.reassessWhen)}</div>
                ${m.guidedQuestions ? `<div><button class="btn btn-sm btn-outline wizard-btn" data-metric="${m.id}" type="button">Help me choose</button></div>` : ''}
              </div>
            </details>
            ${renderMetricJustificationControls(m.id)}
            ${m.id === 'M15' ? renderAssuranceObligationControls() : ''}
          </div>
          <div class="metric-wizard hidden" id="wizard-${m.id}" style="display: none; margin-top: 12px; padding: 16px; background: rgba(99,102,241,0.05); border-radius: 8px; border: 1px solid var(--accent-primary-light);"></div>
          </div>
        </details>`;
  }).join('')}
    </div>
  `;

  dimMetrics.forEach(m => {
    content.querySelectorAll(`input[name="metric-${m.id}"]`).forEach(input => input.addEventListener('change', event => {
      setMetricScore(m.id, Number(event.target.value), content);
    }));
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
      status: input.checked ? 'unknown' : 'unreviewed'
    });
    commitAssessmentDraft();
    renderAssessment(container);
  }));
  content.querySelectorAll('.metric-justification-input').forEach(input => input.addEventListener('input', () => {
    const metricId = input.dataset.metric;
    localMetricAssessments[metricId] = makeMetricAssessment(metricId, { rationale: input.value });
    commitAssessmentDraft();
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
        <label class="text-xs" style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="assurance-confirmed" ${obligation.bindingStatus === 'confirmed' ? 'checked' : ''}> Binding status asserted</label>
        <label class="text-xs">Asserted authority role<input class="input" id="assurance-authority" aria-label="Asserted assurance authority role" placeholder="Asserted authority role (not verified)" value="${escapeHtml(obligation.authority || '')}"></label>
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
      const existingStatus = localMetricAssessments.M15?.status;
      localMetricAssessments.M15 = makeMetricAssessment('M15', {
        score: localScores.M15 ?? 3,
        status: ['assessed', 'inherited-confirmed', 'unknown'].includes(existingStatus) ? existingStatus : 'unreviewed',
        qualifiers: [...qualifiers]
      });
      commitAssessmentDraft();
    };
    assuranceInputs.forEach(id => {
      const input = content.querySelector(`#${id}`);
      input?.addEventListener(input.matches('select, input[type="checkbox"]') ? 'change' : 'input', update);
    });
    content.querySelectorAll('.assurance-scope').forEach(input => input.addEventListener('change', update));
  }
}

function setMetricScore(metricId, value, contentContainer) {
  const m = METRICS.find(x => x.id === metricId);
  const guidance = ASSESSOR_GUIDANCE[metricId];
  localScores[metricId] = value;
  localMetricAssessments[metricId] = makeMetricAssessment(metricId, { score: value, status: 'assessed' });
  commitAssessmentDraft({ manualMetricId: metricId });
  const metricItem = contentContainer.querySelector(`.metric-item[data-metric-id="${metricId}"]`);
  metricItem?.querySelectorAll('.metric-anchor-card').forEach(card => {
    const input = card.querySelector('.metric-anchor-radio');
    const selected = Number(input?.value) === value;
    if (input) input.checked = selected;
    card.classList.toggle('selected', selected);
    card.classList.remove('preview');
    card.querySelector('.metric-anchor-tag')?.remove();
  });

  const display = contentContainer.querySelector(`#score-${metricId}`);
  if (display) {
    display.textContent = value;
    display.style.color = 'var(--text-primary)';
  }

  const desc = contentContainer.querySelector(`#desc-${metricId}`);
  if (desc) desc.textContent = `Confirmed anchor ${value}: ${guidance?.anchors?.[value] || m.anchors[value] || ''}`;

  const status = metricItem?.querySelector('.metric-status');
  if (status) {
    status.className = 'metric-status confirmed';
    status.textContent = 'Assessed 1–5 score';
  }
  const unknownToggle = metricItem?.querySelector('.metric-unknown');
  if (unknownToggle) unknownToggle.checked = false;

  refreshMetricReviewProgress(contentContainer);
}

function refreshMetricReviewProgress(contentContainer) {
  const completeness = assessMetricCompleteness(localScores, localMetricAssessments);
  const assessmentRoot = contentContainer.closest('.assessment-container');
  const coverage = assessmentRoot?.querySelector('.assessment-coverage');
  if (coverage) {
    coverage.setAttribute('aria-label', `${completeness.completeCount} of ${METRICS.length} metrics reviewed`);
    const total = coverage.querySelector('strong');
    if (total) total.textContent = `${completeness.completeCount}/${METRICS.length}`;
  }

  const metricItems = [...contentContainer.querySelectorAll('.metric-item[data-metric-id]')];
  const dimensionReviewCount = contentContainer.querySelector('.dimension-review-count');
  if (dimensionReviewCount && metricItems.length) {
    const reviewed = metricItems.filter(item =>
      ['assessed', 'inherited-confirmed'].includes(localMetricAssessments?.[item.dataset.metricId]?.status)
    ).length;
    dimensionReviewCount.textContent = `${reviewed}/${metricItems.length} reviewed in this section`;
  }
}

function startWizard(metricId, contentContainer) {
  const metric = METRICS.find(m => m.id === metricId);
  const guidance = ASSESSOR_GUIDANCE[metricId];
  const wizardDiv = contentContainer.querySelector(`#wizard-${metricId}`);
  if (!wizardDiv) return;

  if (wizardDiv.style.display === 'block') {
    wizardDiv.style.display = 'none'; // toggle off
    return;
  }

  wizardDiv.style.display = 'block';
  let currentQ = 0;
  const answers = [];

  const renderRecommendation = () => {
    const affirmativeScores = answers.filter(answer => answer.answer === 'yes').map(answer => answer.question.yesScore);
    const recommendation = affirmativeScores.length ? Math.max(...affirmativeScores) : 1;
    const higher = recommendation < 5
      ? `Anchor ${recommendation + 1} was not selected because the recorded path did not support a higher-pressure indicator.`
      : 'No higher adjacent anchor exists.';
    const lower = recommendation > 1
      ? `Anchor ${recommendation - 1} was not selected because at least one recorded indicator supports anchor ${recommendation}.`
      : 'No lower adjacent anchor exists.';
    wizardDiv.innerHTML = `
      <div class="text-sm font-semibold mb-sm">Recommended anchor ${recommendation}</div>
      <div class="text-xs text-secondary mb-md">${escapeHtml(guidance.anchors[recommendation])}</div>
      <div class="text-xs mb-sm"><strong>Evidence path</strong></div>
      <ol class="text-xs text-secondary" style="padding-left:18px;display:grid;gap:5px;">
        ${answers.map(({ question, answer }) => `<li><strong>${answer === 'yes' ? 'Yes' : 'No'}:</strong> ${escapeHtml(question.text)}${answer === 'yes' ? ` — ${escapeHtml(question.rationale)}` : ''}</li>`).join('')}
      </ol>
      <div class="text-xs text-secondary mt-sm"><strong>Adjacent anchors:</strong> ${escapeHtml(lower)} ${escapeHtml(higher)}</div>
      <div class="flex gap-sm mt-md" style="flex-wrap:wrap;">
        <button class="btn btn-sm btn-primary confirm-wizard">Confirm anchor ${recommendation}</button>
        <button class="btn btn-sm btn-outline edit-wizard">Edit anchors</button>
        <button class="btn btn-sm btn-outline unknown-wizard">Mark Unknown</button>
      </div>
      <div class="text-xs text-secondary mt-sm">The recommendation does not create a judgment until you confirm it.</div>`;

    wizardDiv.querySelector('.confirm-wizard').addEventListener('click', () => {
      setMetricScore(metricId, recommendation, contentContainer);
      wizardDiv.innerHTML = `<div class="text-sm font-semibold text-success">Anchor ${recommendation} confirmed.</div>`;
    });
    wizardDiv.querySelector('.edit-wizard').addEventListener('click', () => {
      wizardDiv.style.display = 'none';
      contentContainer.querySelector(`input[name="metric-${metricId}"]`)?.focus();
    });
    wizardDiv.querySelector('.unknown-wizard').addEventListener('click', () => {
      const toggle = contentContainer.querySelector(`.metric-unknown[data-metric="${metricId}"]`);
      if (toggle && !toggle.checked) toggle.click();
    });
  };

  const renderQ = () => {
    if (currentQ >= metric.guidedQuestions.length) {
      renderRecommendation();
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
      answers.push({ question: q, answer: 'yes' });
      currentQ++;
      renderQ();
    });

    wizardDiv.querySelector('.no-btn').addEventListener('click', () => {
      answers.push({ question: q, answer: 'no' });
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
  if (completeness.completeCount === 0 && !showNeutralPreview) {
    content.innerHTML = `
      <section class="empty-results-state" aria-labelledby="empty-results-title">
        <p class="eyebrow">0/${METRICS.length} reviewed</p>
        <h3 id="empty-results-title">No recommendation yet</h3>
        <p class="text-secondary mt-sm">The midpoint values are interface previews, not assessed judgments. Review at least one metric before using a partial preview, or open the neutral what-if view explicitly.</p>
        <div class="flex gap-sm mt-lg" style="justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" type="button" id="btn-review-first-metric">Review the first metric</button>
          <button class="btn btn-secondary" type="button" id="btn-open-neutral-preview">Explore neutral what-if preview</button>
        </div>
        <p class="text-xs text-secondary mt-md">Any neutral what-if profile remains non-authoritative and cannot produce a pilot record.</p>
      </section>`;
    content.querySelector('#btn-review-first-metric')?.addEventListener('click', () => {
      currentStep = STEPS.findIndex(step => step.id === 'complexity');
      visitedSteps.add(currentStep);
      renderAssessmentAtTop(document.getElementById('main-content'));
    });
    content.querySelector('#btn-open-neutral-preview')?.addEventListener('click', () => {
      showNeutralPreview = true;
      renderResults(content);
    });
    return;
  }
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
  const rule11ElevatedPreview = assessRule11Disposition(result.violations, localRuleDispositions, { ...result.levels, 27: 'standard' });
  const canApplyRule11Elevation = localRuleDispositions?.['11']?.outcome === 'elevated-validation' && rule11ElevatedPreview.complete;
  const rootManualAdjustments = state.manualAdjustments || {};
  const activeManualAdjustments = activeNodeBeforeRun?.id === state.assessmentTree?.rootId
    ? { ...rootManualAdjustments, ...(activeNodeBeforeRun?.manualAdjustments || {}) }
    : activeNodeBeforeRun
      ? { ...(activeNodeBeforeRun.manualAdjustments || {}) }
      : { ...rootManualAdjustments };
  const existingP27Adjustment = activeManualAdjustments?.[27] || activeManualAdjustments?.['27'];
  const rule11ElevationPending = canApplyRule11Elevation
    && result.levels?.[27] === 'basic'
    && existingP27Adjustment?.level !== 'standard';
  const displayManualAdjustments = rule11ElevationPending
    ? {
      ...activeManualAdjustments,
      27: {
        level: 'standard',
        source: 'rule-disposition-preview',
        ruleId: 11,
        propagationId: 'P12'
      }
    }
    : activeManualAdjustments;
  const displayLevels = applyManualAdjustmentsToLevels(result.levels, displayManualAdjustments);
  const localScenarioLevels = result.locallyCompleteRightSizingRecordCount > 0
    ? applyManualAdjustmentsToLevels(result.locallyAdjustedLevels || {}, displayManualAdjustments)
    : {};
  const rule11Disposition = assessRule11Disposition(result.violations, localRuleDispositions, displayLevels);
  const warningDispositions = assessWarningDispositions(result.violations, localRuleDispositions, displayLevels);
  const generalWarningDispositions = warningDispositions.assessments.filter(assessment => assessment.ruleId !== '11');
  const csiReadiness = assessCsiResponse(localScores, localCsiResponse);
  const openDecisionCount = (rule11Disposition.required && (!rule11Disposition.complete || rule11ElevationPending) ? 1 : 0)
    + generalWarningDispositions.filter(assessment => !assessment.complete).length
    + (csiReadiness.required && !csiReadiness.complete ? 1 : 0);
  const firstIncompleteGeneralIndex = generalWarningDispositions.findIndex(assessment => !assessment.complete);
  const hasDecisionWorkspace = rule11Disposition.required || generalWarningDispositions.length > 0 || csiReadiness.required;
  const correlatedEvidence = assessCorrelatedEvidence(localMetricAssessments);
  const processCard = (p) => {
    const level = displayLevels[p.id] || result.levels[p.id] || 'basic';
    const derivedLevel = result.derived?.[p.id] || 'basic';
    const floorClosureLevel = result.normativeLevels?.[p.id] || result.levels[p.id] || level;
    const manualAdjustment = displayManualAdjustments?.[p.id] || displayManualAdjustments?.[String(p.id)];
    const governedAdjustment = manualAdjustment?.level || null;
    const localScenarioLevel = localScenarioLevels?.[p.id] || localScenarioLevels?.[String(p.id)] || null;
    const localScenarioAdjustment = localScenarioLevel && localScenarioLevel !== level ? localScenarioLevel : null;
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
    const attentionLabels = [
      basicExcluded.excluded ? 'Basic unavailable' : '',
      wasOverridden ? 'Mandatory floor' : '',
      wasFixed ? 'Dependency closure' : '',
      confidence === 'available-with-justification' ? 'Justification needed' : '',
      governedAdjustment ? 'Manual adjustment' : '',
      localScenarioAdjustment ? 'Local scenario differs' : ''
    ].filter(Boolean);
    return `<article class="result-card" style="--recommendation-level:var(--level-${level})">
      <div class="result-card-main">
        <div class="result-card-header">
          <div><span class="result-process">${escapeHtml(p.name)}</span><span class="result-process-id">P${escapeHtml(p.id)}</span></div>
          <span class="level-badge ${level}">${escapeHtml(FRAMEWORK_META.levelLabels[level] || level)}</span>
        </div>
        <div class="result-why">
          <span>Driven by <strong>${escapeHtml(triggerMetrics)}</strong>${detail.triggerScore ? ` at ${detail.triggerScore}` : ''}</span>
          <span>${escapeHtml(confidenceLabel)}</span>
        </div>
        ${attentionLabels.length ? `<div class="result-signals">${attentionLabels.map(label => `<span>${escapeHtml(label)}</span>`).join('')}</div>` : ''}
        <div class="drivers-list">${drivers.slice(0, 2).map(d => `<span class="driver-item"><span class="driver-badge ${d.role === 'P' ? 'primary' : 'secondary'}">${d.role === 'P' ? 'Main' : 'Also'}</span>${escapeHtml(d.metric)} ${escapeHtml(d.value)}</span>`).join('')}</div>
        <details class="result-derivation">
          <summary>How this level was derived</summary>
          <dl class="causality-grid" aria-label="Recommendation causality">
            <div><dt>Metric result</dt><dd>${escapeHtml(derivedLevel)}</dd></div>
            <div><dt>Rules and closure</dt><dd>${escapeHtml(floorClosureLevel)}</dd></div>
            <div><dt>Recorded adjustment</dt><dd>${governedAdjustment ? escapeHtml(governedAdjustment) : 'None'}</dd></div>
            <div><dt>Local scenario</dt><dd>${localScenarioAdjustment ? escapeHtml(localScenarioAdjustment) : 'No change'}</dd></div>
            <div><dt>Recommended level</dt><dd>${escapeHtml(level)}</dd></div>
          </dl>
        </details>
      </div>
      <a class="btn btn-secondary btn-sm process-detail-link" href="${escapeHtml(processDetailsHref(p.id, level, 'assessment'))}" aria-label="View ${escapeHtml(p.name)} ${escapeHtml(FRAMEWORK_META.levelLabels[level] || level)} details">View guidance →</a>
    </article>`;
  };
  const priorityIds = new Set([
    ...result.overrides.map(item => item.processId),
    ...result.fixes.map(item => item.processId),
    ...result.violations.flatMap(item => [item.processId, ...(item.processes || [])]),
    ...CORE_PROCESSES.filter(p => displayLevels[p.id] === 'comprehensive').map(p => p.id),
    ...CORE_PROCESSES.filter(p => localScenarioLevels[p.id] && localScenarioLevels[p.id] !== displayLevels[p.id]).map(p => p.id),
    ...CORE_PROCESSES.filter(p => result.confidence?.[p.id] === 'available-with-justification').map(p => p.id)
  ].filter(Boolean).map(Number));
  const priorityProcesses = CORE_PROCESSES.filter(p => priorityIds.has(p.id));
  const reviewFirst = priorityProcesses;
  const hierarchyReadiness = assessHierarchyCompleteness(state.assessmentTree);
  const softwareChecksReady = completeness.complete && warningDispositions.complete && csiReadiness.complete && hierarchyReadiness.complete;
  const actionQueue = [
    {
      label: 'Baseline authority status',
      status: softwareChecksReady ? 'software checks passed' : 'work in progress',
      passed: softwareChecksReady,
      detail: softwareChecksReady
        ? 'Internal software checks can pass; external approval and operational authorization remain unverified.'
        : 'This preview is not an authoritative organizational baseline.'
    },
    {
      label: 'Metrics still to resolve',
      status: completeness.complete ? 'passed' : `${completeness.incompleteMetricIds.length} unresolved`,
      passed: completeness.complete,
      detail: completeness.complete ? `All ${METRICS.length} judgments are confirmed.` : completeness.incompleteMetricIds.join(', ')
    },
    {
      label: 'Critical floors',
      status: activeFloors.length ? `${activeFloors.length} active` : 'none active',
      passed: true,
      detail: activeFloors.length ? 'Review each floor and its source condition below.' : 'No mandatory metric/context floors are active in this preview.'
    },
    {
      label: 'Mandatory closure changes',
      status: result.fixes.length ? `${result.fixes.length} applied` : 'none',
      passed: true,
      detail: result.fixes.length ? 'Dependency closure elevated one or more process levels.' : 'The profile already satisfies mandatory dependency closure.'
    },
    {
      label: 'Warning dispositions',
      status: warningDispositions.complete ? 'passed' : `${warningDispositions.incompleteRuleIds.length} unresolved`,
      passed: warningDispositions.complete,
      detail: warningDispositions.complete ? 'All triggered warnings are dispositioned.' : `Rules: ${warningDispositions.incompleteRuleIds.join(', ') || 'none identified'}`
    },
    {
      label: 'CSI response',
      status: csiReadiness.complete ? 'passed' : 'response required',
      passed: csiReadiness.complete,
      detail: csiReadiness.required ? `Constraint response at CSI ${csiReadiness.csi}.` : 'No special constraint response is triggered.'
    },
    {
      label: 'Hierarchy exceptions',
      status: hierarchyReadiness.complete ? 'passed' : `${hierarchyReadiness.incompleteElementIds.length} incomplete`,
      passed: hierarchyReadiness.complete,
      detail: hierarchyReadiness.enabled ? 'Advanced element mode is enabled.' : 'Advanced hierarchy mode is not enabled.'
    },
    {
      label: 'Right-sizing proposals',
      status: rightSizingProposals.length ? 'Decision available — non-blocking' : 'none',
      passed: true,
      neutral: rightSizingProposals.length > 0,
      detail: rightSizingProposals.length ? 'Each proposal needs a recorded decision; no browser-local record changes the normative recommendation.' : 'No proposed reductions await disposition.'
    },
    {
      label: 'Local reduction records',
      status: result.locallyCompleteRightSizingRecordCount > 0 ? `${result.locallyCompleteRightSizingRecordCount} locally complete` : 'none',
      passed: true,
      neutral: result.locallyCompleteRightSizingRecordCount > 0,
      detail: result.locallyCompleteRightSizingRecordCount > 0
        ? 'A separate unverified scenario is available. External approval is not authenticated, so the normative recommendation is unchanged.'
        : 'No structurally complete local reduction record is active.'
    },
    {
      label: 'Pilot process profile',
      status: 'available for review',
      passed: true,
      detail: `${Object.values(displayLevels).filter(level => level === 'basic').length} Basic, ${Object.values(displayLevels).filter(level => level === 'standard').length} Standard, ${Object.values(displayLevels).filter(level => level === 'comprehensive').length} Comprehensive.`
    }
  ];
  const visibleActionQueue = assessmentViewMode === 'issues'
    ? actionQueue.filter(item => !item.passed || item.label === 'Pilot process profile')
    : actionQueue;
  const compactActionQueue = visibleActionQueue.filter(item =>
    (!item.passed && item.label !== 'Baseline authority status')
      || item.label === 'Pilot process profile'
      || (assessmentViewMode !== 'issues' && item.neutral)
  );
  const statusMarkup = `
    <section class="action-queue" aria-labelledby="assessment-action-queue-title">
      <div class="section-heading-row">
        <div>
          <p class="eyebrow">${assessmentViewMode === 'issues' ? 'Completion' : 'Status'}</p>
          <h3 id="assessment-action-queue-title">${assessmentViewMode === 'issues' ? 'Items to resolve' : 'Review status'}</h3>
        </div>
        <span class="status-count">${compactActionQueue.filter(item => !item.passed).length} open</span>
      </div>
      <ol class="action-queue-list">
        ${compactActionQueue.map(item => `<li class="action-queue-item"><strong>${escapeHtml(item.label)}</strong><span class="action-queue-status ${item.neutral ? 'neutral' : item.passed ? 'passed' : ''}">${escapeHtml(item.status)}</span><span class="text-xs text-secondary">${escapeHtml(item.detail)}</span></li>`).join('')}
      </ol>
    </section>
    ${!completeness.complete ? `<div class="override-banner" style="background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.4);">
      <strong>Work in progress</strong>
      <div class="text-sm mt-sm"><strong>${completeness.completeCount}/${completeness.totalCount} reviewed</strong></div>
      <div class="text-sm mt-sm">${completeness.incompleteMetricIds.length} metric judgment(s) remain unresolved: ${escapeHtml(completeness.incompleteMetricIds.join(', '))}. Preview values help with orientation but cannot be finalized until they are resolved.</div>
    </div>` : ''}
    ${correlatedEvidence.warningCount ? `<div class="override-banner" style="background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.4);">
      <strong>Correlated evidence review (${correlatedEvidence.warningCount})</strong>
      ${correlatedEvidence.warnings.map(warning => `<div class="text-sm mt-sm">${escapeHtml(warning.message)}</div>`).join('')}
      <div class="text-xs text-secondary mt-sm">Warning only: scores, recommended process levels, and closure are unchanged. If shared evidence is appropriate, add a distinct consequence analysis in the affected metrics' optional Justification note.</div>
    </div>` : ''}`;
  const decisionWorkspaceMarkup = hasDecisionWorkspace ? `
    <section class="decision-workspace mb-lg" aria-labelledby="decision-workspace-title">
      <div class="section-heading-row">
        <div>
          <p class="eyebrow">Decisions</p>
          <h3 id="decision-workspace-title">${openDecisionCount ? `${openDecisionCount} item${openDecisionCount === 1 ? ' needs' : 's need'} attention` : 'Decision record complete'}</h3>
          <p class="text-sm text-secondary mt-sm">Work one item at a time. The additional record fields appear after you choose a disposition.</p>
        </div>
        <span class="status-count">${openDecisionCount} open</span>
      </div>
      ${rule11Disposition.required ? `<details class="decision-item rule11-decision" ${rule11ElevationPending || !rule11Disposition.complete ? 'open' : ''}>
        <summary>
          <span><small>Rule 11 · verification and validation</small><strong>Align validation evidence with the verification level</strong></span>
          <span class="decision-state ${rule11Disposition.complete || rule11ElevationPending ? 'complete' : ''}">${rule11ElevationPending ? 'Ready to apply' : rule11Disposition.complete ? 'Recorded' : 'Decision needed'}</span>
        </summary>
        <div class="decision-body">
          <p class="text-sm text-secondary">Verification is Comprehensive while Validation is below Standard. Choose whether the current evidence is sufficient or Validation should be raised. The warning remains visible either way.</p>
          <label class="decision-field mt-md">
            <span>Disposition</span>
            <select class="select" id="rule11-outcome" aria-label="Rule 11 disposition outcome">
              <option value="">Choose an outcome...</option>
              ${RULE_11_OUTCOMES.map(option => `<option value="${option.id}" ${localRuleDispositions?.['11']?.outcome === option.id ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
            </select>
          </label>
          <div class="decision-record-fields ${localRuleDispositions?.['11']?.outcome ? '' : 'is-pending'}" id="rule11-record-fields">
            <label class="decision-field"><span>Owner or approver role</span><input class="input" id="rule11-owner" aria-label="Rule 11 asserted owner or approver role" value="${escapeHtml(localRuleDispositions?.['11']?.ownerApprover || '')}"></label>
            <label class="decision-field"><span>Evidence reference</span><input class="input" id="rule11-evidence" aria-label="Rule 11 evidence reference" value="${escapeHtml(localRuleDispositions?.['11']?.evidenceRef || '')}"></label>
            <label class="decision-field"><span>Review date</span><input class="input" id="rule11-date" aria-label="Rule 11 review date" type="date" value="${escapeHtml(localRuleDispositions?.['11']?.reviewDate || '')}"></label>
            <label class="decision-field decision-field-wide"><span>Rationale and controls</span><textarea class="input" id="rule11-rationale" aria-label="Rule 11 disposition rationale" rows="3">${escapeHtml(localRuleDispositions?.['11']?.rationale || '')}</textarea></label>
          </div>
          <div class="decision-feedback" id="rule11-disposition-status" role="status" aria-live="polite">${rule11ElevationPending
            ? 'Ready to apply the explicit Process 27 adjustment when completeness is checked.'
            : rule11Disposition.complete
              ? 'Decision recorded.'
              : 'Choose an outcome and complete its decision record.'}</div>
        </div>
      </details>` : ''}
      ${generalWarningDispositions.map((assessment, index) => {
        const id = escapeHtml(assessment.ruleId);
        const record = localRuleDispositions?.[assessment.ruleId] || {};
        return `<details class="warning-disposition decision-item" data-rule-id="${id}" ${(!rule11Disposition.required || rule11Disposition.complete) && index === firstIncompleteGeneralIndex ? 'open' : ''}>
          <summary>
            <span><small>Rule ${id}</small><strong>${escapeHtml(assessment.violation?.label || 'Triggered warning')}</strong></span>
            <span class="warning-disposition-summary decision-state ${assessment.complete ? 'complete' : ''}" aria-live="polite">${assessment.complete ? 'complete' : 'needs decision'}</span>
          </summary>
          <div class="decision-body">
            <p class="text-sm text-secondary">Record how the project will handle this warning. The choice documents governance; it does not hide the warning or change a process level.</p>
            <label class="decision-field mt-md"><span>Disposition</span><select class="select warning-outcome" aria-label="Rule ${id} disposition outcome">
              <option value="">Choose an outcome...</option>
              ${GENERAL_WARNING_OUTCOMES.map(option => `<option value="${option.id}" ${record.outcome === option.id ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
            </select></label>
            <div class="decision-record-fields ${record.outcome ? '' : 'is-pending'}">
              <label class="decision-field"><span>Owner or approver role</span><input class="input warning-owner" aria-label="Rule ${id} asserted owner or approver role" value="${escapeHtml(record.ownerApprover || '')}"></label>
              <label class="decision-field"><span>Evidence reference</span><input class="input warning-evidence" aria-label="Rule ${id} evidence reference" value="${escapeHtml(record.evidenceRef || '')}"></label>
              <label class="decision-field"><span>Review date</span><input class="input warning-date" aria-label="Rule ${id} review date" type="date" value="${escapeHtml(record.reviewDate || '')}"></label>
              <label class="decision-field decision-field-wide"><span>Rationale and controls</span><textarea class="input warning-rationale" aria-label="Rule ${id} rationale and controls" rows="2">${escapeHtml(record.rationale || '')}</textarea></label>
            </div>
          </div>
        </details>`;
      }).join('')}
      ${csiReadiness.required ? `<details class="decision-item csi-decision" ${(!rule11Disposition.required || rule11Disposition.complete) && firstIncompleteGeneralIndex === -1 && !csiReadiness.complete ? 'open' : ''}>
        <summary>
          <span><small>Delivery feasibility · CSI ${csiReadiness.csi}</small><strong>${csiReadiness.expectedResponseType === 'sponsor-escalation' ? 'Escalate delivery feasibility' : 'Agree the feasibility response'}</strong></span>
          <span class="decision-state ${csiReadiness.complete ? 'complete' : ''}">${csiReadiness.complete ? 'Recorded' : 'Response needed'}</span>
        </summary>
        <div class="decision-body">
          <p class="text-sm text-secondary">High schedule or budget pressure needs an explicit response. This record does not lower required process rigor.</p>
          <input type="hidden" id="csi-response-type" value="${csiReadiness.expectedResponseType}">
          <fieldset class="decision-actions mt-md">
            <legend>Response actions</legend>
            ${CSI_RESPONSE_ACTIONS.map(action => `<label><input type="checkbox" class="csi-action" value="${action.id}" ${(localCsiResponse.selectedActions || []).includes(action.id) ? 'checked' : ''}> ${escapeHtml(action.label)}</label>`).join('')}
          </fieldset>
          <div class="decision-record-fields">
            <label class="decision-field decision-field-wide"><span>Protected outputs and evidence</span><textarea class="input" id="csi-protected-outputs" aria-label="CSI protected outputs and evidence" rows="2">${escapeHtml(localCsiResponse.protectedOutputs || '')}</textarea></label>
            <label class="decision-field decision-field-wide"><span>Feasibility rationale and decision</span><textarea class="input" id="csi-rationale" aria-label="CSI rationale and decision" rows="2">${escapeHtml(localCsiResponse.rationaleDecision || '')}</textarea></label>
            <label class="decision-field"><span>${csiReadiness.csi >= 5 ? 'Sponsor or approver role' : 'Owner or approver role'}</span><input class="input" id="csi-owner" aria-label="CSI asserted owner or approver role" value="${escapeHtml(localCsiResponse.ownerApprover || '')}"></label>
            <label class="decision-field"><span>Evidence reference</span><input class="input" id="csi-evidence" aria-label="CSI evidence reference" value="${escapeHtml(localCsiResponse.evidenceRef || '')}"></label>
            <label class="decision-field"><span>Review date</span><input class="input" id="csi-date" aria-label="CSI review date" type="date" value="${escapeHtml(localCsiResponse.reviewDate || '')}"></label>
          </div>
          <div class="decision-feedback" id="csi-response-status" role="status" aria-live="polite">${csiReadiness.complete ? 'Response recorded.' : 'Incomplete: finish the response record.'}</div>
        </div>
      </details>` : ''}
    </section>` : '';
  content.innerHTML = `
    <nav class="assessment-result-tabs" aria-label="Assessment review sections">
      <button type="button" class="${assessmentViewMode !== 'issues' ? 'active' : ''}" data-result-route="review" aria-pressed="${assessmentViewMode !== 'issues'}">Recommendations</button>
      <button type="button" class="${assessmentViewMode === 'issues' ? 'active' : ''}" data-result-route="issues" aria-pressed="${assessmentViewMode === 'issues'}">Decisions${openDecisionCount ? ` · ${openDecisionCount}` : ''}</button>
    </nav>
    <div class="recommendation-overview ${assessmentViewMode === 'issues' ? 'issues-hidden' : ''}">
    <h3 class="mb-sm">Tailoring profile</h3>
    <p class="result-guidance mb-lg">Use the shape to spot pressure areas, then review only the processes that depart from the baseline or need a decision.</p>
    <div class="results-overview mb-lg">
      <section class="results-summary">
        <p class="eyebrow">At a glance</p>
        <div class="result-stat"><strong>${reviewFirst.length}</strong><span>process${reviewFirst.length === 1 ? '' : 'es'} to review first</span></div>
        <div class="result-stat"><strong>${warningDispositions.incompleteRuleIds.length + (csiReadiness.complete ? 0 : 1)}</strong><span>decision${warningDispositions.incompleteRuleIds.length + (csiReadiness.complete ? 0 : 1) === 1 ? '' : 's'} still needed</span></div>
        <div class="result-stat"><strong>${completeness.completeCount}/${METRICS.length}</strong><span>metric judgments confirmed</span></div>
        <p class="result-priority-note text-sm mt-lg">${reviewFirst.length
          ? 'Start with the process list below. Routine recommendations remain in the full profile.'
          : 'No process needs focused review. Continue with the baseline profile or open a work aid as needed.'}</p>
      </section>
      <section class="results-visual">${renderMetricSpiderwebSvg(localScores, METRICS, DIMENSIONS, {
        idPrefix: 'assessment-profile',
        metricAssessments: localMetricAssessments,
        description: 'The sixteen metric scores grouped into four assessment areas.'
      })}</section>
    </div>
    <section class="priority-guidance mb-lg">
      <div class="section-heading-row">
        <div>
          <p class="eyebrow">Recommendations</p>
          <h4>${reviewFirst.length ? 'Review these processes first' : 'No exceptions to review first'}</h4>
        </div>
        <span class="text-xs text-secondary">${reviewFirst.length ? `${reviewFirst.length} of ${CORE_PROCESSES.length}` : 'Baseline profile'}</span>
      </div>
      ${reviewFirst.length
        ? `<div class="process-guidance-list">${reviewFirst.map(processCard).join('')}</div>`
        : `<div class="baseline-guidance-empty"><p>The assessment does not create a special priority list. Use the full process profile below when you need a specific work aid.</p><a class="btn btn-secondary btn-sm process-detail-link" href="${escapeHtml(processDetailsHref(CORE_PROCESSES[0].id, displayLevels[CORE_PROCESSES[0].id] || 'standard', 'assessment'))}">Open process work aids →</a></div>`}
    </section>
    </div>
    ${statusMarkup}
    ${decisionWorkspaceMarkup}

    <details class="results-breakdown governance-detail">
      <summary>Technical checks and governance trace</summary>
      <div class="results-breakdown-body">
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
        <strong>${rightSizingProposals.length} Right-Sizing Proposal${rightSizingProposals.length === 1 ? '' : 's'} — not applied</strong>
        <div class="text-xs text-secondary mt-sm mb-sm">Project scale: ${result.indices?.psi || '—'} · Delivery pressure: ${result.indices?.csi || '—'} · Adoption readiness: ${result.indices?.cri || '—'}</div>
        <div class="text-xs text-secondary mb-sm">Each proposal can be documented locally, but browser-local records cannot authenticate authority. The pilot profile below remains unchanged.</div>
        ${rightSizingProposals.map(a => `<div class="text-sm mt-sm">• <strong>${escapeHtml(processName(a.processId))}</strong>: ${escapeHtml(a.from)} → proposed ${escapeHtml(a.proposedTo || a.to)} <span class="text-xs text-secondary">(${escapeHtml(a.reason)})</span></div>`).join('')}
      </div>` : ''}
    ${result.locallyCompleteRightSizingRecordCount > 0 ? `
      <div class="override-banner" style="background:rgba(34,211,238,.07);border-color:rgba(34,211,238,.3);">
        <strong>Local reduction scenario — external approval unverified</strong>
        <div class="text-xs text-secondary mt-sm">${result.locallyCompleteRightSizingRecordCount} record(s) are structurally complete and policy-consistent. They do not change the normative recommendation in this static app.</div>
        ${CORE_PROCESSES.filter(process => localScenarioLevels[process.id] && localScenarioLevels[process.id] !== displayLevels[process.id]).map(process => `<div class="text-sm mt-sm">• <strong>${escapeHtml(process.name)}</strong>: pilot profile ${escapeHtml(displayLevels[process.id])} → local scenario ${escapeHtml(localScenarioLevels[process.id])}</div>`).join('')}
      </div>` : ''}
    ${legacyRightSizingActions.length ? `<div class="override-banner" style="background:rgba(148,163,184,.08);border-color:rgba(148,163,184,.3);"><strong>Historical right-sizing records</strong><div class="text-xs text-secondary mt-sm">Imported pre-governance actions are retained for audit only and are not evidence of an approved v4 reduction.</div></div>` : ''}
    ${blockedRightSizingCandidates.length ? `<div class="override-banner" style="background:rgba(239,68,68,.06);border-color:rgba(239,68,68,.25);"><strong>Blocked Right-Sizing Candidates (${blockedRightSizingCandidates.length})</strong><div class="text-xs text-secondary mt-sm">These reductions are not approval candidates because mandatory closure would immediately restore the required level.</div></div>` : ''}
    ${result.budgetStatus && !result.budgetStatus.withinBudget ? `
      <div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 10px; padding: 12px 16px; margin-bottom: 16px;">
        <div class="text-xs" style="font-weight: 700; color: var(--accent-warning);">Final Rigor-Budget Exception</div>
        <div class="text-sm mt-sm">Mandatory floors or closure leave ${result.budgetStatus.comprehensiveExcess} Comprehensive and ${result.budgetStatus.standardExcess} Standard process(es) above configured PSI guidance. Governance review is required.</div>
      </div>` : !rightSizingProposals.length && result.indices ? `
      <div style="background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.25); border-radius: 10px; padding: 12px 16px; margin-bottom: 16px;">
        <div class="text-xs text-secondary" style="font-weight: 600;">Right-Sizing Indices</div>
        <div class="text-sm mt-sm">Project scale: ${result.indices.psi} · Delivery pressure: ${result.indices.csi} · Adoption readiness: ${result.indices.cri} — <span style="color:var(--accent-success)">No right-sizing proposals generated</span></div>
      </div>` : ''}

    ${result.adoptionRisks?.length ? `
      <div class="override-banner" style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.35);">
        <strong>Adoption Readiness Gaps (${result.adoptionRisks.length})</strong>
        <div class="text-xs text-secondary mt-sm mb-sm">Required rigor is preserved. Adoption readiness identifies support the organization may need to use the selected processes.</div>
        ${result.adoptionRisks.slice(0, 8).map(r => `<div class="text-sm mt-sm">• <strong>${escapeHtml(processName(r.processId))}</strong>: ${escapeHtml(r.level)} <span class="text-xs text-secondary">(${escapeHtml(r.guidance)})</span></div>`).join('')}
        ${result.adoptionRisks.length > 8 ? `<div class="text-xs text-secondary mt-sm">+ ${result.adoptionRisks.length - 8} more readiness gaps in the report.</div>` : ''}
      </div>` : ''}

    ${result.overrides.length ? `
      <div class="override-banner">
        <strong>Floor Elevations Applied (${result.overrides.length})</strong>
        ${result.overrides.map(o => `<div class="text-sm mt-sm">• <strong>${processName(o.processId)}</strong>: ${o.from} → ${o.to} (${o.reason})</div>`).join('')}
      </div>` : ''}
    ${activeFloors.length ? `<div class="override-banner" style="background:rgba(14,165,233,.08);border-color:rgba(14,165,233,.3);">
      <strong>Active Mandatory Floors (${activeFloors.length})</strong>
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
        <strong>Remaining Warnings (${result.violations.length})</strong>
        ${result.violations.map(v => `<div class="text-sm mt-sm">• Rule ${v.ruleId} [${v.type}]: ${v.label}</div>`).join('')}
      </div>` : ''}
      </div>
    </details>
    <details class="results-breakdown">
      <summary>Open the full ${CORE_PROCESSES.length}-process profile</summary>
      <div class="results-breakdown-body">
        <p class="text-sm text-secondary mb-lg">Use the work-aid links for activities, deliverables, and level comparisons. Derivation detail stays collapsed until you need it.</p>
    ${Object.entries(groupByGroup).map(([group, procs]) => `
      <h4 class="mb-md mt-lg" style="color: ${PROCESS_GROUPS[group.toUpperCase()]?.color || '#fff'}">${PROCESS_GROUPS[group.toUpperCase()]?.name || group}</h4>
      <div class="process-guidance-list">
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
  let currentRule11ElevationReady = rule11ElevationPending;
  const updateCompleteButton = () => {
    if (!completeButton || !completeness.complete) return;
    if (!currentCsiReadiness.complete) {
      completeButton.textContent = `Save Work in Progress (CSI ${currentCsiReadiness.csi} response required)`;
    } else if (currentRule11ElevationReady && currentWarningReadiness.incompleteRuleIds.every(ruleId => ruleId === '11')) {
      completeButton.textContent = 'Apply P27 Adjustment & Check Completeness';
    } else if (!currentRule11Readiness.complete) {
      completeButton.textContent = 'Save Work in Progress (Rule 11 disposition required)';
    } else if (!currentWarningReadiness.complete) {
      completeButton.textContent = `Save Work in Progress (${currentWarningReadiness.incompleteRuleIds.length} warning disposition(s) required)`;
    } else {
      completeButton.textContent = 'Check Software Completeness';
    }
  };
  content.querySelectorAll('[data-result-route]').forEach(button => {
    button.addEventListener('click', () => navigateTo(button.dataset.resultRoute));
  });
  content.querySelectorAll('.process-detail-link').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      finalizeAssessment(link.getAttribute('href'));
    });
  });
  const refreshRule11Record = () => {
    if (!rule11Disposition.required) return;
    const selectedOutcome = content.querySelector('#rule11-outcome')?.value || '';
    content.querySelector('#rule11-record-fields')?.classList.toggle('is-pending', !selectedOutcome);
    localRuleDispositions = {
      ...localRuleDispositions,
      11: {
        ruleId: 11,
        propagationId: 'P12',
        outcome: selectedOutcome,
        rationale: content.querySelector('#rule11-rationale')?.value.trim() || '',
        ownerApprover: content.querySelector('#rule11-owner')?.value.trim() || '',
        evidenceRef: content.querySelector('#rule11-evidence')?.value.trim() || '',
        reviewDate: content.querySelector('#rule11-date')?.value || ''
      }
    };
    commitAssessmentDraft();
    const status = assessRule11Disposition(result.violations, localRuleDispositions, displayLevels);
    const elevatedPreview = assessRule11Disposition(result.violations, localRuleDispositions, { ...displayLevels, 27: 'standard' });
    const readyToApplyElevation = localRuleDispositions?.['11']?.outcome === 'elevated-validation'
      && elevatedPreview.complete
      && result.levels?.[27] === 'basic'
      && existingP27Adjustment?.level !== 'standard';
    currentRule11Readiness = status;
    currentRule11ElevationReady = readyToApplyElevation;
    currentWarningReadiness = assessWarningDispositions(result.violations, localRuleDispositions, displayLevels);
    const statusNode = content.querySelector('#rule11-disposition-status');
    if (statusNode) {
      statusNode.textContent = readyToApplyElevation
        ? 'Ready to apply the explicit Process 27 adjustment when completeness is checked.'
        : status.complete
          ? 'Decision recorded.'
          : 'Choose an outcome and complete its decision record.';
    }
    const decisionState = content.querySelector('.rule11-decision .decision-state');
    if (decisionState) {
      decisionState.textContent = readyToApplyElevation ? 'Ready to apply' : status.complete ? 'Recorded' : 'Decision needed';
      decisionState.classList.toggle('complete', status.complete || readyToApplyElevation);
    }
    const rule11Section = content.querySelector('.rule11-decision');
    if ((status.complete || readyToApplyElevation) && rule11Section?.open) {
      rule11Section.open = false;
      const nextWarning = [...content.querySelectorAll('.warning-disposition')]
        .find(section => !section.querySelector('.warning-disposition-summary')?.classList.contains('complete'));
      if (nextWarning) nextWarning.open = true;
      else {
        const csiSection = content.querySelector('.csi-decision');
        if (csiSection && !currentCsiReadiness.complete) csiSection.open = true;
      }
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
    const selectedOutcome = section.querySelector('.warning-outcome')?.value || '';
    section.querySelector('.decision-record-fields')?.classList.toggle('is-pending', !selectedOutcome);
    localRuleDispositions = {
      ...localRuleDispositions,
      [ruleId]: {
        ruleId: /^\d+$/.test(ruleId) ? Number(ruleId) : ruleId,
        outcome: selectedOutcome,
        rationale: section.querySelector('.warning-rationale')?.value.trim() || '',
        ownerApprover: section.querySelector('.warning-owner')?.value.trim() || '',
        evidenceRef: section.querySelector('.warning-evidence')?.value.trim() || '',
        reviewDate: section.querySelector('.warning-date')?.value || ''
      }
    };
    commitAssessmentDraft();
    currentWarningReadiness = assessWarningDispositions(result.violations, localRuleDispositions, displayLevels);
    const assessment = currentWarningReadiness.assessments.find(item => item.ruleId === ruleId);
    const summary = section.querySelector('.warning-disposition-summary');
    if (summary && assessment) {
      summary.textContent = assessment.complete ? 'complete' : 'needs decision';
      summary.classList.toggle('complete', assessment.complete);
    }
    if (assessment?.complete && section.open) {
      section.open = false;
      const nextWarning = [...content.querySelectorAll('.warning-disposition')]
        .find(candidate => candidate !== section && !candidate.querySelector('.warning-disposition-summary')?.classList.contains('complete'));
      if (nextWarning) nextWarning.open = true;
      else {
        const csiSection = content.querySelector('.csi-decision');
        if (csiSection && !currentCsiReadiness.complete) csiSection.open = true;
      }
    }
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
    commitAssessmentDraft();
    currentCsiReadiness = assessCsiResponse(localScores, localCsiResponse);
    const statusNode = content.querySelector('#csi-response-status');
    if (statusNode) {
      statusNode.textContent = currentCsiReadiness.complete ? 'Response recorded.' : 'Incomplete: finish the response record.';
    }
    const decisionState = content.querySelector('.csi-decision .decision-state');
    if (decisionState) {
      decisionState.textContent = currentCsiReadiness.complete ? 'Recorded' : 'Response needed';
      decisionState.classList.toggle('complete', currentCsiReadiness.complete);
    }
    updateCompleteButton();
  };
  content.querySelectorAll('.csi-action').forEach(input => input.addEventListener('change', refreshCsiResponse));
  for (const id of ['csi-protected-outputs', 'csi-rationale', 'csi-owner', 'csi-evidence', 'csi-date']) {
    const input = content.querySelector(`#${id}`);
    input?.addEventListener('input', refreshCsiResponse);
    if (id === 'csi-date') input?.addEventListener('change', refreshCsiResponse);
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
  const rootManualAdjustments = state.manualAdjustments || {};
  const activeManualAdjustments = activeNode?.id === state.assessmentTree.rootId
    ? { ...rootManualAdjustments, ...(activeNode.manualAdjustments || {}) }
    : { ...(activeNode?.manualAdjustments || {}) };
  const currentDisplayLevels = applyManualAdjustmentsToLevels(result.levels, activeManualAdjustments);
  const elevatedPreview = assessRule11Disposition(result.violations, localRuleDispositions, { ...currentDisplayLevels, 27: 'standard' });
  const applyRule11Elevation = !navigationOnly && rule11Record?.outcome === 'elevated-validation' && elevatedPreview.complete && result.levels?.[27] === 'basic';
  const manualAdjustments = applyRule11Elevation ? {
    ...activeManualAdjustments,
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
  } : activeManualAdjustments;
  const rule11Levels = applyRule11Elevation ? { ...result.levels, 27: 'standard' } : result.levels;
  const effectiveLevels = applyManualAdjustmentsToLevels(rule11Levels, manualAdjustments);
  const effectiveLocalScenarioLevels = result.locallyCompleteRightSizingRecordCount > 0
    ? applyManualAdjustmentsToLevels(result.locallyAdjustedLevels || {}, manualAdjustments)
    : {};
  const hasManualLevelChanges = Object.keys(manualAdjustments).length > 0;
  const effectiveResult = applyRule11Elevation || hasManualLevelChanges
    ? {
      ...result,
      levels: effectiveLevels,
      locallyAdjustedLevels: effectiveLocalScenarioLevels,
      budgetStatus: computeRigorBudgetStatus(effectiveLevels, localScores)
    }
    : { ...result, locallyAdjustedLevels: effectiveLocalScenarioLevels };
  const globalManualAdjustments = activeNode?.id === state.assessmentTree.rootId
    ? manualAdjustments
    : rootManualAdjustments;
  const rule11Disposition = assessRule11Disposition(result.violations, localRuleDispositions, effectiveLevels);
  const warningDispositions = assessWarningDispositions(result.violations, localRuleDispositions, effectiveLevels);
  const csiReadiness = assessCsiResponse(localScores, localCsiResponse);
  const correlatedEvidence = assessCorrelatedEvidence(localMetricAssessments);
  const hierarchyReady = hierarchyInput.blockedMetrics.length === 0;
  const existingHierarchy = assessHierarchyCompleteness(state.assessmentTree);
  const otherIncompleteElementIds = existingHierarchy.incompleteElementIds.filter(elementId => elementId !== activeNode?.id);
  const hierarchy = {
    ...existingHierarchy,
    complete: hierarchyReady && otherIncompleteElementIds.length === 0,
    incompleteElementIds: hierarchyReady ? otherIncompleteElementIds : [...new Set([...otherIncompleteElementIds, activeNode?.id].filter(Boolean))]
  };
  const eligibility = evaluateBaselineEligibility({
    ...state,
    scores: localScores,
    metricAssessments: localMetricAssessments,
    violations: effectiveResult.violations,
    ruleDispositions: localRuleDispositions,
    levels: effectiveLevels,
    csiResponse: localCsiResponse
  }, { hierarchy, derivationAuthoritative: effectiveResult.authoritative === true });
  const canBaseline = eligibility.softwareChecksPassed;
  if (activeNode) {
    activeNode.metricAssessments = JSON.parse(JSON.stringify(localMetricAssessments ?? {}));
    activeNode.assuranceObligations = JSON.parse(JSON.stringify(localAssuranceObligations ?? []));
    activeNode.ruleDispositions = JSON.parse(JSON.stringify(localRuleDispositions ?? {}));
    activeNode.csiResponse = JSON.parse(JSON.stringify(localCsiResponse ?? {}));
    activeNode.correlatedEvidenceWarnings = JSON.parse(JSON.stringify(correlatedEvidence.warnings ?? []));
    activeNode.rightSizingApprovalRecords = JSON.parse(JSON.stringify(assessmentContext.rightSizingApprovalRecords ?? []));
    activeNode.manualAdjustments = JSON.parse(JSON.stringify(manualAdjustments ?? {}));
    activeNode.scores = { ...localScores };
    activeNode.assessmentResult = effectiveResult;
    activeNode.levels = { ...(effectiveResult.levels || {}) };
    activeNode.status = canBaseline ? 'under_review' : 'draft';
    activeNode.assessmentDisposition = canBaseline ? 'complete-baseline' : 'work-in-progress';
  }
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
    locallyAdjustedLevels: effectiveResult.locallyAdjustedLevels || {},
    localScenarioClosureFixes: effectiveResult.localScenarioClosureFixes || [],
    localScenarioBudgetStatus: effectiveResult.localScenarioBudgetStatus || null,
    locallyCompleteRightSizingRecordCount: effectiveResult.locallyCompleteRightSizingRecordCount || 0,
    approvedRightSizedLevels: {},
    normativeLevels: effectiveResult.normativeLevels || {},
    effectiveRightSizingApprovalCount: 0,
    rightSizingActions: [],
    budgetStatus: effectiveResult.budgetStatus || null,
    adoptionRisks: effectiveResult.adoptionRisks || [],
    indices: effectiveResult.indices || {},
    violations: effectiveResult.violations,
    fixes: effectiveResult.fixes,
    confidence: effectiveResult.confidence || {},
    derivationStatus: effectiveResult.derivationStatus || effectiveResult.confidence || {},
    manualAdjustments: globalManualAdjustments,
    assessmentComplete: !navigationOnly && canBaseline,
    assessmentDisposition: !navigationOnly && canBaseline ? 'complete-baseline' : 'work-in-progress'
  });

  if (activeNode && navigationOnly) {
    activeNode.status = 'draft';
    activeNode.assessmentDisposition = 'work-in-progress';
  }

  if (navigationOnly) {
    showToast('Work in progress saved before opening process details.', 'info');
    const destination = getCurrentRouteContext(destinationHash);
    navigateTo(destination.path, destination.params);
  } else if (canBaseline) {
    showToast(`Software completeness checks passed for "${activeNode?.name || 'Project'}". External approval is not verified.`, 'success');
    currentStep = 0;
    visitedSteps = new Set([0]);
    navigateTo('report');
  } else {
    const remaining = [];
    if (!completeness.complete) remaining.push(`${completeness.incompleteMetricIds.length} metric judgment(s)`);
    if (!warningDispositions.complete) remaining.push(`${warningDispositions.incompleteRuleIds.length} warning disposition(s)`);
    if (!csiReadiness.complete) remaining.push(`the CSI ${csiReadiness.csi} response`);
    if (!hierarchyReady) remaining.push(`${hierarchyInput.blockedMetrics.join('/')} child hierarchy disposition(s)`);
    showToast(`Work in progress saved. Complete ${remaining.join(' and ')} before software completeness can pass.`, 'warning');
    renderAssessment(document.querySelector('.assessment-container')?.parentElement || document.getElementById('main-content'));
  }
}
