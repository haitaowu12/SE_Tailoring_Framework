import{A as e,Ct as t,Pt as n,_ as r,a as i,d as a,dt as o,f as s,g as c,ht as l,kt as u,l as d,n as f,pt as p,r as m,s as h}from"./index-tTzzMvnf.js";function g(g,_={}){let v=_.path===`library`,y=d(),b=i(),x=b.assessments.find(e=>e.active),S=Object.keys(y.scores||{}).length>0,C=Object.values(y.levels||{}).filter(e=>e===`basic`).length,w=Object.values(y.levels||{}).filter(e=>e===`standard`).length,T=Object.values(y.levels||{}).filter(e=>e===`comprehensive`).length,E=e(y.scores,y.metricAssessments);g.innerHTML=`
      ${!v&&S?`<section class="card current-work" aria-labelledby="workspace-next-title">
        <div>
          <span class="eyebrow">${y.assessmentComplete?`Software completeness checks passed`:S?`Work in progress`:`Your next step`}</span>
          <h2 id="workspace-next-title">${x?p(x.name):`Plan your systems engineering work`}</h2>
          <p class="text-sm text-secondary mt-sm">${S?`${E.completeCount}/${l.metricCount} reviewed. ${y.assessmentComplete?`${C} Basic · ${w} Standard · ${T} Comprehensive. External approval not verified.`:`Continue with the next unreviewed judgment.`}`:`Define one project or system, then answer 16 context questions.`}</p>
        </div>
        <div class="hero-actions"><button class="btn btn-primary" id="btn-current-work">${y.assessmentComplete?`View report`:S?`Resume assessment`:`Start assessment`} →</button>${S?`<button class="btn btn-secondary" id="btn-current-decisions">Review decisions</button>`:`<a class="btn btn-secondary" href="#help?topic=start">Quick start guide</a>`}</div>
      </section>`:``}
      ${v?`<section class="card assessment-library" aria-labelledby="assessment-library-title">
        <div class="library-heading">
          <div><span class="eyebrow">Browser-local workspace</span><h2 id="assessment-library-title">Your assessments</h2></div>
          ${x?`<div class="hero-actions"><button class="btn btn-primary btn-sm" id="btn-library-assess" type="button">Continue assessment</button><button class="btn btn-secondary btn-sm" id="btn-duplicate-assessment" type="button">Duplicate current</button></div>`:``}
        </div>
        <p class="text-sm text-secondary mt-sm">Keep independent projects or options here. Switching saves the current assessment first. System elements are parts within one assessment.</p>
        <details class="library-storage-note mt-sm"><summary>Saving, backup and privacy</summary><p class="text-sm text-secondary mt-sm"><strong>Back up important work.</strong> This library is only in this browser and has no cloud backup. Use Session → Private backup for a complete copy of each assessment. Minimum-data Export omits names, notes, evidence, and decision records. Use non-identifying codes; do not enter sensitive information.</p></details>
        ${b.error?`<p class="text-sm mt-md" role="alert">The library could not be saved or loaded. Keep this page open and use Private backup before reloading. Your current work has not been replaced.</p>`:``}
        ${b.locked?`<p class="text-secondary mt-md">Restore your saved session to open the library, or choose Start Fresh to preserve it and begin separately.</p>`:`
          <ul class="assessment-library-list" aria-label="Saved assessments">
            ${b.assessments.map(e=>`<li class="assessment-library-item${e.active?` is-active`:``}">
              <div><h3>${p(e.name)}</h3><p class="text-sm text-secondary">${e.active?`Current assessment · `:``}${e.reviewedCount} judgments confirmed${e.hasRecommendation?` · recommendation available`:``}</p></div>
              ${e.active?`<span class="library-current">Open</span>`:`<button class="btn btn-secondary btn-sm" type="button" data-open-assessment="${p(e.id)}" aria-label="Open assessment ${p(e.name)}">Open</button>`}
            </li>`).join(``)}
          </ul>
          ${b.hiddenCount?`<div class="mt-md"><p class="text-sm text-secondary">${b.hiddenCount} previous assessment${b.hiddenCount===1?` is`:`s are`} preserved. Open them only if this browser library belongs to your session.</p><button class="btn btn-secondary btn-sm mt-sm" id="btn-reveal-assessments" type="button">Show saved assessments</button></div>`:``}
          ${x?`<form class="library-form" id="assessment-rename-form">
            <div><label class="text-sm" for="assessment-name">Current assessment name / code</label><input class="input" id="assessment-name" maxlength="120" required value="${p(x.name)}"></div>
            <button class="btn btn-secondary btn-sm" type="submit">Rename assessment</button>
          </form>`:``}
          <form class="library-form" id="assessment-create-form">
            <div><label class="text-sm" for="new-assessment-name">New assessment name / code</label><input class="input" id="new-assessment-name" maxlength="120" required placeholder="e.g., PILOT-07 · option B"></div>
            <button class="btn btn-primary" type="submit">Create assessment</button>
          </form>
        `}
      </section>`:``}
      ${v?``:`
      ${y.semanticMigration?.status===`review-required`?`<section class="card migration-notice">
        <strong>Older assessment needs review</strong>
        <p class="text-sm text-secondary mt-sm">${y.semanticMigration?.reason===`completion-contract-coherence`?`This saved record could not prove which neutral values were explicitly reviewed. Its scores remain available for preview, but all ${l.metricCount} anchors must be reconfirmed before software completeness can pass.`:`This record used an older semantic contract. Reassess ${p((y.semanticMigration?.reassessmentMetrics||[]).join(`, `)||`the flagged metrics`)} before software completeness can pass.`}</p>
      </section>`:``}

      ${S?`<details class="card framework-introduction"><summary>Framework introduction and references</summary>`:``}
      <div class="dashboard-opening">
      <section class="dashboard-hero">
        <p class="hero-kicker">Systems engineering process tailoring</p>
        <h1>Plan the systems engineering <span>your project needs.</span></h1>
        <p class="hero-subtitle">Define your project boundary, review the suggested rigor for each process, and decide what work and evidence are needed. Record uncertainty where evidence is missing.</p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" id="btn-start-assessment">${S?`Continue assessment`:`Start assessment`}</button>
          <a class="btn btn-secondary btn-lg" href="#help">How to use the framework</a>
        </div>
        <div class="framework-facts" aria-label="Framework scope">
          <span><strong>${l.metricCount}</strong> project questions</span>
          <span><strong>${l.coreProcessCount}</strong> process recommendations</span>
          <span><strong>${l.tailoringLevels.length}</strong> tailoring levels</span>
        </div>
      </section>



      <section class="how-it-works" aria-labelledby="how-it-works-title">
        <div class="section-heading">
          <h2 id="how-it-works-title">From context to a process plan</h2>
        </div>
        <ol class="workflow-steps" role="list">
          <li class="step-card"><span>01</span><h3>Describe the project</h3><p class="text-sm text-secondary">Define what is in scope. Choose the description that fits each question, or mark it Unknown.</p></li>
          <li class="step-card"><span>02</span><h3>Review priorities</h3><p class="text-sm text-secondary">Check why each process was recommended. Resolve warnings and compare the result with your project needs.</p></li>
          <li class="step-card"><span>03</span><h3>Apply the guidance</h3><p class="text-sm text-secondary">Adapt the activities and evidence to your way of working, then agree responsibilities and approval.</p></li>
        </ol>
      </section>
      </div>

      <section class="explore-section" aria-labelledby="explore-title">
        <div class="section-heading">
          <h2 id="explore-title">Explore the framework</h2>
          <p class="text-sm text-secondary">Use these views when you need more context. They are supporting references, not extra assessment steps.</p>
        </div>
        <div class="framework-links">
          <button class="nav-card" type="button" data-route="processes"><span>Guidance</span><h3>Process explorer</h3><p>Browse activities and outputs by tailoring level.</p></button>
          <button class="nav-card" type="button" data-route="elements"><span>${h()} configured</span><h3>System elements</h3><p>Tailor parts of a larger system when needed.</p></button>
          <button class="nav-card" type="button" data-route="vee-model"><span>Lifecycle</span><h3>Vee model</h3><p>See where process guidance fits in delivery.</p></button>
          <button class="nav-card" type="button" data-route="interdependency"><span>${t.length} checks</span><h3>Dependencies</h3><p>Understand consistency rules between processes.</p></button>
        </div>
      </section>

      <details class="card method-details">
        <summary>Learn how the framework is organized</summary>
        <div class="method-details-body">
          <div>
            <h3>${l.tailoringLevels.length} levels</h3>
            <p class="text-sm text-secondary"><strong>Basic</strong> keeps the essentials. <strong>Standard</strong> adds coordination and evidence. <strong>Comprehensive</strong> adds the highest rigor for demanding contexts.</p>
          </div>
          <div>
            <h3>${u.length} assessment areas</h3>
            <ul>${u.map(e=>`<li><strong>${p(e.name)}</strong> · ${e.metrics.length} questions</li>`).join(``)}</ul>
          </div>
          <div>
            <h3>Process scope</h3>
            <p class="text-sm text-secondary">The executable assessment covers ${n.length} project-facing technical and technical-management processes. Other organizational processes remain reference material.</p>
          </div>
        </div>
      </details>
      ${S?`</details>`:``}
      `}
    `;let D=document.createElement(`style`);D.textContent=`
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

      .dashboard-opening { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(0,1fr); gap:clamp(32px,5vw,72px); align-items:start; padding:24px 0 48px; }
      .dashboard-hero { min-width:0; }
      .hero-kicker,.eyebrow { color:var(--accent-primary-light); font-size:12px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; }
      .dashboard-hero h1 { font-size:clamp(2rem,3.5vw,3.1rem); line-height:1.12; letter-spacing:-.035em; margin:16px 0 20px; max-width:22ch; }
      .dashboard-hero h1 span { color:var(--accent-primary-light); }
      .hero-subtitle { max-width:60ch; margin:0 0 24px; color:var(--text-secondary); font-size:1rem; line-height:1.7; }
      .hero-actions { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
      .dashboard-hero .btn { min-height:48px; padding:12px 18px; font-size:14px; }
      .framework-facts { display:flex; gap:24px; margin-top:28px; color:var(--text-secondary); font-size:13px; }
      .framework-facts > span { flex:1; max-width:150px; }
      .framework-facts strong { display:block; color:var(--text-primary); font-size:22px; font-weight:600; font-variant-numeric:tabular-nums; line-height:1.3; margin-bottom:4px; }
      .migration-notice { border-color:rgba(245,158,11,.45); background:rgba(245,158,11,.08); margin-bottom:18px; }
      .current-work { display:flex; align-items:center; justify-content:space-between; gap:24px; margin:0 0 24px; border-left:3px solid var(--accent-primary); }
      .current-work > div { min-width:0; max-width:100%; }
      .current-work h2 { margin-top:5px; overflow-wrap:anywhere; }
      .section-heading { margin-bottom:16px; }
      .section-heading h2 { font-size:24px; line-height:1.3; margin-bottom:8px; }
      .how-it-works { border-left:1px solid var(--border-subtle); padding-left:32px; }
      .how-it-works .section-heading h2 { font-size:20px; margin:0 0 20px; }
      .workflow-steps { list-style:none; }
      .step-card { display:grid; grid-template-columns:24px minmax(0,1fr); gap:4px 16px; padding:18px 0; border-top:1px solid var(--border-subtle); }
      .step-card > span { grid-row:1 / 3; color:var(--accent-primary-light); font-size:13px; font-variant-numeric:tabular-nums; padding-top:2px; }
      .step-card h3 { font-size:16px; line-height:1.5; }
      .step-card p { grid-column:2; line-height:1.65; }
      .explore-section { padding-top:28px; margin-bottom:28px; border-top:1px solid var(--border-subtle); }
      .explore-section .section-heading { max-width:64ch; }
      .framework-links { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); column-gap:40px; }
      .nav-card { display:grid; grid-template-columns:minmax(0,1fr) auto; align-content:start; gap:4px 16px; width:100%; padding:20px 0; text-align:left; cursor:pointer; font:inherit; color:var(--text-primary); background:none; border:0; border-bottom:1px solid var(--border-subtle); border-radius:0; }
      .nav-card > span { grid-column:2; grid-row:1; color:var(--text-secondary); font-size:12px; align-self:center; }
      .nav-card h3 { grid-column:1; grid-row:1; font-size:17px; color:var(--accent-primary-light); }
      .nav-card p { grid-column:1 / -1; color:var(--text-secondary); font-size:14px; line-height:1.6; }
      .nav-card:hover h3 { text-decoration:underline; text-underline-offset:4px; }
      .nav-card:focus-visible { outline:2px solid var(--accent-primary-light); outline-offset:4px; }
      .method-details { margin-bottom:48px; }
      .method-details > summary { cursor:pointer; font-weight:700; color:var(--accent-primary-light); }
      .method-details-body { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:28px; padding-top:24px; margin-top:18px; border-top:1px solid var(--border-subtle); }
      .method-details-body h3 { font-size:16px; margin-bottom:8px; }
      .method-details-body ul { list-style:none; display:grid; gap:8px; color:var(--text-secondary); font-size:13px; }
      @media (max-width: 520px) {
        .hero-actions { flex-direction: column; align-items: stretch; }
        .hero-actions .btn { width: 100%; }
      }
      @media (max-width:900px) { .dashboard-opening { grid-template-columns:1fr; gap:36px; padding:8px 0 32px; } .how-it-works { border-left:0; padding-left:0; } .dashboard-hero h1 { max-width:24ch; } }
      @media (max-width:760px) { .current-work { align-items:flex-start; flex-direction:column; } .method-details-body { grid-template-columns:1fr; } }
      @media (max-width:600px) { .framework-links { grid-template-columns:1fr; } .framework-facts { gap:16px; } .framework-facts > span { line-height:1.5; } .dashboard-hero .hero-actions .btn { white-space:normal; } }
    `,g.appendChild(D);let O=(e,t)=>{if(!e){c(`Your current assessment is still open. Resolve the storage warning before changing assessments.`,`error`);return}c(t,`success`),o(v?`library`:`dashboard`,{},{replace:!0})};g.querySelector(`#assessment-create-form`)?.addEventListener(`submit`,e=>{e.preventDefault();let t=g.querySelector(`#new-assessment-name`).value.trim();t&&O(f(t),`New independent assessment created. Previous work is preserved.`)}),g.querySelector(`#assessment-rename-form`)?.addEventListener(`submit`,e=>{e.preventDefault();let t=g.querySelector(`#assessment-name`).value.trim();t&&O(a(t),`Assessment renamed.`)}),g.querySelector(`#btn-duplicate-assessment`)?.addEventListener(`click`,()=>O(m(),`Independent copy created. External approval is not verified.`)),g.querySelectorAll(`[data-open-assessment]`).forEach(e=>e.addEventListener(`click`,()=>O(r(e.dataset.openAssessment),`Assessment opened.`))),g.querySelector(`#btn-reveal-assessments`)?.addEventListener(`click`,()=>{s(),o(v?`library`:`dashboard`,{},{replace:!0})}),g.querySelector(`#btn-library-assess`)?.addEventListener(`click`,()=>o(`assessment`)),g.querySelector(`#btn-current-decisions`)?.addEventListener(`click`,()=>o(`adjust`)),g.querySelector(`#btn-start-assessment`)?.addEventListener(`click`,()=>o(`assessment`)),g.querySelector(`#btn-explore`)?.addEventListener(`click`,()=>o(`processes`)),g.querySelector(`#btn-current-work`)?.addEventListener(`click`,()=>o(y.assessmentComplete?`report`:`assessment`,!y.assessmentComplete&&S?{resume:`1`}:{})),g.querySelectorAll(`.nav-card`).forEach(e=>e.addEventListener(`click`,()=>o(e.dataset.route)))}export{g as renderDashboard};