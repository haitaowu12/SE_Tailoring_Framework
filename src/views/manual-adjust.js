/**
 * Manual Adjustment View — Override process levels with consistency validation
 */
import { CORE_PROCESSES, PROCESS_GROUPS, FRAMEWORK_META } from '../data/se-tailoring-data.js';
import { checkConsistency } from '../utils/assessment-engine.js';
import { getState, setState, showToast, getElementsFlat, setElementProcessAdjustment } from '../state.js';
import { navigateTo } from '../router.js';

let localLevels = {};
let selectedElementId = null;

export function renderManualAdjust(container) {
  const state = getState();
  const elements = getElementsFlat().filter(el => el.assessmentResult);

  if (elements.length === 0) {
    container.innerHTML = `<div class="card text-center" style="padding:80px 40px"><h3>No Assessment Yet</h3><p class="text-secondary mt-md">Complete an assessment for at least one system element first to manually adjust levels.</p><button class="btn btn-primary mt-lg" id="btn-go-assess">Start Assessment</button></div>`;
    container.querySelector('#btn-go-assess')?.addEventListener('click', () => navigateTo('assessment'));
    return;
  }

  // Set default selected element
  if (!selectedElementId || !elements.find(el => el.id === selectedElementId)) {
    selectedElementId = elements[0].id;
  }

  const selectedElement = elements.find(el => el.id === selectedElementId);
  const derivedLevels = selectedElement.levels || {};

  // Initialize localLevels based on the selected element
  if (!container.querySelector('.element-select')) {
    localLevels = {};
    CORE_PROCESSES.forEach(p => {
        const manualAdj = selectedElement.manualAdjustments?.[p.id];
        localLevels[p.id] = manualAdj ? manualAdj.level : (derivedLevels[p.id] || 'basic');
    });
  }

  const violations = checkConsistency(localLevels);
  const groupByGroup = {};
  CORE_PROCESSES.forEach(p => { if (!groupByGroup[p.group]) groupByGroup[p.group] = []; groupByGroup[p.group].push(p); });

  const processName = id => CORE_PROCESSES.find(p => p.id === id)?.name || `Process ${id}`;

  container.innerHTML = `
    <div class="flex justify-between items-center mb-0">
      <div><h2>🎛️ Manual Level Adjustment</h2><p class="text-secondary text-sm mt-sm">Override algorithm-derived levels. Consistency rules are validated in real-time.</p></div>
      <div class="flex gap-sm">
        <button class="btn btn-secondary btn-sm" id="btn-reset">↻ Reset to Derived</button>
        <button class="btn btn-primary btn-sm" id="btn-save">💾 Save Changes</button>
      </div>
    </div>
    
    <div class="mb-lg mt-md p-md bg-card" style="border-radius: 8px; border: 1px solid var(--border-subtle);">
      <label class="form-label text-sm text-secondary" style="display:block; margin-bottom: 4px;">Target System Element</label>
      <select class="select element-select" style="min-width:300px; max-width:100%;">
        ${elements.map(el => `<option value="${el.id}" ${el.id === selectedElementId ? 'selected' : ''}>${el.name}</option>`).join('')}
      </select>
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
    </div>` : '<div class="card mb-lg" style="border-left:3px solid var(--accent-success);background:rgba(52,211,153,0.06)"><strong>✓ All consistency rules satisfied for this element</strong></div>'}

    ${Object.entries(groupByGroup).map(([group, procs]) => `
      <div class="mb-xl">
        <h3 class="mb-md" style="color: ${PROCESS_GROUPS[group.toUpperCase()]?.color || '#fff'}">${PROCESS_GROUPS[group.toUpperCase()]?.icon || ''} ${PROCESS_GROUPS[group.toUpperCase()]?.name || group}</h3>
        <div class="card" style="padding: 0; overflow: hidden; overflow-x: auto;">
          <table class="data-table" style="min-width: 600px;">
            <thead><tr><th>Process</th><th>Derived</th><th>Current Level</th><th>Justification</th><th>Status</th></tr></thead>
            <tbody>
              ${procs.map(p => {
    const derived = derivedLevels[p.id] || 'basic';
    const current = localLevels[p.id] || 'basic';
    const changed = derived !== current;
    return `<tr>
                  <td><span class="process-id" style="font-size: 10px; padding: 1px 4px;">${p.id}</span> ${p.name}</td>
                  <td><span class="level-badge ${derived}">${derived[0].toUpperCase()}</span></td>
                  <td>
                    <select class="form-control form-control-sm adjust-select" data-pid="${p.id}" style="min-width:130px; font-size:12px;">
                      ${['basic', 'standard', 'comprehensive'].map(l => `<option value="${l}" ${current === l ? 'selected' : ''}>${FRAMEWORK_META.levelLabels[l]}</option>`).join('')}
                    </select>
                  </td>
                  <td>
                    <input type="text" class="input adjust-justification" data-pid="${p.id}" style="width:100%; font-size:12px;" placeholder="${changed ? 'Provide justification...' : 'Optional justification...'}" value="${selectedElement.manualAdjustments?.[p.id]?.justification || ''}" ${!changed ? 'disabled style="opacity:0.5;"' : ''}>
                  </td>
                  <td>${changed ? '<span class="text-xs" style="color:var(--accent-warning); font-weight:bold;">Modified</span>' : '<span class="text-xs text-secondary">—</span>'}</td>
                </tr>`;
  }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `).join('')}
  `;

  // Select change handlers
  container.querySelectorAll('.adjust-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const pid = e.target.dataset.pid;
      localLevels[pid] = e.target.value;
      const justInput = container.querySelector(`.adjust-justification[data-pid="${pid}"]`);
      if (justInput) {
        if (localLevels[pid] !== derivedLevels[pid]) {
          justInput.disabled = false;
          justInput.style.opacity = '1';
        } else {
          justInput.disabled = true;
          justInput.style.opacity = '0.5';
        }
      }
      // Re-render to update consistency banner and status tags
      renderManualAdjust(container);
    });
  });

  // Element select handler
  container.querySelector('.element-select').addEventListener('change', (e) => {
    selectedElementId = e.target.value;
    container.innerHTML = ''; // force full re-render state loop
    renderManualAdjust(container);
  });

  // Reset button
  container.querySelector('#btn-reset').addEventListener('click', () => {
    localLevels = { ...derivedLevels };
    CORE_PROCESSES.forEach(p => {
      setElementProcessAdjustment(selectedElementId, p.id, 'default', '');
    });
    showToast(`Reset to derived levels for ${selectedElement.name}`, 'info');
    renderManualAdjust(container);
  });

  // Save button
  container.querySelector('#btn-save').addEventListener('click', () => {
    CORE_PROCESSES.forEach(p => {
      const justInput = container.querySelector(`.adjust-justification[data-pid="${p.id}"]`);
      const justification = justInput ? justInput.value : '';
      if (localLevels[p.id] !== derivedLevels[p.id]) {
        setElementProcessAdjustment(selectedElementId, p.id, localLevels[p.id], justification);
      } else {
        setElementProcessAdjustment(selectedElementId, p.id, 'default', '');
      }
    });
    showToast(`Levels saved for ${selectedElement.name}!`, 'success');
  });
}

