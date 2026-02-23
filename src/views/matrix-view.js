/**
 * Matrix View — Process-Metric Applicability Heatmap
 */
import { CORE_PROCESSES, METRICS, DIMENSIONS, METRIC_PROCESS_MAP, FRAMEWORK_META } from '../data/se-tailoring-data.js';
import { runFullAssessment } from '../utils/assessment-engine.js';
import { getState, setState } from '../state.js';

export function renderMatrixView(container) {
  const state = getState();
  const matrixMap = state.matrixMap || JSON.parse(JSON.stringify(METRIC_PROCESS_MAP));

  container.innerHTML = `
    <div class="flex justify-between items-center mb-md">
      <div>
        <h2 class="mb-sm">📊 Process-Metric Applicability Matrix</h2>
        <p class="text-secondary text-sm">Shows which metrics (columns) drive which processes (rows). <strong class="text-accent">P</strong> = Primary driver, <strong class="text-secondary">S</strong> = Secondary driver. <strong style="color:var(--text-primary)">Click any cell to toggle.</strong></p>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-secondary btn-sm" id="btn-export-matrix-excel">📥 Export Excel</button>
        <button class="btn btn-primary btn-sm" id="btn-export-matrix-pdf">📄 Export PDF</button>
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
    const lvl = state.levels?.[p.id];
    return `<tr class="matrix-row" data-pid="${p.id}">
                <td class="matrix-process-cell">
                  <span class="process-id">${p.id}</span>
                  <span>${p.name}</span>
                </td>
                ${METRICS.map(m => {
      const role = map[m.id];
      const cellClass = role ? role : 'empty';
      return `<td class="matrix-cell ${cellClass} clickable-cell" data-pid="${p.id}" data-mid="${m.id}" title="Click to toggle (Primary/Secondary/None)" style="cursor:pointer">${role || ''}</td>`;
    }).join('')}
                <td class="matrix-level-cell">${lvl ? `<span class="level-badge ${lvl}">${lvl[0].toUpperCase()}</span>` : '—'}</td>
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
    .matrix-cell { font-weight: 700; font-size: 12px; transition: all 0.15s; border: 1px solid transparent; }
    .matrix-cell.P { background: rgba(99,102,241,0.2); color: var(--accent-primary-light); }
    .matrix-cell.S { background: rgba(148,163,184,0.1); color: var(--text-secondary); }
    .matrix-cell.empty { background: transparent; }
    .matrix-cell:hover { transform: scale(1.5); border-color: var(--accent-primary); z-index: 5; position: relative; }
    .matrix-row:hover td { background: rgba(99,102,241,0.04); }
    .matrix-level-cell { min-width: 50px; }
    .matrix-cell-example { width: 24px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 11px; font-weight: 700; }
    .matrix-cell-example.P { background: rgba(99,102,241,0.2); color: var(--accent-primary-light); }
    .matrix-cell-example.S { background: rgba(148,163,184,0.1); color: var(--text-secondary); }
  `;
  container.appendChild(style);

  const wrapper = container.querySelector('#matrix-wrapper');
  wrapper.addEventListener('click', (e) => {
    if (e.target.classList.contains('clickable-cell')) {
      const currentState = getState();
      const currentMatrixMap = currentState.matrixMap || JSON.parse(JSON.stringify(METRIC_PROCESS_MAP));

      const pid = parseInt(e.target.dataset.pid);
      const mid = e.target.dataset.mid;
      const currentRole = currentMatrixMap[pid]?.[mid];
      const nextRole = currentRole === 'P' ? 'S' : currentRole === 'S' ? null : 'P';

      if (!currentMatrixMap[pid]) currentMatrixMap[pid] = {};
      if (nextRole) {
        currentMatrixMap[pid][mid] = nextRole;
      } else {
        delete currentMatrixMap[pid][mid];
      }

      if (currentState.assessmentComplete) {
        const result = runFullAssessment(currentState.scores, currentMatrixMap);
        const finalLevels = { ...result.levels };
        if (currentState.manualAdjustments) {
          for (const [mpid, adj] of Object.entries(currentState.manualAdjustments)) {
            finalLevels[mpid] = adj.to;
          }
        }
        setState({
          matrixMap: currentMatrixMap,
          derived: result.derived,
          derivationDetails: result.derivationDetails || {},
          levels: finalLevels,
          overrides: result.overrides,
          fixes: result.fixes,
          // Recalculate violations with final levels
        });
      } else {
        setState({ matrixMap: currentMatrixMap });
      }

      const scrollContainer = container.querySelector('.matrix-scroll');
      const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0;
      const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;

      renderMatrixView(container);

      const newScrollContainer = container.querySelector('.matrix-scroll');
      if (newScrollContainer) {
        newScrollContainer.scrollLeft = scrollLeft;
        newScrollContainer.scrollTop = scrollTop;
      }
    }
  });

  // Export handlers will be imported dynamically
  container.querySelector('#btn-export-matrix-excel').addEventListener('click', async () => {
    const { exportMatrixExcel } = await import('../utils/export-import.js');
    exportMatrixExcel(getState(), METRICS, CORE_PROCESSES, METRIC_PROCESS_MAP);
  });

  container.querySelector('#btn-export-matrix-pdf').addEventListener('click', async () => {
    const { exportMatrixPDF } = await import('../utils/export-import.js');
    exportMatrixPDF(getState(), METRICS, CORE_PROCESSES, DIMENSIONS, METRIC_PROCESS_MAP);
  });
}
