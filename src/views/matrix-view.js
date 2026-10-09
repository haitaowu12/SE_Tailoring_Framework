/**
 * Matrix View — Process-Metric Applicability Heatmap
 */
import { CORE_PROCESSES, METRICS, DIMENSIONS, METRIC_PROCESS_MAP, CONDITIONAL_METRIC_PROCESS_DRIVERS, FRAMEWORK_META } from '../data/se-tailoring-data.js';
import { getState } from '../state.js';
import { exportMatrixCSV, exportMatrixPDF } from '../utils/export-import.js';
import { processDetailsHref } from '../router.js';
import { escapeHtml } from '../utils/safe-text.js';
import { getDriverAttribution } from '../utils/assessment-engine.js';
import { getDecisionEffectiveScores } from '../utils/tailoring-decisions.js';

/** Read-only presentation overlay. The canonical registry and engine remain untouched. */
export function buildMatrixPresentation(state = {}) {
  const tree = state.assessmentTree;
  const activeId = tree?.activeId || tree?.rootId;
  const node = activeId ? tree?.nodes?.[activeId] : null;
  const rootContext = !tree || node?.id === tree.rootId;
  const source = node || (!tree ? state : {});
  const scores = node ? getDecisionEffectiveScores(node, state) : (source.scores || {});
  const metricAssessments = source.metricAssessments || (rootContext ? state.metricAssessments : {}) || {};
  const obligations = Array.isArray(source.assuranceObligations) ? source.assuranceObligations
    : rootContext && Array.isArray(state.assuranceObligations) ? state.assuranceObligations : null;
  const migrationRequired = state.semanticMigration?.status === 'review-required';
  const contextAvailable = (!tree || !!node) && obligations !== null && !migrationRequired;
  const context = { ...state.projectInfo, metricAssessments, assuranceObligations: obligations || [] };
  const map = Object.fromEntries(Object.entries(METRIC_PROCESS_MAP).map(([id, roles]) => [id, { ...roles }]));
  const canonicalCellCount = Object.values(METRIC_PROCESS_MAP).reduce((count, roles) => count + Object.keys(roles).length, 0);
  const conditionalDrivers = CONDITIONAL_METRIC_PROCESS_DRIVERS.map(driver => {
    const applicable = contextAvailable && getDriverAttribution(driver.processId, scores, METRIC_PROCESS_MAP, context)
      .some(item => item.metric === driver.metric && item.role === driver.role);
    const status = !contextAvailable ? 'unavailable' : applicable ? 'active' : 'inactive';
    const marker = status === 'active' ? `${driver.role}*` : status === 'unavailable' ? `${driver.role}?` : 'C';
    const roleLabel = driver.role === 'P' ? 'Primary' : 'Secondary';
    const scoreConfirmed = ['assessed', 'inherited-confirmed'].includes(metricAssessments[driver.metric]?.status);
    const reason = status === 'active'
      ? `Confirmed binding obligation with authority and source is scoped to this process; ${driver.metric} is an additional ${roleLabel.toLowerCase()} driver.${scoreConfirmed ? '' : ` ${driver.metric} is not a confirmed rating; resulting levels remain a preview.`}`
      : status === 'inactive'
        ? `Conditional ${roleLabel.toLowerCase()} driver is inactive: no confirmed binding obligation with authority, source, and this process in scope.`
        : migrationRequired
          ? 'Conditional applicability is unavailable until semantic migration is reviewed. Preserved records are not treated as current applicability.'
          : 'Conditional applicability is unavailable because the active element or its scoped assurance context is missing.';
    map[driver.processId] = { ...map[driver.processId], [driver.metric]: marker };
    return { processId: driver.processId, processName: CORE_PROCESSES.find(process => process.id === driver.processId)?.name || String(driver.processId),
      metric: driver.metric, role: driver.role, status, marker, reason };
  });
  const activeCount = conditionalDrivers.filter(driver => driver.status === 'active').length;
  const unavailableCount = conditionalDrivers.filter(driver => driver.status === 'unavailable').length;
  const contextLabel = !contextAvailable ? 'Context unavailable' : rootContext ? 'Root assessment' : 'Active system element';
  const legend = 'P/S = shared primary/secondary allocation. P*/S* = active scoped primary/secondary driver. C = conditional relationship, currently inactive. P?/S? = conditional applicability unavailable. Roles are not numerical weights.';
  const caption = `${canonicalCellCount} shared driver allocations, plus ${conditionalDrivers.length} conditional M15 relationships: ${activeCount} active, ${conditionalDrivers.length - activeCount - unavailableCount} inactive, ${unavailableCount} unavailable. Conditions use the current element context, not a claim of external approval. Minimum-level rules and dependencies are separate influences.`;
  return { map, canonicalCellCount, conditionalDrivers, caption, legend, contextLabel,
    elementName: node?.name || 'Current assessment', scores, metricAssessments, node, rootContext };
}

export function renderMatrixView(container) {
  const state = getState();
  const presentation = buildMatrixPresentation(state);
  const matrixMap = presentation.map;
  const activeNode = presentation.node;
  const effectiveLevel = processId => activeNode?.manualAdjustments?.[processId]?.level
    || (presentation.rootContext ? state.manualAdjustments?.[processId]?.level : null)
    || activeNode?.levels?.[processId]
    || (presentation.rootContext ? state.levels?.[processId] : null)
    || null;
  const conditionalFor = (processId, metricId) => presentation.conditionalDrivers.find(driver => driver.processId === processId && driver.metric === metricId);

  container.innerHTML = `
    <div class="flex justify-between items-center mb-md">
      <div>
        <h2 class="mb-sm">Process-Metric Applicability Matrix</h2>
        <p class="text-secondary text-sm">This matrix links project ratings to process recommendations. <strong class="text-accent">P</strong> = primary driver; <strong class="text-secondary">S</strong> = supporting driver. The roles are not numerical weights. A blank cell means no registered direct mapping. Marked M15 cells are conditional scoped relationships; minimum-level rules and dependencies may also affect the process. <a href="#help?topic=adapt">How to propose a different allocation</a>.</p>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-secondary btn-sm" id="btn-export-matrix-csv">Export CSV</button>
        <button class="btn btn-primary btn-sm" id="btn-export-matrix-pdf">Export PDF</button>
      </div>
    </div>
    <section class="card mb-md matrix-conditional-summary" aria-labelledby="matrix-conditional-title">
      <h3 id="matrix-conditional-title">Scoped M15 drivers</h3>
      <p class="text-sm text-secondary mt-sm">${escapeHtml(presentation.contextLabel)}: ${escapeHtml(presentation.elementName)}. ${escapeHtml(presentation.caption)}</p>
      <p class="text-sm mt-sm">${escapeHtml(presentation.legend)}</p>
      <details class="mt-sm"><summary>View conditional applicability for each process</summary>
        <ul class="matrix-conditional-list">${presentation.conditionalDrivers.map(driver => `<li><strong>${driver.processId}. ${escapeHtml(driver.processName)} · ${escapeHtml(driver.marker)} · ${escapeHtml(driver.status)}</strong><p class="text-sm text-secondary">${escapeHtml(driver.reason)}</p></li>`).join('')}</ul>
      </details>
    </section>
    <div class="matrix-container card" id="matrix-wrapper">
      <div class="matrix-scroll" tabindex="0" role="region" aria-label="Process to metric matrix; scroll horizontally to see all ratings">
        <table class="matrix-table"><caption class="sr-only">${escapeHtml(presentation.caption)} ${escapeHtml(presentation.legend)} Use Help for rating names and interpretation.</caption>
          <thead>
            <tr>
              <th class="matrix-corner">Process</th>
              ${METRICS.map(m => {
    const dim = DIMENSIONS.find(d => d.id === m.dimension);
    return `<th scope="col" class="matrix-metric-header" title="${m.name}" style="border-top: 3px solid ${dim.color}">
                  <div class="metric-col-label">${m.id}</div><span class="sr-only">${escapeHtml(m.name)}</span>
                  <div class="metric-col-score">${escapeHtml(presentation.scores[m.id] ?? '—')}</div>
                </th>`;
  }).join('')}
              <th class="matrix-level-header">Level</th>
            </tr>
          </thead>
          <tbody>
            ${CORE_PROCESSES.map(p => {
    const map = matrixMap[p.id] || {};
    const lvl = effectiveLevel(p.id);
    return `<tr class="matrix-row" data-pid="${p.id}">
                <td class="matrix-process-cell">
                  <span class="process-id">${p.id}</span>
                  <span>${escapeHtml(p.name)}</span>
                </td>
                ${METRICS.map(m => {
      const role = map[m.id];
      const conditional = conditionalFor(p.id, m.id);
      const cellClass = conditional ? `conditional ${conditional.status}` : role ? role : 'empty';
      const label = conditional ? `${conditional.marker}: ${conditional.reason}` : role === 'P' ? 'Primary driver' : role === 'S' ? 'Secondary driver' : 'No registered direct mapping';
      return `<td class="matrix-cell ${cellClass}" data-pid="${p.id}" data-mid="${m.id}" aria-label="${escapeHtml(`${p.name} / ${m.id}: ${label}`)}" title="${escapeHtml(label)}">${role || ''}</td>`;
    }).join('')}
                <td class="matrix-level-cell">${lvl ? `<a href="${escapeHtml(processDetailsHref(p.id, lvl, 'matrix'))}" aria-label="View ${escapeHtml(FRAMEWORK_META.levelLabels[lvl] || lvl)} details for ${escapeHtml(p.name)}" title="View exact assigned level details" style="display:inline-flex;align-items:center;gap:5px;text-decoration:none;"><span class="level-badge ${lvl}">${lvl[0].toUpperCase()}</span><span class="text-xs">View</span></a>` : '—'}</td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <details class="card mt-lg"><summary>Rating names</summary><dl>${METRICS.map(m => `<dt><strong>${escapeHtml(m.id)}</strong></dt><dd>${escapeHtml(m.name)}</dd>`).join('')}</dl></details>
    <div class="matrix-legend mt-lg flex gap-lg justify-between">
      <div class="flex gap-lg">
        ${DIMENSIONS.map(d => `
          <div class="flex items-center gap-sm text-xs">
            <div style="width:10px;height:10px;border-radius:2px;background:${d.color}"></div>
            <span class="text-secondary">${d.name}</span>
          </div>`).join('')}
      </div>
      <div class="flex gap-md">
        <div class="flex items-center gap-sm text-xs"><div class="matrix-cell-example P">P</div><span class="text-secondary">Primary</span></div>
        <div class="flex items-center gap-sm text-xs"><div class="matrix-cell-example S">S</div><span class="text-secondary">Secondary</span></div>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .matrix-conditional-list { padding-left:20px; margin-top:12px; display:grid; gap:12px; }
    .matrix-conditional-summary { line-height:1.6; }
    .matrix-cell.conditional.active { background:rgba(52,211,153,.14); color:var(--text-primary); border:1px dashed var(--accent-primary-light); }
    .matrix-cell.conditional.inactive { color:var(--text-secondary); border:1px dotted var(--border-subtle); }
    .matrix-cell.conditional.unavailable { color:var(--accent-warning); border:1px dashed var(--accent-warning); }
    .matrix-container { padding: 0; overflow: hidden; }
    .matrix-scroll { overflow-x: auto; }
    .matrix-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .matrix-table th, .matrix-table td { padding: 6px 8px; text-align: center; white-space: nowrap; }
    .matrix-corner { text-align: left !important; position: sticky; left: 0; background: var(--bg-secondary); z-index: 2; min-width: 200px; }
    .matrix-metric-header { font-size: 11px; font-weight: 600; padding: 8px 4px !important; vertical-align: bottom; }
    .metric-col-label { color: var(--text-secondary); }
    .metric-col-score { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-top: 2px; }
    .matrix-level-header { font-size: 11px; }
    .matrix-process-cell { text-align: left !important; position: sticky; left: 0; background: var(--bg-card); z-index: 1; display: flex; gap: 8px; align-items: center; }
    .matrix-cell { font-weight: 700; font-size: 12px; border: 1px solid transparent; }
    .matrix-cell.P { background: rgba(99,102,241,0.2); color: var(--accent-primary-light); }
    .matrix-cell.S { background: rgba(148,163,184,0.1); color: var(--text-secondary); }
    .matrix-cell.empty { background: transparent; }
    .matrix-row:hover td { background: rgba(99,102,241,0.04); }
    .matrix-level-cell { min-width: 50px; }
    .matrix-cell-example { width: 24px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 11px; font-weight: 700; }
    .matrix-cell-example.P { background: rgba(99,102,241,0.2); color: var(--accent-primary-light); }
    .matrix-cell-example.S { background: rgba(148,163,184,0.1); color: var(--text-secondary); }
  `;
  container.appendChild(style);

  container.querySelector('#btn-export-matrix-csv').addEventListener('click', () => {
    exportMatrixCSV(getState(), METRICS, CORE_PROCESSES, METRIC_PROCESS_MAP, buildMatrixPresentation(getState()));
  });

  container.querySelector('#btn-export-matrix-pdf').addEventListener('click', async () => {
    await exportMatrixPDF(getState(), METRICS, CORE_PROCESSES, DIMENSIONS, METRIC_PROCESS_MAP, buildMatrixPresentation(getState()));
  });
}
