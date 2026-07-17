/**
 * Process Explorer View — Searchable/filterable process detail browser
 */
import { ACTIVE_CONSISTENCY_RULES, BINDING_ASSURANCE_QUALIFIERS, CORE_PROCESSES, PROCESS_GROUPS, FRAMEWORK_META, METRIC_PROCESS_MAP, METRICS, OVERRIDE_CONDITIONS } from '../data/se-tailoring-data.js';
import { PROCESS_DETAILS, PROCESS_CONTEXT_OVERLAYS } from '../data/process-details.js';
import { getState } from '../state.js';
import { getCurrentRouteContext, processDetailsHref } from '../router.js';
import { escapeHtml } from '../utils/safe-text.js';

let filterGroup = 'all';
let searchQuery = '';

const LEVEL_KEYS = ['basic', 'standard', 'comprehensive'];
const LEVEL_SET = new Set(LEVEL_KEYS);
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
    viewLevel: processId ? (requestedLevel || assignedLevel || 'basic') : null,
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
    const browseLevel = assignedLevel || 'basic';
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
          ${assignedLevel ? `<span class="level-badge ${escapeHtml(assignedLevel)}" title="Recommended for ${escapeHtml(selection.viewContext.elementName)}">${assignedLevel[0].toUpperCase()}</span>` : ''}
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

  container.innerHTML = `
    <h2 class="mb-lg">🔍 Process Explorer</h2>
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
      .process-detail-header { align-items: flex-start; gap: var(--space-lg); }
      .process-meta-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
      .process-meta-pill { border: 1px solid var(--border-subtle); border-radius: var(--radius-full); padding: 3px 9px; font-size: 11px; color: var(--text-secondary); }
      .level-selector-bar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-md); flex-wrap: wrap; padding: 12px 0 18px; margin-bottom: var(--space-xl); border-bottom: 1px solid var(--border-subtle); }
      .level-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 0; }
      .level-tab { display: inline-block; padding: 6px 16px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; cursor: pointer; border: 1px solid var(--border-subtle); background: none; color: var(--text-secondary); transition: all var(--transition-fast); text-decoration: none; }
      .level-tab.active-basic { background: var(--level-basic-bg); color: var(--level-basic); border-color: var(--level-basic-border); }
      .level-tab.active-standard { background: var(--level-standard-bg); color: var(--level-standard); border-color: var(--level-standard-border); }
      .level-tab.active-comprehensive { background: var(--level-comprehensive-bg); color: var(--level-comprehensive); border-color: var(--level-comprehensive-border); }
      .level-tab:focus-visible { outline: 2px solid var(--accent-primary-light); outline-offset: 2px; }
      .detail-empty-line { color: var(--text-tertiary); font-size: var(--font-size-sm); padding: 8px 0; }
      .activity-item { padding: 6px 0; font-size: var(--font-size-xs); color: var(--text-secondary); border-bottom: 1px solid rgba(99,102,241,0.06); }
      .activity-item.essential { color: var(--text-primary); font-weight: 500; }
      .deliverable-item { padding: 6px 0; font-size: var(--font-size-xs); color: var(--text-secondary); border-bottom: 1px solid rgba(99,102,241,0.06); display: flex; gap: 6px; align-items: flex-start; }
      .output-item { background: rgba(34,211,238,0.06); border-radius: var(--radius-md); padding: 10px; margin-bottom: 8px; font-size: var(--font-size-xs); }
      .metric-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; margin: 3px; }
      .metric-tag.P { background: rgba(99,102,241,0.2); color: var(--accent-primary-light); }
      .metric-tag.S { background: rgba(148,163,184,0.12); color: var(--text-secondary); }
      @media (max-width: 900px) { .explorer-layout { grid-template-columns: 1fr; } .process-list-panel { max-height: 300px; } }
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

  if (selection.processId && selection.source) {
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
  if (score === null) return { disabled: false, note: `${metricId} context unconfirmed` };
  return score < 3
    ? { disabled: true, note: `Not required (${metricId} < 3)` }
    : { disabled: false, note: '' };
}

function renderContextNote(note, disabled) {
  if (!note) return '';
  return `<span style="font-size:10px; color:var(--text-secondary); text-decoration:none; margin-left:6px; background:var(--bg-tertiary); padding:2px 6px; border-radius:4px;">${disabled ? '' : 'Review: '}${escapeHtml(note)}</span>`;
}

function renderProcessDetail(processId, state, viewContext, viewLevel, source) {
  const p = CORE_PROCESSES.find(x => x.id === processId);
  if (!p) return '';
  const details = PROCESS_DETAILS[processId];
  const matrixMap = state.matrixMap || METRIC_PROCESS_MAP;
  const map = matrixMap[processId] || {};
  const level = getAssignedProcessLevel(viewContext, processId);
  const activities = details?.activities?.[viewLevel] || [];
  const deliverables = details?.deliverables?.[viewLevel] || [];
  const outputs = details?.outputs || [];
  const contextOverlays = PROCESS_CONTEXT_OVERLAYS[processId] || {};
  const securityScore = getContextScore(viewContext, 'M8');
  const securityOverlay = securityScore !== null && securityScore >= 3 ? contextOverlays.security : null;
  const assuranceOverlay = (viewContext.assuranceObligations || []).some(obligation =>
    obligation?.bindingStatus === 'confirmed'
      && BINDING_ASSURANCE_QUALIFIERS.includes(obligation.type)
      && String(obligation.authority || '').trim()
      && String(obligation.sourceRef || '').trim()
      && Array.isArray(obligation.processScope)
      && obligation.processScope.map(Number).includes(Number(processId))
  ) ? contextOverlays.assurance : null;
  const activeContextOverlays = [
    securityOverlay ? { label: 'Security evidence overlay', metric: 'M8', ...securityOverlay } : null,
    assuranceOverlay ? { label: 'Binding assurance overlay', metric: 'M15', ...assuranceOverlay } : null
  ].filter(Boolean);
  const levelLabel = FRAMEWORK_META.levelLabels[level] || level;
  const viewLevelLabel = FRAMEWORK_META.levelLabels[viewLevel] || viewLevel;
  const groupLabel = PROCESS_GROUPS[p.group.toUpperCase()]?.name || p.group;
  const scopeLabel = p.iso?.scope === 'executable-core' ? 'Executable core' : 'Reference scope';

  return `
    <div class="card animate-fade-in">
      <div class="flex justify-between process-detail-header mb-lg">
        <div>
          <h3 id="process-detail-heading" tabindex="-1">${escapeHtml(p.name)}</h3>
          <p class="text-sm text-secondary mt-sm">${escapeHtml(p.purpose)}</p>
          <div class="process-meta-row">
            <span class="process-meta-pill">P${p.id}</span>
            <span class="process-meta-pill">${escapeHtml(groupLabel)}</span>
            <span class="process-meta-pill">${escapeHtml(scopeLabel)}</span>
            <span class="process-meta-pill">Context: ${escapeHtml(viewContext.elementName)}</span>
            <span class="process-meta-pill">${activities.length} activities · ${deliverables.length} deliverables at ${escapeHtml(viewLevelLabel)}</span>
          </div>
        </div>
        ${level
          ? `<span class="level-badge ${escapeHtml(level)}" title="Recommended tailoring level for ${escapeHtml(viewContext.elementName)}">Recommended: ${escapeHtml(levelLabel)}</span>`
          : '<span class="process-meta-pill">No assessment assignment</span>'}
      </div>

      <div class="level-selector-bar">
        <div>
          <div class="text-xs text-secondary">Viewing process content at</div>
          <div class="text-sm">${level
            ? `The recommendation is ${escapeHtml(levelLabel)}. Switch levels for comparison.`
            : `No recommendation is assigned. ${escapeHtml(viewLevelLabel)} is shown for browsing only.`}</div>
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

      ${p.definition ? `
      <div class="detail-section">
        <h4>Definition at ${escapeHtml(viewLevelLabel)}</h4>
        <p class="text-sm text-secondary">${escapeHtml(p.definition[viewLevel] || '—')}</p>
      </div>` : ''}

      <div class="detail-section">
        <h4>Activities (${activities.length}) <span class="text-xs text-secondary font-normal ml-sm">(Essential core activities are marked)</span></h4>
        ${activities.length ? activities.map(a => {
    let isEssential = a.startsWith('(*)');
    let text = isEssential ? a.slice(4) : a;
    const contentState = getConditionalContentState(text, viewContext);
    const { disabled } = contentState;
    return `<div class="activity-item ${isEssential ? 'essential' : ''}" style="${disabled ? 'opacity: 0.5; text-decoration: line-through;' : ''}">
            <span class="activity-marker" aria-hidden="true">${isEssential ? '◆' : '•'}</span> <span style="${disabled ? 'text-decoration: line-through;' : ''}">${escapeHtml(text)}</span>
            ${renderContextNote(contentState.note, disabled)}
          </div>`;
  }).join('') : '<div class="detail-empty-line">No activity detail is defined for this process level yet.</div>'}
      </div>

      <div class="detail-section">
        <h4>Deliverables (${deliverables.length})</h4>
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
        <h4>Outputs & Feeds Into</h4>
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

      ${renderRegistryDependencyContext(processId)}

      <div class="detail-section">
        <h4>Metric Applicability</h4>
        <div class="flex" style="flex-wrap:wrap">
          ${Object.entries(map).map(([mid, role]) => {
    const m = METRICS.find(x => x.id === mid);
    return `<span class="metric-tag ${escapeHtml(role)}">${escapeHtml(role)} ${escapeHtml(mid)}: ${escapeHtml(m?.name || mid)}</span>`;
  }).join('')}
        </div>
      </div>

      ${p.whenToElevate ? `
      <div class="detail-section">
        <h4>When to Elevate</h4>
        <p class="text-sm text-secondary">${escapeHtml(p.whenToElevate)}</p>
      </div>` : ''}
    </div>
  `;
}

function renderRegistryDependencyContext(processId) {
  const rules = ACTIVE_CONSISTENCY_RULES.filter(rule =>
    Number(rule.trigger?.process) === Number(processId) || Number(rule.required?.process) === Number(processId)
  );
  const floors = OVERRIDE_CONDITIONS.filter(floor =>
    (floor.processes || []).map(Number).includes(Number(processId))
  );
  if (rules.length === 0 && floors.length === 0) return '';

  return `<div class="detail-section">
    <h4>Registry-Derived Governance Context</h4>
    <p class="text-xs text-secondary mb-md">Generated directly from the current rule and floor registry. It does not add practitioner-authored semantics.</p>
    ${rules.length ? `<div class="mb-md"><strong class="text-xs">Related active rules</strong>${rules.map(rule => `<div class="activity-item"><span class="activity-marker" aria-hidden="true">•</span> Rule ${escapeHtml(rule.id)} [${escapeHtml(rule.type)}]: ${escapeHtml(rule.label)}</div>`).join('')}</div>` : ''}
    ${floors.length ? `<div><strong class="text-xs">Applicable floor definitions</strong>${floors.map(floor => `<div class="activity-item"><span class="activity-marker" aria-hidden="true">•</span> ${escapeHtml(floor.label || floor.description || floor.id || floor.overrideId)} · minimum ${escapeHtml(floor.minLevel || 'defined by registry')}</div>`).join('')}</div>` : ''}
  </div>`;
}
