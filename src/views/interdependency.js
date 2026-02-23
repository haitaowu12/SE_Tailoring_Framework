/**
 * Interdependency View — Process dependency visualization & consistency rules
 */
import { CORE_PROCESSES, CONSISTENCY_RULES, PROPAGATION_RULES, DEPENDENCY_CHAINS, FRAMEWORK_META } from '../data/se-tailoring-data.js';
import { getState } from '../state.js';
import { simulatePropagation } from '../utils/assessment-engine.js';

export function renderInterdependency(container) {
    const state = getState();
    const processName = id => CORE_PROCESSES.find(p => p.id === id)?.name || `Process ${id}`;

    container.innerHTML = `
    <h2 class="mb-lg">🔗 Process Interdependencies</h2>

    <div class="tabs mb-xl">
      <button class="tab active" data-tab="rules">Consistency Rules</button>
      <button class="tab" data-tab="propagation">Propagation</button>
      <button class="tab" data-tab="chains">Dependency Chains</button>
      <button class="tab" data-tab="simulate">Simulate</button>
    </div>

    <div id="tab-content"></div>
  `;

    const style = document.createElement('style');
    style.textContent = `
    .rule-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 18px; margin-bottom: 12px; transition: all 0.2s; }
    .rule-card:hover { border-color: var(--border-medium); }
    .rule-type { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
    .rule-type.HC { background: rgba(239,68,68,0.15); color: #f87171; }
    .rule-type.WN { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .chain-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 20px; margin-bottom: 14px; }
    .chain-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 12px 0; }
    .chain-node { padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; }
    .chain-arrow { color: var(--accent-primary); font-size: 18px; }
    .prop-row { display: grid; grid-template-columns: 1fr auto 1fr auto auto; gap: 12px; align-items: center; padding: 10px; border-bottom: 1px solid var(--border-subtle); font-size: 13px; }
    .prop-type { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .prop-type.mandatory { background: rgba(239,68,68,0.12); color: #f87171; }
    .prop-type.recommended { background: rgba(34,211,238,0.12); color: #22d3ee; }
    .sim-select { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 20px; }
    .sim-result { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 14px; margin-top: 12px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .status-dot.ok { background: var(--accent-success); }
    .status-dot.violated { background: var(--accent-error); }
  `;
    container.appendChild(style);

    function showTab(tab) {
        const content = container.querySelector('#tab-content');
        container.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

        if (tab === 'rules') {
            content.innerHTML = `
        <div class="mb-lg">
          <p class="text-secondary text-sm mb-md">${CONSISTENCY_RULES.length} consistency rules prevent logically inconsistent tailoring combinations. Hard Constraints (HC) must be satisfied; Warnings (WN) should be reviewed.</p>
        </div>
        ${CONSISTENCY_RULES.map(r => {
                const triggerDesc = Array.isArray(r.trigger.process) ? r.trigger.process.map(processName).join(' or ') : r.trigger.process === 'any_technical' ? 'Any Technical Process' : processName(r.trigger.process);
                const violated = state.violations?.some(v => v.ruleId === r.id);
                return `
          <div class="rule-card" style="border-left: 3px solid ${r.type === 'HC' ? '#f87171' : '#fbbf24'}">
            <div class="flex justify-between items-center mb-sm">
              <div class="flex items-center gap-sm">
                <span class="rule-type ${r.type}">${r.type}</span>
                <strong>Rule ${r.id}</strong>
                ${violated ? '<span class="status-dot violated" title="Currently violated"></span>' : '<span class="status-dot ok" title="Satisfied"></span>'}
              </div>
            </div>
            <p class="text-sm font-bold mb-sm">${r.label}</p>
            <p class="text-xs text-secondary">${r.rationale}</p>
          </div>`;
            }).join('')}
      `;
        } else if (tab === 'propagation') {
            content.innerHTML = `
        <p class="text-secondary text-sm mb-lg">When a process level is elevated, dependent processes may need adjustment.</p>
        <div class="card" style="overflow-x:auto">
          <div class="prop-row" style="font-weight:700;color:var(--text-secondary);font-size:11px;text-transform:uppercase">
            <span>Source Process</span><span>→</span><span>Target Process</span><span>Min Level</span><span>Type</span>
          </div>
          ${PROPAGATION_RULES.filter(r => r.target !== 'all_technical').map(r => `
            <div class="prop-row">
              <span>${processName(r.source)} ≥ ${FRAMEWORK_META.levelLabels[r.sourceLevel]}</span>
              <span class="chain-arrow">→</span>
              <span>${processName(r.target)}</span>
              <span class="level-badge ${r.minLevel}">${FRAMEWORK_META.levelLabels[r.minLevel]}</span>
              <span class="prop-type ${r.type}">${r.type} (d${r.depth})</span>
            </div>
          `).join('')}
        </div>
      `;
        } else if (tab === 'chains') {
            content.innerHTML = `
        <p class="text-secondary text-sm mb-lg">Common dependency chains that should be considered together.</p>
        ${DEPENDENCY_CHAINS.map(c => `
          <div class="chain-card">
            <h4 class="mb-sm">${c.name}</h4>
            <p class="text-xs text-secondary mb-md">${c.description}</p>
            <div class="chain-flow">
              ${c.processes.map((pid, i) => {
                const lvl = state.levels[pid];
                const color = lvl ? FRAMEWORK_META.levelColors[lvl] : 'var(--bg-tertiary)';
                return `${i > 0 ? '<span class="chain-arrow">→</span>' : ''}<span class="chain-node" style="background:${color}20;border:1px solid ${color}50;color:${lvl ? FRAMEWORK_META.levelColors[lvl] : 'var(--text-secondary)'}">${processName(pid)}${lvl ? ` (${lvl[0].toUpperCase()})` : ''}</span>`;
            }).join('')}
            </div>
          </div>
        `).join('')}
      `;
        } else if (tab === 'simulate') {
            content.innerHTML = `
        <p class="text-secondary text-sm mb-lg">Select a process and new level to see propagation effects.</p>
        <div class="sim-select">
          <select class="select" id="sim-process">
            <option value="">Select process...</option>
            ${CORE_PROCESSES.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
          <select class="select" id="sim-level">
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="comprehensive" selected>Comprehensive</option>
          </select>
          <button class="btn btn-primary btn-sm" id="sim-run">Simulate</button>
        </div>
        <div id="sim-results"></div>
      `;
            content.querySelector('#sim-run').addEventListener('click', () => {
                const pid = parseInt(content.querySelector('#sim-process').value);
                const lvl = content.querySelector('#sim-level').value;
                if (!pid) return;
                const changes = simulatePropagation(pid, lvl, state.levels || {});
                const results = content.querySelector('#sim-results');
                if (changes.length === 0) {
                    results.innerHTML = '<div class="sim-result text-sm text-secondary">No propagation needed — all dependent processes already meet minimum levels.</div>';
                } else {
                    results.innerHTML = changes.map(c => `
            <div class="sim-result">
              <div class="flex justify-between items-center">
                <strong>${processName(c.processId)}</strong>
                <span class="prop-type ${c.type}">${c.type}</span>
              </div>
              <div class="text-sm text-secondary mt-sm">${c.from} → <span class="level-badge ${c.to}">${FRAMEWORK_META.levelLabels[c.to]}</span> (depth: ${c.depth})</div>
            </div>
          `).join('');
                }
            });
        }
    }

    container.querySelectorAll('.tab').forEach(t => {
        t.addEventListener('click', () => showTab(t.dataset.tab));
    });
    showTab('rules');
}
