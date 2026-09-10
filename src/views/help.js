/** Practitioner help. Changing this guidance does not change assessment rules. */
export function renderHelp(container) {
  container.innerHTML = `
    <article class="help-guide">
      <header><p class="eyebrow">Using the framework</p><h1>Choose the systems engineering work your project needs</h1>
      <p>This tool recommends a starting level of effort for 22 systems engineering processes. Use it to discuss what work is needed, why it is needed, and which evidence will demonstrate it. The recommendation needs professional review before your organization adopts it.</p></header>
      <nav aria-label="Help topics"><a href="#help?topic=start">Start an assessment</a><a href="#help?topic=example">Worked example</a><a href="#help?topic=adapt">Adapt the framework</a><a href="#help?topic=terms">Terms and common questions</a></nav>
      <section id="help-start"><h2>Start with one system or project</h2>
      <ol>
        <li><strong>Define the decision.</strong> In Setup, describe what is inside and outside the assessed boundary, its life-cycle stage, and what this assessment will help decide. Use a non-identifying project code. Start with one assessment; use System Elements only if different parts need separate decisions.</li>
        <li><strong>Choose the closest supported description.</strong> Answer each of the 16 questions using the five rating descriptions. Record a short reason and a safe reference to the evidence. Select Unknown when evidence is missing. A displayed midpoint is a preview until you choose it; it is not a default answer.</li>
        <li><strong>Review the recommendation.</strong> Start with the highlighted processes, then check the full profile. Open View guidance to read the activities and expected evidence. Check that the recommendation fits your boundary and life-cycle stage.</li>
        <li><strong>Resolve decisions.</strong> Explain any warning, missing evidence, or requested adjustment. High schedule or budget pressure calls for a feasibility decision, such as changing scope, sequencing work, or adding capacity. It does not automatically lower the recommended rigor.</li>
        <li><strong>Save and agree the work.</strong> Use Report and Session → Minimum-data Export to keep a record. The browser saves work locally; it does not submit your case study. Agree responsibilities and approval outside the tool. Revisit the assessment when scope, evidence, or obligations change.</li>
      </ol><p><a class="btn btn-primary" href="#assessment">Start or continue assessment</a></p></section>
      <section><h2>Read the three levels</h2>
      <dl><dt>Basic</dt><dd>Keep the process purpose and essential evidence, using simple activities and records.</dd><dt>Standard</dt><dd>Use a structured, coordinated approach with defined responsibilities, review, and traceability.</dd><dt>Comprehensive</dt><dd>Use more detailed analysis, control, and assurance where the context warrants them.</dd></dl>
      <p>These are framework categories, not certification or maturity ratings. Basic does not mean skipping the process. Existing project records can satisfy an information need; a separate document is not required for every process. Choose the content and evidence first, then a practical way to maintain them.</p></section>
      <section id="help-example"><h2>A small worked example</h2>
      <p><strong>Illustration only.</strong> A team is replacing an internal booking service. The boundary includes the service and its interfaces, but excludes changes to the corporate network. The immediate decision is how much integration and verification work to plan.</p>
      <p>The team reviews the integration descriptions and selects M4 = 4 because the planned interface and integration work matches that description. They record their reason and a reference to a redacted interface list. The framework requires at least Standard Integration and Configuration Management for this rating. Other answers may raise these or other processes further.</p>
      <p>The team opens the two process guides, compares the expected evidence with its existing integration plan and change log, and identifies what is missing. It does not treat Standard as a requirement to buy a tool or create a new board. If the guidance does not fit, it records the mismatch and proposes a specific alternative for review.</p>
      <p>For a case-study contribution, describe the work actually performed and its observed outcome separately from your opinion about what this recommendation might have improved.</p></section>
      <section id="help-adapt"><h2>Adapt the framework to your needs</h2>
      <p><strong>For your project:</strong> choose the assessed boundary and stage, use your own evidence, and adapt the activities, record formats, tools, responsibilities, and review timing. Keep the intended process outcome and applicable obligations. Use the adjustment workflow to record proposed level changes and their reasons; local records do not establish external approval.</p>
      <p><strong>For your organization:</strong> the metric-to-process matrix and consistency rules are proposed policy choices. They may need different allocations, thresholds, or examples for your domain. The app displays its shared matrix and rules read-only; editing a project does not change them.</p>
      <ol><li>Identify the exact cell, rule, rating description, or guidance passage you would change.</li><li>Give a real example or counterexample, the proposed replacement, and why it fits better.</li><li>Check the effect on connected processes, safety, security, environmental consequences, and binding obligations.</li><li>Compare the original and proposed outputs on representative cases, including borderline and adverse cases. Arrange domain review and record approval before adopting the change.</li></ol>
      <p>Send proposals through the peer-review form. The framework maintainer can implement and test an agreed change in a separately identified configuration. Do not infer that removing a matrix cell removes a legal or contractual obligation.</p>
      <p><a href="#matrix">Inspect the matrix</a> · <a href="#interdependency">Inspect the rules</a> · <a href="#processes">Browse process guidance</a></p></section>
      <section id="help-terms"><h2>Terms and common questions</h2>
      <dl>
        <dt>What do P, S, and a blank matrix cell mean?</dt><dd>P marks a primary driver; S marks a supporting driver. These are roles in the recommendation rule, not numerical weights. A blank means no direct mapping in the shared matrix. A process can still be raised by a minimum-level rule, a dependency, or a scoped obligation. Schedule, budget, and organizational culture are handled separately.</dd>
        <dt>How is a level selected?</dt><dd>The highest mapped rating starts the calculation. Ratings 1–2 indicate Basic; 3–4 indicate Standard. Comprehensive requires one Primary at 5 plus a different Primary at 3 or above, or one Primary at 5 plus a Secondary at 5. Primary support therefore qualifies at a lower threshold than Secondary support. One metric cannot support itself. A mapped safety or environmental rating of 5 is an explicit exception. Minimum-level rules and mandatory dependencies can then raise the result. Multiple high inputs do not prove that their evidence is independent.</dd>
        <dt>What is a floor or a hard constraint?</dt><dd>A floor sets the minimum level under a stated condition. A hard constraint raises a connected process when needed for consistency. These rules are the framework's policy; they do not replace checking the requirements that actually apply to your project. Warnings ask for a recorded judgment rather than an automatic increase.</dd>
        <dt>What should I do when ratings share evidence?</dt><dd>Explain each distinct consequence. One event may affect safety, service availability, and security, but repeating the same argument does not provide independent support. The app's shared-evidence warning does not remove double counting or change recommendations. Review this limitation when judging the result.</dd>
        <dt>Does a complete assessment mean the project is approved?</dt><dd>No. Completeness checks whether the required information and decisions are recorded. It does not verify identities, confirm compliance, or demonstrate that the recommendation will improve delivery.</dd>
        <dt>Can I use this without a facilitator?</dt><dd>Yes, for an initial assessment and feedback. Ask a colleague with relevant project knowledge to review uncertain ratings and consequential decisions. Record disagreement rather than forcing a consensus.</dd>
        <dt>How do I share safely?</dt><dd>Use project codes and redacted summaries. Inspect every exported file before sharing. Keep confidential evidence in your approved repository and cite a safe reference. Clearing a browser session does not delete files you have already downloaded.</dd>
      </dl></section>
    </article>
    <style>
      .help-guide{max-width:860px;margin:20px auto 64px;font-size:16px;line-height:1.7}
      .help-guide h1{font-size:clamp(28px,4vw,42px);line-height:1.15;margin:12px 0 22px}
      .help-guide h2{font-size:24px;margin-bottom:16px}.help-guide p{margin:14px 0;color:var(--text-secondary)}
      .help-guide section{padding-top:32px;margin-top:20px;border-top:1px solid var(--border-subtle);scroll-margin-top:100px}
      .help-guide nav{display:flex;gap:12px 24px;flex-wrap:wrap;margin:24px 0}.help-guide a{color:var(--accent-primary-light)}
      .help-guide ol{padding-left:24px}.help-guide li{margin:16px 0;color:var(--text-secondary)}
      .help-guide dt{font-weight:700;margin-top:22px}.help-guide dd{margin:6px 0 18px;color:var(--text-secondary)}
      .help-guide strong{color:var(--text-primary)}.help-guide a.btn{color:var(--text-on-accent,#061a1c)}
    </style>`;
  const topic = new URLSearchParams(location.hash.split('?')[1] || '').get('topic');
  if (['start', 'example', 'adapt', 'terms'].includes(topic)) {
    requestAnimationFrame(() => container.querySelector(`#help-${topic}`)?.scrollIntoView());
  }
}
