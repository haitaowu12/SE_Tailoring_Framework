/**
 * Report View — Assessment summary & export
 */
import { CORE_PROCESSES, METRICS, DIMENSIONS, FRAMEWORK_META, PROCESS_GROUPS, OVERRIDE_CONDITIONS, PROPAGATION_RULES } from '../data/se-tailoring-data.js';
import { getDriverAttribution, runFullAssessment } from '../utils/assessment-engine.js';
import { generateReport, exportConfig } from '../utils/export-import.js';
import * as data from '../data/se-tailoring-data.js';
import { getState, showToast, getElementsFlat } from '../state.js';
import { navigateTo } from '../router.js';

export function renderReport(container) {
  const state = getState();
  if (!state.assessmentComplete) {
    container.innerHTML = `<div class="card text-center" style="padding:80px 40px"><h3>No Assessment Yet</h3><p class="text-secondary mt-md">Complete an assessment first to generate a report.</p><button class="btn btn-primary mt-lg" id="btn-go-assess">Start Assessment</button></div>`;
    container.querySelector('#btn-go-assess')?.addEventListener('click', () => navigateTo('assessment'));
    return;
  }

  const elements = getElementsFlat();
  const tree = state.assessmentTree;

  const basicCount = Object.values(state.levels).filter(l => l === 'basic').length;
  const stdCount = Object.values(state.levels).filter(l => l === 'standard').length;
  const compCount = Object.values(state.levels).filter(l => l === 'comprehensive').length;

  // Dimension averages
  const dimAvgs = DIMENSIONS.map(d => {
    const mets = METRICS.filter(m => m.dimension === d.id);
    const avg = mets.reduce((s, m) => s + (state.scores[m.id] || 1), 0) / mets.length;
    return { ...d, avg: avg.toFixed(1) };
  });

  const processName = id => CORE_PROCESSES.find(p => p.id === id)?.name || `Process ${id}`;
  const processRefName = (ref) => {
    if (ref === 'any_technical') return 'Any Technical Process';
    if (ref === 'all_technical') return 'All Technical Processes';
    if (Array.isArray(ref)) return ref.map(processName).join(', ');
    return processName(ref);
  };

  container.innerHTML = `
    <div class="flex justify-between items-center mb-lg">
      <div>
        <h2>📄 Tailoring Report</h2>
        <p class="text-secondary text-sm mt-sm">${state.projectInfo.name || 'Project'} · ${state.projectInfo.date || new Date().toLocaleDateString()}</p>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-secondary btn-sm" id="btn-export-json">📥 Export JSON</button>
        <button class="btn btn-primary btn-sm" id="btn-export-html">📄 Export HTML Report</button>
      </div>
    </div>

    <div class="grid-2 mb-xl">
      <div class="card">
        <h4 class="mb-md">Project Details</h4>
        <table class="data-table">
          <tr><td class="text-secondary">Name</td><td>${state.projectInfo.name || '—'}</td></tr>
          <tr><td class="text-secondary">Date</td><td>${state.projectInfo.date || '—'}</td></tr>
          <tr><td class="text-secondary">Team</td><td>${state.projectInfo.team || '—'}</td></tr>
          <tr><td class="text-secondary">Phase</td><td>${state.projectInfo.phase || 'N/A'}</td></tr>
        </table>
      </div>
      <div class="card">
        <h4 class="mb-md">Level Distribution</h4>
        <div class="level-bar-chart">
          <div class="level-bar">
            <div class="level-bar-fill basic-bar" style="width: ${basicCount / CORE_PROCESSES.length * 100}%"></div>
            <span>${basicCount} Basic</span>
          </div>
          <div class="level-bar">
            <div class="level-bar-fill standard-bar" style="width: ${stdCount / CORE_PROCESSES.length * 100}%"></div>
            <span>${stdCount} Standard</span>
          </div>
          <div class="level-bar">
            <div class="level-bar-fill comp-bar" style="width: ${compCount / CORE_PROCESSES.length * 100}%"></div>
            <span>${compCount} Comprehensive</span>
          </div>
        </div>
      </div>
    </div>

    ${elements.length > 1 ? `
    <div class="card mb-xl">
      <h4 class="mb-md">🏗️ System Element Tailoring Overview</h4>
      <p class="text-xs text-secondary mb-md">Hierarchical breakdown of system elements and their targeted tailoring assessments.</p>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Element</th>
              <th>Assessment Type</th>
              <th>Status</th>
              <th>Process Levels (B / S / C)</th>
            </tr>
          </thead>
          <tbody>
            ${elements.map(e => {
              const bCount = Object.values(e.levels || {}).filter(l => l === 'basic').length;
              const sCount = Object.values(e.levels || {}).filter(l => l === 'standard').length;
              const cCount = Object.values(e.levels || {}).filter(l => l === 'comprehensive').length;
              const hasResult = e.assessmentResult != null;
              const indent = e.depth * 20;
              const icon = e.childIds?.length > 0 ? '📂' : '📄';
              
              const levelsBadgeHtml = hasResult 
                ? '<div class="se-level-counts text-xs" style="display: flex; gap: 4px;">' +
                  '<span class="level-badge basic" title="Basic Processes" style="padding: 2px 6px;">' + bCount + ' B</span>' +
                  '<span class="level-badge standard" title="Standard Processes" style="padding: 2px 6px;">' + sCount + ' S</span>' +
                  '<span class="level-badge comprehensive" title="Comprehensive Processes" style="padding: 2px 6px;">' + cCount + ' C</span>' +
                  '</div>' 
                : '<span class="text-tertiary text-xs">Not assessed</span>';

              return `
                <tr>
                  <td style="padding-left: ${indent + 12}px">
                    <span style="opacity:0.7; font-size:12px; margin-right:4px;">${icon}</span>
                    <strong style="${e.id === tree.rootId ? 'color: var(--accent-primary-light);' : ''}">${e.name}</strong>
                  </td>
                  <td><span class="se-type-badge ${e.assessmentType}">${e.assessmentType}</span></td>
                  <td><span class="se-status-badge ${e.status}">${e.status}</span></td>
                  <td>${levelsBadgeHtml}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}

    <div class="card mb-xl" style="border-left: 3px solid ${state.rightSizingActions?.length > 0 ? '#6366f1' : '#34d399'};">
      <h4 class="mb-md">📐 Right-Sizing Analysis</h4>
      <div class="grid-3 mb-md">
        <div style="text-align: center; padding: 12px;">
          <div style="font-size: 28px; font-weight: 900; color: #6366f1;">${state.indices?.psi || '—'}</div>
          <div class="text-xs text-secondary">PSI (Project Scale)</div>
          <div class="text-xs" style="color: #888;">${(state.indices?.psi || 3) <= 2 ? 'Small' : (state.indices?.psi || 3) <= 3 ? 'Medium' : 'Large/Mega'}</div>
        </div>
        <div style="text-align: center; padding: 12px;">
          <div style="font-size: 28px; font-weight: 900; color: #f59e0b;">${state.indices?.csi || '—'}</div>
          <div class="text-xs text-secondary">CSI (Constraint Stress)</div>
          <div class="text-xs" style="color: #888;">${(state.indices?.csi || 3) >= 4 ? 'High Pressure' : (state.indices?.csi || 3) >= 3 ? 'Moderate' : 'Low'}</div>
        </div>
        <div style="text-align: center; padding: 12px;">
          <div style="font-size: 28px; font-weight: 900; color: #22d3ee;">${state.indices?.cri || '—'}</div>
          <div class="text-xs text-secondary">CRI (Capability)</div>
          <div class="text-xs" style="color: #888;">${(state.indices?.cri || 2) <= 1 ? 'Resistant' : (state.indices?.cri || 2) <= 2 ? 'Tolerant' : 'Supportive'}</div>
        </div>
      </div>
      <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
        <strong>Level Distribution:</strong> ${basicCount} Basic · ${stdCount} Standard · ${compCount} Comprehensive (${Math.round(compCount / CORE_PROCESSES.length * 100)}% Comprehensive)
      </div>
      ${state.rightSizingActions?.length > 0 ? `
      <div style="background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.25); border-radius: 8px; padding: 12px; margin-top: 8px;">
        <div style="font-weight: 700; color: #6366f1; font-size: 13px; margin-bottom: 6px;">📐 ${state.rightSizingActions.length} Right-Sizing Adjustments Applied</div>
        ${state.rightSizingActions.map(a => `<div class="text-sm mb-sm">• <strong>${processName(a.processId)}</strong>: ${a.from} → ${a.to} <span class="text-xs text-secondary">(${a.reason})</span></div>`).join('')}
      </div>` : `
      <div class="text-sm" style="color: #34d399;">✓ Profile is within right-sizing bounds. No adjustments needed.</div>`}
    </div>

    ${state.saTier ? `
    <div class="card mb-xl" style="border-left: 3px solid #ef4444; background: rgba(239,68,68,0.04);">
      <h4 class="mb-md">🔒 Safety Assurance Criticality</h4>
      <div class="flex items-center gap-lg">
        <div class="sa-tier-badge tier-${state.saTier.tier}" style="font-size: 24px; font-weight: 700; padding: 12px 24px; border-radius: 8px;">
          ${state.saTier.tier}
        </div>
        <div>
          <div class="font-bold">${state.saTier.name}</div>
          <div class="text-sm text-secondary">${state.saTier.description}</div>
          <div class="text-sm mt-sm"><strong>Minimum Rigor Floor:</strong> ${state.saTier.floor || 'None'}</div>
        </div>
      </div>
    </div>` : ''}

    <div class="card mb-xl">
      <h4 class="mb-md">Dimension Scores</h4>
      <div class="grid-4">
        ${dimAvgs.map(d => `
          <div class="dim-score-card" style="border-top: 3px solid ${d.color}">
            <div class="dim-score-value" style="color: ${d.color}">${d.avg}</div>
            <div class="dim-score-label">${d.name}</div>
          </div>
        `).join('')}
      </div>
    </div>

    ${state.overrides.length > 0 ? `
    <div class="card mb-xl" style="border-left: 3px solid var(--accent-warning)">
      <h4 class="mb-md">⚠️ Override Conditions (${state.overrides.length})</h4>
      ${state.overrides.map(o => `<div class="text-sm mb-sm"><strong>${processName(o.processId)}</strong>: ${o.from} → ${o.to} — ${o.reason}${o.condition ? ` (${o.condition})` : ''}</div>`).join('')}
    </div>` : ''}

    ${state.violations.length > 0 ? `
    <div class="card mb-xl" style="border-left: 3px solid var(--accent-error)">
      <h4 class="mb-md">⚠ Consistency Warnings (${state.violations.length})</h4>
      ${state.violations.map(v => `<div class="text-sm mb-sm"><strong>[${v.type}] Rule ${v.ruleId}</strong>: ${v.label}</div>`).join('')}
    </div>` : ''}

    <div class="card mb-xl">
      <h4 class="mb-md">📋 Full Process Tailoring Profile</h4>
      <p class="text-xs text-secondary mb-md">Complete tailoring profile showing derived levels, overrides, and final assignments for all core processes.</p>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Process</th>
              <th>Group</th>
              <th>Derived</th>
              <th>Override</th>
              <th>Fix</th>
              <th>Final</th>
            </tr>
          </thead>
          <tbody>
            ${CORE_PROCESSES.map(p => {
    const derived = state.derived[p.id] || 'basic';
    const final_ = state.levels[p.id] || 'basic';
    const override = state.overrides?.find(o => o.processId === p.id);
    const fix = state.fixes?.find(f => f.processId === p.id);
    const groupInfo = PROCESS_GROUPS[p.group.toUpperCase()];
    return `<tr>
                <td><span class="process-id">${p.id}</span></td>
                <td>${p.name}</td>
                <td style="color:${groupInfo?.color || 'inherit'}">${groupInfo?.name || p.group}</td>
                <td><span class="level-badge ${derived}">${derived[0].toUpperCase()}</span></td>
                <td>${override ? `<span style="color:var(--accent-warning); font-size:11px;">${override.from}→${override.to}</span>` : '<span class="text-tertiary">—</span>'}</td>
                <td>${fix ? `<span style="color:var(--accent-success); font-size:11px;">${fix.from}→${fix.to}</span>` : '<span class="text-tertiary">—</span>'}</td>
                <td><span class="level-badge ${final_}" style="font-weight:700;">${final_[0].toUpperCase()}</span></td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    ${state.overrides.length > 0 ? `
    <div class="card mb-xl" style="border-left: 3px solid var(--accent-warning)">
      <h4 class="mb-md">🔗 Override Chain Documentation</h4>
      <p class="text-xs text-secondary mb-md">Traceability from metric thresholds to process level floors.</p>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Override Condition</th>
              <th>Trigger</th>
              <th>Affected Process</th>
              <th>Change</th>
              <th>Source Standard</th>
            </tr>
          </thead>
          <tbody>
            ${state.overrides.map(o => {
    const overrideDef = OVERRIDE_CONDITIONS.find(oc => oc.id === o.overrideId || oc.label === o.reason);
    const triggerText = o.condition || overrideDef?.condition || '—';
    return `<tr>
                <td><strong>${o.reason}</strong></td>
                <td><code style="font-size:11px; background:var(--bg-tertiary); padding:2px 6px; border-radius:4px;">${triggerText}</code></td>
                <td>${processName(o.processId)}</td>
                <td><span class="level-badge ${o.from}" style="opacity:0.6;">${o.from[0].toUpperCase()}</span> → <span class="level-badge ${o.to}">${o.to[0].toUpperCase()}</span></td>
                <td class="text-xs text-secondary">${overrideDef?.source || '—'}</td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}

    ${(state.fixes?.length > 0 || state.violations?.length > 0) ? `
    <div class="card mb-xl" style="border-left: 3px solid var(--accent-info)">
      <h4 class="mb-md">⚡ Propagation Chain Documentation</h4>
      <p class="text-xs text-secondary mb-md">Consistency rule enforcement showing how process dependencies were resolved.</p>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Type</th>
              <th>Trigger Process</th>
              <th>Required Process</th>
              <th>Action</th>
              <th>Rationale</th>
            </tr>
          </thead>
          <tbody>
            ${state.fixes?.map(f => {
    const rule = data.CONSISTENCY_RULES?.find(r => r.label?.includes(f.reason) || r.id === f.ruleId);
    return `<tr style="background: rgba(52,211,153,0.05);">
                <td><strong>Rule ${rule?.id || '—'}</strong></td>
                <td><span style="background: rgba(239,68,68,0.15); color:#ef4444; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:600;">HC</span></td>
                <td>${rule?.trigger?.process ? processRefName(rule.trigger.process) : '—'}</td>
                <td>${processName(f.processId)}</td>
                <td><span class="level-badge ${f.from}" style="opacity:0.6;">${f.from[0].toUpperCase()}</span> → <span class="level-badge ${f.to}">${f.to[0].toUpperCase()}</span></td>
                <td class="text-xs text-secondary">${rule?.rationale?.substring(0, 80) || '—'}...</td>
              </tr>`;
  }).join('') || ''}
            ${state.violations?.filter(v => v.type === 'WN').map(v => {
    const rule = data.CONSISTENCY_RULES?.find(r => r.id === v.ruleId);
    return `<tr style="background: rgba(251,191,36,0.05);">
                <td><strong>Rule ${v.ruleId}</strong></td>
                <td><span style="background: rgba(251,191,36,0.15); color:#f59e0b; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:600;">WN</span></td>
                <td>${rule?.trigger?.process ? processRefName(rule.trigger.process) : '—'}</td>
                <td>${processName(v.affectedProcess)}</td>
                <td><span style="color:var(--accent-warning); font-size:11px;">Review recommended</span></td>
                <td class="text-xs text-secondary">${v.rationale?.substring(0, 80) || v.label}...</td>
              </tr>`;
  }).join('') || ''}
          </tbody>
        </table>
      </div>
    </div>` : ''}

    <div class="card mb-xl">
      <h4 class="mb-md">Process Levels & Drivers</h4>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Process</th><th>Derived</th><th>Final</th><th>Trigger Metric(s)</th><th>Conditional Cap</th><th>Weighted Ref (Advisory)</th><th>Top Drivers</th></tr></thead>
          <tbody>
            ${CORE_PROCESSES.map(p => {
    const derived = state.derived[p.id] || 'basic';
    const final_ = state.levels[p.id] || 'basic';
    const detail = state.derivationDetails?.[p.id] || {};
    const triggerMetrics = Array.isArray(detail.triggerMetrics) && detail.triggerMetrics.length
      ? detail.triggerMetrics.join(', ')
      : '—';
    const weightedRef = typeof detail.weightedReferenceScore === 'number'
      ? `${detail.weightedReferenceScore} (${detail.weightedReferenceLevel || '—'})`
      : '—';
    const drivers = getDriverAttribution(p.id, state.scores, state.matrixMap);
    const changed = derived !== final_;
    return `<tr>
                <td><span class="process-id">${p.id}</span> ${p.name}</td>
                <td><span class="level-badge ${derived}">${derived[0].toUpperCase()}</span></td>
                <td><span class="level-badge ${final_}">${final_[0].toUpperCase()}</span>${changed ? ' ⬆' : ''}</td>
                <td class="text-xs">${triggerMetrics}${detail.triggerScore ? ` (score ${detail.triggerScore})` : ''}</td>
                <td class="text-xs text-secondary">${detail.conditionalRuleApplied ? `${detail.triggerLevel} → ${detail.level}` : 'No'}</td>
                <td class="text-xs text-secondary">${weightedRef}</td>
                <td class="text-xs text-secondary">${drivers.slice(0, 3).map(d => `${d.metric}=${d.value}(${d.role})`).join(', ')}</td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card mb-xl">
      <h4 class="mb-md">Metric Scores Detail</h4>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Metric</th><th>Dimension</th><th>Score</th><th>Description</th></tr></thead>
          <tbody>
            ${METRICS.map(m => {
    const s = state.scores[m.id] || '—';
    const dim = DIMENSIONS.find(d => d.id === m.dimension);
    return `<tr>
                <td><strong>${m.id}</strong> ${m.name}</td>
                <td style="color:${dim.color}">${dim.name}</td>
                <td><strong>${s}</strong></td>
                <td class="text-xs text-secondary">${m.anchors[s] || ''}</td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .level-bar-chart { display: flex; flex-direction: column; gap: 10px; }
    .level-bar { position: relative; height: 28px; background: var(--bg-tertiary); border-radius: 6px; overflow: hidden; display: flex; align-items: center; }
    .level-bar span { position: relative; z-index: 1; padding-left: 10px; font-size: 12px; font-weight: 600; }
    .level-bar-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 6px; transition: width 0.5s ease; }
    .basic-bar { background: rgba(59,130,246,0.3); }
    .standard-bar { background: rgba(245,158,11,0.3); }
    .comp-bar { background: rgba(239,68,68,0.3); }
    .dim-score-card { text-align: center; padding: 16px; }
    .dim-score-value { font-size: 2rem; font-weight: 900; }
    .dim-score-label { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
    .se-type-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
    .se-type-badge.full { background: rgba(99,102,241,0.15); color: var(--accent-primary-light); }
    .se-type-badge.quick { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .se-type-badge.inherited { background: rgba(52,211,153,0.15); color: #34d399; }
    .se-status-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
    .se-status-badge.draft { background: rgba(148,163,184,0.15); color: var(--text-secondary); }
    .se-status-badge.under_review { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .se-status-badge.approved { background: rgba(52,211,153,0.15); color: #34d399; }
  `;
  container.appendChild(style);

  // Export handlers
  container.querySelector('#btn-export-json').addEventListener('click', () => {
    exportConfig(state);
    showToast('JSON configuration exported!', 'success');
  });
  container.querySelector('#btn-export-html').addEventListener('click', () => {
    generateReport(state, data);
    showToast('HTML report downloaded!', 'success');
  });
}
