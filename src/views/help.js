/** Practitioner help. Changing this guidance does not change assessment rules. */
export function renderHelp(container, routeContext = null) {
  container.innerHTML = `
    <article class="help-guide">
      <header><p class="eyebrow">Using the framework</p><h1>Choose the systems engineering work your project needs</h1>
      <p>This tool recommends a starting level of effort for 22 systems engineering processes. Use it to discuss what work is needed, why, and which evidence will demonstrate it.</p>
      <p class="help-boundary"><strong>Prototype use only.</strong> Self-guided use is for internal review, training, synthetic scenarios, and non-consequential exploration. Facilitated pilot use requires separate study and session authorization. The tool does not approve a project, demonstrate compliance, or establish that its recommendations improve project outcomes.</p></header>
      <nav aria-label="Help topics"><a href="#help?topic=start">Start an assessment</a><a href="#help?topic=example">Worked example</a><a href="#help?topic=adapt">Adapt the framework</a><a href="#help?topic=terms">Terms and common questions</a></nav>
      <section id="help-start"><h2 tabindex="-1">Start with one system or project</h2>
      <ol>
        <li><strong>Define the decision.</strong> In Setup, describe what is inside and outside the assessed boundary, its life-cycle stage, and what this assessment will help decide. Use a non-identifying project code. Start with one assessment; use System Elements only if different parts need separate decisions.</li>
        <li><strong>Choose the closest supported description.</strong> Answer each of the 16 questions using the five rating descriptions. Record a short reason and a safe evidence reference. Select Cannot assess yet when evidence is missing; the assessment stays incomplete until resolved. Metric-level N/A is not supported. A displayed midpoint is a preview until you choose it; it is not a default answer.</li>
        <li><strong>Review the recommendation.</strong> Start with the highlighted processes, then check the full profile. Open View guidance to read the activities and expected evidence. Check the fit with your boundary and life-cycle stage.</li>
        <li><strong>Resolve decisions.</strong> Explain warnings, missing evidence, and requested adjustments. High schedule or budget pressure calls for a feasibility decision, such as changing scope, sequencing work, or adding capacity. It does not automatically lower rigor.</li>
        <li><strong>Save and agree the work.</strong> Use Decisions to keep or adjust recommendations and record rationale. Session → Private backup retains the current assessment, decision history, and drafts. Minimum-data Export is a reduced sharing copy. Agree responsibilities and approval outside the tool; revisit the assessment when scope, evidence, or obligations change.</li>
      </ol>
      <p><strong>Keep a backup:</strong> work is saved only in this browser, with no account login or cloud backup. Other users of this browser profile may be able to see it. Saving does not submit a case study.</p>
      <p><a class="btn btn-primary" href="#assessment">Start or continue assessment</a></p></section>
      <section><h2>Read the three levels</h2>
      <dl class="help-levels"><dt>Basic</dt><dd>Keep the process purpose and essential evidence, using simple activities and records.</dd><dt>Standard</dt><dd>Use a structured, coordinated approach with defined responsibilities, review, and traceability.</dd><dt>Comprehensive</dt><dd>Use more detailed analysis, control, and assurance where the context warrants them.</dd></dl>
      <p>These are framework categories, not certification or maturity ratings. Basic does not mean skipping the process. Existing project records can satisfy an information need; a separate document is not required for every process. Choose the content and evidence first, then a practical way to maintain them.</p></section>
      <section class="help-reference" aria-labelledby="help-reference-title"><h2 id="help-reference-title">Examples and advanced reference</h2>
      <p>Open the guidance you need. The quick start above is enough to begin.</p>
      <details id="help-example" class="help-disclosure"><summary>A small worked example</summary><div class="help-disclosure-body">
      <p><strong>Illustration only.</strong> A team is replacing an internal booking service. The boundary includes the service and its interfaces, but excludes changes to the corporate network. The immediate decision is how much integration and verification work to plan.</p>
      <p>The team reviews the integration descriptions and selects M4 = 4 because the planned interface and integration work matches that description. They record their reason and a reference to a redacted interface list. The framework requires at least Standard Integration and Configuration Management for this rating. Other answers may raise these or other processes further.</p>
      <p>The team opens the two process guides, compares the expected evidence with its existing integration plan and change log, and identifies what is missing. It does not treat Standard as a requirement to buy a tool or create a new board. If the guidance does not fit, it records the mismatch and proposes a specific alternative for review.</p>
      <p>For a case-study contribution, describe the work actually performed and its observed outcome separately from your opinion about what this recommendation might have improved.</p></div></details>
      <details id="help-adapt" class="help-disclosure"><summary>Adapt the framework to your needs</summary><div class="help-disclosure-body">
      <p><strong>For your project:</strong> choose the assessed boundary and stage, use your own evidence, and adapt the activities, record formats, tools, responsibilities, and review timing. Keep the intended process outcome and applicable obligations. Open Decisions from the navigation or recommendation review to record level choices, reasons, owner, evidence and review date; local records do not establish external approval.</p>
      <p><strong>For your organization:</strong> the metric-to-process matrix and consistency rules are proposed policy choices. They may need different allocations, thresholds, or examples for your domain. The app displays its shared matrix and rules read-only; editing a project does not change them.</p>
      <ol><li>Identify the exact cell, rule, rating description, or guidance passage you would change.</li><li>Give a real example or counterexample, the proposed replacement, and why it fits better.</li><li>Check the effect on connected processes, safety, security, environmental consequences, and binding obligations.</li><li>Compare the original and proposed outputs on representative cases, including borderline and adverse cases. Arrange domain review and record approval before adopting the change.</li></ol>
      <p>Share the proposed change with the framework maintainer through your agreed review channel. The maintainer can implement and test an agreed change in a separately identified configuration. Do not infer that removing a matrix cell removes a legal or contractual obligation.</p>
      <p><a href="#matrix">Inspect the matrix</a> · <a href="#interdependency">Inspect the rules</a> · <a href="#processes">Browse process guidance</a></p></div></details></section>
      <section id="help-terms"><h2 tabindex="-1">Terms and common questions</h2>
        <details class="help-disclosure"><summary>What do P, S, and a blank matrix cell mean?</summary><div class="help-disclosure-body"><p>P marks a primary driver; S marks a supporting driver. These are roles in the recommendation rule, not numerical weights. A blank means no direct mapping in the shared matrix. A process can still be raised by a minimum-level rule, a dependency, or a scoped obligation. Schedule, budget, and organizational culture are handled separately.</p></div></details>
        <details class="help-disclosure"><summary>How is a level selected?</summary><div class="help-disclosure-body"><p>The highest mapped rating starts the calculation. Ratings 1–2 indicate Basic; 3–4 indicate Standard. Comprehensive requires one Primary at 5 plus a different Primary at 3 or above, or one Primary at 5 plus a Secondary at 5. Primary support therefore qualifies at a lower threshold than Secondary support. One metric cannot support itself. A mapped safety or environmental rating of 5 is an explicit exception. Minimum-level rules and mandatory dependencies can then raise the result. Multiple high inputs do not prove that their evidence is independent.</p></div></details>
        <details class="help-disclosure"><summary>What is a floor or a hard constraint?</summary><div class="help-disclosure-body"><p>A floor sets the minimum level under a stated condition. A hard constraint raises a connected process when needed for consistency. These rules are the framework's policy; they do not replace checking the requirements that actually apply to your project. Warnings ask for a recorded judgment rather than an automatic increase. Advisory dependency chains do not impose a maximum level gap between adjacent processes.</p></div></details>
        <details class="help-disclosure"><summary>How does M15 affect binding assurance?</summary><div class="help-disclosure-body"><p>M15 has ordinary governance mappings as well as conditional binding-assurance mappings. Conditional mappings require a confirmed binding obligation with an applicable type, named authority, source reference, and scope covering the process. M15 at 4 or 5 can then activate the specified minimum levels for scoped processes. For Measurement and Quality Assurance, scoped M15 at 4 or 5 can also make the matching support rule mandatory when triggered. A high M15 rating alone does not activate these conditional mappings or impose a minimum on every process. Record the actual obligation and check its applicability.</p></div></details>
        <details class="help-disclosure"><summary>What should I do when ratings share evidence?</summary><div class="help-disclosure-body"><p>Explain each distinct consequence. One event may affect safety, service availability, and security, but repeating the same argument does not provide independent support. The app's shared-evidence warning does not remove double counting or change recommendations. Review this limitation when judging the result.</p></div></details>
        <details class="help-disclosure"><summary>Does a complete assessment mean the project is approved?</summary><div class="help-disclosure-body"><p>No. Software completeness checks confirmed ratings, rule and warning dispositions, required constraint responses, and hierarchy consistency. It does not check whether all project evidence is present, authenticate reviewers, confirm compliance, or authorize release. It does not demonstrate that the recommendation will improve delivery.</p></div></details>
        <details class="help-disclosure"><summary>Does selecting a phase change the recommended processes?</summary><div class="help-disclosure-body"><p>Phase and boundary describe the context for your ratings. Changing these fields alone does not filter processes or recalculate phase-specific requirements; reassess affected ratings and obligations. Check the guidance against your actual life-cycle work.</p></div></details>
        <details class="help-disclosure"><summary>Can I use this without a facilitator?</summary><div class="help-disclosure-body"><p>Only for prototype activities: internal review, training, synthetic scenarios, and non-consequential self-guided exploration. Facilitated research or pilot sessions require separate study and session authorization. This build does not support consequential self-service use. Ask a colleague with relevant project knowledge to review uncertain ratings and record disagreement rather than forcing a consensus.</p></div></details>
        <details class="help-disclosure"><summary>How do I keep multiple assessments?</summary><div class="help-disclosure-body"><p>Open Workspace to create, name, switch or duplicate independent assessments. System elements are parts inside one assessment. Import adds a new assessment. Start Fresh preserves older work; End Session explicitly erases the whole local library after confirmation.</p></div></details>
        <details class="help-disclosure"><summary>What happens when the recommendation changes?</summary><div class="help-disclosure-body"><p>Earlier reasons and history remain. Adjustments that are stale or conflict with current protected floors become review drafts instead of silently lowering the new recommendation. Review the inputs, then reconfirm the choices in Decisions.</p></div></details>
        <details class="help-disclosure"><summary>How do I save and share safely?</summary><div class="help-disclosure-body"><p>Use project codes and redacted summaries. Keep personal, confidential, export-controlled, privileged, and operationally sensitive content out of this prototype. Keep evidence in your approved repository and cite a safe reference.</p><p>Work is saved only in this browser. It has no account login or cloud backup and may be visible to other users of this browser profile. Private backup includes free text and decision records for the current assessment only; back up each assessment separately. Minimum-data JSON omits them. Pilot HTML retains free text and evidence references and is not de-identified. Inspect every exported file before sharing. Clearing a browser session does not delete files you have already downloaded.</p></div></details>
      </section>
    </article>
    <style>
      .help-guide{max-width:860px;margin:20px auto 64px;font-size:16px;line-height:1.7}
      .help-guide h1{font-size:clamp(28px,4vw,42px);line-height:1.15;margin:12px 0 22px}
      .help-guide h2{font-size:24px;margin-bottom:16px}.help-guide p{margin:14px 0;color:var(--text-secondary)}
      .help-guide section{padding-top:28px;margin-top:20px;border-top:1px solid var(--border-subtle);scroll-margin-top:100px}
      .help-guide nav{display:flex;gap:12px 24px;flex-wrap:wrap;margin:24px 0}.help-guide a{color:var(--accent-primary-light)}
      .help-guide ol{padding-left:24px}.help-guide li{margin:16px 0;color:var(--text-secondary)}
      .help-guide dt{font-weight:700;margin-top:16px}.help-guide dd{margin:6px 0 14px;color:var(--text-secondary)}
      .help-guide strong{color:var(--text-primary)}.help-guide a.btn{color:var(--text-on-accent,#061a1c)}
      .help-guide .help-boundary{border-left:3px solid var(--accent-primary-light);padding:8px 16px;font-size:14px}
      .help-disclosure{margin:12px 0;border:1px solid var(--border-subtle);border-radius:8px;scroll-margin-top:100px}
      .help-disclosure>summary{padding:16px;font-weight:650;line-height:1.45;cursor:pointer;color:var(--text-primary)}
      .help-disclosure[open]>summary{border-bottom:1px solid var(--border-subtle)}
      .help-disclosure-body{padding:0 16px 4px;overflow-wrap:anywhere}
      .help-guide :is(summary,a,h2):focus-visible{outline:2px solid var(--accent-primary-light);outline-offset:4px}
      @media(max-width:480px){.help-disclosure>summary{padding:14px}.help-disclosure-body{padding:0 14px 2px}}
    </style>`;

  const topic = routeContext?.params?.get('topic')
    || new URLSearchParams(location.hash.split('?')[1] || '').get('topic');
  function revealTopic(selectedTopic) {
    if (!['start', 'example', 'adapt', 'terms'].includes(selectedTopic)) return;
    const target = container.querySelector(`#help-${selectedTopic}`);
    if (!target) return;
    if (target.matches('details')) target.open = true;
    const focusTarget = target.querySelector('summary, h2');
    requestAnimationFrame(() => {
      // A newer route may have replaced this Help view before the frame runs.
      if (!container.contains(target)) return;
      focusTarget?.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  }
  revealTopic(topic);
  container.querySelectorAll('nav[aria-label="Help topics"] a').forEach(link => {
    link.addEventListener('click', event => {
      // Reusing the current topic link must reopen a manually closed disclosure.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.hash !== location.hash) return;
      event.preventDefault();
      revealTopic(new URLSearchParams(link.hash.split('?')[1] || '').get('topic'));
    });
  });
}
