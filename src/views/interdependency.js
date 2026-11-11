/**
 * Interdependency View — Process dependency visualization & consistency rules
 */
import { CORE_PROCESSES, ACTIVE_CONSISTENCY_RULES, ACTIVE_PROPAGATION_RULES, DEPENDENCY_CHAINS, FRAMEWORK_META } from '../data/se-tailoring-data.js';
import { getState } from '../state.js';
import { previewDirectConsequences, getEffectivePropagationType, getEffectiveConsistencyType, checkConsistency } from '../utils/assessment-engine.js';
import { renderDependencyPreview } from '../utils/dependency-preview.js';

export function renderInterdependency(container) {
    const state = getState();
    const node = state.assessmentTree?.nodes?.[state.assessmentTree?.activeId];
    const isRoot = !node || node.id === state.assessmentTree?.rootId;
    const scores = node?.scores || (isRoot ? state.scores : {}) || {};
    const levels = node?.levels || (isRoot ? state.levels : {}) || {};
    const context = { assuranceObligations: node?.assuranceObligations || (isRoot ? state.assuranceObligations : []) || [] };
    const hasProfile = CORE_PROCESSES.every(process => ['basic', 'standard', 'comprehensive'].includes(levels[process.id]));
    const violations = hasProfile ? checkConsistency(levels, scores, context) : [];
    const processName = id => CORE_PROCESSES.find(p => p.id === id)?.name || `Process ${id}`;
    const processRefName = (ref) => {
        if (ref === 'any_technical') return 'Any Technical Process';
        if (ref === 'all_technical') return 'All Technical Processes';
        if (Array.isArray(ref)) return ref.map(processName).join(' or ');
        return processName(ref);
    };

    container.innerHTML = `
    <h2 class="mb-md">Process Interdependencies</h2><p class="text-secondary mb-lg">These are framework rules for keeping process recommendations consistent. They are proposed policy choices, not clauses of a standard. Hard constraints raise connected processes; warnings ask for your judgment. <a href="#help?topic=adapt">How to review or propose a rule change</a>.</p>

    <div class="tabs mb-xl">
      <button class="tab active" data-tab="rules">Consistency Rules</button>
      <button class="tab" data-tab="propagation">Propagation</button>
      <button class="tab" data-tab="chains">Dependency Chains</button>
      <button class="tab" data-tab="simulate">Direct Preview</button>
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
    .sim-select { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 20px; }
    .sim-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; max-width: 100%; }
    .sim-field .select { max-width: 100%; }
    .sim-result { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 14px; margin-top: 12px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .status-dot.ok { background: var(--accent-success); }
    .status-dot.violated { background: var(--accent-error); }
    .dependency-preview { display:grid; grid-template-columns:minmax(180px,.7fr) minmax(0,2fr); gap:32px; align-items:start; }
    .dependency-origin { padding:20px 0; border-top:3px solid var(--accent-primary); }
    .dependency-origin h3 { margin:8px 0 14px; font-size:20px; line-height:1.4; }
    .dependency-count { font-size:14px; margin-bottom:14px; color:var(--text-secondary); }
    .dependency-effects { list-style:none; padding:0 0 0 20px; margin:0; border-left:1px solid var(--border-medium); }
    .dependency-effect { position:relative; padding:18px 20px; border-bottom:1px solid var(--border-subtle); }
    .dependency-effect::before { content:''; position:absolute; top:28px; left:-21px; width:20px; border-top:1px solid var(--border-medium); }
    .dependency-effect-heading { display:flex; justify-content:space-between; gap:12px; align-items:start; margin-bottom:8px; flex-wrap:wrap; }
    .dependency-effect h4 { font-size:16px; line-height:1.5; }
    .dependency-effect h4 a { text-underline-offset:4px; }
    .dependency-effect p { line-height:1.65; }
    .dependency-levels { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); margin:16px 0 8px; gap:4px; }
    .dependency-level { border-top:4px solid var(--border-medium); padding:8px 3px 0; font-size:13px; color:var(--text-secondary); }
    .dependency-level small { display:block; min-height:1.6em; margin-top:3px; font-size:11px; }
    .dependency-level.is-current { border-top-style:dashed; color:var(--text-primary); }
    .dependency-level.is-target { border-top-color:var(--accent-primary); color:var(--accent-primary-light); font-weight:700; }
    .dependency-reason { margin-top:12px; }
    .dependency-next { display:inline-block; margin-top:16px; padding:8px 0; }
    .sim-select .btn { min-height:44px; }
    @media(prefers-reduced-motion:no-preference) { .dependency-outcomes { animation:dependency-reveal 200ms ease-out; } @keyframes dependency-reveal { from { opacity:.6; transform:translateY(5px); } to { opacity:1; transform:none; } } }
    @media(max-width:700px) { .dependency-preview { grid-template-columns:1fr; gap:16px; } .dependency-origin { padding:16px 0 4px; } .dependency-effects { padding-left:12px; } .dependency-effect { padding:16px 0 16px 12px; } .dependency-effect::before { left:-13px; width:12px; } .sim-field { width:100%; } }
  `;
    container.appendChild(style);

    function showTab(tab) {
        const content = container.querySelector('#tab-content');
        container.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

        if (tab === 'rules') {
            content.innerHTML = `
        <div class="mb-lg">
          <p class="text-secondary text-sm mb-md">${ACTIVE_CONSISTENCY_RULES.length} active consistency rules identify incoherent tailoring combinations. Hard Constraints (HC) must be satisfied; Warnings (WN) should be reviewed.</p>
        </div>
        ${ACTIVE_CONSISTENCY_RULES.map(r => {
                const triggerDesc = Array.isArray(r.trigger.process) ? r.trigger.process.map(processName).join(' or ') : r.trigger.process === 'any_technical' ? 'Any Technical Process' : processName(r.trigger.process);
                const violated = violations.some(v => v.ruleId === r.id);
                const effectiveType = getEffectiveConsistencyType(r, scores, context);
                return `
          <div class="rule-card" style="border-left: 3px solid ${effectiveType === 'HC' ? '#f87171' : '#fbbf24'}">
            <div class="flex justify-between items-center mb-sm">
              <div class="flex items-center gap-sm">
                <span class="rule-type ${effectiveType}">${effectiveType}${effectiveType !== r.type ? ' in this context' : ''}</span>
                <strong>Rule ${r.id}</strong>
                <span class="text-xs">${!hasProfile ? 'No full profile assessed' : violated ? 'Review required' : 'No current conflict'}</span>
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
          ${ACTIVE_PROPAGATION_RULES.map(r => {
              const effectiveType = getEffectivePropagationType(r, scores, context);
              return `
            <div class="prop-row">
              <span>${processRefName(r.source)} ≥ ${FRAMEWORK_META.levelLabels[r.sourceLevel]}</span>
              <span class="chain-arrow">→</span>
              <span>${processRefName(r.target)}</span>
              <span class="level-badge ${r.minLevel || r.maxLevel}">
                ${r.minLevel ? `≥ ${FRAMEWORK_META.levelLabels[r.minLevel]}` : `≤ ${FRAMEWORK_META.levelLabels[r.maxLevel]}`}
              </span>
              <span class="prop-type ${effectiveType}">${effectiveType} (direct)</span>
            </div>
          `}).join('')}
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
                const lvl = levels[pid];
                const color = lvl ? FRAMEWORK_META.levelColors[lvl] : 'var(--bg-tertiary)';
                return `${i > 0 ? '<span class="chain-arrow">→</span>' : ''}<span class="chain-node" style="background:${color}20;border:1px solid ${color}50;color:${lvl ? FRAMEWORK_META.levelColors[lvl] : 'var(--text-secondary)'}">${processName(pid)}${lvl ? ` (${lvl[0].toUpperCase()})` : ''}</span>`;
            }).join('')}
            </div>
          </div>
        `).join('')}
      `;
        } else if (tab === 'simulate') {
            content.innerHTML = `
        <p class="text-secondary text-sm mb-lg">Choose a process and proposed level to see directly affected processes only. The full assessment also follows further required dependencies and checks the whole profile. This preview does not change your assessment.</p>
        <div class="sim-select">
          <div class="sim-field">
            <label class="text-xs text-secondary" for="sim-process">Process</label>
            <select class="select" id="sim-process">
              <option value="">Select process...</option>
              ${CORE_PROCESSES.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
            </select>
          </div>
          <div class="sim-field">
            <label class="text-xs text-secondary" for="sim-level">Proposed level</label>
            <select class="select" id="sim-level">
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="comprehensive" selected>Comprehensive</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm" id="sim-run">Show direct effects</button>
        </div>
        <div id="sim-results" aria-live="polite" aria-atomic="true"><p class="text-sm text-secondary">Select a process to trace its direct effects. The three positions show tailoring levels, not numerical amounts.</p></div>
      `;
            content.querySelector('#sim-run').addEventListener('click', () => {
                const pid = parseInt(content.querySelector('#sim-process').value);
                const lvl = content.querySelector('#sim-level').value;
                if (!pid) {
                    content.querySelector('#sim-results').innerHTML = '<p class="sim-result">Choose a process, then select Show direct effects.</p>';
                    return;
                }
                const changes = previewDirectConsequences(pid, lvl, levels, scores, context);
                const results = content.querySelector('#sim-results');
                results.innerHTML = renderDependencyPreview({ processId: pid, proposedLevel: lvl, changes, levels });
            });
        }
    }

    container.querySelectorAll('.tab').forEach(t => {
        t.addEventListener('click', () => showTab(t.dataset.tab));
    });
    showTab('rules');
}
