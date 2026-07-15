/**
 * Matrix View — Process-Metric Applicability Heatmap
 */
import { CORE_PROCESSES, METRICS, DIMENSIONS, METRIC_PROCESS_MAP, FRAMEWORK_META } from '../data/se-tailoring-data.js';
import { getState } from '../state.js';
import { exportMatrixCSV, exportMatrixPDF } from '../utils/export-import.js';
import { processDetailsHref } from '../router.js';
import { escapeHtml } from '../utils/safe-text.js';

export function renderMatrixView(container) {
  const state = getState();
  const matrixMap = METRIC_PROCESS_MAP;
  const canonicalCellCount = Object.values(matrixMap)
    .reduce((count, mapping) => count + Object.keys(mapping || {}).length, 0);
  const activeNodeId = state.assessmentTree?.activeId;
  const activeNode = activeNodeId ? state.assessmentTree?.nodes?.[activeNodeId] : null;
  const activeNodeIsRoot = activeNodeId === state.assessmentTree?.rootId;
  const effectiveLevel = processId => activeNode?.manualAdjustments?.[processId]?.level
    || (activeNodeIsRoot ? state.manualAdjustments?.[processId]?.level : null)
    || activeNode?.levels?.[processId]
    || state.levels?.[processId]
    || null;

  container.innerHTML = `
    <div class="flex justify-between items-center mb-md">
      <div>
        <h2 class="mb-sm">Process-Metric Applicability Matrix</h2>
        <p class="text-secondary text-sm">Read-only canonical ${canonicalCellCount}-cell process–metric map. <strong class="text-accent">P</strong> = Primary driver, <strong class="text-secondary">S</strong> = Secondary driver. Changes require governed registry review and cannot be made from the practitioner app.</p>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-secondary btn-sm" id="btn-export-matrix-csv">Export CSV</button>
        <button class="btn btn-primary btn-sm" id="btn-export-matrix-pdf">Export PDF</button>
      </div>
    </div>
    <div class="matrix-container card" id="matrix-wrapper">
      <div class="matrix-scroll">
        <table class="matrix-table">
          <thead>
            <tr>
              <th class="matrix-corner">Process</th>
              ${METRICS.map(m => {
    const dim = DIMENSIONS.find(d => d.id === m.dimension);
    return `<th class="matrix-metric-header" title="${m.name}" style="border-top: 3px solid ${dim.color}">
                  <div class="metric-col-label">${m.id}</div>
                  <div class="metric-col-score">${state.scores[m.id] || '—'}</div>
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
      const cellClass = role ? role : 'empty';
      const label = role === 'P' ? 'Primary driver' : role === 'S' ? 'Secondary driver' : 'Not mapped';
      return `<td class="matrix-cell ${cellClass}" data-pid="${p.id}" data-mid="${m.id}" aria-label="${escapeHtml(`${p.name} / ${m.id}: ${label}`)}" title="${escapeHtml(label)}">${role || ''}</td>`;
    }).join('')}
                <td class="matrix-level-cell">${lvl ? `<a href="${escapeHtml(processDetailsHref(p.id, lvl, 'matrix'))}" aria-label="View ${escapeHtml(FRAMEWORK_META.levelLabels[lvl] || lvl)} details for ${escapeHtml(p.name)}" title="View exact assigned level details" style="display:inline-flex;align-items:center;gap:5px;text-decoration:none;"><span class="level-badge ${lvl}">${lvl[0].toUpperCase()}</span><span class="text-xs">View</span></a>` : '—'}</td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
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
    exportMatrixCSV(getState(), METRICS, CORE_PROCESSES, METRIC_PROCESS_MAP);
  });

  container.querySelector('#btn-export-matrix-pdf').addEventListener('click', async () => {
    await exportMatrixPDF(getState(), METRICS, CORE_PROCESSES, DIMENSIONS, METRIC_PROCESS_MAP);
  });
}
