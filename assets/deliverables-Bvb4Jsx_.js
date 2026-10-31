import{Ft as e,Pt as t,l as n,xt as r}from"./index-UYXeF8Yt.js";var i=`all`;function a(o){let s=n(),c={};t.forEach(e=>{c[e.group]||(c[e.group]=[]),c[e.group].push(e)}),o.innerHTML=`
    <div class="flex justify-between items-center mb-lg deliverables-toolbar">
      <div>
        <h2>Reference Deliverables</h2>
        <p class="text-secondary text-sm mt-sm">Read-only practitioner guidance. These examples are not completion evidence and are not stored as assessment state.</p>
      </div>
      <div class="flex gap-sm items-center deliverables-filter">
        <label class="text-xs text-secondary" for="level-filter">Filter:</label>
        <select class="select" id="level-filter">
          <option value="all" ${i===`all`?`selected`:``}>Current Assessment Levels</option>
          <option value="basic" ${i===`basic`?`selected`:``}>All Basic</option>
          <option value="standard" ${i===`standard`?`selected`:``}>All Standard</option>
          <option value="comprehensive" ${i===`comprehensive`?`selected`:``}>All Comprehensive</option>
        </select>
      </div>
    </div>
    <div class="flex gap-sm mb-lg">
      <button class="btn btn-secondary btn-sm" id="deliverables-expand-all" aria-controls="deliverables-list">Expand all</button>
      <button class="btn btn-secondary btn-sm" id="deliverables-collapse-all" aria-controls="deliverables-list">Collapse all</button>
    </div>
    <div id="deliverables-list">
    ${Object.entries(c).map(([t,n])=>`
      <div class="mb-xl">
        <h3 class="mb-md" style="color: ${e[t.toUpperCase()]?.color||`#fff`}">${e[t.toUpperCase()]?.name||t}</h3>
        ${n.map(e=>{let t=r[e.id];if(!t?.deliverables)return``;let n=i===`all`?s.levels[e.id]:i;if(!n)return`
          <div class="card mb-md" style="padding: 14px 16px; opacity: 0.78;">
            <div class="flex items-center gap-sm deliverable-unassessed-row">
              <span class="process-id">${e.id}</span>
              <strong>${e.name}</strong>
              <span class="text-xs text-secondary">Unassessed</span>
            </div>
          </div>`;let a=t.deliverables[n]||[];return a.length===0?``:`
          <details class="deliverable-group card mb-md">
            <summary class="deliverable-summary">
              <div class="flex justify-between items-center w-full">
                <div class="flex items-center gap-sm">
                  <span class="process-id">${e.id}</span>
                  <strong>${e.name}</strong>
                  <span class="level-badge ${n}">${n[0].toUpperCase()}</span>
                </div>
                <span class="text-xs text-secondary">${a.length} reference item${a.length===1?``:`s`}</span>
                <span class="deliverable-toggle" aria-hidden="true">▸</span>
              </div>
            </summary>
            <div class="deliverable-items mt-md">
              ${a.map(e=>`<div class="deliverable-reference-item"><span aria-hidden="true">•</span><span>${e}</span></div>`).join(``)}
            </div>
          </details>`}).join(``)}
      </div>
    `).join(``)}
    </div>
  `;let l=document.createElement(`style`);l.textContent=`
    .deliverable-group { padding: 0 !important; overflow: hidden; }
    .deliverables-toolbar { gap: 12px; min-width: 0; }
    .deliverables-toolbar > div { min-width: 0; }
    .deliverables-filter { min-width: 0; flex-wrap: wrap; justify-content: flex-end; }
    .deliverables-filter .select { max-width: 100%; }
    .deliverable-summary { padding: 16px 20px; cursor: pointer; list-style: none; }
    .deliverable-toggle { flex:0 0 auto; color:var(--text-secondary); font-size:18px; transition:transform .15s; }
    .deliverable-group[open] .deliverable-toggle { transform:rotate(90deg); }
    .deliverable-summary::-webkit-details-marker { display: none; }
    .deliverable-summary::marker { display: none; }
    .deliverable-summary .w-full { min-width: 0; gap: 8px; }
    .deliverable-summary .w-full > .flex { min-width: 0; flex-wrap: wrap; }
    .deliverable-summary strong,
    .deliverable-unassessed-row strong {
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .deliverable-unassessed-row { min-width: 0; flex-wrap: wrap; }
    .deliverable-items { padding: 0 20px 16px; }
    .deliverable-reference-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 10px; border-radius: 6px; font-size: 13px; color: var(--text-secondary); }
    @media (max-width: 520px) {
      .deliverables-toolbar {
        align-items: flex-start;
        flex-direction: column;
      }
      .deliverables-filter {
        justify-content: flex-start;
        width: 100%;
      }
      .deliverable-summary {
        padding: 14px 16px;
      }
      .deliverable-summary .w-full {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `,o.appendChild(l);let u=o.querySelectorAll(`.deliverable-group`);for(let[e,t]of[[`deliverables-expand-all`,!0],[`deliverables-collapse-all`,!1]]){let n=o.querySelector(`#${e}`);n.disabled=u.length===0,n.addEventListener(`click`,()=>u.forEach(e=>{e.open=t}))}o.querySelector(`#level-filter`).addEventListener(`change`,e=>{i=e.target.value,a(o)})}export{a as renderDeliverables};