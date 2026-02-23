/**
 * Dashboard View — Landing page with framework overview
 */
import { FRAMEWORK_META, CORE_PROCESSES, PROCESS_GROUPS, METRICS, DIMENSIONS, CONSISTENCY_RULES } from '../data/se-tailoring-data.js';
import { getState } from '../state.js';
import { navigateTo } from '../router.js';

export function renderDashboard(container) {
    const state = getState();
    const techMgmt = CORE_PROCESSES.filter(p => p.group === 'tech_mgmt');
    const technical = CORE_PROCESSES.filter(p => p.group === 'technical');

    container.innerHTML = `
    <section class="hero animate-fade-in-up">
      <div class="hero-badge">v${FRAMEWORK_META.version} · ${FRAMEWORK_META.standard}</div>
      <h1 class="hero-title">SE Process<br><span class="gradient-text">Tailoring Framework</span></h1>
      <p class="hero-subtitle">Metrics-driven process tailoring for systems engineering projects. Score 16 metrics once, get tailored recommendations for 22 core processes now, with a 30-process roadmap.</p>
      <div class="hero-actions">
        <button class="btn btn-primary btn-lg" id="btn-start-assessment">🎯 Start Assessment</button>
        <button class="btn btn-secondary btn-lg" id="btn-explore">🔍 Explore Processes</button>
      </div>
    </section>

    <section class="stats-strip animate-fade-in-up stagger-2">
      <div class="grid-4">
        <div class="card stat-card hover-lift">
          <div class="stat-value">${FRAMEWORK_META.coreProcessCount}</div>
          <div class="stat-label">Core Processes</div>
        </div>
        <div class="card stat-card hover-lift">
          <div class="stat-value">${FRAMEWORK_META.metricCount}</div>
          <div class="stat-label">Assessment Metrics</div>
        </div>
        <div class="card stat-card hover-lift">
          <div class="stat-value">3</div>
          <div class="stat-label">Tailoring Levels</div>
        </div>
        <div class="card stat-card hover-lift">
          <div class="stat-value">${CONSISTENCY_RULES.length}</div>
          <div class="stat-label">Consistency Rules</div>
        </div>
      </div>
    </section>

    ${state.assessmentComplete ? `
    <section class="assessment-summary card animate-fade-in-up stagger-3 mb-xl">
      <div class="card-header">
        <h3 class="card-title">📊 Current Assessment: ${state.projectInfo.name || 'Project'}</h3>
        <button class="btn btn-secondary btn-sm" id="btn-view-report">View Report →</button>
      </div>
      <div class="grid-3">
        <div class="level-summary">
          <div class="level-count basic-count">${Object.values(state.levels).filter(l => l === 'basic').length}</div>
          <span class="level-badge basic">Basic</span>
        </div>
        <div class="level-summary">
          <div class="level-count standard-count">${Object.values(state.levels).filter(l => l === 'standard').length}</div>
          <span class="level-badge standard">Standard</span>
        </div>
        <div class="level-summary">
          <div class="level-count comprehensive-count">${Object.values(state.levels).filter(l => l === 'comprehensive').length}</div>
          <span class="level-badge comprehensive">Comprehensive</span>
        </div>
      </div>
    </section>` : ''}

    <section class="levels-section mb-xl animate-fade-in-up stagger-3">
      <h2 class="mb-lg">Tailoring Levels</h2>
      <div class="grid-3">
        ${['basic', 'standard', 'comprehensive'].map(l => `
        <div class="card level-card hover-lift level-card-${l}">
          <div class="level-card-header">
            <span class="level-badge ${l}">${FRAMEWORK_META.levelLabels[l]}</span>
          </div>
          <p class="text-sm text-secondary mt-md">${FRAMEWORK_META.levelDescriptions[l]}</p>
          <div class="level-range mt-md text-xs text-secondary">
            ${l === 'basic' ? 'Trigger tier: scores 1-2' : l === 'standard' ? 'Trigger tier: score 3' : 'Trigger tier: scores 4-5'}
          </div>
        </div>`).join('')}
      </div>
    </section>

    <section class="process-groups mb-xl animate-fade-in-up stagger-4">
      <h2 class="mb-lg">Process Architecture</h2>
      <div class="grid-2">
        <div class="card process-group-card hover-lift">
          <h3 style="color: ${PROCESS_GROUPS.TECH_MGMT.color}">${PROCESS_GROUPS.TECH_MGMT.icon} Technical Management (${techMgmt.length})</h3>
          <ul class="process-list mt-md">
            ${techMgmt.map(p => `<li class="process-list-item"><span class="process-id">${p.id}</span> ${p.name}</li>`).join('')}
          </ul>
        </div>
        <div class="card process-group-card hover-lift">
          <h3 style="color: ${PROCESS_GROUPS.TECHNICAL.color}">${PROCESS_GROUPS.TECHNICAL.icon} Technical Processes (${technical.length})</h3>
          <ul class="process-list mt-md">
            ${technical.map(p => `<li class="process-list-item"><span class="process-id">${p.id}</span> ${p.name}</li>`).join('')}
          </ul>
        </div>
      </div>
    </section>

    <section class="dimensions-section mb-xl animate-fade-in-up stagger-5">
      <h2 class="mb-lg">Assessment Dimensions</h2>
      <div class="grid-4">
        ${DIMENSIONS.map(d => `
        <div class="card dimension-card hover-lift" style="border-top: 3px solid ${d.color}">
          <h4 style="color: ${d.color}">${d.name}</h4>
          <div class="dimension-metrics mt-md">
            ${d.metrics.map(mid => {
        const m = METRICS.find(x => x.id === mid);
        return `<div class="text-xs text-secondary">${mid}: ${m.name}</div>`;
    }).join('')}
          </div>
        </div>`).join('')}
      </div>
    </section>

    <section class="quick-nav mb-xl animate-fade-in-up stagger-6">
      <h2 class="mb-lg">Quick Navigation</h2>
      <div class="grid-3">
        <button class="card nav-card hover-lift click-ripple" data-route="vee-model">
          <div class="nav-card-icon">📐</div>
          <h4>Vee Model</h4>
          <p class="text-xs text-secondary">Project delivery lifecycle view</p>
        </button>
        <button class="card nav-card hover-lift click-ripple" data-route="interdependency">
          <div class="nav-card-icon">🔗</div>
          <h4>Dependencies</h4>
          <p class="text-xs text-secondary">Process relationships & consistency rules</p>
        </button>
        <button class="card nav-card hover-lift click-ripple" data-route="matrix">
          <div class="nav-card-icon">📊</div>
          <h4>Metric Matrix</h4>
          <p class="text-xs text-secondary">Process-metric applicability mapping</p>
        </button>
      </div>
    </section>
  `;

    // Styles for this view
    const style = document.createElement('style');
    style.textContent = `
    .hero { text-align: center; padding: 60px 20px 40px; }
    .hero-badge { display: inline-block; padding: 4px 16px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); border-radius: 20px; font-size: 12px; color: var(--accent-primary-light); font-weight: 600; margin-bottom: 16px; }
    .hero-title { font-size: 3.5rem; font-weight: 900; line-height: 1.1; margin-bottom: 16px; }
    .gradient-text { background: linear-gradient(135deg, #6366f1, #22d3ee, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-subtitle { max-width: 640px; margin: 0 auto 32px; color: var(--text-secondary); font-size: 1.1rem; line-height: 1.7; }
    .hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .stats-strip { margin-top: 40px; margin-bottom: 48px; }
    .level-card { position: relative; overflow: hidden; }
    .level-card-basic { border-left: 3px solid var(--level-basic); }
    .level-card-standard { border-left: 3px solid var(--level-standard); }
    .level-card-comprehensive { border-left: 3px solid var(--level-comprehensive); }
    .level-range { padding: 4px 8px; background: rgba(255,255,255,0.03); border-radius: 6px; display: inline-block; }
    .process-list { list-style: none; }
    .process-list-item { padding: 6px 0; font-size: 14px; color: var(--text-secondary); border-bottom: 1px solid rgba(99,102,241,0.06); display: flex; align-items: center; gap: 8px; }
    .process-id { background: rgba(99,102,241,0.12); color: var(--accent-primary-light); padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; min-width: 24px; text-align: center; }
    .dimension-card { padding: 20px; }
    .nav-card { text-align: center; cursor: pointer; border: none; background: var(--bg-card); color: var(--text-primary); width: 100%; }
    .nav-card-icon { font-size: 2rem; margin-bottom: 8px; }
    .level-summary { text-align: center; }
    .level-count { font-size: 2.5rem; font-weight: 900; margin-bottom: 4px; }
    .basic-count { color: var(--level-basic); }
    .standard-count { color: var(--level-standard); }
    .comprehensive-count { color: var(--level-comprehensive); }
    @media (max-width: 768px) { .hero-title { font-size: 2rem; } }
  `;
    container.appendChild(style);

    // Event handlers
    container.querySelector('#btn-start-assessment').addEventListener('click', () => navigateTo('assessment'));
    container.querySelector('#btn-explore').addEventListener('click', () => navigateTo('processes'));
    container.querySelector('#btn-view-report')?.addEventListener('click', () => navigateTo('report'));
    container.querySelectorAll('.nav-card').forEach(card => {
        card.addEventListener('click', () => navigateTo(card.dataset.route));
    });
}
