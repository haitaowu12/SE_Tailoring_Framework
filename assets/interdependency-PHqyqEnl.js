import{Ct as e,Ot as t,Pt as n,at as r,et as i,ht as a,it as o,l as s,rt as c,wt as l}from"./index-tTzzMvnf.js";function u(u){let d=s(),f=d.assessmentTree?.nodes?.[d.assessmentTree?.activeId],p=!f||f.id===d.assessmentTree?.rootId,m=f?.scores||(p?d.scores:{})||{},h=f?.levels||(p?d.levels:{})||{},g={assuranceObligations:f?.assuranceObligations||(p?d.assuranceObligations:[])||[]},_=n.every(e=>[`basic`,`standard`,`comprehensive`].includes(h[e.id])),v=_?i(h,m,g):[],y=e=>n.find(t=>t.id===e)?.name||`Process ${e}`,b=e=>e===`any_technical`?`Any Technical Process`:e===`all_technical`?`All Technical Processes`:Array.isArray(e)?e.map(y).join(` or `):y(e);u.innerHTML=`
    <h2 class="mb-md">Process Interdependencies</h2><p class="text-secondary mb-lg">These are framework rules for keeping process recommendations consistent. They are proposed policy choices, not clauses of a standard. Hard constraints raise connected processes; warnings ask for your judgment. <a href="#help?topic=adapt">How to review or propose a rule change</a>.</p>

    <div class="tabs mb-xl">
      <button class="tab active" data-tab="rules">Consistency Rules</button>
      <button class="tab" data-tab="propagation">Propagation</button>
      <button class="tab" data-tab="chains">Dependency Chains</button>
      <button class="tab" data-tab="simulate">Direct Preview</button>
    </div>

    <div id="tab-content"></div>
  `;let x=document.createElement(`style`);x.textContent=`
    .rule-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 18px; margin-bottom: 12px; transition: all 0.2s; }
    .rule-card:hover { border-color: var(--border-medium); }
    .rule-type { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
    .rule-type.HC { background: rgba(239,68,68,0.15); color: #f87171; }
    .rule-type.WN { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .chain-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 20px; margin-bottom: 14px; }
    .chain-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 12px 0; }
    .chain-node { padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; }
    .chain-arrow { color: var(--accent-primary); font-size: 18px; }
    .prop-row { display: grid; grid-template-columns: 1fr auto 1fr auto auto; gap: 12px; align-items: center; padding: 10px; border-bottom: 1px solid var(--border-subtle); font-size: 13px; }
    .prop-type { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .prop-type.mandatory { background: rgba(239,68,68,0.12); color: #f87171; }
    .prop-type.recommended { background: rgba(34,211,238,0.12); color: #22d3ee; }
    .sim-select { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 20px; }
    .sim-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; max-width: 100%; }
    .sim-field .select { max-width: 100%; }
    .sim-result { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 14px; margin-top: 12px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .status-dot.ok { background: var(--accent-success); }
    .status-dot.violated { background: var(--accent-error); }
  `,u.appendChild(x);function S(i){let s=u.querySelector(`#tab-content`);u.querySelectorAll(`.tab`).forEach(e=>e.classList.toggle(`active`,e.dataset.tab===i)),i===`rules`?s.innerHTML=`
        <div class="mb-lg">
          <p class="text-secondary text-sm mb-md">${e.length} active consistency rules identify incoherent tailoring combinations. Hard Constraints (HC) must be satisfied; Warnings (WN) should be reviewed.</p>
        </div>
        ${e.map(e=>{Array.isArray(e.trigger.process)?e.trigger.process.map(y).join(` or `):e.trigger.process===`any_technical`||y(e.trigger.process);let t=v.some(t=>t.ruleId===e.id),n=c(e,m,g);return`
          <div class="rule-card" style="border-left: 3px solid ${n===`HC`?`#f87171`:`#fbbf24`}">
            <div class="flex justify-between items-center mb-sm">
              <div class="flex items-center gap-sm">
                <span class="rule-type ${n}">${n}${n===e.type?``:` in this context`}</span>
                <strong>Rule ${e.id}</strong>
                <span class="text-xs">${_?t?`Review required`:`No current conflict`:`No full profile assessed`}</span>
              </div>
            </div>
            <p class="text-sm font-bold mb-sm">${e.label}</p>
            <p class="text-xs text-secondary">${e.rationale}</p>
          </div>`}).join(``)}
      `:i===`propagation`?s.innerHTML=`
        <p class="text-secondary text-sm mb-lg">When a process level is elevated, dependent processes may need adjustment.</p>
        <div class="card" style="overflow-x:auto">
          <div class="prop-row" style="font-weight:700;color:var(--text-secondary);font-size:11px;text-transform:uppercase">
            <span>Source Process</span><span>→</span><span>Target Process</span><span>Min Level</span><span>Type</span>
          </div>
          ${l.map(e=>{let t=o(e,m,g);return`
            <div class="prop-row">
              <span>${b(e.source)} ≥ ${a.levelLabels[e.sourceLevel]}</span>
              <span class="chain-arrow">→</span>
              <span>${b(e.target)}</span>
              <span class="level-badge ${e.minLevel||e.maxLevel}">
                ${e.minLevel?`≥ ${a.levelLabels[e.minLevel]}`:`≤ ${a.levelLabels[e.maxLevel]}`}
              </span>
              <span class="prop-type ${t}">${t} (direct)</span>
            </div>
          `}).join(``)}
        </div>
      `:i===`chains`?s.innerHTML=`
        <p class="text-secondary text-sm mb-lg">Common dependency chains that should be considered together.</p>
        ${t.map(e=>`
          <div class="chain-card">
            <h4 class="mb-sm">${e.name}</h4>
            <p class="text-xs text-secondary mb-md">${e.description}</p>
            <div class="chain-flow">
              ${e.processes.map((e,t)=>{let n=h[e],r=n?a.levelColors[n]:`var(--bg-tertiary)`;return`${t>0?`<span class="chain-arrow">→</span>`:``}<span class="chain-node" style="background:${r}20;border:1px solid ${r}50;color:${n?a.levelColors[n]:`var(--text-secondary)`}">${y(e)}${n?` (${n[0].toUpperCase()})`:``}</span>`}).join(``)}
            </div>
          </div>
        `).join(``)}
      `:i===`simulate`&&(s.innerHTML=`
        <p class="text-secondary text-sm mb-lg">Choose a process and proposed level to see directly affected processes only. The full assessment also follows further required dependencies and checks the whole profile. This preview does not change your assessment.</p>
        <div class="sim-select">
          <div class="sim-field">
            <label class="text-xs text-secondary" for="sim-process">Process</label>
            <select class="select" id="sim-process">
              <option value="">Select process...</option>
              ${n.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``)}
            </select>
          </div>
          <div class="sim-field">
            <label class="text-xs text-secondary" for="sim-level">Proposed level</label>
            <select class="select" id="sim-level">
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="comprehensive" selected>Comprehensive</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm" id="sim-run">Simulate</button>
        </div>
        <div id="sim-results"></div>
      `,s.querySelector(`#sim-run`).addEventListener(`click`,()=>{let e=parseInt(s.querySelector(`#sim-process`).value),t=s.querySelector(`#sim-level`).value;if(!e)return;let n=r(e,t,h,m,g),i=s.querySelector(`#sim-results`);n.length===0?i.innerHTML=`<div class="sim-result text-sm text-secondary">No directly affected processes for this change. Run the full assessment to check the whole profile and all required dependencies.</div>`:i.innerHTML=n.map(e=>`
            <div class="sim-result">
              <div class="flex justify-between items-center">
                <strong>${y(e.processId)}</strong>
                <span class="prop-type ${e.type}">${e.type}</span>
              </div>
              <div class="text-sm text-secondary mt-sm">${a.levelLabels[e.from]||e.from} → <span class="level-badge ${e.to}">${a.levelLabels[e.to]}</span> · Direct dependency</div>
            </div>
          `).join(``)}))}u.querySelectorAll(`.tab`).forEach(e=>{e.addEventListener(`click`,()=>S(e.dataset.tab))}),S(`rules`)}export{u as renderInterdependency};