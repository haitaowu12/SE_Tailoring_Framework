import{At as e,Ct as t,Ft as n,Nt as r,Pt as i,St as a,bt as o,et as s,ft as c,ht as l,l as u,pt as d,rt as f,ut as p,xt as m}from"./index-CIMXf6J5.js";import{buildMatrixPresentation as h}from"./matrix-view-Dq9JJvAV.js";var g=`all`,_=``,v=[`basic`,`standard`,`comprehensive`],y=new Set(v),b=`standard`,x=new Set(i.map(e=>e.id)),S=new Set([`process`,`level`,`source`]),C=new Set([`assessment`,`report`,`elements`,`system-elements`,`vee-model`,`matrix`,`deliverables`,`adjust`,`manual-adjust`,`interdependency`,`dashboard`,`process-explorer`,`direct`]);function w(e){return e&&typeof e==`object`&&Object.keys(e).length>0}function T(e){let t=e.assessmentTree,n=t?.nodes?.[t.activeId]||t?.nodes?.[t.rootId]||null,r=!n||n.id===t?.rootId,i=n?.assessmentResult||{},a=w(n?.levels)?n.levels:w(i.levels)?i.levels:r&&e.levels||{},o=w(n?.scores)?n.scores:r&&e.scores||{},s=w(n?.metricAssessments)?n.metricAssessments:r&&e.metricAssessments||{};return{elementId:n?.id||null,elementName:n?.name||`Current assessment`,levels:a,recommendationLevels:n?.recommendationBaseline?.levels||i.normativeLevels||(r?e.normativeLevels:{})||{},scores:o,metricAssessments:s,manualAdjustments:{...r&&e.manualAdjustments||{},...n?.manualAdjustments||{}},assuranceObligations:Array.isArray(n?.assuranceObligations)?r&&n.assuranceObligations.length===0&&(e.assuranceObligations||[]).length>0?e.assuranceObligations:n.assuranceObligations:r&&e.assuranceObligations||[],derivationDetails:i.derivationDetails||(r?e.derivationDetails:{})||{},overrides:i.overrides||(r?e.overrides:[])||[],fixes:i.fixes||(r?e.fixes:[])||[]}}function E(e,t){let n=e?.[t]||e?.[String(t)],r=typeof n==`string`?n:n?.level||n?.to;return y.has(r)?r:null}function D(e,t){let n=E(e.manualAdjustments,t);if(n)return n;let r=e.levels?.[t]||e.levels?.[String(t)];return y.has(r)?r:null}function O(e,t,n){let r=e.getAll(t);return r.length>1?(n.push(`The ${t} parameter must appear only once.`),null):r.length===1?r[0]:null}function k(e=p(),t=u()){let n=e?.params instanceof URLSearchParams?e.params:new URLSearchParams,r=[];for(let e of new Set(n.keys()))S.has(e)||r.push(`Unsupported route parameter ignored: ${e}.`);let a=O(n,`process`,r),o=O(n,`level`,r),s=O(n,`source`,r),c=a!==null&&/^(?:0|[1-9]\d*)$/.test(a)&&x.has(Number(a))?Number(a):null;a!==null&&c===null&&r.push(`The requested process is not part of the ${i.length}-process executable core.`);let l=s===null?null:C.has(s)?s:null;s!==null&&l===null&&r.push(`The process-detail source is not recognized.`);let d=T(t),f=c?D(d,c):null,m=o!==null&&y.has(o)?o:null;return o!==null&&m===null&&r.push(`The requested tailoring level must be basic, standard, or comprehensive.`),!c&&o!==null&&r.push(`A tailoring level can only be opened with a valid process.`),{processId:c,assignedLevel:f,recommendationLevel:c&&y.has(d.recommendationLevels?.[c])?d.recommendationLevels[c]:null,viewLevel:c?m||f||b:null,source:l,issues:r,viewContext:d}}function A(){let e=_.trim().toLowerCase();return i.filter(t=>!(g!==`all`&&t.group!==g||e&&!`${t.id} ${t.name} ${t.purpose}`.toLowerCase().includes(e)))}function j(e){let t=A();return t.length?t.map(t=>{let n=D(e.viewContext,t.id),r=n||b;return`
      <a class="process-list-card ${e.processId===t.id?`selected`:``} hover-lift"
         href="${d(c(t.id,r,e.source))}"
         ${e.processId===t.id?`aria-current="page"`:``}
         aria-label="Open ${d(t.name)} at ${d(l.levelLabels[r])} detail">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-sm">
            <span class="process-id">${t.id}</span>
            <span class="font-bold">${d(t.name)}</span>
          </div>
          ${n?`<span class="level-badge ${d(n)}" title="Current applied level for ${d(e.viewContext.elementName)}">${n[0].toUpperCase()}</span>`:``}
        </div>
        <div class="text-xs text-secondary mt-sm">${d(t.purpose)}</div>
      </a>`}).join(``):`<div class="empty-state process-list-empty"><p class="text-secondary">No processes match this filter.</p></div>`}function M(e,t){let n=e.querySelector(`#process-list-panel`);n&&(n.innerHTML=j(t))}function N(e,t=p()){let n=u(),r=k(t,n),a=!!r.processId;if(!r.processId&&r.issues.length===0){let e=i.filter(e=>D(r.viewContext,e.id)),t=e.find(e=>D(r.viewContext,e.id)===`comprehensive`)||e.find(e=>D(r.viewContext,e.id)!==`standard`)||e[0]||i[0];r.processId=t.id,r.assignedLevel=D(r.viewContext,t.id),r.viewLevel=r.assignedLevel||b,r.source=r.source||`process-explorer`}if(e.innerHTML=`
    <div class="mb-lg">
      <p class="eyebrow">Framework reference</p>
      <h2>Process work aids</h2>
      <p class="text-sm text-secondary mt-sm">Open a process to compare levels, plan activities, and identify the deliverables the team needs.</p>
    </div>
    ${r.issues.length?`
      <div class="callout process-route-warning mb-lg" role="status">
        <strong>Some process-detail link information was ignored.</strong>
        <div class="text-xs text-secondary mt-sm">${r.issues.map(e=>d(e)).join(`<br>`)}</div>
      </div>`:``}
    <div class="explorer-controls mb-lg">
      <input class="input" id="process-search" placeholder="Search processes..." value="${d(_)}" style="max-width:300px" aria-label="Search processes" type="search">
      <div class="tabs" id="group-tabs" role="group" aria-label="Process group filter">
        <button class="tab ${g===`all`?`active`:``}" data-group="all" type="button" aria-pressed="${g===`all`}">All (${i.length})</button>
        <button class="tab ${g===`tech_mgmt`?`active`:``}" data-group="tech_mgmt" type="button" aria-pressed="${g===`tech_mgmt`}">Tech Management</button>
        <button class="tab ${g===`technical`?`active`:``}" data-group="technical" type="button" aria-pressed="${g===`technical`}">Technical</button>
      </div>
    </div>
    <div class="explorer-layout">
      <nav class="process-list-panel" id="process-list-panel" aria-label="Processes">
        ${j(r)}
      </nav>
      <div class="process-detail-panel" id="process-detail">
        ${r.processId?z(r.processId,n,r.viewContext,r.viewLevel,r.source):`<div class="empty-state"><p class="text-secondary">Select a process to view its Basic, Standard, and Comprehensive content.</p></div>`}
      </div>
    </div>
  `,!document.getElementById(`process-explorer-styles`)){let e=document.createElement(`style`);e.id=`process-explorer-styles`,e.textContent=`
      .explorer-controls { display: flex; flex-direction: column; gap: 12px; }
      .explorer-layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; }
      .process-list-panel { display: flex; flex-direction: column; gap: 8px; max-height: calc(100vh - 240px); overflow-y: auto; padding-right: 8px; }
      .process-list-card { display: block; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; cursor: pointer; transition: all var(--transition-fast); color: inherit; text-decoration: none; }
      .process-list-card.selected { border-color: var(--accent-primary); background: rgba(99,102,241,0.08); }
      .process-list-card:hover { border-color: var(--border-medium); }
      .process-list-card:focus-visible { outline: 2px solid var(--accent-primary-light); outline-offset: 2px; }
      .process-list-empty { min-height: 140px; }
      .process-detail-panel { min-height: 500px; }
      .empty-state { display: flex; align-items: center; justify-content: center; min-height: 400px; }
      .detail-section { margin-bottom: var(--space-xl); }
      .detail-section h4 { margin-bottom: var(--space-md); color: var(--accent-primary-light); }
      .process-work-aid { padding: clamp(16px, 2vw, 24px); }
      .process-detail-header { align-items: flex-start; gap: var(--space-md); margin-bottom: var(--space-md); }
      .process-meta-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
      .process-meta-pill { border: 1px solid var(--border-subtle); border-radius: var(--radius-full); padding: 3px 9px; font-size: 11px; color: var(--text-secondary); }
      .level-selector-bar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-md); flex-wrap: wrap; padding: 8px 0 12px; margin-bottom: var(--space-md); border-bottom: 1px solid var(--border-subtle); }
      .level-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 0; }
      .level-tab { display: inline-block; padding: 6px 16px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; cursor: pointer; border: 1px solid var(--border-subtle); background: none; color: var(--text-secondary); transition: all var(--transition-fast); text-decoration: none; }
      .level-tab.active-basic { background: var(--level-basic-bg); color: var(--level-basic); border-color: var(--level-basic-border); }
      .level-tab.active-standard { background: var(--level-standard-bg); color: var(--level-standard); border-color: var(--level-standard-border); }
      .level-tab.active-comprehensive { background: var(--level-comprehensive-bg); color: var(--level-comprehensive); border-color: var(--level-comprehensive-border); }
      .level-tab:focus-visible { outline: 2px solid var(--accent-primary-light); outline-offset: 2px; }
      .practitioner-work-aid { margin-bottom: var(--space-lg); }
      .practitioner-work-aid > summary { cursor: pointer; color: var(--text-secondary); font-size: var(--font-size-xs); font-weight: 600; }
      .practitioner-work-aid[open] > ol { margin-top: 12px; }
      .practitioner-work-aid ol { display: grid; gap: 10px; margin: 0; padding-left: 22px; }
      .practitioner-work-aid li { padding-left: 4px; color: var(--text-secondary); font-size: var(--font-size-xs); line-height: 1.5; }
      .practitioner-work-aid li strong, .practitioner-work-aid li span { display: block; }
      .practitioner-work-aid li strong { color: var(--text-primary); }
      .detail-empty-line { color: var(--text-tertiary); font-size: var(--font-size-sm); padding: 8px 0; }
      .activity-item { padding: 6px 0; font-size: var(--font-size-xs); color: var(--text-secondary); border-bottom: 1px solid rgba(99,102,241,0.06); }
      .activity-item.essential { color: var(--text-primary); font-weight: 500; }
      .deliverable-item { padding: 6px 0; font-size: var(--font-size-xs); color: var(--text-secondary); border-bottom: 1px solid rgba(99,102,241,0.06); display: flex; gap: 6px; align-items: flex-start; }
      .output-item { background: rgba(34,211,238,0.06); border-radius: var(--radius-md); padding: 10px; margin-bottom: 8px; font-size: var(--font-size-xs); }
      .metric-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; margin: 3px; }
      .metric-tag.P { background: rgba(99,102,241,0.2); color: var(--accent-primary-light); }
      .metric-tag.S { background: rgba(148,163,184,0.12); color: var(--text-secondary); }
      .technical-context { border-top: 1px solid var(--border-subtle); padding-top: 14px; }
      .technical-context > summary { cursor: pointer; color: var(--text-secondary); font-size: var(--font-size-xs); font-weight: 700; }
      .technical-context-body { margin-top: 18px; }
      @media (max-width: 900px) { .explorer-layout { grid-template-columns: 1fr; } .process-list-panel { max-height: 300px; } }
      @media (max-width: 480px) {
        #group-tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); overflow-x: visible; }
        #group-tabs .tab { min-width: 0; padding: 8px 4px; font-size: 11px; line-height: 1.25; white-space: normal; }
      }
    `,document.head.appendChild(e)}e.querySelector(`#process-search`).addEventListener(`input`,t=>{_=t.target.value,M(e,r)}),e.querySelectorAll(`.tab`).forEach(t=>{t.addEventListener(`click`,()=>{g=t.dataset.group,e.querySelectorAll(`.tab`).forEach(e=>{let t=e.dataset.group===g;e.classList.toggle(`active`,t),e.setAttribute(`aria-pressed`,String(t))}),M(e,r)})}),a&&r.processId&&r.source&&window.requestAnimationFrame(()=>{let t=e.querySelector(`#process-detail-heading`);if(t&&(t.focus({preventScroll:!0}),window.matchMedia?.(`(max-width: 900px)`).matches)){let e=window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches;t.scrollIntoView({behavior:e?`auto`:`smooth`,block:`start`})}})}function P(e,t){let n=e?.metricAssessments?.[t];if(![`assessed`,`inherited-confirmed`].includes(n?.status))return null;let r=Number(n?.score),i=Number(e?.scores?.[t]),a=Number.isInteger(r)&&r>=1&&r<=5,o=Number.isInteger(i)&&i>=1&&i<=5;return a&&o&&r!==i?null:a?r:o?i:null}function F(e,t){let n=e.includes(`[Safety]`)?`M5`:e.includes(`[RAM]`)?`M6`:null;if(!n)return{disabled:!1,note:``};let r=P(t,n);return r===null?{disabled:!1,note:`Conditional example: ${n} context unconfirmed; assess applicability and obligations before planning this work`}:r<3?{disabled:!1,note:`Not highlighted by ${n}; check applicability and binding obligations`}:{disabled:!1,note:``}}function I(e,t){return e?`<span style="font-size:10px; color:var(--text-secondary); text-decoration:none; margin-left:6px; background:var(--bg-tertiary); padding:2px 6px; border-radius:4px;">${t?``:`Review: `}${d(e)}</span>`:``}function L(e,t){return Array.isArray(e)?e.some(e=>L(e,t)):e===`any_technical`||e===`all_technical`?i.some(e=>e.id===Number(t)&&e.group===`technical`):Number(e)===Number(t)}function R(e,n={},a=T(n)){let o=h(n),c=o.conditionalDrivers.every(e=>e.status!==`unavailable`),l=o.node||(n.assessmentTree?{}:n),u={assuranceObligations:Array.isArray(l.assuranceObligations)?l.assuranceObligations:o.rootContext&&Array.isArray(n.assuranceObligations)?n.assuranceObligations:[]},d=Object.fromEntries(i.map(e=>[e.id,D(a,e.id)])),p=c&&i.every(e=>y.has(d[e.id])),m=p?s(d,o.scores,u):[],g=t.filter(t=>L(t.trigger?.process,e)||L(t.required?.process,e)).map(e=>({...e,effectiveType:c?f(e,o.scores,u):null,status:c?p?m.some(t=>t.ruleId===e.id)?`Review required`:`No current conflict`:`No full profile assessed`:`Context unavailable`})),_=r.filter(t=>(t.processes||[]).map(Number).includes(Number(e)));return{map:o.map[e]||{},conditionalDrivers:o.conditionalDrivers.filter(t=>Number(t.processId)===Number(e)),scores:o.scores,contextAvailable:c,rules:g,floors:_}}function z(t,r,s,u,f){let p=i.find(e=>e.id===t);if(!p)return``;let h=m[t],g=a[t],_=R(t,r,s),b=_.map,x=D(s,t),S=h?.activities?.[u]||[],C=h?.deliverables?.[u]||[],w=h?.outputs||[],T=o[t]||{},O=P(s,`M8`),k=O!==null&&O>=3?T.security:null,A=_.conditionalDrivers.some(e=>e.metric===`M15`&&e.status===`active`)?T.assurance:null,j=[k?{label:`Security evidence overlay`,metric:`M8`,...k}:null,A?{label:`Binding assurance overlay`,metric:`M15`,...A}:null].filter(Boolean),M=s.recommendationLevels?.[t],N=y.has(M)?l.levelLabels[M]:null,L=E(s.manualAdjustments,t),z=l.levelLabels[x]||x,V=l.levelLabels[u]||u,H=n[p.group.toUpperCase()]?.name||p.group;return`
    <div class="card process-work-aid animate-fade-in">
      <div class="flex justify-between process-detail-header mb-md">
        <div>
          <h3 id="process-detail-heading" tabindex="-1">${d(p.name)}</h3>
          <p class="text-sm text-secondary mt-sm">${d(p.purpose)}</p>
          <div class="process-meta-row">
            <span class="process-meta-pill">P${p.id}</span>
            <span class="process-meta-pill">${d(H)}</span>
            <span class="process-meta-pill">Context: ${d(s.elementName)}</span>
          </div>
        </div>
        ${x?`<span class="level-badge ${d(x)}" title="Current applied tailoring level for ${d(s.elementName)}">${L?`Local choice`:`Current profile`}: ${d(z)}</span>`:`<span class="process-meta-pill">No assessment assignment</span>`}
      </div>

      <div class="level-selector-bar">
        <div>
          <div class="text-xs text-secondary">Viewing process content at</div>
          <div class="text-sm">${x?`${N?`Recorded recommendation: ${d(N)}.`:`The recommendation was not recorded separately.`} Current applied level: ${d(z)}. Content tabs compare only; they do not save a decision. <a href="#adjust">Record or revise the tailoring decision</a>.`:`No assessment assignment exists. ${d(V)} is shown for browsing only.`}</div>
        </div>
        <nav class="level-tabs" aria-label="Tailoring level detail selector">
          ${v.map(e=>`
            <a class="level-tab ${u===e?`active-`+d(e):``}"
               href="${d(c(t,e,f))}"
               ${u===e?`aria-current="page"`:``}
               aria-label="View ${d(l.levelLabels[e])} level content">${d(l.levelLabels[e])}</a>
          `).join(``)}
        </nav>
      </div>

      <details class="practitioner-work-aid">
        <summary>Plan this work with your team</summary>
        <ol>
          <li><strong>Confirm the level.</strong><span>Compare Basic, Standard, and Comprehensive against the project context.</span></li>
          <li><strong>Assign the work.</strong><span>Agree owners for the activities and deliverables listed below.</span></li>
          <li><strong>Set the evidence.</strong><span>Record what will demonstrate that the selected level has been applied.</span></li>
        </ol>
      </details>

      ${p.definition?`
      <div class="detail-section">
        <h4>What ${d(V)} means here</h4>
        <p class="text-sm text-secondary">${d(p.definition[u]||`—`)}</p>
      </div>`:``}

      <p class="text-sm text-secondary mb-lg">Use the following activities and records as examples to adapt. Higher rigor retains the essential outcomes of lower levels. Named tools, document formats, and analysis methods are options unless your project has a specific obligation. Existing controlled records may meet several information needs. <a href="#help?topic=adapt">How to adapt the guidance</a>.</p>
      ${g?`<section class="detail-section" aria-label="Work-package responsibility"><h4>Outcome and work-package responsibility</h4><p class="text-sm text-secondary"><strong>Retain the outcome:</strong> ${d(g.outcome)}</p><p class="text-sm text-secondary mt-sm">${d(g.local)}</p><p class="text-xs text-secondary mt-sm">The level tabs show different depth, not a requirement to duplicate every lower-level activity or every example. Record the local contribution, applicable programme evidence and responsible role. <a href="#help?topic=adapt">Check the allocation</a>.</p></section>`:``}
      <div class="detail-section">
        <h4>Activity examples to adapt (${S.length}) <span class="text-xs text-secondary font-normal ml-sm">(core outcome examples are marked)</span></h4>
        ${S.length?S.map(e=>{let t=e.startsWith(`(*)`),n=t?e.slice(4):e,r=F(n,s),{disabled:i}=r;return`<div class="activity-item ${t?`essential`:``}" style="${i?`opacity: 0.5; text-decoration: line-through;`:``}">
            <span class="activity-marker" aria-hidden="true">${t?`◆`:`•`}</span>${t?`<span class="sr-only">Core outcome: </span>`:``} <span style="${i?`text-decoration: line-through;`:``}">${d(n)}</span>
            ${I(r.note,i)}
          </div>`}).join(``):`<div class="detail-empty-line">No activity detail is defined for this process level yet.</div>`}
      </div>

      <div class="detail-section">
        <h4>Record and evidence examples (${C.length})</h4>
        ${C.length?C.map(e=>{let t=e,n=F(t,s),{disabled:r}=n;return`<div class="deliverable-item" style="${r?`opacity: 0.5; text-decoration: line-through;`:``}">
            <span class="deliverable-marker" aria-hidden="true">•</span> <span style="${r?`text-decoration: line-through;`:``}">${d(t)}</span>
            ${I(n.note,r)}
          </div>`}).join(``):`<div class="detail-empty-line">No deliverable detail is defined for this process level yet.</div>`}
      </div>

      <div class="detail-section">
        <h4>Coordinate these handoffs</h4><p class="text-sm text-secondary">These are possible information flows. They do not set the recipient process level; use its assessment and applicable obligations.</p>
        ${w.length?w.map(e=>`<div class="output-item"><strong>${d(e.name)}</strong> → ${d(e.feedsInto)}</div>`).join(``):`<div class="detail-empty-line">No output flow detail is defined for this process yet.</div>`}
      </div>

      ${j.length?`
      <div class="detail-section" style="border-left: 3px solid var(--accent-warning); padding-left: 14px;">
        <h4>Conditional Context Evidence</h4>
        <p class="text-xs text-secondary mb-md">These prompts operationalize an existing mapped context. They do not change the assigned process level or create a new metric-to-process relationship.</p>
        ${j.map(e=>`
          <div class="mb-md">
            <div class="text-sm font-bold">${d(e.label)} <span class="metric-tag secondary">${d(e.metric)}</span></div>
            ${(e.activities||[]).map(e=>`<div class="activity-item">• ${d(e)}</div>`).join(``)}
            ${(e.evidence||[]).map(e=>`<div class="deliverable-item"><span class="deliverable-marker" aria-hidden="true">•</span> ${d(e)}</div>`).join(``)}
          </div>
        `).join(``)}
      </div>`:``}

      <details class="technical-context detail-section">
        <summary>Why this process is connected to the assessment</summary>
        ${B(_)}
        <div class="technical-context-body">
          <h4>Metric applicability</h4>
          <p class="text-xs text-secondary mb-md">P = primary driver; S = supporting driver. Roles are not numerical weights. A starred role is active only within the confirmed obligation scope. C marks an inactive conditional relationship; ? means its applicability is unavailable.</p>
          <div class="flex" style="flex-wrap:wrap">
            ${Object.entries(b).map(([t,n])=>{let r=e.find(e=>e.id===t),i=_.conditionalDrivers.find(e=>e.metric===t);return`<span class="metric-tag ${d(i?.status===`active`?i.role:i?``:n)}"${i?` title="${d(i.reason)}"`:``}>${d(n)} ${d(t)}: ${d(r?.name||t)}</span>`}).join(``)}
          </div>
          ${_.conditionalDrivers.map(e=>`<p class="text-xs text-secondary mt-sm"><strong>${d(e.metric)} conditional ${e.role===`P`?`primary`:`supporting`} driver: ${d(e.status)}.</strong> ${d(e.reason)}</p>`).join(``)}
        </div>
      </details>

      ${p.whenToElevate?`
      <div class="detail-section">
        <h4>Questions for professional review</h4>
        <p class="text-sm text-secondary">${d(p.whenToElevate)}</p>
        <p class="text-xs text-secondary mt-sm">These authored prompts do not override the assessment rules or save a level change.</p>
      </div>`:``}
    </div>
  `}function B({rules:e,floors:t}){return e.length===0&&t.length===0?``:`<div class="detail-section">
    <h4>Registry-Derived Governance Context</h4>
    <p class="text-xs text-secondary mb-md">Generated from the current rule and floor registry. Rule types use the element's effective ratings, including protected inheritance; unconfirmed inputs remain a preview. Related rules apply only when their trigger is met. Browsing a different content level does not change this context.</p>
    ${e.length?`<div class="mb-md"><strong class="text-xs">Related framework rules</strong>${e.map(e=>`<div class="activity-item"><span class="activity-marker" aria-hidden="true">•</span> Rule ${d(e.id)} [${d(e.effectiveType||`Base ${e.type}; context unavailable`)}${e.effectiveType&&e.effectiveType!==e.type?` in this context`:``}]: ${d(e.label)} <span class="text-secondary">· ${d(e.status)}</span></div>`).join(``)}</div>`:``}
    ${t.length?`<div><strong class="text-xs">Possible minimum-level rules</strong><p class="text-xs text-secondary">Each minimum applies only when its stated condition is met.</p>${t.map(e=>`<div class="activity-item"><span class="activity-marker" aria-hidden="true">•</span> ${d(e.label||e.description||e.id||e.overrideId)} · minimum ${d(l.levelLabels[e.minLevel]||e.minLevel||`defined by registry`)}<div class="text-secondary">Condition: ${d(e.condition||e.description)}</div></div>`).join(``)}</div>`:``}
  </div>`}export{R as buildProcessGovernanceContext,P as getContextScore,N as renderProcessExplorer,k as resolveProcessExplorerRoute};