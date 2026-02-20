/**
 * Deliverables View — Process-grouped checklist explorer
 */
import { CORE_PROCESSES, PROCESS_GROUPS, FRAMEWORK_META } from '../data/se-tailoring-data.js';
import { PROCESS_DETAILS } from '../data/process-details.js';
import { getState } from '../state.js';

let filterLevel = 'all';
let checkedItems = new Set();

export function renderDeliverables(container) {
    const state = getState();
    const groupByGroup = {};
    CORE_PROCESSES.forEach(p => { if (!groupByGroup[p.group]) groupByGroup[p.group] = []; groupByGroup[p.group].push(p); });

    // Count deliverables
    let totalCount = 0, checkedCount = checkedItems.size;
    CORE_PROCESSES.forEach(p => {
        const details = PROCESS_DETAILS[p.id];
        if (!details?.deliverables) return;
        const lvl = filterLevel !== 'all' ? filterLevel : (state.levels[p.id] || 'basic');
        totalCount += (details.deliverables[lvl] || []).length;
    });

    container.innerHTML = `
    <div class="flex justify-between items-center mb-lg">
      <div>
        <h2>📋 Deliverables Checklist</h2>
        <p class="text-secondary text-sm mt-sm">${checkedCount}/${totalCount} items checked</p>
      </div>
      <div class="flex gap-sm items-center">
        <span class="text-xs text-secondary">Filter:</span>
        <select class="select" id="level-filter">
          <option value="all" ${filterLevel === 'all' ? 'selected' : ''}>Current Assessment Levels</option>
          <option value="basic" ${filterLevel === 'basic' ? 'selected' : ''}>All Basic</option>
          <option value="standard" ${filterLevel === 'standard' ? 'selected' : ''}>All Standard</option>
          <option value="comprehensive" ${filterLevel === 'comprehensive' ? 'selected' : ''}>All Comprehensive</option>
        </select>
      </div>
    </div>
    <div class="progress-bar mb-xl"><div class="progress-bar-fill" style="width:${totalCount > 0 ? (checkedCount / totalCount * 100) : 0}%"></div></div>

    ${Object.entries(groupByGroup).map(([group, procs]) => `
      <div class="mb-xl">
        <h3 class="mb-md" style="color: ${PROCESS_GROUPS[group.toUpperCase()]?.color || '#fff'}">${PROCESS_GROUPS[group.toUpperCase()]?.icon || ''} ${PROCESS_GROUPS[group.toUpperCase()]?.name || group}</h3>
        ${procs.map(p => {
        const details = PROCESS_DETAILS[p.id];
        if (!details?.deliverables) return '';
        const lvl = filterLevel !== 'all' ? filterLevel : (state.levels[p.id] || 'basic');
        const items = details.deliverables[lvl] || [];
        if (items.length === 0) return '';
        const pChecked = items.filter((_, i) => checkedItems.has(`${p.id}-${lvl}-${i}`)).length;
        return `
          <details class="deliverable-group card mb-md" ${items.length <= 6 ? 'open' : ''}>
            <summary class="deliverable-summary">
              <div class="flex justify-between items-center w-full">
                <div class="flex items-center gap-sm">
                  <span class="process-id">${p.id}</span>
                  <strong>${p.name}</strong>
                  <span class="level-badge ${lvl}">${lvl[0].toUpperCase()}</span>
                </div>
                <span class="text-xs text-secondary">${pChecked}/${items.length}</span>
              </div>
            </summary>
            <div class="deliverable-items mt-md">
              ${items.map((item, i) => {
            const key = `${p.id}-${lvl}-${i}`;
            return `
                <label class="deliverable-check ${checkedItems.has(key) ? 'checked' : ''}">
                  <input type="checkbox" ${checkedItems.has(key) ? 'checked' : ''} data-key="${key}">
                  <span>${item}</span>
                </label>`;
        }).join('')}
            </div>
          </details>`;
    }).join('')}
      </div>
    `).join('')}
  `;

    const style = document.createElement('style');
    style.textContent = `
    .deliverable-group { padding: 0 !important; overflow: hidden; }
    .deliverable-summary { padding: 16px 20px; cursor: pointer; list-style: none; }
    .deliverable-summary::-webkit-details-marker { display: none; }
    .deliverable-summary::marker { display: none; }
    .deliverable-items { padding: 0 20px 16px; }
    .deliverable-check { display: flex; align-items: flex-start; gap: 10px; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s; font-size: 13px; color: var(--text-secondary); }
    .deliverable-check:hover { background: rgba(99,102,241,0.05); }
    .deliverable-check.checked span { text-decoration: line-through; opacity: 0.5; }
    .deliverable-check input { margin-top: 2px; accent-color: var(--accent-primary); }
  `;
    container.appendChild(style);

    // Level filter
    container.querySelector('#level-filter').addEventListener('change', (e) => {
        filterLevel = e.target.value;
        renderDeliverables(container);
    });

    // Checkbox handlers
    container.querySelectorAll('.deliverable-check input').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const key = e.target.dataset.key;
            if (e.target.checked) checkedItems.add(key); else checkedItems.delete(key);
            renderDeliverables(container);
        });
    });
}
