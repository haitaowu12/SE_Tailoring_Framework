/**
 * Report View — Assessment summary & export
 */
import { CORE_PROCESSES, METRICS, DIMENSIONS, FRAMEWORK_META, PROCESS_GROUPS } from '../data/se-tailoring-data.js';
import { getDriverAttribution } from '../utils/assessment-engine.js';
import { generateReport, exportConfig } from '../utils/export-import.js';
import * as data from '../data/se-tailoring-data.js';
import { getState, showToast } from '../state.js';
import { navigateTo } from '../router.js';

export function renderReport(container) {
  const state = getState();
  if (!state.assessmentComplete) {
    container.innerHTML = `<div class="card text-center" style="padding:80px 40px"><h3>No Assessment Yet</h3><p class="text-secondary mt-md">Complete an assessment first to generate a report.</p><button class="btn btn-primary mt-lg" id="btn-go-assess">Start Assessment</button></div>`;
    container.querySelector('#btn-go-assess')?.addEventListener('click', () => navigateTo('assessment'));
    return;
  }

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
          <tr><td class="text-secondary">Phase</td><td>${state.projectInfo.phase || '—'}</td></tr>
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

    ${state.saTier ? `
    <div class="card mb-xl" style="border-left: 3px solid #ef4444; background: rgba(239,68,68,0.04);">
      <h4 class="mb-md">🔒 System Assurance Criticality</h4>
      <div class="flex items-center gap-lg">
        <div class="sa-tier-badge tier-${state.saTier.tier}" style="font-size: 24px; font-weight: 700; padding: 12px 24px; border-radius: 8px;">
          ${state.saTier.tier}
        </div>
        <div>
          <div class="font-bold">${state.saTier.name}</div>
          <div class="text-sm text-secondary">${state.saTier.description}</div>
          <div class="text-sm mt-sm"><strong>Minimum Rigor Floor:</strong> ${state.saTier.floor}</div>
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
      ${state.overrides.map(o => `<div class="text-sm mb-sm"><strong>${processName(o.processId)}</strong>: ${o.from} → ${o.to} — ${o.reason} (${o.condition})</div>`).join('')}
    </div>` : ''}

    ${state.violations.length > 0 ? `
    <div class="card mb-xl" style="border-left: 3px solid var(--accent-error)">
      <h4 class="mb-md">⚠ Consistency Warnings (${state.violations.length})</h4>
      ${state.violations.map(v => `<div class="text-sm mb-sm"><strong>[${v.type}] Rule ${v.ruleId}</strong>: ${v.label}</div>`).join('')}
    </div>` : ''}

    <div class="card mb-xl">
      <h4 class="mb-md">Process Levels & Drivers</h4>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Process</th><th>Derived</th><th>Final</th><th>Top Drivers</th></tr></thead>
          <tbody>
            ${CORE_PROCESSES.map(p => {
    const derived = state.derived[p.id] || 'basic';
    const final_ = state.levels[p.id] || 'basic';
    const drivers = getDriverAttribution(p.id, state.scores, state.matrixMap);
    const changed = derived !== final_;
    return `<tr>
                <td><span class="process-id">${p.id}</span> ${p.name}</td>
                <td><span class="level-badge ${derived}">${derived[0].toUpperCase()}</span></td>
                <td><span class="level-badge ${final_}">${final_[0].toUpperCase()}</span>${changed ? ' ⬆' : ''}</td>
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
