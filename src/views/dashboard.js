/** Dashboard View — focused start/resume surface with framework detail on demand. */
import { FRAMEWORK_META, CORE_PROCESSES, DIMENSIONS, ACTIVE_CONSISTENCY_RULES } from '../data/se-tailoring-data.js';
import { getState, getElementCount, getAssessmentWorkspace, createWorkspaceAssessment, switchWorkspaceAssessment, duplicateWorkspaceAssessment, renameWorkspaceAssessment, revealSavedWorkspaceAssessments, showToast } from '../state.js';
import { navigateTo } from '../router.js';
import { escapeHtml } from '../utils/safe-text.js';
import { assessMetricCompleteness } from '../utils/assessment-integrity.js';

export function renderDashboard(container) {
    const state = getState();
    const workspace = getAssessmentWorkspace();
    const activeAssessment = workspace.assessments.find(entry => entry.active);
    const hasAssessment = Object.keys(state.scores || {}).length > 0;
    const basicCount = Object.values(state.levels || {}).filter(level => level === 'basic').length;
    const standardCount = Object.values(state.levels || {}).filter(level => level === 'standard').length;
    const comprehensiveCount = Object.values(state.levels || {}).filter(level => level === 'comprehensive').length;
    const completeness = assessMetricCompleteness(state.scores, state.metricAssessments);

    container.innerHTML = `
      <section class="card current-work" aria-labelledby="workspace-next-title">
        <div>
          <span class="eyebrow">${state.assessmentComplete ? 'Software completeness checks passed' : 'Your next step'}</span>
          <h2 id="workspace-next-title">${activeAssessment ? escapeHtml(activeAssessment.name) : 'Plan your systems engineering work'}</h2>
          <p class="text-sm text-secondary mt-sm">${hasAssessment ? `${completeness.completeCount}/${FRAMEWORK_META.metricCount} judgments reviewed. ${state.assessmentComplete ? `${basicCount} Basic · ${standardCount} Standard · ${comprehensiveCount} Comprehensive. External approval not verified.` : 'Continue with the next unreviewed judgment.'}` : 'Define one project or system, then answer 16 context questions.'}</p>
        </div>
        <div class="hero-actions"><button class="btn btn-primary" id="btn-current-work">${state.assessmentComplete ? 'View report' : hasAssessment ? 'Resume assessment' : 'Start assessment'} →</button>${hasAssessment ? '<button class="btn btn-secondary" id="btn-current-decisions">Review decisions</button>' : '<a class="btn btn-secondary" href="#help?topic=start">Quick start guide</a>'}</div>
      </section>
      <section class="card assessment-library" aria-labelledby="assessment-library-title">
        <div class="library-heading">
          <div><span class="eyebrow">Browser-local workspace</span><h2 id="assessment-library-title">Your assessments</h2></div>
          ${activeAssessment ? '<div class="hero-actions"><button class="btn btn-primary btn-sm" id="btn-library-assess" type="button">Rate this assessment</button><button class="btn btn-secondary btn-sm" id="btn-duplicate-assessment" type="button">Duplicate current</button></div>' : ''}
        </div>
        <p class="text-sm text-secondary mt-sm">Keep independent projects or options here. Switching saves the current assessment first. System elements are parts within one assessment.</p>
        <details class="library-storage-note mt-sm"><summary>Saving, backup and privacy</summary><p class="text-sm text-secondary mt-sm"><strong>Back up important work.</strong> This library is only in this browser and has no cloud backup. Use Session → Private backup for a complete copy of each assessment. Minimum-data Export omits names, notes, evidence, and decision records. Use non-identifying codes; do not enter sensitive information.</p></details>
        ${workspace.error ? '<p class="text-sm mt-md" role="alert">The library could not be saved or loaded. Keep this page open and use Private backup before reloading. Your current work has not been replaced.</p>' : ''}
        ${workspace.locked ? '<p class="text-secondary mt-md">Restore your saved session to open the library, or choose Start Fresh to preserve it and begin separately.</p>' : `
          <ul class="assessment-library-list" aria-label="Saved assessments">
            ${workspace.assessments.map(entry => `<li class="assessment-library-item${entry.active ? ' is-active' : ''}">
              <div><h3>${escapeHtml(entry.name)}</h3><p class="text-sm text-secondary">${entry.active ? 'Current assessment · ' : ''}${entry.reviewedCount} judgments confirmed${entry.hasRecommendation ? ' · recommendation available' : ''}</p></div>
              ${entry.active ? '<span class="library-current">Open</span>' : `<button class="btn btn-secondary btn-sm" type="button" data-open-assessment="${escapeHtml(entry.id)}" aria-label="Open assessment ${escapeHtml(entry.name)}">Open</button>`}
            </li>`).join('')}
          </ul>
          ${workspace.hiddenCount ? `<div class="mt-md"><p class="text-sm text-secondary">${workspace.hiddenCount} previous assessment${workspace.hiddenCount === 1 ? ' is' : 's are'} preserved. Open them only if this browser library belongs to your session.</p><button class="btn btn-secondary btn-sm mt-sm" id="btn-reveal-assessments" type="button">Show saved assessments</button></div>` : ''}
          ${activeAssessment ? `<form class="library-form" id="assessment-rename-form">
            <div><label class="text-sm" for="assessment-name">Current assessment name / code</label><input class="input" id="assessment-name" maxlength="120" required value="${escapeHtml(activeAssessment.name)}"></div>
            <button class="btn btn-secondary btn-sm" type="submit">Rename assessment</button>
          </form>` : ''}
          <form class="library-form" id="assessment-create-form">
            <div><label class="text-sm" for="new-assessment-name">New assessment name / code</label><input class="input" id="new-assessment-name" maxlength="120" required placeholder="e.g., PILOT-07 · option B"></div>
            <button class="btn btn-primary" type="submit">Create assessment</button>
          </form>
        `}
      </section>

      ${state.semanticMigration?.status === 'review-required' ? `<section class="card migration-notice">
        <strong>Older assessment needs review</strong>
        <p class="text-sm text-secondary mt-sm">${state.semanticMigration?.reason === 'completion-contract-coherence'
          ? `This saved record could not prove which neutral values were explicitly reviewed. Its scores remain available for preview, but all ${FRAMEWORK_META.metricCount} anchors must be reconfirmed before software completeness can pass.`
          : `This record used an older semantic contract. Reassess ${escapeHtml((state.semanticMigration?.reassessmentMetrics || []).join(', ') || 'the flagged metrics')} before software completeness can pass.`}</p>
      </section>` : ''}

      ${hasAssessment || workspace.assessments.length > 1 ? '<details class="card framework-introduction"><summary>Framework introduction and references</summary>' : ''}
      <section class="dashboard-hero animate-fade-in-up">
        <div class="hero-badge">A decision aid for project teams</div>
        <p class="hero-kicker">Systems engineering process tailoring</p>
        <h1>Plan the systems engineering<br><span>your project needs.</span></h1>
        <p class="hero-subtitle">Describe your project, review a suggested level of effort for each process, and decide what work and evidence are needed. Start with the boundary and information you know; record uncertainty where evidence is missing.</p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" id="btn-start-assessment">${hasAssessment ? 'Continue assessment' : 'Start assessment'}</button>
          <a class="btn btn-secondary btn-lg" href="#help">How to use the framework</a>
        </div>
        <div class="framework-facts" aria-label="Framework scope">
          <span><strong>${FRAMEWORK_META.metricCount}</strong> project questions</span>
          <span><strong>${FRAMEWORK_META.coreProcessCount}</strong> process recommendations</span>
          <span><strong>${FRAMEWORK_META.tailoringLevels.length}</strong> tailoring levels</span>
        </div>
      </section>



      <section class="how-it-works animate-fade-in-up stagger-3">
        <div class="section-heading">
          <span class="eyebrow">A straightforward path</span>
          <h2>How it works</h2>
        </div>
        <div class="grid-3">
          <article class="card step-card"><span>01</span><h3>Describe the project</h3><p class="text-sm text-secondary">Define what is in scope. Choose the description that fits each question, or mark it Unknown.</p></article>
          <article class="card step-card"><span>02</span><h3>Review priorities</h3><p class="text-sm text-secondary">Check why each process was recommended. Resolve warnings and compare the result with your project needs.</p></article>
          <article class="card step-card"><span>03</span><h3>Apply the guidance</h3><p class="text-sm text-secondary">Adapt the activities and evidence to your way of working, then agree responsibilities and approval.</p></article>
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
      ${hasAssessment || workspace.assessments.length > 1 ? '</details>' : ''}
    `;

    const style = document.createElement('style');
    style.textContent = `
      .library-storage-note > summary { cursor:pointer; color:var(--text-secondary); font-size:13px; }
      .assessment-library { margin:0 0 24px; }
      .framework-introduction > summary { cursor:pointer; font-weight:700; }
      .library-heading { display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; }
      .library-heading h2 { margin-top:6px; }
      .assessment-library-list { list-style:none; padding:0; margin:20px 0; display:grid; gap:8px; max-height:360px; overflow-y:auto; }
      .assessment-library-item { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:14px; border:1px solid var(--border-subtle); border-radius:var(--radius-md); }
      .assessment-library-item.is-active { border-color:var(--accent-primary); background:rgba(99,102,241,.07); }
      .assessment-library-item h3 { font-size:16px; overflow-wrap:anywhere; margin-bottom:6px; }
      .assessment-library-item > div { min-width:0; }
      .assessment-library-item .btn,.library-current { flex:0 0 auto; }
      .library-current { color:var(--accent-primary-light); font-size:12px; font-weight:700; }
      .library-form { display:flex; align-items:flex-end; gap:12px; margin-top:16px; }
      .library-form > div { flex:1; min-width:0; }
      .library-form label { display:block; margin-bottom:6px; }
      @media(max-width:600px) { .library-form { flex-direction:column; align-items:stretch; } .library-form .btn { width:100%; } }

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
      .current-work { display:flex; align-items:center; justify-content:space-between; gap:24px; margin:0 0 24px; border-left:3px solid var(--accent-primary); }
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

    const refreshWorkspace = (succeeded, message) => {
        if (!succeeded) {
            showToast('Your current assessment is still open. Resolve the storage warning before changing assessments.', 'error');
            return;
        }
        showToast(message, 'success');
        navigateTo('dashboard', {}, { replace: true });
    };
    container.querySelector('#assessment-create-form')?.addEventListener('submit', event => {
        event.preventDefault();
        const name = container.querySelector('#new-assessment-name').value.trim();
        if (!name) return;
        refreshWorkspace(createWorkspaceAssessment(name), 'New independent assessment created. Previous work is preserved.');
    });
    container.querySelector('#assessment-rename-form')?.addEventListener('submit', event => {
        event.preventDefault();
        const name = container.querySelector('#assessment-name').value.trim();
        if (!name) return;
        refreshWorkspace(renameWorkspaceAssessment(name), 'Assessment renamed.');
    });
    container.querySelector('#btn-duplicate-assessment')?.addEventListener('click', () => refreshWorkspace(duplicateWorkspaceAssessment(), 'Independent copy created. External approval is not verified.'));
    container.querySelectorAll('[data-open-assessment]').forEach(button => button.addEventListener('click', () => refreshWorkspace(switchWorkspaceAssessment(button.dataset.openAssessment), 'Assessment opened.')));
    container.querySelector('#btn-reveal-assessments')?.addEventListener('click', () => {
        revealSavedWorkspaceAssessments();
        navigateTo('dashboard', {}, { replace: true });
    });
    container.querySelector('#btn-library-assess')?.addEventListener('click', () => navigateTo('assessment'));
    container.querySelector('#btn-current-decisions')?.addEventListener('click', () => navigateTo('adjust'));
    container.querySelector('#btn-start-assessment')?.addEventListener('click', () => navigateTo('assessment'));
    container.querySelector('#btn-explore')?.addEventListener('click', () => navigateTo('processes'));
    container.querySelector('#btn-current-work')?.addEventListener('click', () => navigateTo(state.assessmentComplete ? 'report' : 'assessment', !state.assessmentComplete && hasAssessment ? { resume: '1' } : {}));
    container.querySelectorAll('.nav-card').forEach(card => card.addEventListener('click', () => navigateTo(card.dataset.route)));
}
