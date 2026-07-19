/** Dashboard View — focused start/resume surface with framework detail on demand. */
import { FRAMEWORK_META, CORE_PROCESSES, DIMENSIONS, ACTIVE_CONSISTENCY_RULES } from '../data/se-tailoring-data.js';
import { getState, getElementCount } from '../state.js';
import { navigateTo } from '../router.js';
import { escapeHtml, safeText } from '../utils/safe-text.js';
import { assessMetricCompleteness } from '../utils/assessment-integrity.js';

export function renderDashboard(container) {
    const state = getState();
    const hasAssessment = Object.keys(state.scores || {}).length > 0;
    const projectName = escapeHtml(safeText(state.projectInfo.name, 'Current project'));
    const basicCount = Object.values(state.levels || {}).filter(level => level === 'basic').length;
    const standardCount = Object.values(state.levels || {}).filter(level => level === 'standard').length;
    const comprehensiveCount = Object.values(state.levels || {}).filter(level => level === 'comprehensive').length;
    const completeness = assessMetricCompleteness(state.scores, state.metricAssessments);

    container.innerHTML = `
      ${state.semanticMigration?.status === 'review-required' ? `<section class="card migration-notice">
        <strong>Older assessment needs review</strong>
        <p class="text-sm text-secondary mt-sm">${state.semanticMigration?.reason === 'completion-contract-coherence'
          ? `This 4.1.0 record could not prove which neutral values were explicitly reviewed. Its scores remain available for preview, but all ${FRAMEWORK_META.metricCount} anchors must be reconfirmed before software completeness can pass.`
          : `This record used an older semantic contract. Reassess ${escapeHtml((state.semanticMigration?.reassessmentMetrics || []).join(', ') || 'the flagged metrics')} before software completeness can pass.`}</p>
      </section>` : ''}

      <section class="dashboard-hero animate-fade-in-up">
        <div class="hero-badge">Version ${FRAMEWORK_META.version} · Standards-informed process architecture</div>
        <p class="hero-kicker">Systems engineering process tailoring</p>
        <h1>Right-size the work.<br><span>Keep the reasoning visible.</span></h1>
        <p class="hero-subtitle">Review ${FRAMEWORK_META.metricCount} provisional ordinal judgments and inspect recommendations for ${FRAMEWORK_META.coreProcessCount} systems engineering processes. Neutral score 3 is preview-only until explicitly confirmed.</p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" id="btn-start-assessment">${hasAssessment ? 'Continue assessment' : 'Start assessment'}</button>
          <button class="btn btn-secondary btn-lg" id="btn-explore">Explore process guidance</button>
        </div>
        <div class="framework-facts" aria-label="Framework scope">
          <span><strong>${FRAMEWORK_META.metricCount}</strong> project questions</span>
          <span><strong>${FRAMEWORK_META.coreProcessCount}</strong> process recommendations</span>
          <span><strong>${FRAMEWORK_META.tailoringLevels.length}</strong> tailoring levels</span>
        </div>
      </section>

      ${hasAssessment ? `<section class="card current-work animate-fade-in-up stagger-2">
        <div>
          <span class="eyebrow">${state.assessmentComplete ? 'Software completeness checks passed' : 'Work in progress'}</span>
          <h2>${projectName}</h2>
          <p class="text-sm text-secondary mt-sm">${completeness.completeCount}/${FRAMEWORK_META.metricCount} reviewed · ${state.assessmentComplete ? `${basicCount} Basic · ${standardCount} Standard · ${comprehensiveCount} Comprehensive recommendations. External approval not verified.` : 'Saved in this browser. Continue with the next unreviewed judgment.'}</p>
        </div>
        <button class="btn btn-secondary" id="btn-current-work">${state.assessmentComplete ? 'View report' : 'Resume assessment'} →</button>
      </section>` : ''}

      <section class="how-it-works animate-fade-in-up stagger-3">
        <div class="section-heading">
          <span class="eyebrow">A straightforward path</span>
          <h2>How it works</h2>
        </div>
        <div class="grid-3">
          <article class="card step-card"><span>01</span><h3>Describe the project</h3><p class="text-sm text-secondary">Confirm each anchor or mark it Unknown. Untouched neutral previews never count as reviewed.</p></article>
          <article class="card step-card"><span>02</span><h3>Review priorities</h3><p class="text-sm text-secondary">Use the grouped ordinal profile and issue list before opening the complete process breakdown.</p></article>
          <article class="card step-card"><span>03</span><h3>Apply the guidance</h3><p class="text-sm text-secondary">Open a process to see the expected activities, outputs, and practical level guidance.</p></article>
        </div>
      </section>

      <section class="explore-section animate-fade-in-up stagger-4">
        <div class="section-heading">
          <span class="eyebrow">Supporting tools</span>
          <h2>Explore the framework</h2>
          <p class="text-sm text-secondary">Use these views when you need more context. They are supporting references, not extra assessment steps.</p>
        </div>
        <div class="grid-4">
          <button class="card nav-card hover-lift" data-route="processes"><span>Guidance</span><h3>Process explorer</h3><p>Browse activities and outputs by tailoring level.</p></button>
          <button class="card nav-card hover-lift" data-route="elements"><span>${getElementCount()} configured</span><h3>System elements</h3><p>Tailor parts of a larger system when needed.</p></button>
          <button class="card nav-card hover-lift" data-route="vee-model"><span>Lifecycle</span><h3>Vee model</h3><p>See where process guidance fits in delivery.</p></button>
          <button class="card nav-card hover-lift" data-route="interdependency"><span>${ACTIVE_CONSISTENCY_RULES.length} checks</span><h3>Dependencies</h3><p>Understand consistency rules between processes.</p></button>
        </div>
      </section>

      <details class="card method-details animate-fade-in-up stagger-5">
        <summary>Learn how the framework is organized</summary>
        <div class="method-details-body">
          <div>
            <h3>${FRAMEWORK_META.tailoringLevels.length} levels</h3>
            <p class="text-sm text-secondary"><strong>Basic</strong> keeps the essentials. <strong>Standard</strong> adds coordination and evidence. <strong>Comprehensive</strong> adds the highest rigor for demanding contexts.</p>
          </div>
          <div>
            <h3>${DIMENSIONS.length} assessment areas</h3>
            <ul>${DIMENSIONS.map(dimension => `<li><strong>${escapeHtml(dimension.name)}</strong> · ${dimension.metrics.length} questions</li>`).join('')}</ul>
          </div>
          <div>
            <h3>Process scope</h3>
            <p class="text-sm text-secondary">The executable assessment covers ${CORE_PROCESSES.length} project-facing technical and technical-management processes. Other organizational processes remain reference material.</p>
          </div>
        </div>
      </details>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .dashboard-hero { max-width: 980px; margin: 0 auto; padding: 64px 20px 46px; text-align: center; }
      .hero-badge { display:inline-block; padding:4px 14px; border:1px solid var(--border-subtle); border-radius:999px; color:var(--text-secondary); font-size:12px; margin-bottom:24px; }
      .hero-kicker,.eyebrow { color:var(--accent-primary-light); font-size:11px; font-weight:800; letter-spacing:.09em; text-transform:uppercase; }
      .dashboard-hero h1 { font-size:clamp(2.3rem,6vw,4.8rem); line-height:1.02; letter-spacing:-.045em; max-width:860px; margin:10px auto 20px; }
      .dashboard-hero h1 span { color:var(--accent-primary-light); }
      .hero-subtitle { max-width:700px; margin:0 auto 28px; color:var(--text-secondary); font-size:1.05rem; line-height:1.7; }
      .hero-actions { display:flex; justify-content:center; gap:12px; flex-wrap:wrap; }
      .framework-facts { display:flex; justify-content:center; gap:28px; flex-wrap:wrap; margin-top:34px; color:var(--text-secondary); font-size:13px; }
      .framework-facts strong { color:var(--text-primary); font-size:17px; margin-right:4px; }
      .migration-notice { border-color:rgba(245,158,11,.45); background:rgba(245,158,11,.08); margin-bottom:18px; }
      .current-work { display:flex; align-items:center; justify-content:space-between; gap:24px; margin:0 auto 64px; max-width:900px; border-left:3px solid var(--accent-primary); }
      .current-work h2 { margin-top:5px; }
      .how-it-works,.explore-section { margin-bottom:64px; }
      .section-heading { max-width:680px; margin-bottom:20px; }
      .section-heading h2 { margin:5px 0 8px; }
      .step-card { min-height:190px; }
      .step-card > span { color:var(--accent-primary-light); font-size:12px; font-weight:800; }
      .step-card h3 { margin:28px 0 8px; font-size:18px; }
      .nav-card { width:100%; min-height:190px; text-align:left; cursor:pointer; color:var(--text-primary); background:var(--bg-card); }
      .nav-card > span { color:var(--accent-primary-light); font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.06em; }
      .nav-card h3 { margin:28px 0 8px; font-size:17px; }
      .nav-card p { color:var(--text-secondary); font-size:12px; line-height:1.55; }
      .method-details { margin-bottom:48px; }
      .method-details > summary { cursor:pointer; font-weight:700; color:var(--accent-primary-light); }
      .method-details-body { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:28px; padding-top:24px; margin-top:18px; border-top:1px solid var(--border-subtle); }
      .method-details-body h3 { font-size:16px; margin-bottom:8px; }
      .method-details-body ul { list-style:none; display:grid; gap:8px; color:var(--text-secondary); font-size:13px; }
      @media (max-width: 520px) {
        .hero-actions { flex-direction: column; align-items: stretch; }
        .hero-actions .btn { width: 100%; }
        #btn-explore { white-space: normal; }
      }
      @media (max-width:760px) { .dashboard-hero { padding-top:38px; } .framework-facts { gap:14px; flex-direction:column; } .current-work { align-items:flex-start; flex-direction:column; } .method-details-body { grid-template-columns:1fr; } }
    `;
    container.appendChild(style);

    container.querySelector('#btn-start-assessment')?.addEventListener('click', () => navigateTo('assessment'));
    container.querySelector('#btn-explore')?.addEventListener('click', () => navigateTo('processes'));
    container.querySelector('#btn-current-work')?.addEventListener('click', () => navigateTo(state.assessmentComplete ? 'report' : 'assessment'));
    container.querySelectorAll('.nav-card').forEach(card => card.addEventListener('click', () => navigateTo(card.dataset.route)));
}
