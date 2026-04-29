/**
 * Assessment View — Step-by-step metric scoring wizard
 * v3.3: Hierarchy-aware — loads/saves per-element, shows inherited metrics
 */
import { METRICS, DIMENSIONS, CORE_PROCESSES, FRAMEWORK_META, PROCESS_GROUPS, METRIC_PROCESS_MAP, OVERRIDE_CONDITIONS } from '../data/se-tailoring-data.js';
import { runFullAssessment, getDriverAttribution } from '../utils/assessment-engine.js';
import { getState, setState, showToast, getActiveNode, getElementBreadcrumbs, setElementScores, setElementAssessmentResult, markMetricManual } from '../state.js';
import { navigateTo } from '../router.js';

const STEPS = [
  { id: 'info', title: 'Project Info', icon: '📋' },
  { id: 'complexity', title: 'System Complexity', icon: '🔧' },
  { id: 'safety', title: 'Safety & Criticality', icon: '🛡️' },
  { id: 'constraints', title: 'Project Constraints', icon: '📏' },
  { id: 'stakeholder', title: 'Stakeholder Context', icon: '👥' },
  { id: 'results', title: 'Results', icon: '📊' }
];

let currentStep = 0;
let localScores = {};
let localProject = {};

function compareScore(lhs, op, rhs) {
  if (op === '>=') return lhs >= rhs;
  if (op === '=') return lhs === rhs;
  if (op === '<=') return lhs <= rhs;
  return false;
}

function isBasicExcluded(processId, scores, projectInfo = {}) {
  for (const ov of OVERRIDE_CONDITIONS) {
    const trigger = ov.trigger || {};
    let triggered = false;

    if (trigger.type === 'metric') {
      const score = typeof scores?.[trigger.metric] === 'number' ? scores[trigger.metric] : 3;
      triggered = compareScore(score, trigger.op, trigger.value);
    } else if (trigger.type === 'context') {
      triggered = projectInfo?.[trigger.field] === trigger.equals;
    }

    if (triggered && ov.processes.includes(processId)) {
      return { excluded: true, reason: ov.label, minLevel: ov.minLevel };
    }
  }
  return { excluded: false, reason: null, minLevel: null };
}

export function renderAssessment(container) {
  const isFreshLoad = !container.querySelector('.assessment-container');
  if (isFreshLoad) {
    const state = getState();
    const activeNode = getActiveNode();
    // Load per-element scores if available, otherwise fall back to global
    const elementScores = activeNode?.scores || {};
    localScores = Object.keys(elementScores).length > 0
      ? { ...elementScores }
      : { ...state.scores };
    localProject = { securityCritical: false, ...state.projectInfo };

    METRICS.forEach(m => {
      if (localScores[m.id] === undefined) {
        localScores[m.id] = 3;
      }
    });
  }

  const activeNode = getActiveNode();
  const isHierarchical = activeNode && activeNode.id !== 'default';
  const crumbs = isHierarchical ? getElementBreadcrumbs(activeNode.id) : [];

  container.innerHTML = `
    <div class="assessment-container">
      ${isHierarchical ? `
      <div class="hierarchy-context-bar">
        <div class="hierarchy-crumbs">
          ${crumbs.map((c, i) => `<span class="h-crumb${c.id === activeNode.id ? ' active' : ''}">${c.name}</span>${i < crumbs.length - 1 ? ' <span class="h-sep">›</span> ' : ''}`).join('')}
        </div>
        <div class="hierarchy-badges">
          <span class="se-type-badge ${activeNode.assessmentType}">${activeNode.assessmentType}</span>
          <button class="btn btn-ghost btn-sm" id="btn-back-to-tree">← Back to Elements</button>
        </div>
      </div>` : ''}
      <div class="assessment-header">
        <h2>🎯 ${isHierarchical ? activeNode.name + ' — ' : ''}Assessment</h2>
        <p class="text-secondary">${isHierarchical
          ? `Scoring metrics for system element: ${activeNode.name} (${activeNode.assessmentType} assessment)`
          : 'Score 16 metrics to get process-specific tailoring recommendations'}</p>
      </div>
      <div class="ordinal-warning mb-lg" style="background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.35); border-radius: 10px; padding: 14px 18px;">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <span style="font-size: 18px;">⚠️</span>
          <div>
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">Ordinal Scale Warning</div>
            <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">Metric scores (1-5) and derived levels (B/S/C) are <strong>ordinal scales</strong>, not cardinal values. They indicate relative ranking within this project only. <strong>Do not compare scores or averages across different projects</strong>—use them only for determining appropriate tailoring levels for the current project.</div>
          </div>
        </div>
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
    .hierarchy-context-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 14px; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); border-radius: 8px; margin-bottom: 16px; }
    .hierarchy-crumbs { display: flex; align-items: center; gap: 4px; font-size: 13px; }
    .h-crumb { color: var(--text-secondary); }
    .h-crumb.active { color: var(--accent-primary-light); font-weight: 600; }
    .h-sep { color: var(--text-tertiary); }
    .hierarchy-badges { display: flex; align-items: center; gap: 8px; }
    .se-type-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
    .se-type-badge.full { background: rgba(99,102,241,0.15); color: var(--accent-primary-light); }
    .se-type-badge.quick { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .se-type-badge.inherited { background: rgba(52,211,153,0.15); color: #34d399; }
    .metric-inherited-lock { opacity: 0.5; pointer-events: none; position: relative; }
    .metric-inherited-lock::after { content: '↑ Inherited'; position: absolute; top: 8px; right: 12px; font-size: 10px; color: #34d399; background: rgba(52,211,153,0.15); padding: 1px 6px; border-radius: 3px; }
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
  // Back to elements tree (hierarchy context)
  container.querySelector('#btn-back-to-tree')?.addEventListener('click', () => navigateTo('elements'));
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
          <input class="input" id="proj-name" placeholder="e.g., State of Good Repair Program" value="${localProject.name || ''}">
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
    const scoreColor = val >= 4 ? 'var(--level-comprehensive)' : val >= 3 ? 'var(--level-standard)' : 'var(--level-basic)';
    return `
        <div class="metric-item">
          <div class="metric-header">
            <div class="flex items-center gap-sm">
              <span class="metric-id">${m.id}</span>
              <span class="metric-name">${m.name}</span>
            </div>
            <div class="flex items-center gap-sm">
              ${m.guidedQuestions ? `<button class="btn btn-sm btn-outline wizard-btn" data-metric="${m.id}" style="font-size: 11px; padding: 2px 8px;">Help me choose</button>` : ''}
              <div class="metric-score-display" id="score-${m.id}" style="color:${scoreColor}">${val}</div>
            </div>
          </div>
          <input type="range" class="range-slider" id="slider-${m.id}" min="1" max="5" step="1" value="${val}">
          <div class="metric-anchors">
            <span>${m.anchors[1]}</span>
            <span>${m.anchors[5]}</span>
          </div>
          <div class="metric-description" id="desc-${m.id}">${m.anchors[val] || ''}</div>
          <div class="metric-wizard hidden" id="wizard-${m.id}" style="display: none; margin-top: 12px; padding: 16px; background: rgba(99,102,241,0.05); border-radius: 8px; border: 1px solid var(--accent-primary-light);"></div>
        </div>`;
  }).join('')}
    </div>
  `;

  // Slider handlers
  dimMetrics.forEach(m => {
    const slider = content.querySelector(`#slider-${m.id}`);
    slider.addEventListener('input', (e) => {
      setMetricScore(m.id, parseInt(e.target.value), content);
    });

    const wizardBtn = content.querySelector(`.wizard-btn[data-metric="${m.id}"]`);
    if (wizardBtn) {
      wizardBtn.addEventListener('click', () => startWizard(m.id, content));
    }
  });
}

function setMetricScore(metricId, value, contentContainer) {
  const m = METRICS.find(x => x.id === metricId);
  localScores[metricId] = value;
  const slider = contentContainer.querySelector(`#slider-${metricId}`);
  if (slider && slider.value != value) slider.value = value;

  const display = contentContainer.querySelector(`#score-${metricId}`);
  if (display) {
    display.textContent = value;
    display.style.color = value >= 4 ? 'var(--level-comprehensive)' : value >= 3 ? 'var(--level-standard)' : 'var(--level-basic)';
  }

  const desc = contentContainer.querySelector(`#desc-${metricId}`);
  if (desc) desc.textContent = m.anchors[value] || '';

  // Update dim avg
  const dimMetrics = METRICS.filter(x => x.dimension === m.dimension);
  const avg = (dimMetrics.reduce((s, x) => s + (localScores[x.id] || 3), 0) / dimMetrics.length).toFixed(1);
  const avgDisplay = document.querySelector('.dim-avg strong');
  if (avgDisplay) avgDisplay.textContent = avg;

  // Track as manually set for the active element
  const activeNode = getActiveNode();
  if (activeNode) {
    markMetricManual(activeNode.id, metricId);
  }
}

function startWizard(metricId, contentContainer) {
  const metric = METRICS.find(m => m.id === metricId);
  const wizardDiv = contentContainer.querySelector(`#wizard-${metricId}`);
  if (!wizardDiv) return;

  if (wizardDiv.style.display === 'block') {
    wizardDiv.style.display = 'none'; // toggle off
    return;
  }

  wizardDiv.style.display = 'block';
  let currentQ = 0;

  const renderQ = () => {
    if (currentQ >= metric.guidedQuestions.length) {
      setMetricScore(metricId, 1, contentContainer);
      wizardDiv.innerHTML = `<div class="text-sm font-semibold mb-sm">Recommended Score: 1</div>
                             <div class="text-xs text-secondary mb-md">You answered 'No' to all key indicators.</div>
                             <button class="btn btn-sm btn-outline close-wizard">Done</button>`;
      wizardDiv.querySelector('.close-wizard').addEventListener('click', () => wizardDiv.style.display = 'none');
      return;
    }

    const q = metric.guidedQuestions[currentQ];
    wizardDiv.innerHTML = `
      <div class="text-xs text-secondary mb-sm">Question ${currentQ + 1} of ${metric.guidedQuestions.length}</div>
      <div class="text-sm font-semibold mb-md">${q.text}</div>
      <div class="flex gap-sm">
        <button class="btn btn-sm btn-primary yes-btn" style="min-width: 60px;">Yes</button>
        <button class="btn btn-sm btn-outline no-btn" style="min-width: 60px;">No</button>
      </div>
    `;

    wizardDiv.querySelector('.yes-btn').addEventListener('click', () => {
      setMetricScore(metricId, q.yesScore, contentContainer);
      wizardDiv.innerHTML = `<div class="text-sm font-semibold text-success mb-sm">Recommended Score: ${q.yesScore}</div>
                             <div class="text-xs text-secondary mb-md">Score automatically applied.</div>
                             <button class="btn btn-sm btn-outline close-wizard">Done</button>`;
      wizardDiv.querySelector('.close-wizard').addEventListener('click', () => wizardDiv.style.display = 'none');
    });

    wizardDiv.querySelector('.no-btn').addEventListener('click', () => {
      currentQ++;
      renderQ();
    });
  };

  renderQ();
}



function renderResults(content) {
  const state = getState();
  const matrixMap = state.matrixMap || METRIC_PROCESS_MAP;
  const result = runFullAssessment(localScores, matrixMap, localProject);
  const derivationDetails = result.derivationDetails || {};
  const saTier = result.saTier;

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

  const m5Val = localScores.M5 || 3;

  content.innerHTML = `
    <h3 class="mb-lg">📊 Assessment Results</h3>
    
    <div class="ordinal-warning-banner mb-lg" style="background: rgba(239,68,68,0.08); border: 2px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 14px 18px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">⚠️</span>
        <div>
          <div style="font-weight: 700; color: var(--accent-danger); font-size: 14px;">Ordinal Score Warning</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
            Metric scores are <strong>ordinal values</strong>, not cardinal. Total scores or averages <strong>cannot be compared between projects</strong>. 
            Scores indicate relative rigor within this assessment only.
          </div>
        </div>
      </div>
    </div>
    
    <div class="workflow-diagram mb-lg" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px;">
      <details>
        <summary style="cursor: pointer; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px;">
          <span>📋</span> Tailoring Workflow (click to expand)
        </summary>
        <div style="margin-top: 12px; font-size: 11px; font-family: monospace; line-height: 1.4; white-space: pre; overflow-x: auto;">
┌──────────────────────────────────────────────────────────────────────┐
│                      SE TAILORING WORKFLOW                            │
└──────────────────────────────────────────────────────────────────────┘

  Step 1: Score Metrics (§3.2-3.3)
  └──▶ Assess 16 metrics (1-5 scale), document rationale

  Step 2: Derive Process Levels (§3.4)
  └──▶ For each process: identify metrics → map to tiers → corroboration check
       (Comprehensive requires corroboration; single high trigger may cap at Standard)

  Step 3: Check Overrides (§3.4.4)
  └──▶ Does criticality override apply? ──[Yes]──▶ Apply minimum level
                    │
                   [No]
                    ▼
  Step 4: Apply Interdependencies (§6.5-6.6)
  └──▶ Hard constraint violated? ──[Yes]──▶ Elevate level
                    │
                   [No]
                    ▼
  Step 5: Review Trade-offs (§3.6)
  └──▶ Accepting trade-off? ──[Yes]──▶ Document in Trade-off Log
                    │
                   [No]
                    ▼
  Step 6: Generate Profile
  └──▶ Process Tailoring Profile with attribution and sign-off
        </div>
      </details>
    </div>
    
    <div class="metric-legend mb-lg" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px 16px;">
      <div class="text-xs text-secondary mb-sm" style="font-weight: 600;">Metric Legend (Override-Relevant)</div>
      <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px;">
        <span><strong style="color: var(--accent-primary);">M4</strong> – Multi-Contractor Integration</span>
        <span><strong style="color: var(--accent-primary);">M3</strong> – Technology Novelty</span>
        <span><strong style="color: var(--accent-primary);">M5</strong> – Safety Criticality</span>
        <span><strong style="color: var(--accent-primary);">M6</strong> – Mission Criticality</span>
        <span><strong style="color: var(--accent-primary);">M7</strong> – Environmental Criticality</span>
        <span><strong style="color: var(--accent-primary);">M8</strong> – Regulatory Burden</span>
        <span><strong style="color: var(--accent-primary);">CTX</strong> – Security-Critical project context</span>
      </div>
    </div>
    
    <div class="workflow-diagram mb-lg" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 16px;">
      <div class="text-xs text-secondary mb-sm" style="font-weight: 600;">Tailoring Workflow</div>
      <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 11px;">
        <span style="background: rgba(99,102,241,0.15); padding: 4px 10px; border-radius: 4px; font-weight: 600;">1. Score Metrics</span>
        <span style="color: var(--text-tertiary);">→</span>
        <span style="background: rgba(99,102,241,0.15); padding: 4px 10px; border-radius: 4px; font-weight: 600;">2. Derive Levels</span>
        <span style="color: var(--text-tertiary);">→</span>
        <span style="background: rgba(245,158,11,0.15); padding: 4px 10px; border-radius: 4px; font-weight: 600;">3. Apply Overrides</span>
        <span style="color: var(--text-tertiary);">→</span>
        <span style="background: rgba(245,158,11,0.15); padding: 4px 10px; border-radius: 4px; font-weight: 600;">4. Check Consistency</span>
        <span style="color: var(--text-tertiary);">→</span>
        <span style="background: rgba(52,211,153,0.15); padding: 4px 10px; border-radius: 4px; font-weight: 600;">5. Final Profile</span>
      </div>
      <div style="margin-top: 10px; font-size: 10px; color: var(--text-tertiary);">
        Decision points: <span style="background: rgba(245,158,11,0.1); padding: 1px 4px; border-radius: 3px;">Criticality override?</span> 
        <span style="background: rgba(239,68,68,0.1); padding: 1px 4px; border-radius: 3px;">HC violated?</span> 
        <span style="background: rgba(52,211,153,0.1); padding: 1px 4px; border-radius: 3px;">Accepting trade-off?</span>
      </div>
    </div>
    
    <div class="sa-tier-result mb-lg" style="background: ${tierColors[saTier.tier]}15; border: 2px solid ${tierColors[saTier.tier]}; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div class="text-sm text-secondary">Safety Assurance Criticality Tier (derived from M5: Safety Impact = ${m5Val})</div>
        <div style="font-size: 24px; font-weight: 800; color: ${tierColors[saTier.tier]}">Tier ${saTier.tier}: ${saTier.name}</div>
        <div class="text-sm">${saTier.description}</div>
      </div>
      <div style="text-align: right;">
        ${saTier.floor ? `<div class="text-xs" style="color: ${tierColors[saTier.tier]}">Min Floor: ${saTier.floor}</div>` : '<div class="text-xs text-secondary">No floor applied</div>'}
      </div>
    </div>
    
    ${result.rightSizingActions?.length ? `
      <div class="override-banner" style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3);">
        <strong>📐 Right-Sizing Applied (${result.rightSizingActions.length} adjustments)</strong>
        <div class="text-xs text-secondary mt-sm mb-sm">PSI=${result.indices?.psi || '—'} (Scale) · CSI=${result.indices?.csi || '—'} (Constraints) · CRI=${result.indices?.cri || '—'} (Capability)</div>
        ${result.rightSizingActions.map(a => `<div class="text-sm mt-sm">• <strong>${processName(a.processId)}</strong>: ${a.from} → ${a.to} <span class="text-xs text-secondary">(${a.reason})</span></div>`).join('')}
      </div>` : result.indices ? `
      <div style="background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.25); border-radius: 10px; padding: 12px 16px; margin-bottom: 16px;">
        <div class="text-xs text-secondary" style="font-weight: 600;">📐 Right-Sizing Indices</div>
        <div class="text-sm mt-sm">PSI=${result.indices.psi} (Scale) · CSI=${result.indices.csi} (Constraints) · CRI=${result.indices.cri} (Capability) — <span style="color: var(--accent-success);">No adjustments needed</span></div>
      </div>` : ''}

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
    <div class="basic-exclusion-legend mb-lg" style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 12px 16px;">
      <div class="text-xs text-secondary mb-sm" style="font-weight: 600;">Basic Level Exclusion</div>
      <div class="text-sm">When criticality thresholds are exceeded, <strong style="color: var(--level-basic); text-decoration: line-through;">Basic</strong> is not available for affected processes. These processes show a <span style="background: rgba(239,68,68,0.15); padding: 1px 4px; border-radius: 3px; font-size: 11px;">🚫 B excluded</span> indicator.</div>
    </div>
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
    const detail = derivationDetails[p.id] || {};
    const drivers = getDriverAttribution(p.id, localScores, matrixMap);
    const wasOverridden = result.overrides.some(o => o.processId === p.id);
    const wasFixed = result.fixes.some(f => f.processId === p.id);
    const basicExcluded = isBasicExcluded(p.id, localScores, localProject);
    const triggerMetrics = Array.isArray(detail.triggerMetrics) && detail.triggerMetrics.length
      ? detail.triggerMetrics.join(', ')
      : '—';
    const confidence = result.confidence?.[p.id] || detail.confidence || 'high';
    const confidenceLabel = confidence === 'corroborated'
      ? 'Corroborated'
      : confidence === 'available-with-justification'
        ? 'Available with justification'
        : 'High';
    return `
          <div class="result-card" style="border-left: 3px solid var(--level-${level})">
            <div class="result-card-header">
              <span class="result-process">${p.name}</span>
              <span class="level-badge ${level}">${level}</span>
            </div>
            ${basicExcluded.excluded ? `<div class="text-xs" style="color:var(--accent-danger)">🚫 B excluded (${basicExcluded.reason})</div>` : ''}
            ${wasOverridden ? '<div class="text-xs" style="color:var(--accent-warning)">⚠ Override applied</div>' : ''}
            ${wasFixed ? '<div class="text-xs" style="color:var(--accent-success)">✓ Consistency fix</div>' : ''}
            ${confidence === 'available-with-justification' ? `<div class="text-xs" style="color:var(--accent-warning)">⚠ Comprehensive available with explicit justification</div>` : ''}
            <div class="text-xs text-secondary mt-sm">Trigger metric(s): <strong>${triggerMetrics}</strong>${detail.triggerScore ? ` (score ${detail.triggerScore})` : ''}</div>
            <div class="text-xs text-secondary">Confidence: <strong>${confidenceLabel}</strong></div>
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
  const result = runFullAssessment(localScores, matrixMap, localProject);

  // Store results globally (backward compat)
  setState({
    projectInfo: { ...localProject },
    scores: localScores,
    saTier: result.saTier,
    derived: result.derived,
    derivationDetails: result.derivationDetails || {},
    levels: result.levels,
    overrides: result.overrides,
    rightSizingActions: result.rightSizingActions || [],
    indices: result.indices || {},
    violations: result.violations,
    fixes: result.fixes,
    confidence: result.confidence || {},
    assessmentComplete: true
  });

  // Also store per-element (hierarchy)
  const activeNode = getActiveNode();
  if (activeNode) {
    setElementScores(activeNode.id, { ...localScores });
    setElementAssessmentResult(activeNode.id, result);
  }

  showToast(`Assessment complete for "${activeNode?.name || 'Project'}"! Process levels calculated.`, 'success');
  currentStep = 0;
  navigateTo('report');
}
