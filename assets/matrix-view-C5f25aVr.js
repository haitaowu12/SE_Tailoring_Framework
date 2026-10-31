import{At as e,Et as t,H as n,Pt as r,b as i,ft as a,ht as o,jt as s,kt as c,l,nt as u,pt as d,x as f}from"./index-tTzzMvnf.js";function p(e={}){let i=e.assessmentTree,a=i?.activeId||i?.rootId,o=a?i?.nodes?.[a]:null,c=!i||o?.id===i.rootId,l=o||(i?{}:e),d=o?n(o,e):l.scores||{},f=l.metricAssessments||(c?e.metricAssessments:{})||{},p=Array.isArray(l.assuranceObligations)?l.assuranceObligations:c&&Array.isArray(e.assuranceObligations)?e.assuranceObligations:null,m=e.semanticMigration?.status===`review-required`,h=(!i||!!o)&&p!==null&&!m,g={...e.projectInfo,metricAssessments:f,assuranceObligations:p||[]},_=Object.fromEntries(Object.entries(s).map(([e,t])=>[e,{...t}])),v=Object.values(s).reduce((e,t)=>e+Object.keys(t).length,0),y=t.map(e=>{let t=h&&u(e.processId,d,s,g).some(t=>t.metric===e.metric&&t.role===e.role),n=h?t?`active`:`inactive`:`unavailable`,i=n===`active`?`${e.role}*`:n===`unavailable`?`${e.role}?`:`C`,a=e.role===`P`?`Primary`:`Secondary`,o=[`assessed`,`inherited-confirmed`].includes(f[e.metric]?.status),c=n===`active`?`Confirmed binding obligation with authority and source is scoped to this process; ${e.metric} is an additional ${a.toLowerCase()} driver.${o?``:` ${e.metric} is not a confirmed rating; resulting levels remain a preview.`}`:n===`inactive`?`Conditional ${a.toLowerCase()} driver is inactive: no confirmed binding obligation with authority, source, and this process in scope.`:m?`Conditional applicability is unavailable until semantic migration is reviewed. Preserved records are not treated as current applicability.`:`Conditional applicability is unavailable because the active element or its scoped assurance context is missing.`;return _[e.processId]={..._[e.processId],[e.metric]:i},{processId:e.processId,processName:r.find(t=>t.id===e.processId)?.name||String(e.processId),metric:e.metric,role:e.role,status:n,marker:i,reason:c}}),b=y.filter(e=>e.status===`active`).length,x=y.filter(e=>e.status===`unavailable`).length,S=h?c?`Root assessment`:`Active system element`:`Context unavailable`;return{map:_,canonicalCellCount:v,conditionalDrivers:y,caption:`${v} shared driver allocations, plus ${y.length} conditional M15 relationships: ${b} active, ${y.length-b-x} inactive, ${x} unavailable. Conditions use the current element context, not a claim of external approval. Minimum-level rules and dependencies are separate influences.`,legend:`P/S = shared primary/secondary allocation. P*/S* = active scoped primary/secondary driver. C = conditional relationship, currently inactive. P?/S? = conditional applicability unavailable. Roles are not numerical weights.`,contextLabel:S,elementName:o?.name||`Current assessment`,scores:d,metricAssessments:f,node:o,rootContext:c}}function m(t){let n=l(),u=p(n),m=u.map,h=u.node,g=e=>h?.manualAdjustments?.[e]?.level||(u.rootContext?n.manualAdjustments?.[e]?.level:null)||h?.levels?.[e]||(u.rootContext?n.levels?.[e]:null)||null,_=(e,t)=>u.conditionalDrivers.find(n=>n.processId===e&&n.metric===t);t.innerHTML=`
    <div class="flex justify-between items-center mb-md">
      <div>
        <h2 class="mb-sm">Process-Metric Applicability Matrix</h2>
        <p class="text-secondary text-sm">This matrix links project ratings to process recommendations. <strong class="text-accent">P</strong> = primary driver; <strong class="text-secondary">S</strong> = supporting driver. The roles are not numerical weights. A blank cell means no registered direct mapping. Marked M15 cells are conditional scoped relationships; minimum-level rules and dependencies may also affect the process. <a href="#help?topic=adapt">How to propose a different allocation</a>.</p>
      </div>
      <div class="flex gap-sm">
        <button class="btn btn-secondary btn-sm" id="btn-export-matrix-csv">Export CSV</button>
        <button class="btn btn-primary btn-sm" id="btn-export-matrix-pdf">Export PDF</button>
      </div>
    </div>
    <section class="card mb-md matrix-conditional-summary" aria-labelledby="matrix-conditional-title">
      <h3 id="matrix-conditional-title">Scoped M15 drivers</h3>
      <p class="text-sm text-secondary mt-sm">${d(u.contextLabel)}: ${d(u.elementName)}. ${d(u.caption)}</p>
      <p class="text-sm mt-sm">${d(u.legend)}</p>
      <details class="mt-sm"><summary>View conditional applicability for each process</summary>
        <ul class="matrix-conditional-list">${u.conditionalDrivers.map(e=>`<li><strong>${e.processId}. ${d(e.processName)} · ${d(e.marker)} · ${d(e.status)}</strong><p class="text-sm text-secondary">${d(e.reason)}</p></li>`).join(``)}</ul>
      </details>
    </section>
    <div class="matrix-container card" id="matrix-wrapper">
      <div class="matrix-scroll" tabindex="0" role="region" aria-label="Process to metric matrix; scroll horizontally to see all ratings">
        <table class="matrix-table"><caption class="sr-only">${d(u.caption)} ${d(u.legend)} Use Help for rating names and interpretation.</caption>
          <thead>
            <tr>
              <th class="matrix-corner">Process</th>
              ${e.map(e=>{let t=c.find(t=>t.id===e.dimension);return`<th scope="col" class="matrix-metric-header" title="${e.name}" style="border-top: 3px solid ${t.color}">
                  <div class="metric-col-label">${e.id}</div><span class="sr-only">${d(e.name)}</span>
                  <div class="metric-col-score">${d(u.scores[e.id]??`—`)}</div>
                </th>`}).join(``)}
              <th class="matrix-level-header">Level</th>
            </tr>
          </thead>
          <tbody>
            ${r.map(t=>{let n=m[t.id]||{},r=g(t.id);return`<tr class="matrix-row" data-pid="${t.id}">
                <td class="matrix-process-cell">
                  <span class="process-id">${t.id}</span>
                  <span>${d(t.name)}</span>
                </td>
                ${e.map(e=>{let r=n[e.id],i=_(t.id,e.id),a=i?`conditional ${i.status}`:r||`empty`,o=i?`${i.marker}: ${i.reason}`:r===`P`?`Primary driver`:r===`S`?`Secondary driver`:`No registered direct mapping`;return`<td class="matrix-cell ${a}" data-pid="${t.id}" data-mid="${e.id}" aria-label="${d(`${t.name} / ${e.id}: ${o}`)}" title="${d(o)}">${r||``}</td>`}).join(``)}
                <td class="matrix-level-cell">${r?`<a href="${d(a(t.id,r,`matrix`))}" aria-label="View ${d(o.levelLabels[r]||r)} details for ${d(t.name)}" title="View exact assigned level details" style="display:inline-flex;align-items:center;gap:5px;text-decoration:none;"><span class="level-badge ${r}">${r[0].toUpperCase()}</span><span class="text-xs">View</span></a>`:`—`}</td>
              </tr>`}).join(``)}
          </tbody>
        </table>
      </div>
    </div>
    <details class="card mt-lg"><summary>Rating names</summary><dl>${e.map(e=>`<dt><strong>${d(e.id)}</strong></dt><dd>${d(e.name)}</dd>`).join(``)}</dl></details>
    <div class="matrix-legend mt-lg flex gap-lg justify-between">
      <div class="flex gap-lg">
        ${c.map(e=>`
          <div class="flex items-center gap-sm text-xs">
            <div style="width:10px;height:10px;border-radius:2px;background:${e.color}"></div>
            <span class="text-secondary">${e.name}</span>
          </div>`).join(``)}
      </div>
      <div class="flex gap-md">
        <div class="flex items-center gap-sm text-xs"><div class="matrix-cell-example P">P</div><span class="text-secondary">Primary</span></div>
        <div class="flex items-center gap-sm text-xs"><div class="matrix-cell-example S">S</div><span class="text-secondary">Secondary</span></div>
      </div>
    </div>
  `;let v=document.createElement(`style`);v.textContent=`
    .matrix-conditional-list { padding-left:20px; margin-top:12px; display:grid; gap:12px; }
    .matrix-conditional-summary { line-height:1.6; }
    .matrix-cell.conditional.active { background:rgba(52,211,153,.14); color:var(--text-primary); border:1px dashed var(--accent-primary-light); }
    .matrix-cell.conditional.inactive { color:var(--text-secondary); border:1px dotted var(--border-subtle); }
    .matrix-cell.conditional.unavailable { color:var(--accent-warning); border:1px dashed var(--accent-warning); }
    .matrix-container { padding: 0; overflow: hidden; }
    .matrix-scroll { overflow-x: auto; }
    .matrix-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .matrix-table th, .matrix-table td { padding: 6px 8px; text-align: center; white-space: nowrap; }
    .matrix-corner { text-align: left !important; position: sticky; left: 0; background: var(--bg-secondary); z-index: 2; min-width: 200px; }
    .matrix-metric-header { font-size: 11px; font-weight: 600; padding: 8px 4px !important; vertical-align: bottom; }
    .metric-col-label { color: var(--text-secondary); }
    .metric-col-score { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-top: 2px; }
    .matrix-level-header { font-size: 11px; }
    .matrix-process-cell { text-align: left !important; position: sticky; left: 0; background: var(--bg-card); z-index: 1; display: flex; gap: 8px; align-items: center; }
    .matrix-cell { font-weight: 700; font-size: 12px; border: 1px solid transparent; }
    .matrix-cell.P { background: rgba(99,102,241,0.2); color: var(--accent-primary-light); }
    .matrix-cell.S { background: rgba(148,163,184,0.1); color: var(--text-secondary); }
    .matrix-cell.empty { background: transparent; }
    .matrix-row:hover td { background: rgba(99,102,241,0.04); }
    .matrix-level-cell { min-width: 50px; }
    .matrix-cell-example { width: 24px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 11px; font-weight: 700; }
    .matrix-cell-example.P { background: rgba(99,102,241,0.2); color: var(--accent-primary-light); }
    .matrix-cell-example.S { background: rgba(148,163,184,0.1); color: var(--text-secondary); }
  `,t.appendChild(v),t.querySelector(`#btn-export-matrix-csv`).addEventListener(`click`,()=>{i(l(),e,r,s,p(l()))}),t.querySelector(`#btn-export-matrix-pdf`).addEventListener(`click`,async()=>{await f(l(),e,r,c,s,p(l()))})}export{p as buildMatrixPresentation,m as renderMatrixView};