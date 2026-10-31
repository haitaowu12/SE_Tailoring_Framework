import{Pt as e,_t as t,ft as n,ht as r,l as i,pt as a,vt as o,yt as s}from"./index-UYXeF8Yt.js";function c(c){let l=i(),u=1e3;function d(e){let t=l.assessmentTree?.activeId,n=t?l.assessmentTree?.nodes?.[t]:null,r=t===l.assessmentTree?.rootId;return n?.manualAdjustments?.[e]?.level||(r?l.manualAdjustments?.[e]?.level:null)||n?.levels?.[e]||l.levels?.[e]||null}function f(t){let n=d(t);return n?r.levelColors[n]:e.find(e=>e.id===t)?.group===`tech_mgmt`?`#6366f1`:`#22d3ee`}function p(t){return e.find(e=>e.id===t)?.name||`Process ${t}`}function m(e){let t=d(e);return[`basic`,`standard`,`comprehensive`].includes(t)?r.levelLabels[t]:`Not assessed`}let h=s.map(e=>({...e,cx:e.x/100*u,cy:e.y/100*480+120})),g=o.map(e=>{let t=e.y===-8?85:35;return{...e,cx:e.x/100*u,cy:t,row:e.y===-8?1:2}}),_=h.map((e,t)=>`${t===0?`M`:`L`} ${e.cx} ${e.cy}`).join(` `),v=t.map(e=>{let t=h.find(t=>t.processId===e.from),n=h.find(t=>t.processId===e.to);return!t||!n?``:`<line x1="${t.cx}" y1="${t.cy}" x2="${n.cx}" y2="${n.cy}" stroke="rgba(244,114,182,0.3)" stroke-width="1.5" stroke-dasharray="6 4" class="flow-arrow">
      <title>${a(e.label)}</title>
    </line>`}).join(``);c.innerHTML=`
    <div class="vee-header">
      <h2>Vee Model Lifecycle View</h2>
      <p class="text-secondary text-sm">Click any process node to explore details. Colors indicate current tailoring levels.</p>
      <div class="vee-legend flex gap-lg mt-md">
        ${Object.entries(r.levelLabels).map(([e,t])=>`
          <div class="flex items-center gap-sm text-sm">
            <div style="width:12px;height:12px;border-radius:50%;background:${r.levelColors[e]}"></div>
            <span>${a(t)}</span>
          </div>`).join(``)}
        <div class="flex items-center gap-sm text-sm">
          <div style="width:12px;height:12px;border-radius:50%;background:#6366f1;opacity:0.5"></div>
          <span>Not assessed</span>
        </div>
      </div>
    </div>
    <div class="vee-svg-container card mt-lg">
      <svg viewBox="0 0 ${u} 600" class="vee-svg" id="vee-svg">
        <!-- Vee path -->
        <path d="${_}" fill="none" stroke="rgba(99,102,241,0.2)" stroke-width="3" stroke-linecap="round"/>
        <!-- Horizontal V&V links -->
        ${v}
        <!-- Management layer background -->
        <rect x="20" y="10" width="${u-40}" height="100" rx="12" fill="rgba(99,102,241,0.04)" stroke="rgba(99,102,241,0.1)" stroke-width="1"/>
        <text x="50" y="30" fill="rgba(99,102,241,0.4)" font-size="11" font-weight="600">TECHNICAL MANAGEMENT</text>
        <!-- Management process nodes -->
        ${g.map(e=>`
          <a class="vee-node" data-pid="${e.processId}" href="${a(n(e.processId,d(e.processId),`vee-model`))}" aria-label="Open ${a(m(e.processId))} details for ${a(e.label)}" style="cursor:pointer">
            <circle cx="${e.cx}" cy="${e.cy}" r="16" fill="${f(e.processId)}" opacity="0.2" stroke="${f(e.processId)}" stroke-width="1.5"/>
            <circle cx="${e.cx}" cy="${e.cy}" r="11" fill="${f(e.processId)}" opacity="0.8"/>
            <text x="${e.cx}" y="${e.cy+4}" text-anchor="middle" fill="white" font-size="9" font-weight="700">${e.processId}</text>
            <text x="${e.cx}" y="${e.cy+(e.row===1?28:-22)}" text-anchor="middle" fill="var(--text-secondary)" font-size="9">${a(e.label)}</text>
          </a>
        `).join(``)}
        <!-- Phase labels -->
        <text x="${u*.15}" y="130" fill="var(--text-secondary)" font-size="14" font-weight="600" text-anchor="middle">Definition & Decomposition</text>
        <text x="${u*.85}" y="130" fill="var(--text-secondary)" font-size="14" font-weight="600" text-anchor="middle">Integration & Verification</text>
        <text x="${u*.5}" y="590" fill="var(--text-secondary)" font-size="14" font-weight="600" text-anchor="middle">Implementation</text>
        <!-- Technical process nodes -->
        ${h.map(e=>`
          <a class="vee-node" data-pid="${e.processId}" href="${a(n(e.processId,d(e.processId),`vee-model`))}" aria-label="Open ${a(m(e.processId))} details for ${a(e.label)}" style="cursor:pointer">
            <circle cx="${e.cx}" cy="${e.cy}" r="22" fill="${f(e.processId)}" opacity="0.15" stroke="${f(e.processId)}" stroke-width="2"/>
            <circle cx="${e.cx}" cy="${e.cy}" r="15" fill="${f(e.processId)}" opacity="0.9"/>
            <text x="${e.cx}" y="${e.cy+4}" text-anchor="middle" fill="white" font-size="10" font-weight="700">${e.processId}</text>
            <text x="${e.cx}" y="${e.cy-28}" text-anchor="middle" fill="var(--text-primary)" font-size="10" font-weight="500">${a(e.label)}</text>
          </a>
        `).join(``)}
        <!-- Vee arrows along path segments -->
        ${h.slice(0,-1).map((e,t)=>{let n=h[t+1];return(e.cx+n.cx)/2,(e.cy+n.cy)/2,`<line x1="${e.cx}" y1="${e.cy}" x2="${n.cx}" y2="${n.cy}" stroke="rgba(99,102,241,0.12)" stroke-width="1.5" marker-end="none"/>`}).join(``)}
      </svg>
    </div>
    <div class="card mt-lg vee-fallback-wrapper">
      <h3 class="mb-sm">Lifecycle Process Table</h3>
      <p class="text-secondary text-sm mb-md">Non-visual fallback for the Vee diagram. Use the action buttons to open the same process details.</p>
      <div style="overflow-x:auto">
        <table class="data-table vee-fallback-table">
          <caption>Vee lifecycle process table</caption>
          <thead>
            <tr>
              <th>Lifecycle Area</th>
              <th>Process</th>
              <th>Current Level</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${[...g.map(e=>({...e,area:`Technical Management`})),...h.map(e=>({...e,area:e.x<50?`Definition and Decomposition`:e.x>50?`Integration and Verification`:`Implementation`}))].map(e=>`
              <tr>
                <td>${a(e.area)}</td>
                <td><span class="process-id">${e.processId}</span> ${a(p(e.processId))}</td>
                <td>${a(m(e.processId))}</td>
                <td><a class="btn btn-secondary btn-sm vee-table-process" href="${a(n(e.processId,d(e.processId),`vee-model`))}" aria-label="Open ${a(p(e.processId))} process details at ${a(m(e.processId))}">Open</a></td>
              </tr>
            `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
    <div id="vee-tooltip" class="vee-tooltip" style="display:none"></div>
  `;let y=document.createElement(`style`);y.textContent=`
    .vee-header { text-align: center; }
    .vee-legend { justify-content: center; flex-wrap: wrap; }
    .vee-svg-container { padding: 24px; overflow: auto; }
    .vee-svg { width: 100%; max-height: 70vh; }
    .vee-fallback-table caption { text-align: left; color: var(--text-secondary); font-size: 12px; padding: 6px 0 10px; }
    .vee-node:hover circle { filter: brightness(1.3); }
    .vee-node:hover text { fill: white !important; }
    .vee-node:focus-visible circle { stroke-width: 4; filter: brightness(1.35); }
    .vee-tooltip { position: fixed; background: var(--bg-secondary); border: 1px solid var(--border-medium); border-radius: 10px; padding: 12px 16px; font-size: 13px; box-shadow: var(--shadow-lg); z-index: 100; pointer-events: none; max-width: 280px; }
  `,c.appendChild(y),c.querySelectorAll(`.vee-node`).forEach(t=>{t.addEventListener(`mouseenter`,n=>{let i=parseInt(t.dataset.pid),a=e.find(e=>e.id===i),o=d(i),s=document.getElementById(`vee-tooltip`);s.replaceChildren();let c=document.createElement(`strong`);c.textContent=a?.name||``;let l=document.createElement(`span`);l.className=`text-secondary`,l.textContent=a?.purpose||``,s.append(c,document.createElement(`br`),l);let u=[`basic`,`standard`,`comprehensive`].includes(o)?o:null;if(u){let e=document.createElement(`span`);e.className=`level-badge ${u}`,e.style.marginTop=`6px`,e.textContent=r.levelLabels[u],s.append(document.createElement(`br`),e)}s.style.display=`block`,s.style.left=n.clientX+16+`px`,s.style.top=n.clientY+16+`px`}),t.addEventListener(`mouseleave`,()=>{document.getElementById(`vee-tooltip`).style.display=`none`})})}export{c as renderVeeModel};