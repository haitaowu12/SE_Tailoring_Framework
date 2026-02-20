/**
 * Process Explorer View — Searchable/filterable process detail browser
 */
import { CORE_PROCESSES, PROCESS_GROUPS, FRAMEWORK_META, METRIC_PROCESS_MAP, METRICS } from '../data/se-tailoring-data.js';
import { PROCESS_DETAILS } from '../data/process-details.js';
import { getState } from '../state.js';

let activeProcess = null;
let activeLevel = 'basic';
let filterGroup = 'all';
let searchQuery = '';

export function renderProcessExplorer(container) {
  const state = getState();
  const matrixMap = state.matrixMap || METRIC_PROCESS_MAP;
  const filtered = CORE_PROCESSES.filter(p => {
    if (filterGroup !== 'all' && p.group !== filterGroup) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  container.innerHTML = `
    <h2 class="mb-lg">🔍 Process Explorer</h2>
    <div class="explorer-controls mb-lg">
      <input class="input" id="process-search" placeholder="Search processes..." value="${searchQuery}" style="max-width:300px">
      <div class="tabs" id="group-tabs">
        <button class="tab ${filterGroup === 'all' ? 'active' : ''}" data-group="all">All (${CORE_PROCESSES.length})</button>
        <button class="tab ${filterGroup === 'tech_mgmt' ? 'active' : ''}" data-group="tech_mgmt">Tech Management</button>
        <button class="tab ${filterGroup === 'technical' ? 'active' : ''}" data-group="technical">Technical</button>
      </div>
    </div>
    <div class="explorer-layout">
      <div class="process-list-panel">
        ${filtered.map(p => {
    const level = state.levels[p.id];
    return `
          <div class="process-list-card ${activeProcess === p.id ? 'selected' : ''} hover-lift" data-pid="${p.id}">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-sm">
                <span class="process-id">${p.id}</span>
                <span class="font-bold">${p.name}</span>
              </div>
              ${level ? `<span class="level-badge ${level}">${level[0].toUpperCase()}</span>` : ''}
            </div>
            <div class="text-xs text-secondary mt-sm">${p.purpose}</div>
          </div>`;
  }).join('')}
      </div>
      <div class="process-detail-panel" id="process-detail">
        ${activeProcess ? renderProcessDetail(activeProcess, state) : '<div class="empty-state"><p class="text-secondary">← Select a process to view details</p></div>'}
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .explorer-controls { display: flex; flex-direction: column; gap: 12px; }
    .explorer-layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; }
    .process-list-panel { display: flex; flex-direction: column; gap: 8px; max-height: calc(100vh - 240px); overflow-y: auto; padding-right: 8px; }
    .process-list-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 14px; cursor: pointer; transition: all 0.2s; }
    .process-list-card.selected { border-color: var(--accent-primary); background: rgba(99,102,241,0.08); }
    .process-list-card:hover { border-color: var(--border-medium); }
    .process-detail-panel { min-height: 500px; }
    .empty-state { display: flex; align-items: center; justify-content: center; min-height: 400px; }
    .detail-section { margin-bottom: 24px; }
    .detail-section h4 { margin-bottom: 12px; color: var(--accent-primary-light); }
    .level-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
    .level-tab { padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-subtle); background: none; color: var(--text-secondary); transition: all 0.2s; }
    .level-tab.active-basic { background: var(--level-basic-bg); color: var(--level-basic); border-color: var(--level-basic-border); }
    .level-tab.active-standard { background: var(--level-standard-bg); color: var(--level-standard); border-color: var(--level-standard-border); }
    .level-tab.active-comprehensive { background: var(--level-comprehensive-bg); color: var(--level-comprehensive); border-color: var(--level-comprehensive-border); }
    .activity-item { padding: 6px 0; font-size: 13px; color: var(--text-secondary); border-bottom: 1px solid rgba(99,102,241,0.06); }
    .activity-item.essential { color: var(--text-primary); font-weight: 500; }
    .deliverable-item { padding: 6px 0; font-size: 13px; color: var(--text-secondary); border-bottom: 1px solid rgba(99,102,241,0.06); display: flex; gap: 6px; align-items: flex-start; }
    .output-item { background: rgba(34,211,238,0.06); border-radius: 8px; padding: 10px; margin-bottom: 8px; font-size: 13px; }
    .metric-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; margin: 3px; }
    .metric-tag.P { background: rgba(99,102,241,0.2); color: var(--accent-primary-light); }
    .metric-tag.S { background: rgba(148,163,184,0.12); color: var(--text-secondary); }
    @media (max-width: 900px) { .explorer-layout { grid-template-columns: 1fr; } .process-list-panel { max-height: 300px; } }
  `;
  container.appendChild(style);

  // Event handlers
  container.querySelector('#process-search').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderProcessExplorer(container);
  });
  container.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => { filterGroup = tab.dataset.group; renderProcessExplorer(container); });
  });
  container.querySelectorAll('.process-list-card').forEach(card => {
    card.addEventListener('click', () => {
      activeProcess = parseInt(card.dataset.pid);
      activeLevel = 'basic';
      renderProcessExplorer(container);
    });
  });
}

function renderProcessDetail(processId, state) {
  const p = CORE_PROCESSES.find(x => x.id === processId);
  if (!p) return '';
  const details = PROCESS_DETAILS[processId];
  const matrixMap = state.matrixMap || METRIC_PROCESS_MAP;
  const map = matrixMap[processId] || {};
  const level = state.levels[processId];

  const activities = details?.activities?.[activeLevel] || [];
  const deliverables = details?.deliverables?.[activeLevel] || [];
  const outputs = details?.outputs || [];

  return `
    <div class="card animate-fade-in">
      <div class="flex justify-between items-center mb-lg">
        <div>
          <h3>${p.name}</h3>
          <p class="text-sm text-secondary mt-sm">${p.purpose}</p>
        </div>
        ${level ? `<span class="level-badge ${level}">${FRAMEWORK_META.levelLabels[level]}</span>` : ''}
      </div>

      ${p.definition ? `
      <div class="detail-section">
        <h4>Definition at ${FRAMEWORK_META.levelLabels[activeLevel]}</h4>
        <p class="text-sm text-secondary">${p.definition[activeLevel] || '—'}</p>
      </div>` : ''}

      <div class="level-tabs">
        ${['basic', 'standard', 'comprehensive'].map(l => `
          <button class="level-tab ${activeLevel === l ? 'active-' + l : ''}" data-level="${l}" onclick="document.dispatchEvent(new CustomEvent('setLevel',{detail:'${l}'}))">${FRAMEWORK_META.levelLabels[l]}</button>
        `).join('')}
      </div>

      <div class="detail-section">
        <h4>Activities (${activities.length}) <span class="text-xs text-secondary font-normal ml-sm">(⭐ = Essential core activity)</span></h4>
        ${activities.map(a => `<div class="activity-item ${a.startsWith('(*)') ? 'essential' : ''}">${a.startsWith('(*)') ? '⭐ ' + a.slice(4) : '• ' + a}</div>`).join('')}
      </div>

      <div class="detail-section">
        <h4>Deliverables (${deliverables.length})</h4>
        ${deliverables.map(d => `<div class="deliverable-item">📄 ${d}</div>`).join('')}
      </div>

      <div class="detail-section">
        <h4>Outputs & Feeds Into</h4>
        ${outputs.map(o => `<div class="output-item"><strong>${o.name}</strong> → ${o.feedsInto}</div>`).join('')}
      </div>

      <div class="detail-section">
        <h4>Metric Applicability</h4>
        <div class="flex" style="flex-wrap:wrap">
          ${Object.entries(map).map(([mid, role]) => {
    const m = METRICS.find(x => x.id === mid);
    return `<span class="metric-tag ${role}">${role} ${mid}: ${m?.name || mid}</span>`;
  }).join('')}
        </div>
      </div>

      ${p.whenToElevate ? `
      <div class="detail-section">
        <h4>When to Elevate</h4>
        <p class="text-sm text-secondary">${p.whenToElevate}</p>
      </div>` : ''}
    </div>
  `;
}

// Listen for level tab changes
document.addEventListener('setLevel', (e) => {
  activeLevel = e.detail;
  const panel = document.getElementById('process-detail');
  if (panel && activeProcess) {
    panel.innerHTML = renderProcessDetail(activeProcess, getState());
  }
});
