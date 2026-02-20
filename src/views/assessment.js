/**
 * Assessment View — Step-by-step metric scoring wizard
 */
import { METRICS, DIMENSIONS, CORE_PROCESSES, FRAMEWORK_META, PROCESS_GROUPS, METRIC_PROCESS_MAP } from '../data/se-tailoring-data.js';
import { runFullAssessment, getDriverAttribution, calculateSATier } from '../utils/assessment-engine.js';
import { getState, setState, showToast } from '../state.js';
import { navigateTo } from '../router.js';

const STEPS = [
  { id: 'info', title: 'Project Info', icon: '📋' },
  { id: 'complexity', title: 'System Complexity', icon: '🔧' },
  { id: 'safety', title: 'Safety & Criticality', icon: '🛡️' },
  { id: 'constraints', title: 'Project Constraints', icon: '📏' },
  { id: 'stakeholder', title: 'Stakeholder Context', icon: '👥' },
  { id: 'assurance', title: 'System Assurance', icon: '🔒' },
  { id: 'results', title: 'Results', icon: '📊' }
];

const SA_QUESTIONS = [
  { id: 'SA1', text: 'Could a system failure lead to harm to people, property, or environment?', weight: 2 },
  { id: 'SA2', text: 'Are there regulatory or contractual safety requirements?', weight: 1 },
  { id: 'SA3', text: 'Is there potential for fatality or major harm?', weight: 3 },
  { id: 'SA4', text: 'Is the system in a regulated safety domain?', weight: 1 },
  { id: 'SA5', text: 'Does the system use novel technology in safety-relevant functions?', weight: 1 },
  { id: 'SA6', text: 'What are the availability requirements?', weight: 1, options: ['Low (best effort)', 'Moderate (99%)', 'High (99.9%)', 'Critical (99.99%+)'] },
  { id: 'SA7', text: 'Does the operational context involve hazardous environments?', weight: 1 }
];

const SA_TIERS = [
  { tier: 'I', name: 'Basic', minScore: 0, maxScore: 3, description: 'Standard SE processes sufficient', floor: null },
  { tier: 'II', name: 'Enhanced', minScore: 4, maxScore: 6, description: 'Additional assurance activities needed', floor: 'standard' },
  { tier: 'III', name: 'Critical', minScore: 7, maxScore: 9, description: 'Safety-critical processes required', floor: 'standard' },
  { tier: 'IV', name: 'Safety-Critical', minScore: 10, maxScore: 20, description: 'Full safety assurance program', floor: 'comprehensive' }
];

let currentStep = 0;
let localScores = {};
let localProject = {};
let localSAResponses = {};

export function renderAssessment(container) {
  const isFreshLoad = !container.querySelector('.assessment-container');
  if (isFreshLoad) {
    const state = getState();
    localScores = { ...state.scores };
    localProject = { ...state.projectInfo };
    localSAResponses = { ...state.saResponses } || {};

    METRICS.forEach(m => {
      if (localScores[m.id] === undefined) {
        localScores[m.id] = 3;
      }
    });
    
    SA_QUESTIONS.forEach(q => {
      if (localSAResponses[q.id] === undefined) {
        localSAResponses[q.id] = q.options ? 0 : false;
      }
    });
  }

  container.innerHTML = `
    <div class="assessment-container">
      <div class="assessment-header">
        <h2>🎯 Project Assessment</h2>
        <p class="text-secondary">Score 16 metrics to get process-specific tailoring recommendations</p>
      </div>
      <div class="step-progress">
        ${STEPS.map((s, i) => `
          <div class="step-dot ${i <= currentStep ? 'active' : ''} ${i === currentStep ? 'current' : ''}" data-step="${i}">
            <span class="step-icon">${s.icon}</span>
            <span class="step-label">${s.title}</span>
          </div>
        `).join('<div class="step-line"></div>')}
      </div>
      <div class="progress-bar mb-xl"><div class="progress-bar-fill" style="width:${((currentStep + 1) / STEPS.length) * 100}%"></div></div>
      <div id="step-content" class="step-content"></div>
      <div class="step-actions">
        <button class="btn btn-secondary" id="btn-prev" ${currentStep === 0 ? 'disabled' : ''}>← Back</button>
        <span class="step-indicator text-sm text-secondary">Step ${currentStep + 1} of ${STEPS.length}</span>
        <button class="btn btn-primary" id="btn-next">${currentStep === STEPS.length - 1 ? '✓ Complete' : 'Next →'}</button>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .assessment-container { max-width: 900px; margin: 0 auto; }
    .assessment-header { text-align: center; margin-bottom: 32px; }
    .step-progress { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 16px; flex-wrap: wrap; }
    .step-dot { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px; cursor: pointer; opacity: 0.4; transition: all 0.3s; }
    .step-dot.active { opacity: 1; }
    .step-dot.current .step-icon { background: var(--accent-primary); transform: scale(1.15); }
    .step-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--bg-tertiary); font-size: 16px; transition: all 0.3s; }
    .step-label { font-size: 11px; color: var(--text-secondary); white-space: nowrap; }
    .step-line { width: 24px; height: 2px; background: var(--border-subtle); margin-bottom: 18px; }
    .step-content { min-height: 400px; }
    .step-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--border-subtle); }
    .metric-group { margin-bottom: 24px; }
    .metric-item { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 20px; margin-bottom: 12px; transition: all 0.2s; }
    .metric-item:hover { border-color: var(--border-medium); }
    .metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .metric-name { font-weight: 600; font-size: 15px; }
    .metric-id { font-size: 12px; font-weight: 700; color: var(--accent-primary-light); background: rgba(99,102,241,0.12); padding: 2px 8px; border-radius: 4px; }
    .metric-score-display { font-size: 24px; font-weight: 800; min-width: 40px; text-align: center; transition: color 0.2s; }
    .metric-anchors { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-tertiary); margin-top: 6px; padding: 0 2px; }
    .metric-description { font-size: 13px; color: var(--text-secondary); margin-top: 8px; padding: 6px 10px; background: rgba(99,102,241,0.05); border-radius: 6px; }
    .info-form { display: grid; gap: 16px; max-width: 500px; margin: 0 auto; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
    .dim-avg { font-size: 13px; padding: 6px 12px; background: rgba(99,102,241,0.08); border-radius: 8px; display: inline-flex; gap: 6px; align-items: center; }
    .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
    .result-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px; }
    .result-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .result-process { font-weight: 600; font-size: 14px; }
    .drivers-list { font-size: 12px; color: var(--text-secondary); }
    .driver-item { display: flex; gap: 6px; align-items: center; padding: 2px 0; }
    .override-banner { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; padding: 14px; margin-bottom: 16px; }
    .violation-banner { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 14px; margin-bottom: 16px; }
    .fix-banner { background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3); border-radius: 10px; padding: 14px; margin-bottom: 16px; }
  `;
  container.appendChild(style);

  renderStep(container);

  container.querySelector('#btn-next').addEventListener('click', () => {
    if (currentStep < STEPS.length - 1) {
      currentStep++;
      renderAssessment(container);
    } else {
      finalizeAssessment();
    }
  });
  container.querySelector('#btn-prev').addEventListener('click', () => {
    if (currentStep > 0) { currentStep--; renderAssessment(container); }
  });
  container.querySelectorAll('.step-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      currentStep = parseInt(dot.dataset.step);
      renderAssessment(container);
    });
  });
}

function renderStep(container) {
  const content = container.querySelector('#step-content');
  const step = STEPS[currentStep];

  if (step.id === 'info') {
    content.innerHTML = `
      <h3 class="mb-lg">Project Information</h3>
      <div class="info-form">
        <div class="form-group">
          <label class="form-label">Project Name</label>
          <input class="input" id="proj-name" placeholder="e.g., Medical Device Control System" value="${localProject.name || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Date</label>
          <input class="input" id="proj-date" type="date" value="${localProject.date || new Date().toISOString().slice(0, 10)}">
        </div>
        <div class="form-group">
          <label class="form-label">Team / Organization</label>
          <input class="input" id="proj-team" placeholder="e.g., Systems Engineering Team" value="${localProject.team || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Project Phase</label>
          <select class="select" id="proj-phase">
            <option value="">Select phase...</option>
            <option value="concept" ${localProject.phase === 'concept' ? 'selected' : ''}>Concept / Pre-project</option>
            <option value="development" ${localProject.phase === 'development' ? 'selected' : ''}>Development</option>
            <option value="production" ${localProject.phase === 'production' ? 'selected' : ''}>Production</option>
            <option value="operations" ${localProject.phase === 'operations' ? 'selected' : ''}>Operations & Support</option>
            <option value="disposal" ${localProject.phase === 'disposal' ? 'selected' : ''}>Retirement / Disposal</option>
          </select>
        </div>
      </div>
    `;
    ['proj-name', 'proj-date', 'proj-team', 'proj-phase'].forEach(id => {
      content.querySelector(`#${id}`).addEventListener('change', (e) => {
        const key = id.replace('proj-', '');
        localProject[key] = e.target.value;
      });
    });
    return;
  }

  if (step.id === 'assurance') {
    renderAssuranceStep(content);
    return;
  }

  if (step.id === 'results') {
    renderResults(content);
    return;
  }

  // Metric scoring step
  const dim = DIMENSIONS.find(d => d.id === step.id);
  const dimMetrics = METRICS.filter(m => m.dimension === step.id);
  const dimAvg = dimMetrics.length > 0
    ? (dimMetrics.reduce((s, m) => s + (localScores[m.id] || 3), 0) / dimMetrics.length).toFixed(1)
    : '—';

  content.innerHTML = `
    <div class="flex justify-between items-center mb-lg">
      <h3 style="color: ${dim.color}">${step.icon} ${dim.name}</h3>
      <div class="dim-avg"><span>Avg:</span> <strong>${dimAvg}</strong></div>
    </div>
    <div class="metric-group">
      ${dimMetrics.map(m => {
    const val = localScores[m.id] || 3;
    const scoreColor = val >= 4 ? 'var(--level-comprehensive)' : val >= 2.5 ? 'var(--level-standard)' : 'var(--level-basic)';
    return `
        <div class="metric-item">
          <div class="metric-header">
            <div class="flex items-center gap-sm">
              <span class="metric-id">${m.id}</span>
              <span class="metric-name">${m.name}</span>
            </div>
            <div class="metric-score-display" id="score-${m.id}" style="color:${scoreColor}">${val}</div>
          </div>
          <input type="range" class="range-slider" id="slider-${m.id}" min="1" max="5" step="1" value="${val}">
          <div class="metric-anchors">
            <span>${m.anchors[1]}</span>
            <span>${m.anchors[5]}</span>
          </div>
          <div class="metric-description" id="desc-${m.id}">${m.anchors[val] || ''}</div>
        </div>`;
  }).join('')}
    </div>
  `;

  // Slider handlers
  dimMetrics.forEach(m => {
    const slider = content.querySelector(`#slider-${m.id}`);
    slider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value);
      localScores[m.id] = v;
      const display = content.querySelector(`#score-${m.id}`);
      display.textContent = v;
      display.style.color = v >= 4 ? 'var(--level-comprehensive)' : v >= 2.5 ? 'var(--level-standard)' : 'var(--level-basic)';
      content.querySelector(`#desc-${m.id}`).textContent = m.anchors[v] || '';
      // Update dim avg
      const avg = (dimMetrics.reduce((s, x) => s + (localScores[x.id] || 3), 0) / dimMetrics.length).toFixed(1);
      container.querySelector('.dim-avg strong').textContent = avg;
    });
  });
}

function renderAssuranceStep(content) {
  const saTier = calculateSATier(localSAResponses);
  const tierColors = {
    'I': '#3b82f6',
    'II': '#f59e0b', 
    'III': '#ef4444',
    'IV': '#7c3aed'
  };

  content.innerHTML = `
    <h3 class="mb-lg">🔒 System Assurance Assessment</h3>
    <p class="text-secondary mb-lg">Determine the System Assurance Criticality Tier based on safety and assurance factors.</p>
    
    <div class="sa-tier-display mb-xl" style="background: ${tierColors[saTier.tier]}15; border: 2px solid ${tierColors[saTier.tier]}; border-radius: 12px; padding: 16px; text-align: center;">
      <div class="text-sm text-secondary">Current Criticality Tier</div>
      <div class="sa-tier-title" style="font-size: 28px; font-weight: 800; color: ${tierColors[saTier.tier]}">Tier ${saTier.tier}: ${saTier.name}</div>
      <div class="text-sm">${saTier.description}</div>
      <div class="text-xs text-secondary mt-sm">Score: ${saTier.score} points</div>
    </div>
    
    <div class="sa-questions">
      ${SA_QUESTIONS.map(q => {
        const val = localSAResponses[q.id];
        if (q.options) {
          return `
            <div class="metric-item">
              <div class="metric-header">
                <div class="flex items-center gap-sm">
                  <span class="metric-id">${q.id}</span>
                  <span class="metric-name">${q.text}</span>
                </div>
              </div>
              <div class="sa-options mt-sm">
                ${q.options.map((opt, i) => `
                  <label class="sa-option ${val === i ? 'selected' : ''}" style="display: block; padding: 10px 14px; margin: 4px 0; border-radius: 8px; cursor: pointer; border: 1px solid ${val === i ? 'var(--accent-primary)' : 'var(--border-subtle)'}; background: ${val === i ? 'rgba(99,102,241,0.1)' : 'var(--bg-tertiary)'}">
                    <input type="radio" name="${q.id}" value="${i}" ${val === i ? 'checked' : ''} style="margin-right: 8px;">
                    ${opt}
                  </label>
                `).join('')}
              </div>
            </div>`;
        }
        return `
            <div class="metric-item">
              <div class="metric-header">
                <div class="flex items-center gap-sm">
                  <span class="metric-id">${q.id}</span>
                  <span class="metric-name">${q.text}</span>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" id="sa-${q.id}" ${val ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="text-xs text-secondary mt-sm">Weight: ${q.weight} point${q.weight > 1 ? 's' : ''}</div>
            </div>`;
      }).join('')}
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .toggle-switch { position: relative; display: inline-block; width: 48px; height: 24px; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--bg-tertiary); transition: .3s; border-radius: 24px; }
    .toggle-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
    input:checked + .toggle-slider { background-color: var(--accent-primary); }
    input:checked + .toggle-slider:before { transform: translateX(24px); }
    .sa-option:hover { border-color: var(--accent-primary-light); }
    .sa-tier-display { transition: all 0.3s ease; }
  `;
  if (!content.querySelector('style[data-sa-styles]')) {
    style.setAttribute('data-sa-styles', 'true');
    content.appendChild(style);
  }

  SA_QUESTIONS.forEach(q => {
    if (q.options) {
      content.querySelectorAll(`input[name="${q.id}"]`).forEach(radio => {
        radio.addEventListener('change', (e) => {
          localSAResponses[q.id] = parseInt(e.target.value);
          renderAssuranceStep(content);
        });
      });
    } else {
      const checkbox = content.querySelector(`#sa-${q.id}`);
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          localSAResponses[q.id] = e.target.checked;
          renderAssuranceStep(content);
        });
      }
    }
  });
}

function renderResults(content) {
  const state = getState();
  const matrixMap = state.matrixMap || METRIC_PROCESS_MAP;
  const result = runFullAssessment(localScores, matrixMap, localSAResponses);
  const saTier = result.saTier || calculateSATier(localSAResponses);
  
  const tierColors = {
    'I': '#3b82f6',
    'II': '#f59e0b', 
    'III': '#ef4444',
    'IV': '#7c3aed'
  };
  
  const groupByGroup = {};
  CORE_PROCESSES.forEach(p => {
    if (!groupByGroup[p.group]) groupByGroup[p.group] = [];
    groupByGroup[p.group].push(p);
  });

  const processName = (id) => CORE_PROCESSES.find(p => p.id === id)?.name || `Process ${id}`;

  content.innerHTML = `
    <h3 class="mb-lg">📊 Assessment Results</h3>
    
    <div class="sa-tier-result mb-lg" style="background: ${tierColors[saTier.tier]}15; border: 2px solid ${tierColors[saTier.tier]}; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div class="text-sm text-secondary">System Assurance Criticality Tier</div>
        <div style="font-size: 24px; font-weight: 800; color: ${tierColors[saTier.tier]}">Tier ${saTier.tier}: ${saTier.name}</div>
        <div class="text-sm">${saTier.description}</div>
      </div>
      <div style="text-align: right;">
        <div class="text-xs text-secondary">Score</div>
        <div style="font-size: 20px; font-weight: 700;">${saTier.score}</div>
        ${saTier.floor ? `<div class="text-xs" style="color: ${tierColors[saTier.tier]}">Floor: ${saTier.floor}</div>` : ''}
      </div>
    </div>
    
    ${result.overrides.length ? `
      <div class="override-banner">
        <strong>⚠️ Override Conditions Applied (${result.overrides.length})</strong>
        ${result.overrides.map(o => `<div class="text-sm mt-sm">• <strong>${processName(o.processId)}</strong>: ${o.from} → ${o.to} (${o.reason})</div>`).join('')}
      </div>` : ''}
    ${result.fixes.length ? `
      <div class="fix-banner">
        <strong>✓ Consistency Fixes Applied (${result.fixes.length})</strong>
        ${result.fixes.map(f => `<div class="text-sm mt-sm">• <strong>${processName(f.processId)}</strong>: ${f.from} → ${f.to} (${f.reason})</div>`).join('')}
      </div>` : ''}
    ${result.violations.length ? `
      <div class="violation-banner">
        <strong>⚠ Remaining Warnings (${result.violations.length})</strong>
        ${result.violations.map(v => `<div class="text-sm mt-sm">• Rule ${v.ruleId} [${v.type}]: ${v.label}</div>`).join('')}
      </div>` : ''}
    <div class="grid-3 mb-lg">
      <div class="card stat-card"><div class="stat-value" style="color:var(--level-basic)">${Object.values(result.levels).filter(l => l === 'basic').length}</div><div class="stat-label">Basic</div></div>
      <div class="card stat-card"><div class="stat-value" style="color:var(--level-standard)">${Object.values(result.levels).filter(l => l === 'standard').length}</div><div class="stat-label">Standard</div></div>
      <div class="card stat-card"><div class="stat-value" style="color:var(--level-comprehensive)">${Object.values(result.levels).filter(l => l === 'comprehensive').length}</div><div class="stat-label">Comprehensive</div></div>
    </div>
    ${Object.entries(groupByGroup).map(([group, procs]) => `
      <h4 class="mb-md mt-lg" style="color: ${PROCESS_GROUPS[group.toUpperCase()]?.color || '#fff'}">${PROCESS_GROUPS[group.toUpperCase()]?.icon || ''} ${PROCESS_GROUPS[group.toUpperCase()]?.name || group}</h4>
      <div class="results-grid">
        ${procs.map(p => {
    const level = result.levels[p.id] || 'basic';
    const drivers = getDriverAttribution(p.id, localScores, matrixMap);
    const wasOverridden = result.overrides.some(o => o.processId === p.id);
    const wasFixed = result.fixes.some(f => f.processId === p.id);
    return `
          <div class="result-card" style="border-left: 3px solid var(--level-${level})">
            <div class="result-card-header">
              <span class="result-process">${p.name}</span>
              <span class="level-badge ${level}">${level}</span>
            </div>
            ${wasOverridden ? '<div class="text-xs" style="color:var(--accent-warning)">⚠ Override applied</div>' : ''}
            ${wasFixed ? '<div class="text-xs" style="color:var(--accent-success)">✓ Consistency fix</div>' : ''}
            <div class="drivers-list mt-sm">
              ${drivers.slice(0, 3).map(d => `
                <div class="driver-item">
                  <span class="driver-badge ${d.role === 'P' ? 'primary' : 'secondary'}">${d.role}</span>
                  <span>${d.metric}: ${d.value}</span>
                </div>`).join('')}
            </div>
          </div>`;
  }).join('')}
      </div>
    `).join('')}
  `;
}

function finalizeAssessment() {
  const state = getState();
  const matrixMap = state.matrixMap || METRIC_PROCESS_MAP;
  const result = runFullAssessment(localScores, matrixMap, localSAResponses);
  setState({
    projectInfo: localProject,
    scores: localScores,
    saResponses: localSAResponses,
    saTier: result.saTier,
    derived: result.derived,
    levels: result.levels,
    overrides: result.overrides,
    violations: result.violations,
    fixes: result.fixes,
    assessmentComplete: true
  });
  showToast('Assessment complete! Process levels calculated.', 'success');
  currentStep = 0;
  navigateTo('report');
}
