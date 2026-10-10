/**
 * Process Explorer View — Searchable/filterable process detail browser
 */
import { ACTIVE_CONSISTENCY_RULES, CORE_PROCESSES, PROCESS_GROUPS, FRAMEWORK_META, METRICS, OVERRIDE_CONDITIONS } from '../data/se-tailoring-data.js';
import { PROCESS_DETAILS, PROCESS_CONTEXT_OVERLAYS } from '../data/process-details.js';
import { getState } from '../state.js';
import { getCurrentRouteContext, processDetailsHref } from '../router.js';
import { escapeHtml } from '../utils/safe-text.js';
import { checkConsistency, getEffectiveConsistencyType } from '../utils/assessment-engine.js';
import { buildMatrixPresentation } from './matrix-view.js';

let filterGroup = 'all';
let searchQuery = '';

const LEVEL_KEYS = ['basic', 'standard', 'comprehensive'];
const LEVEL_SET = new Set(LEVEL_KEYS);
const DEFAULT_BROWSE_LEVEL = 'standard';
const PROCESS_ID_SET = new Set(CORE_PROCESSES.map(process => process.id));
const ROUTE_PARAM_KEYS = new Set(['process', 'level', 'source']);
const VALID_PROCESS_SOURCES = new Set([
  'assessment',
  'report',
  'elements',
  'system-elements',
  'vee-model',
  'matrix',
  'deliverables',
  'adjust',
  'manual-adjust',
  'interdependency',
  'dashboard',
  'process-explorer',
  'direct'
]);

function hasEntries(value) {
  return value && typeof value === 'object' && Object.keys(value).length > 0;
}

function getProcessViewContext(state) {
  const tree = state.assessmentTree;
  const activeNode = tree?.nodes?.[tree.activeId] || tree?.nodes?.[tree.rootId] || null;
  const isRootContext = !activeNode || activeNode.id === tree?.rootId;
  const assessmentResult = activeNode?.assessmentResult || {};
  const levels = hasEntries(activeNode?.levels)
    ? activeNode.levels
    : hasEntries(assessmentResult.levels)
      ? assessmentResult.levels
      : isRootContext
        ? (state.levels || {})
        : {};
  const scores = hasEntries(activeNode?.scores)
    ? activeNode.scores
    : isRootContext
      ? (state.scores || {})
      : {};
  const metricAssessments = hasEntries(activeNode?.metricAssessments)
    ? activeNode.metricAssessments
    : isRootContext
      ? (state.metricAssessments || {})
      : {};

  return {
    elementId: activeNode?.id || null,
    elementName: activeNode?.name || 'Current assessment',
    levels,
    recommendationLevels: activeNode?.recommendationBaseline?.levels || assessmentResult.normativeLevels || (isRootContext ? state.normativeLevels : {}) || {},
    scores,
    metricAssessments,
    manualAdjustments: {
      ...(isRootContext ? (state.manualAdjustments || {}) : {}),
      ...(activeNode?.manualAdjustments || {})
    },
    assuranceObligations: Array.isArray(activeNode?.assuranceObligations)
      ? (isRootContext && activeNode.assuranceObligations.length === 0 && (state.assuranceObligations || []).length > 0
        ? state.assuranceObligations
        : activeNode.assuranceObligations)
      : isRootContext
        ? (state.assuranceObligations || [])
        : [],
    derivationDetails: assessmentResult.derivationDetails || (isRootContext ? state.derivationDetails : {}) || {},
    overrides: assessmentResult.overrides || (isRootContext ? state.overrides : []) || [],
    fixes: assessmentResult.fixes || (isRootContext ? state.fixes : []) || []
  };
}

function getAdjustmentLevel(manualAdjustments, processId) {
  const adjustment = manualAdjustments?.[processId] || manualAdjustments?.[String(processId)];
  const level = typeof adjustment === 'string' ? adjustment : adjustment?.level || adjustment?.to;
  return LEVEL_SET.has(level) ? level : null;
}

function getAssignedProcessLevel(viewContext, processId) {
  const adjustedLevel = getAdjustmentLevel(viewContext.manualAdjustments, processId);
  if (adjustedLevel) return adjustedLevel;
  const level = viewContext.levels?.[processId] || viewContext.levels?.[String(processId)];
  return LEVEL_SET.has(level) ? level : null;
}

function readSingleRouteParam(params, key, issues) {
  const values = params.getAll(key);
  if (values.length > 1) {
    issues.push(`The ${key} parameter must appear only once.`);
    return null;
  }
  return values.length === 1 ? values[0] : null;
}

export function resolveProcessExplorerRoute(routeContext = getCurrentRouteContext(), state = getState()) {
  const params = routeContext?.params instanceof URLSearchParams
    ? routeContext.params
    : new URLSearchParams();
  const issues = [];
  for (const key of new Set(params.keys())) {
    if (!ROUTE_PARAM_KEYS.has(key)) issues.push(`Unsupported route parameter ignored: ${key}.`);
  }

  const processValue = readSingleRouteParam(params, 'process', issues);
  const levelValue = readSingleRouteParam(params, 'level', issues);
  const sourceValue = readSingleRouteParam(params, 'source', issues);
  const processId = processValue !== null
    && /^(?:0|[1-9]\d*)$/.test(processValue)
    && PROCESS_ID_SET.has(Number(processValue))
    ? Number(processValue)
    : null;
  if (processValue !== null && processId === null) {
    issues.push(`The requested process is not part of the ${CORE_PROCESSES.length}-process executable core.`);
  }

  const source = sourceValue === null
    ? null
    : VALID_PROCESS_SOURCES.has(sourceValue)
      ? sourceValue
      : null;
  if (sourceValue !== null && source === null) issues.push('The process-detail source is not recognized.');

  const viewContext = getProcessViewContext(state);
  const assignedLevel = processId ? getAssignedProcessLevel(viewContext, processId) : null;
  const requestedLevel = levelValue !== null && LEVEL_SET.has(levelValue) ? levelValue : null;
  if (levelValue !== null && requestedLevel === null) {
    issues.push('The requested tailoring level must be basic, standard, or comprehensive.');
  }
  if (!processId && levelValue !== null) issues.push('A tailoring level can only be opened with a valid process.');

  return {
    processId,
    assignedLevel,
    recommendationLevel: processId && LEVEL_SET.has(viewContext.recommendationLevels?.[processId]) ? viewContext.recommendationLevels[processId] : null,
    viewLevel: processId ? (requestedLevel || assignedLevel || DEFAULT_BROWSE_LEVEL) : null,
    source,
    issues,
    viewContext
  };
}

function getFilteredProcesses() {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  return CORE_PROCESSES.filter(process => {
    if (filterGroup !== 'all' && process.group !== filterGroup) return false;
    if (normalizedSearch && !`${process.id} ${process.name} ${process.purpose}`.toLowerCase().includes(normalizedSearch)) return false;
    return true;
  });
}

function renderProcessListMarkup(selection) {
  const filtered = getFilteredProcesses();
  if (!filtered.length) return '<div class="empty-state process-list-empty"><p class="text-secondary">No processes match this filter.</p></div>';
  return filtered.map(process => {
    const assignedLevel = getAssignedProcessLevel(selection.viewContext, process.id);
    const browseLevel = assignedLevel || DEFAULT_BROWSE_LEVEL;
    return `
      <a class="process-list-card ${selection.processId === process.id ? 'selected' : ''} hover-lift"
         href="${escapeHtml(processDetailsHref(process.id, browseLevel, selection.source))}"
         ${selection.processId === process.id ? 'aria-current="page"' : ''}
         aria-label="Open ${escapeHtml(process.name)} at ${escapeHtml(FRAMEWORK_META.levelLabels[browseLevel])} detail">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-sm">
            <span class="process-id">${process.id}</span>
            <span class="font-bold">${escapeHtml(process.name)}</span>
          </div>
          ${assignedLevel ? `<span class="level-badge ${escapeHtml(assignedLevel)}" title="Current applied level for ${escapeHtml(selection.viewContext.elementName)}">${assignedLevel[0].toUpperCase()}</span>` : ''}
        </div>
        <div class="text-xs text-secondary mt-sm">${escapeHtml(process.purpose)}</div>
      </a>`;
  }).join('');
}

function updateProcessList(container, selection) {
  const panel = container.querySelector('#process-list-panel');
  if (panel) panel.innerHTML = renderProcessListMarkup(selection);
}

export function renderProcessExplorer(container, routeContext = getCurrentRouteContext()) {
  const state = getState();
  const selection = resolveProcessExplorerRoute(routeContext, state);
  const hasExplicitProcess = Boolean(selection.processId);
  if (!selection.processId && selection.issues.length === 0) {
    const assignedProcesses = CORE_PROCESSES.filter(process =>
      getAssignedProcessLevel(selection.viewContext, process.id)
    );
    const defaultProcess = assignedProcesses.find(process =>
      getAssignedProcessLevel(selection.viewContext, process.id) === 'comprehensive'
    ) || assignedProcesses.find(process =>
      getAssignedProcessLevel(selection.viewContext, process.id) !== 'standard'
    ) || assignedProcesses[0] || CORE_PROCESSES[0];
    selection.processId = defaultProcess.id;
    selection.assignedLevel = getAssignedProcessLevel(selection.viewContext, defaultProcess.id);
    selection.viewLevel = selection.assignedLevel || DEFAULT_BROWSE_LEVEL;
    selection.source = selection.source || 'process-explorer';
  }

  container.innerHTML = `
    <div class="mb-lg">
      <p class="eyebrow">Framework reference</p>
      <h2>Process work aids</h2>
      <p class="text-sm text-secondary mt-sm">Open a process to compare levels, plan activities, and identify the deliverables the team needs.</p>
    </div>
    ${selection.issues.length ? `
      <div class="callout process-route-warning mb-lg" role="status">
        <strong>Some process-detail link information was ignored.</strong>
        <div class="text-xs text-secondary mt-sm">${selection.issues.map(issue => escapeHtml(issue)).join('<br>')}</div>
      </div>` : ''}
    <div class="explorer-controls mb-lg">
      <input class="input" id="process-search" placeholder="Search processes..." value="${escapeHtml(searchQuery)}" style="max-width:300px" aria-label="Search processes" type="search">
      <div class="tabs" id="group-tabs" role="group" aria-label="Process group filter">
        <button class="tab ${filterGroup === 'all' ? 'active' : ''}" data-group="all" type="button" aria-pressed="${filterGroup === 'all'}">All (${CORE_PROCESSES.length})</button>
        <button class="tab ${filterGroup === 'tech_mgmt' ? 'active' : ''}" data-group="tech_mgmt" type="button" aria-pressed="${filterGroup === 'tech_mgmt'}">Tech Management</button>
        <button class="tab ${filterGroup === 'technical' ? 'active' : ''}" data-group="technical" type="button" aria-pressed="${filterGroup === 'technical'}">Technical</button>
      </div>
    </div>
    <div class="explorer-layout">
      <nav class="process-list-panel" id="process-list-panel" aria-label="Processes">
        ${renderProcessListMarkup(selection)}
      </nav>
      <div class="process-detail-panel" id="process-detail">
        ${selection.processId
          ? renderProcessDetail(selection.processId, state, selection.viewContext, selection.viewLevel, selection.source)
          : '<div class="empty-state"><p class="text-secondary">Select a process to view its Basic, Standard, and Comprehensive content.</p></div>'}
      </div>
    </div>
  `;

  // Inject styles only once (avoid re-injecting on every re-render)
  if (!document.getElementById('process-explorer-styles')) {
    const style = document.createElement('style');
    style.id = 'process-explorer-styles';
    style.textContent = `
      .explorer-controls { display: flex; flex-direction: column; gap: 12px; }
      .explorer-layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; }
      .process-list-panel { display: flex; flex-direction: column; gap: 8px; max-height: calc(100vh - 240px); overflow-y: auto; padding-right: 8px; }
      .process-list-card { display: block; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; cursor: pointer; transition: all var(--transition-fast); color: inherit; text-decoration: none; }
      .process-list-card.selected { border-color: var(--accent-primary); background: rgba(99,102,241,0.08); }
      .process-list-card:hover { border-color: var(--border-medium); }
      .process-list-card:focus-visible { outline: 2px solid var(--accent-primary-light); outline-offset: 2px; }
      .process-list-empty { min-height: 140px; }
      .process-detail-panel { min-height: 500px; }
      .empty-state { display: flex; align-items: center; justify-content: center; min-height: 400px; }
      .detail-section { margin-bottom: var(--space-xl); }
      .detail-section h4 { margin-bottom: var(--space-md); color: var(--accent-primary-light); }
      .process-work-aid { padding: clamp(16px, 2vw, 24px); }
      .process-detail-header { align-items: flex-start; gap: var(--space-md); margin-bottom: var(--space-md); }
      .process-meta-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
      .process-meta-pill { border: 1px solid var(--border-subtle); border-radius: var(--radius-full); padding: 3px 9px; font-size: 11px; color: var(--text-secondary); }
      .level-selector-bar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-md); flex-wrap: wrap; padding: 8px 0 12px; margin-bottom: var(--space-md); border-bottom: 1px solid var(--border-subtle); }
      .level-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 0; }
      .level-tab { display: inline-block; padding: 6px 16px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; cursor: pointer; border: 1px solid var(--border-subtle); background: none; color: var(--text-secondary); transition: all var(--transition-fast); text-decoration: none; }
      .level-tab.active-basic { background: var(--level-basic-bg); color: var(--level-basic); border-color: var(--level-basic-border); }
      .level-tab.active-standard { background: var(--level-standard-bg); color: var(--level-standard); border-color: var(--level-standard-border); }
      .level-tab.active-comprehensive { background: var(--level-comprehensive-bg); color: var(--level-comprehensive); border-color: var(--level-comprehensive-border); }
      .level-tab:focus-visible { outline: 2px solid var(--accent-primary-light); outline-offset: 2px; }
      .practitioner-work-aid { margin-bottom: var(--space-lg); }
      .practitioner-work-aid > summary { cursor: pointer; color: var(--text-secondary); font-size: var(--font-size-xs); font-weight: 600; }
      .practitioner-work-aid[open] > ol { margin-top: 12px; }
      .practitioner-work-aid ol { display: grid; gap: 10px; margin: 0; padding-left: 22px; }
      .practitioner-work-aid li { padding-left: 4px; color: var(--text-secondary); font-size: var(--font-size-xs); line-height: 1.5; }
      .practitioner-work-aid li strong, .practitioner-work-aid li span { display: block; }
      .practitioner-work-aid li strong { color: var(--text-primary); }
      .detail-empty-line { color: var(--text-tertiary); font-size: var(--font-size-sm); padding: 8px 0; }
      .activity-item { padding: 6px 0; font-size: var(--font-size-xs); color: var(--text-secondary); border-bottom: 1px solid rgba(99,102,241,0.06); }
      .activity-item.essential { color: var(--text-primary); font-weight: 500; }
      .deliverable-item { padding: 6px 0; font-size: var(--font-size-xs); color: var(--text-secondary); border-bottom: 1px solid rgba(99,102,241,0.06); display: flex; gap: 6px; align-items: flex-start; }
      .output-item { background: rgba(34,211,238,0.06); border-radius: var(--radius-md); padding: 10px; margin-bottom: 8px; font-size: var(--font-size-xs); }
      .metric-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; margin: 3px; }
      .metric-tag.P { background: rgba(99,102,241,0.2); color: var(--accent-primary-light); }
      .metric-tag.S { background: rgba(148,163,184,0.12); color: var(--text-secondary); }
      .technical-context { border-top: 1px solid var(--border-subtle); padding-top: 14px; }
      .technical-context > summary { cursor: pointer; color: var(--text-secondary); font-size: var(--font-size-xs); font-weight: 700; }
      .technical-context-body { margin-top: 18px; }
      @media (max-width: 900px) { .explorer-layout { grid-template-columns: 1fr; } .process-list-panel { max-height: 300px; } }
      @media (max-width: 480px) {
        #group-tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); overflow-x: visible; }
        #group-tabs .tab { min-width: 0; padding: 8px 4px; font-size: 11px; line-height: 1.25; white-space: normal; }
      }
    `;
    document.head.appendChild(style);
  }

  // Event handlers
  container.querySelector('#process-search').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    updateProcessList(container, selection);
  });
  container.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      filterGroup = tab.dataset.group;
      container.querySelectorAll('.tab').forEach(button => {
        const active = button.dataset.group === filterGroup;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      updateProcessList(container, selection);
    });
  });

  if (hasExplicitProcess && selection.processId && selection.source) {
    window.requestAnimationFrame(() => {
      const heading = container.querySelector('#process-detail-heading');
      if (!heading) return;
      heading.focus({ preventScroll: true });
      const mobileLayout = window.matchMedia?.('(max-width: 900px)').matches;
      if (mobileLayout) {
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        heading.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  }
}

export function getContextScore(viewContext, metricId) {
  const assessment = viewContext?.metricAssessments?.[metricId];
  if (!['assessed', 'inherited-confirmed'].includes(assessment?.status)) return null;
  const assessmentScore = Number(assessment?.score);
  const contextScore = Number(viewContext?.scores?.[metricId]);
  const validAssessmentScore = Number.isInteger(assessmentScore) && assessmentScore >= 1 && assessmentScore <= 5;
  const validContextScore = Number.isInteger(contextScore) && contextScore >= 1 && contextScore <= 5;
  if (validAssessmentScore && validContextScore && assessmentScore !== contextScore) return null;
  if (validAssessmentScore) return assessmentScore;
  return validContextScore ? contextScore : null;
}

function getConditionalContentState(text, viewContext) {
  const metricId = text.includes('[Safety]') ? 'M5' : text.includes('[RAM]') ? 'M6' : null;
  if (!metricId) return { disabled: false, note: '' };
  const score = getContextScore(viewContext, metricId);
  if (score === null) return { disabled: false, note: `Conditional example: ${metricId} context unconfirmed; assess applicability and obligations before planning this work` };
  return score < 3
    ? { disabled: false, note: `Not highlighted by ${metricId}; check applicability and binding obligations` }
    : { disabled: false, note: '' };
}

function renderContextNote(note, disabled) {
  if (!note) return '';
  return `<span style="font-size:10px; color:var(--text-secondary); text-decoration:none; margin-left:6px; background:var(--bg-tertiary); padding:2px 6px; border-radius:4px;">${disabled ? '' : 'Review: '}${escapeHtml(note)}</span>`;
}

function processReferenceIncludes(reference, processId) {
  if (Array.isArray(reference)) return reference.some(item => processReferenceIncludes(item, processId));
  if (reference === 'any_technical' || reference === 'all_technical') {
    return CORE_PROCESSES.some(process => process.id === Number(processId) && process.group === 'technical');
  }
  return Number(reference) === Number(processId);
}

/** Read-only Guidance projection of the same effective context shown by Matrix. */
export function buildProcessGovernanceContext(processId, state = {}, viewContext = getProcessViewContext(state)) {
  const matrix = buildMatrixPresentation(state);
  const contextAvailable = matrix.conditionalDrivers.every(driver => driver.status !== 'unavailable');
  const source = matrix.node || (!state.assessmentTree ? state : {});
  const assuranceObligations = Array.isArray(source.assuranceObligations) ? source.assuranceObligations
    : matrix.rootContext && Array.isArray(state.assuranceObligations) ? state.assuranceObligations : [];
  const context = { assuranceObligations };
  const levels = Object.fromEntries(CORE_PROCESSES.map(process => [process.id, getAssignedProcessLevel(viewContext, process.id)]));
  const hasProfile = contextAvailable && CORE_PROCESSES.every(process => LEVEL_SET.has(levels[process.id]));
  const violations = hasProfile ? checkConsistency(levels, matrix.scores, context) : [];
  const rules = ACTIVE_CONSISTENCY_RULES.filter(rule =>
    processReferenceIncludes(rule.trigger?.process, processId) || processReferenceIncludes(rule.required?.process, processId)
  ).map(rule => ({
    ...rule,
    effectiveType: contextAvailable ? getEffectiveConsistencyType(rule, matrix.scores, context) : null,
    status: !contextAvailable ? 'Context unavailable' : !hasProfile ? 'No full profile assessed'
      : violations.some(violation => violation.ruleId === rule.id) ? 'Review required' : 'No current conflict'
  }));
  const floors = OVERRIDE_CONDITIONS.filter(floor =>
    (floor.processes || []).map(Number).includes(Number(processId))
  );
  return {
    map: matrix.map[processId] || {},
    conditionalDrivers: matrix.conditionalDrivers.filter(driver => Number(driver.processId) === Number(processId)),
    scores: matrix.scores,
    contextAvailable,
    rules,
    floors
  };
}

function renderProcessDetail(processId, state, viewContext, viewLevel, source) {
  const p = CORE_PROCESSES.find(x => x.id === processId);
  if (!p) return '';
  const details = PROCESS_DETAILS[processId];
  const governance = buildProcessGovernanceContext(processId, state, viewContext);
  const map = governance.map;
  const level = getAssignedProcessLevel(viewContext, processId);
  const activities = details?.activities?.[viewLevel] || [];
  const deliverables = details?.deliverables?.[viewLevel] || [];
  const outputs = details?.outputs || [];
  const contextOverlays = PROCESS_CONTEXT_OVERLAYS[processId] || {};
  const securityScore = getContextScore(viewContext, 'M8');
  const securityOverlay = securityScore !== null && securityScore >= 3 ? contextOverlays.security : null;
  const assuranceOverlay = governance.conditionalDrivers.some(driver =>
    driver.metric === 'M15' && driver.status === 'active'
  ) ? contextOverlays.assurance : null;
  const activeContextOverlays = [
    securityOverlay ? { label: 'Security evidence overlay', metric: 'M8', ...securityOverlay } : null,
    assuranceOverlay ? { label: 'Binding assurance overlay', metric: 'M15', ...assuranceOverlay } : null
  ].filter(Boolean);
  const recommendation = viewContext.recommendationLevels?.[processId];
  const recommendationLabel = LEVEL_SET.has(recommendation) ? FRAMEWORK_META.levelLabels[recommendation] : null;
  const localChoice = getAdjustmentLevel(viewContext.manualAdjustments, processId);
  const levelLabel = FRAMEWORK_META.levelLabels[level] || level;
  const viewLevelLabel = FRAMEWORK_META.levelLabels[viewLevel] || viewLevel;
  const groupLabel = PROCESS_GROUPS[p.group.toUpperCase()]?.name || p.group;

  return `
    <div class="card process-work-aid animate-fade-in">
      <div class="flex justify-between process-detail-header mb-md">
        <div>
          <h3 id="process-detail-heading" tabindex="-1">${escapeHtml(p.name)}</h3>
          <p class="text-sm text-secondary mt-sm">${escapeHtml(p.purpose)}</p>
          <div class="process-meta-row">
            <span class="process-meta-pill">P${p.id}</span>
            <span class="process-meta-pill">${escapeHtml(groupLabel)}</span>
            <span class="process-meta-pill">Context: ${escapeHtml(viewContext.elementName)}</span>
          </div>
        </div>
        ${level
          ? `<span class="level-badge ${escapeHtml(level)}" title="Current applied tailoring level for ${escapeHtml(viewContext.elementName)}">${localChoice ? 'Local choice' : 'Current profile'}: ${escapeHtml(levelLabel)}</span>`
          : '<span class="process-meta-pill">No assessment assignment</span>'}
      </div>

      <div class="level-selector-bar">
        <div>
          <div class="text-xs text-secondary">Viewing process content at</div>
          <div class="text-sm">${level
            ? `${recommendationLabel ? `Recorded recommendation: ${escapeHtml(recommendationLabel)}.` : 'The recommendation was not recorded separately.'} Current applied level: ${escapeHtml(levelLabel)}. Content tabs compare only; they do not save a decision. <a href="#adjust">Record or revise the tailoring decision</a>.`
            : `No assessment assignment exists. ${escapeHtml(viewLevelLabel)} is shown for browsing only.`}</div>
        </div>
        <nav class="level-tabs" aria-label="Tailoring level detail selector">
          ${LEVEL_KEYS.map(l => `
            <a class="level-tab ${viewLevel === l ? 'active-' + escapeHtml(l) : ''}"
               href="${escapeHtml(processDetailsHref(processId, l, source))}"
               ${viewLevel === l ? 'aria-current="page"' : ''}
               aria-label="View ${escapeHtml(FRAMEWORK_META.levelLabels[l])} level content">${escapeHtml(FRAMEWORK_META.levelLabels[l])}</a>
          `).join('')}
        </nav>
      </div>

      <details class="practitioner-work-aid">
        <summary>Plan this work with your team</summary>
        <ol>
          <li><strong>Confirm the level.</strong><span>Compare Basic, Standard, and Comprehensive against the project context.</span></li>
          <li><strong>Assign the work.</strong><span>Agree owners for the activities and deliverables listed below.</span></li>
          <li><strong>Set the evidence.</strong><span>Record what will demonstrate that the selected level has been applied.</span></li>
        </ol>
      </details>

      ${p.definition ? `
      <div class="detail-section">
        <h4>What ${escapeHtml(viewLevelLabel)} means here</h4>
        <p class="text-sm text-secondary">${escapeHtml(p.definition[viewLevel] || '—')}</p>
      </div>` : ''}

      <p class="text-sm text-secondary mb-lg">Use the following activities and records as examples to adapt. Higher rigor retains the essential outcomes of lower levels. Named tools, document formats, and analysis methods are options unless your project has a specific obligation. Existing controlled records may meet several information needs. <a href="#help?topic=adapt">How to adapt the guidance</a>.</p>
      <div class="detail-section">
        <h4>Activity examples to adapt (${activities.length}) <span class="text-xs text-secondary font-normal ml-sm">(core outcome examples are marked)</span></h4>
        ${activities.length ? activities.map(a => {
    let isEssential = a.startsWith('(*)');
    let text = isEssential ? a.slice(4) : a;
    const contentState = getConditionalContentState(text, viewContext);
    const { disabled } = contentState;
    return `<div class="activity-item ${isEssential ? 'essential' : ''}" style="${disabled ? 'opacity: 0.5; text-decoration: line-through;' : ''}">
            <span class="activity-marker" aria-hidden="true">${isEssential ? '◆' : '•'}</span>${isEssential ? '<span class="sr-only">Core outcome: </span>' : ''} <span style="${disabled ? 'text-decoration: line-through;' : ''}">${escapeHtml(text)}</span>
            ${renderContextNote(contentState.note, disabled)}
          </div>`;
  }).join('') : '<div class="detail-empty-line">No activity detail is defined for this process level yet.</div>'}
      </div>

      <div class="detail-section">
        <h4>Record and evidence examples (${deliverables.length})</h4>
        ${deliverables.length ? deliverables.map(d => {
    let text = d;
    const contentState = getConditionalContentState(text, viewContext);
    const { disabled } = contentState;
    return `<div class="deliverable-item" style="${disabled ? 'opacity: 0.5; text-decoration: line-through;' : ''}">
            <span class="deliverable-marker" aria-hidden="true">•</span> <span style="${disabled ? 'text-decoration: line-through;' : ''}">${escapeHtml(text)}</span>
            ${renderContextNote(contentState.note, disabled)}
          </div>`;
  }).join('') : '<div class="detail-empty-line">No deliverable detail is defined for this process level yet.</div>'}
      </div>

      <div class="detail-section">
        <h4>Coordinate these handoffs</h4><p class="text-sm text-secondary">These are possible information flows. They do not set the recipient process level; use its assessment and applicable obligations.</p>
        ${outputs.length ? outputs.map(o => `<div class="output-item"><strong>${escapeHtml(o.name)}</strong> → ${escapeHtml(o.feedsInto)}</div>`).join('') : '<div class="detail-empty-line">No output flow detail is defined for this process yet.</div>'}
      </div>

      ${activeContextOverlays.length ? `
      <div class="detail-section" style="border-left: 3px solid var(--accent-warning); padding-left: 14px;">
        <h4>Conditional Context Evidence</h4>
        <p class="text-xs text-secondary mb-md">These prompts operationalize an existing mapped context. They do not change the assigned process level or create a new metric-to-process relationship.</p>
        ${activeContextOverlays.map(overlay => `
          <div class="mb-md">
            <div class="text-sm font-bold">${escapeHtml(overlay.label)} <span class="metric-tag secondary">${escapeHtml(overlay.metric)}</span></div>
            ${(overlay.activities || []).map(activity => `<div class="activity-item">• ${escapeHtml(activity)}</div>`).join('')}
            ${(overlay.evidence || []).map(item => `<div class="deliverable-item"><span class="deliverable-marker" aria-hidden="true">•</span> ${escapeHtml(item)}</div>`).join('')}
          </div>
        `).join('')}
      </div>` : ''}

      <details class="technical-context detail-section">
        <summary>Why this process is connected to the assessment</summary>
        ${renderRegistryDependencyContext(governance)}
        <div class="technical-context-body">
          <h4>Metric applicability</h4>
          <p class="text-xs text-secondary mb-md">P = primary driver; S = supporting driver. Roles are not numerical weights. A starred role is active only within the confirmed obligation scope. C marks an inactive conditional relationship; ? means its applicability is unavailable.</p>
          <div class="flex" style="flex-wrap:wrap">
            ${Object.entries(map).map(([mid, role]) => {
    const m = METRICS.find(x => x.id === mid);
    const conditional = governance.conditionalDrivers.find(driver => driver.metric === mid);
    const roleClass = conditional?.status === 'active' ? conditional.role : conditional ? '' : role;
    return `<span class="metric-tag ${escapeHtml(roleClass)}"${conditional ? ` title="${escapeHtml(conditional.reason)}"` : ''}>${escapeHtml(role)} ${escapeHtml(mid)}: ${escapeHtml(m?.name || mid)}</span>`;
  }).join('')}
          </div>
          ${governance.conditionalDrivers.map(driver => `<p class="text-xs text-secondary mt-sm"><strong>${escapeHtml(driver.metric)} conditional ${driver.role === 'P' ? 'primary' : 'supporting'} driver: ${escapeHtml(driver.status)}.</strong> ${escapeHtml(driver.reason)}</p>`).join('')}
        </div>
      </details>

      ${p.whenToElevate ? `
      <div class="detail-section">
        <h4>Questions for professional review</h4>
        <p class="text-sm text-secondary">${escapeHtml(p.whenToElevate)}</p>
        <p class="text-xs text-secondary mt-sm">These authored prompts do not override the assessment rules or save a level change.</p>
      </div>` : ''}
    </div>
  `;
}

function renderRegistryDependencyContext({ rules, floors }) {
  if (rules.length === 0 && floors.length === 0) return '';

  return `<div class="detail-section">
    <h4>Registry-Derived Governance Context</h4>
    <p class="text-xs text-secondary mb-md">Generated from the current rule and floor registry. Rule types use the element's effective ratings, including protected inheritance; unconfirmed inputs remain a preview. Related rules apply only when their trigger is met. Browsing a different content level does not change this context.</p>
    ${rules.length ? `<div class="mb-md"><strong class="text-xs">Related framework rules</strong>${rules.map(rule => `<div class="activity-item"><span class="activity-marker" aria-hidden="true">•</span> Rule ${escapeHtml(rule.id)} [${escapeHtml(rule.effectiveType || `Base ${rule.type}; context unavailable`)}${rule.effectiveType && rule.effectiveType !== rule.type ? ' in this context' : ''}]: ${escapeHtml(rule.label)} <span class="text-secondary">· ${escapeHtml(rule.status)}</span></div>`).join('')}</div>` : ''}
    ${floors.length ? `<div><strong class="text-xs">Possible minimum-level rules</strong><p class="text-xs text-secondary">Each minimum applies only when its stated condition is met.</p>${floors.map(floor => `<div class="activity-item"><span class="activity-marker" aria-hidden="true">•</span> ${escapeHtml(floor.label || floor.description || floor.id || floor.overrideId)} · minimum ${escapeHtml(FRAMEWORK_META.levelLabels[floor.minLevel] || floor.minLevel || 'defined by registry')}<div class="text-secondary">Condition: ${escapeHtml(floor.condition || floor.description)}</div></div>`).join('')}</div>` : ''}
  </div>`;
}
