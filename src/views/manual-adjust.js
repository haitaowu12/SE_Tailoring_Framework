/**
 * Manual Adjustment View — Override process levels with consistency validation
 */
import { CORE_PROCESSES, PROCESS_GROUPS, FRAMEWORK_META } from '../data/se-tailoring-data.js';
import { checkConsistency, simulatePropagation } from '../utils/assessment-engine.js';
import { getState, setState, showToast } from '../state.js';
import { navigateTo } from '../router.js';

let localLevels = {};

export function renderManualAdjust(container) {
  const state = getState();
  if (!state.assessmentComplete) {
    container.innerHTML = `<div class="card text-center" style="padding:80px 40px"><h3>No Assessment Yet</h3><p class="text-secondary mt-md">Complete an assessment first to manually adjust levels.</p><button class="btn btn-primary mt-lg" id="btn-go-assess">Start Assessment</button></div>`;
    container.querySelector('#btn-go-assess')?.addEventListener('click', () => navigateTo('assessment'));
    return;
  }

  // Initialize localLevels only if it's the first render or if state has changed from outside
  if (!container.querySelector('.adjust-select')) {
    localLevels = { ...state.levels };
  }

  const violations = checkConsistency(localLevels);
  const groupByGroup = {};
  CORE_PROCESSES.forEach(p => { if (!groupByGroup[p.group]) groupByGroup[p.group] = []; groupByGroup[p.group].push(p); });

  const processName = id => CORE_PROCESSES.find(p => p.id === id)?.name || `Process ${id}`;

  container.innerHTML = `
    <div class="flex justify-between items-center mb-lg">
      <div><h2>🎛️ Manual Level Adjustment</h2><p class="text-secondary text-sm mt-sm">Override algorithm-derived levels. Consistency rules are validated in real-time.</p></div>
      <div class="flex gap-sm">
        <button class="btn btn-secondary btn-sm" id="btn-reset">↻ Reset to Derived</button>
        <button class="btn btn-primary btn-sm" id="btn-save">💾 Save Changes</button>
      </div>
    </div>
    ${violations.length > 0 ? `
    <div class="card mb-lg" style="border-left: 3px solid ${violations.some(v => v.type === 'HC') ? 'var(--accent-error)' : 'var(--accent-warning)'}; background: ${violations.some(v => v.type === 'HC') ? 'rgba(239,68,68,0.06)' : 'rgba(251,191,36,0.06)'}">
      <div class="flex items-center gap-sm mb-sm">
        <strong>${violations.some(v => v.type === 'HC') ? '🚫' : '⚠️'} ${violations.length} Consistency Issue${violations.length > 1 ? 's' : ''}</strong>
      </div>
      ${violations.map(v => `
        <div class="text-sm mb-sm" style="color: ${v.type === 'HC' ? 'var(--accent-error)' : 'var(--accent-warning)'}">
          <strong>[${v.type}] Rule ${v.ruleId}</strong>: ${v.label}<br>
          <span class="text-xs text-secondary">${processName(v.affectedProcess)} is ${v.currentLevel}, needs ${v.requiredOp} ${v.requiredLevel}</span>
        </div>
      `).join('')}
    </div>` : '<div class="card mb-lg" style="border-left:3px solid var(--accent-success);background:rgba(52,211,153,0.06)"><strong>✓ All consistency rules satisfied</strong></div>'}

    ${Object.entries(groupByGroup).map(([group, procs]) => `
      <div class="mb-xl">
        <h3 class="mb-md" style="color: ${PROCESS_GROUPS[group.toUpperCase()]?.color || '#fff'}">${PROCESS_GROUPS[group.toUpperCase()]?.icon || ''} ${PROCESS_GROUPS[group.toUpperCase()]?.name || group}</h3>
        <div class="card" style="padding: 0; overflow: hidden;">
          <table class="data-table">
            <thead><tr><th>Process</th><th>Derived</th><th>Current Level</th><th>Impact</th></tr></thead>
            <tbody>
              ${procs.map(p => {
    const derived = state.derived[p.id] || 'basic';
    const current = localLevels[p.id] || 'basic';
    const changed = derived !== current;
    return `<tr>
                  <td><span class="process-id">${p.id}</span> ${p.name}</td>
                  <td><span class="level-badge ${derived}">${derived[0].toUpperCase()}</span></td>
                  <td>
                    <select class="select adjust-select" data-pid="${p.id}" style="min-width:150px">
                      ${['basic', 'standard', 'comprehensive'].map(l => `<option value="${l}" ${current === l ? 'selected' : ''}>${FRAMEWORK_META.levelLabels[l]}</option>`).join('')}
                    </select>
                  </td>
                  <td>${changed ? '<span class="text-xs" style="color:var(--accent-warning)">Modified</span>' : '—'}</td>
                </tr>`;
  }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `).join('')}

    <div id="propagation-preview" class="mt-lg"></div>
  `;

  // Select change handlers
  container.querySelectorAll('.adjust-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const pid = parseInt(e.target.dataset.pid);
      localLevels[pid] = e.target.value;
      renderManualAdjust(container);
    });
  });

  // Reset button
  container.querySelector('#btn-reset').addEventListener('click', () => {
    localLevels = { ...state.derived };
    setState({ levels: { ...state.derived }, manualAdjustments: {} });
    showToast('Reset to derived levels', 'info');
    renderManualAdjust(container);
  });

  // Save button
  container.querySelector('#btn-save').addEventListener('click', () => {
    const manualAdj = {};
    CORE_PROCESSES.forEach(p => {
      if (localLevels[p.id] !== state.derived[p.id]) {
        manualAdj[p.id] = { from: state.derived[p.id], to: localLevels[p.id] };
      }
    });
    setState({ levels: localLevels, manualAdjustments: manualAdj, violations: checkConsistency(localLevels) });
    showToast('Levels saved!', 'success');
  });
}
