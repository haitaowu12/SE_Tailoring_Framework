import{$ as e,At as t,C as n,D as r,Dt as i,F as a,Ft as o,G as s,H as c,I as l,K as u,L as d,M as f,Nt as p,O as m,P as h,Pt as g,R as _,T as v,U as y,V as b,c as x,ct as ee,dt as S,ft as C,g as w,gt as te,h as ne,ht as T,kt as re,l as E,lt as ie,mt as D,nt as ae,ot as oe,pt as O,q as se,st as k,tt as ce,ut as le,v as ue,y as de,z as fe}from"./index-tTzzMvnf.js";import{t as pe}from"./recommendation-explanation-ClaEMXKn.js";import{checkAssessmentAutomatically as me}from"./assessment-CIB6pPRF.js";var he=new Set([`rationale`,`protectedOutputs`,`residualRisks`,`riskAcceptanceOwner`,`compensatingControls`,`rejectedAlternatives`,`evidenceRef`,`reviewDate`,...Object.keys(k).flatMap(e=>[`${e}-identity`,`${e}-basis`])]),A=e=>e.assessmentTree?.nodes?.[e.assessmentTree.activeId||e.assessmentTree.rootId],j=e=>Object.fromEntries(Object.entries(e||{}).filter(([e,t])=>he.has(e)&&typeof t==`string`));function M(e,t){return ee(t,{assessmentTree:e.assessmentTree,scores:e.scores,assuranceObligations:e.assuranceObligations,activeFloors:e.activeFloors,normativeLevels:e.normativeLevels||e.levels,frameworkVersion:T.version,metricDefinitionSet:T.metricDefinitionSet})}function ge(e,t){let n=A(e)?.rightSizingDrafts?.[t.processId];return!n||typeof n!=`object`?null:{fields:j(n.fields),stale:n.proposalSnapshot!==M(e,t)}}function _e(e,t,n){let r=A(e);if(!r)return e.assessmentTree;let i=r.rightSizingDrafts?.[t.processId];return{...e.assessmentTree,nodes:{...e.assessmentTree.nodes,[r.id]:{...r,rightSizingDrafts:{...r.rightSizingDrafts||{},[t.processId]:{fields:j(n),proposalSnapshot:i?.proposalSnapshot||M(e,t)}}}}}}var N=()=>{};function ve(e,t){let n=g.find(t=>t.id===Number(e.processId))?.name||`Process ${e.processId}`,r=e.proposedTo||e.to,i=ie(e,t.assessmentTree),a=(t.rightSizingApprovalEvaluations||[]).find(t=>Number(t.proposal?.processId)===Number(e.processId)),o=a?.locallyComplete||a?.records?.[0],s=o?.record||(t.rightSizingApprovalRecords||[]).find(t=>Number(t.processId)===Number(e.processId))||{},c=ge(t,e),l=(e,t=``)=>O(c?.fields[e]??t),u=o?.assessment?.status||`not-recorded`,d=o?.assessment?.reasons||[],f=i.requiredRoles.map(e=>`
    <div class="grid-2 mb-sm">
      <label class="text-xs">${O(k[e])} — asserted role<input class="input" name="${e}-identity" placeholder="Asserted approver role (not verified)" value="${l(`${e}-identity`,s.approvals?.[e]?.identity||``)}"></label>
      <label class="text-xs">Authority basis<input class="input" name="${e}-basis" placeholder="Role charter, delegation, or acceptance authority" value="${l(`${e}-basis`,s.approvals?.[e]?.authorityBasis||``)}"></label>
    </div>`).join(``);return`
    <details class="mt-sm" style="border-top:1px solid rgba(99,102,241,.2);padding-top:8px;">
      <summary class="text-sm"><strong>${O(n)}</strong>: ${O(e.from)} → ${O(r)} · local record ${O(u)}</summary>
      <form class="right-sizing-approval-form mt-sm" data-process-id="${e.processId}">
        <div class="text-xs text-secondary mb-sm">Required asserted roles: ${i.requiredRoles.map(e=>O(k[e])).join(` · `)}. ${i.crossElement?`Boundary: ${O(i.governingBoundaryElementId||`unresolved`)}.`:``} The static prototype cannot authenticate identities or verify external approval.</div>
        ${d.length?`<div class="text-xs mb-sm" style="color:var(--accent-warning);">Current record: ${d.map(O).join(`, `)}</div>`:``}
        <p class="right-sizing-draft-status text-xs text-secondary mb-sm" role="status">${c?.stale?`Draft from an earlier proposal. Review every field against the current proposal before recording.`:c?`Draft kept in this browser session. It has not been submitted or applied.`:`Typing saves a draft in this browser; only the button below records the asserted decision.`}</p>
        <label class="text-xs">Rationale<textarea class="input" name="rationale" rows="2">${l(`rationale`,s.rationale||``)}</textarea></label>
        <label class="text-xs">Protected outputs and evidence<textarea class="input" name="protectedOutputs" rows="2">${l(`protectedOutputs`,s.protectedOutputs||``)}</textarea></label>
        <div class="grid-2">
          <label class="text-xs">Residual risks<textarea class="input" name="residualRisks" rows="2">${l(`residualRisks`,s.residualRisks||``)}</textarea></label>
          <label class="text-xs">Risk acceptance owner<input class="input" name="riskAcceptanceOwner" value="${l(`riskAcceptanceOwner`,s.riskAcceptanceOwner||``)}"></label>
          <label class="text-xs">Compensating controls<textarea class="input" name="compensatingControls" rows="2">${l(`compensatingControls`,s.compensatingControls||``)}</textarea></label>
          <label class="text-xs">Rejected alternatives<textarea class="input" name="rejectedAlternatives" rows="2">${l(`rejectedAlternatives`,s.rejectedAlternatives||``)}</textarea></label>
          <label class="text-xs">Evidence reference<input class="input" name="evidenceRef" value="${l(`evidenceRef`,s.evidenceRef||``)}"></label>
          <label class="text-xs">Valid through / review date<input class="input" type="date" name="reviewDate" value="${l(`reviewDate`,s.reviewDate||``)}"></label>
        </div>
        ${f}
        <button class="btn btn-primary btn-sm" type="submit">Record asserted decision and update local scenario</button>
      </form>
    </details>`}function P(e,t){return[...e.querySelectorAll(`:scope > .card.mb-xl`)].find(e=>e.querySelector(`h4`)?.textContent?.includes(t))}function F(e,t,n,r,i=!0){if(!t)return;let a=document.createElement(`details`);a.className=`report-section`,i&&(a.open=!0);let o=document.createElement(`summary`);o.innerHTML=`
    <span class="report-section-labels">
      <span class="report-section-title">${n}</span>
      <span class="report-section-description">${r}</span>
    </span>
  `;let s=document.createElement(`div`);s.className=`report-section-body`,t.replaceWith(a),a.append(o,s),s.appendChild(t)}function ye(e,t=new Map){let n=e.querySelector(`.report-summary-panel`);if(!n)return;(e.querySelector(`.report-process-plan`)||n).insertAdjacentHTML(`afterend`,`
    <div class="report-section-toolbar" aria-label="Report section controls">
      <span>Report sections</span>
      <button class="btn btn-secondary btn-sm" id="btn-expand-report-sections">Expand all</button>
      <button class="btn btn-secondary btn-sm" id="btn-collapse-report-sections">Collapse all</button>
    </div>
  `),[{section:e.querySelector(`.report-method-details`),title:`Method scope and completion details`,description:`Software checks, policy indicators and evidence limits.`,open:!1},{section:e.querySelector(`.decision-ledger`),title:`Saved tailoring decisions`,description:`Recommendation, local choice, rationale and change history.`,open:!1},{section:P(e,`Project context`),title:`Project context`,description:`Assessed boundary, decision purpose and project metadata.`,open:!1},{section:P(e,`System Element Tailoring Overview`),title:`System Element Tailoring Overview`,description:`Hierarchy and element-level assessment status.`,open:!1},{section:P(e,`Right-Sizing Analysis`),title:`Right-Sizing Analysis`,description:`PSI, CSI, CRI, and non-binding right-sizing proposals.`,open:!1},{section:P(e,`Safety Assurance Criticality`),title:`Safety Assurance Criticality`,description:`Safety tier and rigor floor.`,open:!1},{section:P(e,`Active Mandatory Floors`),title:`Active Mandatory Floors`,description:`Triggered floors, including those already satisfied by derivation.`,open:!1},{section:P(e,`Correlated Evidence Review`),title:`Correlated Evidence Review`,description:`Warning-only review of shared M5, M6, and M8 evidence.`,open:!1},{section:P(e,`Consistency Warnings`),title:`Consistency Warnings`,description:`Rules that need review or follow-up.`,open:!1},{section:P(e,`Rule 11 Disposition`),title:`Rule 11 Disposition`,description:`Recorded outcome, rationale, authority, evidence, and review date.`,open:!1},{section:P(e,`Constraint Response`),title:`Delivery Feasibility Response`,description:`Recorded feasibility actions, owner, rationale, and evidence.`,open:!1},{section:P(e,`Governed Warning Dispositions`),title:`Warning Decision Records`,description:`Recorded warning outcomes and supporting decision records.`,open:!1},{section:P(e,`Full Process Tailoring Profile`),title:`Full Process Tailoring Profile`,description:`One process view with derived, pilot-profile, local-scenario, evidence, and driver context.`,open:!1},{section:P(e,`Override Chain Documentation`),title:`Override Chain Documentation`,description:`Traceability from thresholds to process floors.`,open:!1},{section:P(e,`Propagation Chain Documentation`),title:`Propagation Chain Documentation`,description:`Consistency rule enforcement and dependency resolution.`,open:!1},{section:P(e,`Metric Scores Detail`),title:`Metric Scores Detail`,description:`All metric scores with dimension and anchor text.`,open:!1}].forEach(n=>{F(e,n.section,n.title,n.description,t.get(n.title)??n.open)}),e.querySelector(`#btn-expand-report-sections`)?.addEventListener(`click`,()=>{e.querySelectorAll(`.report-section`).forEach(e=>{e.open=!0})}),e.querySelector(`#btn-collapse-report-sections`)?.addEventListener(`click`,()=>{e.querySelectorAll(`.report-section`).forEach(e=>{e.open=!1})}),N();let r=[],i=()=>{let t=[...e.querySelectorAll(`details`)];r=t.map(e=>e.open),t.forEach(e=>{e.open=!0})},a=()=>{[...e.querySelectorAll(`details`)].forEach((e,t)=>{e.open=r[t]??e.open}),r=[]};window.addEventListener(`beforeprint`,i),window.addEventListener(`afterprint`,a),N=()=>{window.removeEventListener(`beforeprint`,i),window.removeEventListener(`afterprint`,a)}}function I(k){let he=new Map([...k.querySelectorAll(`.report-section`)].map(e=>[e.querySelector(`.report-section-title`)?.textContent,e.open]));N(),E().assessmentComplete||me();let A=E(),j=f(A),M=!j.complete;if(M&&!Object.keys(A.derived||{}).length){k.innerHTML=`<section class="card"><h2>Assessment Work in Progress</h2><p>Answer at least one metric to view a draft report.</p><button class="btn btn-primary mt-md" id="btn-go-assess">Continue Assessment</button></section>`,k.querySelector(`#btn-go-assess`).addEventListener(`click`,()=>S(`assessment`,{resume:`1`}));return}let P=x(),F=A.assessmentTree,L=F?.nodes?.[F.activeId||F.rootId],R=L?.manualAdjustments||((F?.activeId||F?.rootId)===F?.rootId?A.manualAdjustments:{})||{},be=Object.values(L?.decisionRecords||{}),xe=Object.keys(L?.decisionDrafts||{}).length,Se=be.filter(e=>b(e,y(L,A))).length,z=A.scores||{},B=A.levels||{},V=A.locallyAdjustedLevels||{},Ce=A.derived||{},we=A.derivationDetails||{},H=A.confidence||{},Te=O(D(A.projectInfo.name,`Project`)),Ee=O(D(A.projectInfo.date,new Date().toLocaleDateString())),De=O(D(A.projectInfo.team,`—`)),Oe=O(D(A.projectInfo.phase,`N/A`)),ke=Object.values(B).filter(e=>e===`basic`).length,Ae=Object.values(B).filter(e=>e===`standard`).length,U=Object.values(B).filter(e=>e===`comprehensive`).length,je=g.filter(e=>V[e.id]&&V[e.id]!==B[e.id]),Me=A.overrides?.length||0,Ne=A.violations?.length||0,Pe=A.fixes?.length||0,Fe=A.adoptionRisks?.length||0,W=_(A.violations,A.ruleDispositions,A.levels),Ie=fe(A.violations,A.ruleDispositions,A.levels),G=A.ruleDispositions?.[`11`]||A.ruleDispositions?.[11],K=R?.[27]||R?.[`27`],q=K?.origin,Le=d.find(e=>e.id===G?.outcome)?.label||G?.outcome||`—`,J=Ie.assessments.filter(e=>e.ruleId!==`11`),Y=a(z,A.csiResponse),X=Y.response,Re=new Map(h.map(e=>[e.id,e.label])),ze=Object.values(H).filter(e=>e===`available-with-justification`).length,Be=t.filter(e=>String(A.metricAssessments?.[e.id]?.rationale||``).trim()).length,Ve=t.filter(e=>(z[e.id]??3)>=4).map(e=>e.id),He=[...g].sort((e,t)=>{let n=e=>(R[e.id]?4:0)+(B[e.id]===`comprehensive`?2:0)+ +!!A.activeFloors?.some(t=>t.processId===e.id);return n(t)-n(e)||e.id-t.id}),Z=m(A.metricAssessments),Ue=e=>({passed:`Passed`,incomplete:`Incomplete`,"not-implemented":`Not implemented`,"not-recorded":`Not recorded`,"not-available":`Not available`})[e]||e,Q=e=>g.find(t=>t.id===e)?.name||`Process ${e}`,We=e=>e===`any_technical`?`Any Technical Process`:e===`all_technical`?`All Technical Processes`:Array.isArray(e)?e.map(Q).join(`, `):Q(e);k.innerHTML=`
    <div class="report-page-header flex justify-between items-center mb-sm">
      <div>
        <h2>${M?`Draft Tailoring Report`:`Pilot Tailoring Record`}</h2>
        <p class="text-secondary text-sm mt-sm">${Te} · ${Ee}${P.length>1?` · ${O(L?.name||`Current element`)}`:``}</p>
      </div>
      <div class="report-export-actions flex gap-sm">
        <button class="btn btn-primary btn-sm" id="btn-report-decisions">Review / adjust decisions</button>
        <button class="btn btn-secondary btn-sm" id="btn-export-json">Minimum-data JSON</button>
        <button class="btn btn-secondary btn-sm" ${M?`disabled`:``} id="btn-export-html" title="Software completeness only; removes direct display labels but retains free text and evidence references">Download pilot HTML record</button>
      </div>
    </div>

    <p class="report-export-note text-xs text-secondary mb-md">HTML includes rationale and evidence; inspect before sharing. Minimum-data JSON omits those details. Session → Private backup keeps a restorable copy.</p>

    <div class="pilot-record-banner mb-lg" data-record-state="${M?`draft`:`pilot`}" role="note">
      <strong>${M?`Draft report — incomplete`:`Pilot record — not an authoritative organizational baseline`}</strong>
      <span>${M?`${j.completeCount}/${t.length} metric judgments confirmed. Unresolved inputs and checks remain listed below. This is a draft, not a completed record.`:`Software completeness checks passed. External approval not verified.`}</span>${M?`<button type="button" class="btn btn-secondary btn-sm" id="btn-go-assess">Continue Assessment</button><a class="btn btn-secondary btn-sm" href="#issues">Resolve open checks</a>`:``}
    </div>

    <section class="card mb-lg report-summary-panel" aria-labelledby="report-summary-title">
      <div>
        <h3 id="report-summary-title">Current process profile</h3>
        <p class="text-secondary text-sm mt-sm">Use the plan below to agree activities, owners and evidence with your team. Record changes in Decisions; approval stays outside this prototype.</p>
      <p class="text-sm mt-md">${be.length}/${g.length} process decisions recorded · ${xe} unrecorded draft(s)${Se?` · ${Se} previous decision(s) need reconfirmation after input changes`:``}. <a href="#adjust">Review decisions and drafts</a>.</p>
      </div>

      <div class="report-summary-grid">
        <div class="report-summary-item"><span class="summary-value">${ke}</span><span class="summary-label">Basic</span></div>
        <div class="report-summary-item"><span class="summary-value">${Ae}</span><span class="summary-label">Standard</span></div>
        <div class="report-summary-item"><span class="summary-value">${U}</span><span class="summary-label">Comprehensive</span></div>
      </div>

    </section>

    <section class="card mb-xl report-process-plan" aria-labelledby="report-plan-title">
      <div class="flex justify-between items-center gap-lg mb-md" style="flex-wrap:wrap;">
        <div>
          <h3 id="report-plan-title">Process plan</h3>
          <p class="text-xs text-secondary mt-sm">All ${g.length} process recommendations remain available. Local choices and higher-rigor work appear first. Check activities against your boundary and stage.</p>
        </div>
        <button class="btn btn-secondary btn-sm" type="button" id="btn-open-process-guidance">Open process work aids</button>
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table" id="report-process-plan-table" role="table">
          <caption class="sr-only">Current process levels and their reasons. Separate recommendations and local decisions are preserved in the saved decision record.</caption>
          <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Process</th><th scope="col" role="columnheader">Recommendation / chosen level</th><th scope="col" role="columnheader">Why</th><th scope="col" role="columnheader">Work aid</th></tr></thead>
          <tbody role="rowgroup">${He.map((e,n)=>{let r=B[e.id]||B[String(e.id)]||`basic`;return`<tr role="row" ${n>=5?`data-plan-extra hidden`:``}>
              <th scope="row" role="rowheader">${O(e.name)}</th>
              <td role="cell"><span class="text-xs text-secondary">Framework: ${O(T.levelLabels[y(L||{},A).levels[e.id]]||r)}</span><br><span class="level-badge ${O(r)}">${O(T.levelLabels[r]||r)}</span>${R[e.id]?`<br><span class="text-xs text-secondary">Recorded human adjustment</span>`:``}</td>
              <td role="cell" class="text-sm text-secondary report-plan-reason">${O(pe(e.id,{derivationDetails:we,preview:j.completeCount<t.length,authoritative:L?.assessmentResult?.authoritative,activeFloors:A.activeFloors,overrides:A.overrides,fixes:A.fixes}))}${R[e.id]?`<p class="mt-sm"><strong>Your reason:</strong> ${O(R[e.id].justification||`Not supplied`)}</p>`:``}${L?.decisionDrafts?.[e.id]?`<p class="mt-sm">Unsaved decision draft — not applied. Open Decisions to record it.</p>`:``}</td>
              <td role="cell" class="report-plan-action"><a href="${O(C(e.id,r,`report`))}" class="process-detail-link" aria-label="Open work aid for ${O(e.name)}">Open work aid →</a></td>
            </tr>`}).join(``)}</tbody>
        </table>
      </div>
      <button class="btn btn-secondary btn-sm mt-md" type="button" id="btn-toggle-process-plan" aria-controls="report-process-plan-table" aria-expanded="false">Show all ${g.length} processes</button>
    </section>

    <div class="card mb-xl report-method-details">
        <h4>Method scope and completion details</h4>
        <p class="text-xs text-secondary mt-sm">${Me} floor elevations · ${Pe} automatic dependency adjustments · ${Ne} recorded warnings · ${Fe} adoption gaps. ${ze} optional Comprehensive choice${ze===1?``:`s`} need rationale only if selected.</p>
        <p class="text-xs text-secondary mt-sm">Ratings at 4 or 5: ${Ve.length?Ve.join(`, `):`None`}. Higher M16 means stronger enabling conditions. ${Be}/${t.length} metric notes recorded.</p>
        <div class="report-scope-note">
          <strong>Scope and evidence maturity:</strong> This executable assessment covers ${g.length} project-facing Technical and Technical Management processes. Agreement and Organizational Project-Enabling processes are reference scope unless explicitly reviewed. Current evidence supports implementation-integrity claims for the defined research workflow. Content validity, assessor reliability, practical utility, and project-outcome effects remain unestablished.
        </div>
        <div class="report-gate-grid" aria-label="Record gate statuses">
          ${j.gates.map(e=>`<div class="report-gate ${O(e.status)}"><span>${O(e.label)}</span><strong>${O(Ue(e.status))}</strong><small>${O(e.detail)}</small></div>`).join(``)}
        </div>
      </div>

    ${r(A)}
    <div class="card mb-xl">
        <h4 class="mb-md">Project context</h4>
        <table class="data-table">
          <tr><td class="text-secondary">Name</td><td>${Te}</td></tr>
          <tr><td class="text-secondary">Date</td><td>${Ee}</td></tr>
          <tr><td class="text-secondary">Team</td><td>${De}</td></tr>
          <tr><td class="text-secondary">Phase</td><td>${Oe}</td></tr>
          <tr><td class="text-secondary">Assessed boundary</td><td>${O(A.projectInfo.boundary||`Not recorded`)}</td></tr>
          <tr><td class="text-secondary">Decision purpose</td><td>${O(A.projectInfo.purpose||`Not recorded`)}</td></tr>
        </table>
      </div>
    ${P.length>1?`
    <div class="card mb-xl">
      <h4 class="mb-md">System Element Tailoring Overview</h4>
      <p class="text-xs text-secondary mb-md">Hierarchical breakdown of system elements and their targeted tailoring assessments.</p>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Element</th>
              <th>Assessment Type</th>
              <th>Status</th>
              <th>Safety allocation</th>
              <th>M8 child disposition</th>
              <th>M15 child disposition</th>
              <th>Process Levels (B / S / C)</th>
            </tr>
          </thead>
          <tbody>
            ${P.map(t=>{let n=Object.values(t.levels||{}).filter(e=>e===`basic`).length,r=Object.values(t.levels||{}).filter(e=>e===`standard`).length,i=Object.values(t.levels||{}).filter(e=>e===`comprehensive`).length,a=t.assessmentResult!=null,o=t.depth*20,s=O(t.name),c=[`full`,`quick`,`inherited`].includes(t.assessmentType)?t.assessmentType:`full`,l=[`draft`,`under_review`,`approved`,`baselined`].includes(t.status)?t.status:`draft`,u=t.parentId?se(t.safetyAllocationDecision??(t.hasIndependentSafetyAnalysis===!0||null)):null,d=t.parentId?e(`M8`,t.securityHierarchyDisposition??(t.hasIndependentSecurityAnalysis===!0||null)):null,f=t.parentId?e(`M15`,t.assuranceHierarchyDisposition??(t.hasScopedAssuranceDecision===!0||null)):null,p=e=>e?e.valid?`Confirmed decision; evidence not verified`:e.legacyMigrationInput?`Legacy unconfirmed`:`Incomplete`:`—`,m=a?`<div class="se-level-counts text-xs" style="display: flex; gap: 4px;"><span class="level-badge basic" title="Basic Processes" style="padding: 2px 6px;">`+n+` B</span><span class="level-badge standard" title="Standard Processes" style="padding: 2px 6px;">`+r+` S</span><span class="level-badge comprehensive" title="Comprehensive Processes" style="padding: 2px 6px;">`+i+` C</span></div>`:`<span class="text-tertiary text-xs">Not assessed</span>`;return`
                <tr>
                  <td style="padding-left: ${o+12}px">
                    <strong style="${t.id===F.rootId?`color: var(--accent-primary-light);`:``}">${s}</strong>
                  </td>
                  <td><span class="se-type-badge ${c}">${c}</span></td>
                  <td><span class="se-status-badge ${l}">${l}</span></td>
                  <td>${u?u.valid?`Confirmed parent-retained`:u.legacyMigrationInput?`Legacy unconfirmed`:`Incomplete`:`—`}</td>
                  <td>${p(d)}</td>
                  <td>${p(f)}</td>
                  <td>${m}</td>
                </tr>
              `}).join(``)}
          </tbody>
        </table>
      </div>
    </div>`:``}

    ${Y.required?`
    <div class="card mb-xl" style="border-left:3px solid ${Y.complete?`var(--accent-success)`:`var(--accent-warning)`};">
      <h4 class="mb-md">CSI ${Y.csi} Constraint Response — ${Y.complete?`Complete`:`Incomplete`}</h4>
      <p class="text-xs text-secondary mb-md">${Y.expectedResponseType===`sponsor-escalation`?`Sponsor escalation`:`Feasibility review`} record. It does not change the process profile or approve right-sizing proposals.</p>
      <table class="data-table"><tbody>
        <tr><th>Actions</th><td>${O((X.selectedActions||[]).map(e=>Re.get(e)||e).join(`, `)||`—`)}</td></tr>
        <tr><th>Protected outputs/evidence</th><td>${O(X.protectedOutputs||`—`)}</td></tr>
        <tr><th>Rationale/decision</th><td>${O(X.rationaleDecision||`—`)}</td></tr>
        <tr><th>Asserted owner/approver role</th><td>${O(X.ownerApprover||`—`)}</td></tr>
        <tr><th>Evidence reference</th><td>${O(X.evidenceRef||`—`)}</td></tr>
        <tr><th>Review date</th><td>${O(X.reviewDate||`—`)}</td></tr>
      </tbody></table>
    </div>`:``}

    <div class="card mb-xl" style="border-left: 3px solid ${A.rightSizingProposals?.length>0?`#6366f1`:`#34d399`};">
      <h4 class="mb-md">Right-Sizing Analysis</h4>
      <div class="grid-3 mb-md">
        <div style="text-align: center; padding: 12px;">
          <div style="font-size: 28px; font-weight: 900; color: #6366f1;">${A.indices?.psi||`—`}</div>
          <div class="text-xs text-secondary">PSI (Project Scale)</div>
          <div class="text-xs" style="color: #888;">${(A.indices?.psi||3)<=2?`Small`:(A.indices?.psi||3)<=3?`Medium`:`Large/Mega`}</div>
        </div>
        <div style="text-align: center; padding: 12px;">
          <div style="font-size: 28px; font-weight: 900; color: #f59e0b;">${A.indices?.csi||`—`}</div>
          <div class="text-xs text-secondary">CSI (Constraint Stress)</div>
          <div class="text-xs" style="color: #888;">${(A.indices?.csi||3)>=4?`High Pressure`:(A.indices?.csi||3)>=3?`Moderate`:`Low`}</div>
        </div>
        <div style="text-align: center; padding: 12px;">
          <div style="font-size: 28px; font-weight: 900; color: #22d3ee;">${A.indices?.cri||`—`}</div>
          <div class="text-xs text-secondary">CRI (Adoption Readiness)</div>
          <div class="text-xs" style="color: #888;">${(A.indices?.cri||2)<=1?`Constrained conditions`:(A.indices?.cri||2)<=2?`Mixed conditions`:`Strong conditions`}</div>
        </div>
      </div>
      <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
        <strong>Level Distribution:</strong> ${ke} Basic · ${Ae} Standard · ${U} Comprehensive (${Math.round(U/g.length*100)}% Comprehensive)
      </div>
      ${A.rightSizingProposals?.length>0?`
      <div style="background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.25); border-radius: 8px; padding: 12px; margin-top: 8px;">
        <div style="font-weight: 700; color: #6366f1; font-size: 13px; margin-bottom: 6px;">${A.rightSizingProposals.length} Right-Sizing Proposal${A.rightSizingProposals.length===1?``:`s`} — Not Applied</div>
        <div class="text-xs text-secondary mb-sm">The pilot process profile remains normative. A complete browser-local decision record produces only an unverified scenario; it cannot authenticate or apply external approval.</div>
        ${A.rightSizingProposals.map(e=>`<div class="text-sm mb-sm">• <strong>${O(Q(e.processId))}</strong>: ${O(e.from)} → proposed ${O(e.proposedTo||e.to)} <span class="text-xs text-secondary">(${O(e.reason)})</span></div>${ve(e,A)}`).join(``)}
      </div>`:``}
      ${A.locallyCompleteRightSizingRecordCount>0?`<div style="background:rgba(34,211,238,.07);border:1px solid rgba(34,211,238,.3);border-radius:8px;padding:12px;margin-top:8px;"><strong>${A.locallyCompleteRightSizingRecordCount} structurally complete local reduction record(s)</strong><div class="text-xs text-secondary mt-sm">External approval is unverified. The pilot process profile remains unchanged; the separate local scenario has been re-closed against mandatory constraints.</div>${je.map(e=>`<div class="text-sm mt-sm">• <strong>${O(e.name)}</strong>: pilot profile ${O(B[e.id])} → local scenario ${O(V[e.id])}</div>`).join(``)}</div>`:``}
      ${A.rightSizingActions?.length>0?`<div style="background:rgba(148,163,184,.08);border:1px solid rgba(148,163,184,.3);border-radius:8px;padding:12px;margin-top:8px;"><div style="font-weight:700;font-size:13px;">Historical right-sizing actions (${A.rightSizingActions.length})</div><div class="text-xs text-secondary mt-sm">Preserved from a legacy import for audit only; not treated as approved v4 reductions.</div></div>`:``}
      ${A.blockedRightSizingCandidates?.length>0?`<div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:12px;margin-top:8px;"><div style="font-weight:700;font-size:13px;">Blocked reduction candidates (${A.blockedRightSizingCandidates.length})</div><div class="text-xs text-secondary mt-sm">Mandatory closure would restore these candidate levels, so they are not offered for approval.</div></div>`:``}
      ${A.budgetStatus&&!A.budgetStatus.withinBudget?`
      <div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 8px; padding: 12px; margin-top: 8px;">
        <div style="font-weight: 700; color: #f59e0b; font-size: 13px;">Pilot Profile Concentration Exception</div>
        <div class="text-sm mt-sm">The pilot protected profile exceeds the configured PSI guidance by ${A.budgetStatus.comprehensiveExcess} Comprehensive and ${A.budgetStatus.standardExcess} Standard process(es). This exception requires governance review; it is not a failed safety or mandatory-rule closure.</div>
      </div>`:A.rightSizingProposals?.length?``:`
      <div class="text-sm" style="color: #34d399;">✓ Pilot process profile is within configured concentration guidance; no reduction proposal is needed.</div>`}
      ${A.adoptionRisks?.length>0?`
      <div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 8px; padding: 12px; margin-top: 8px;">
        <div style="font-weight: 700; color: #f59e0b; font-size: 13px; margin-bottom: 6px;">${A.adoptionRisks.length} Adoption Readiness Gap${A.adoptionRisks.length===1?``:`s`}</div>
        <div class="text-xs text-secondary mb-sm">Required rigor is preserved. These gaps identify support needed to execute the selected profile.</div>
        ${A.adoptionRisks.slice(0,10).map(e=>`<div class="text-sm mb-sm">• <strong>${O(Q(e.processId))}</strong>: ${O(e.level)} <span class="text-xs text-secondary">(${O(e.guidance||e.reason)})</span></div>`).join(``)}
        ${A.adoptionRisks.length>10?`<div class="text-xs text-secondary">+ ${A.adoptionRisks.length-10} more readiness gaps.</div>`:``}
      </div>`:``}
    </div>

    ${A.saTier?`
    <div class="card mb-xl" style="border-left: 3px solid #ef4444; background: rgba(239,68,68,0.04);">
      <h4 class="mb-md">Safety Assurance Criticality</h4>
      <div class="flex items-center gap-lg">
        <div class="sa-tier-badge tier-${A.saTier.tier}" style="font-size: 24px; font-weight: 700; padding: 12px 24px; border-radius: 8px;">
          ${A.saTier.tier}
        </div>
        <div>
          <div class="font-bold">${O(A.saTier.name)}</div>
          <div class="text-sm text-secondary">${O(A.saTier.description)}</div>
          <div class="text-sm mt-sm"><strong>Minimum Rigor Floor:</strong> ${O(A.saTier.floor||`None`)}</div>
        </div>
      </div>
    </div>`:``}

    ${A.activeFloors?.length>0?`
    <div class="card mb-xl" style="border-left:3px solid var(--accent-info)">
      <h4 class="mb-md">Active Mandatory Floors (${A.activeFloors.length})</h4>
      <p class="text-xs text-secondary mb-md">Every triggered floor is retained for provenance. A floor may already be satisfied and therefore produce no elevation event.</p>
      ${A.activeFloors.map(e=>{let t=A.overrides.find(t=>t.processId===e.processId&&(t.overrideId===e.overrideId||t.reason===e.reason||t.reason===e.label));return`<div class="text-sm mb-sm"><strong>${O(Q(e.processId))}</strong>: minimum ${O(e.minLevel||e.requiredLevel||e.to||`active`)} — <span style="color:${t?`var(--accent-warning)`:`var(--accent-success)`}">${t?`elevated`:`already satisfied`}</span> <span class="text-xs text-secondary">(${O(e.label||e.reason||e.condition||e.overrideId||`mandatory floor`)})</span></div>`}).join(``)}
    </div>`:``}

    ${A.violations.length>0?`
    <div class="card mb-xl" style="border-left: 3px solid var(--accent-error)">
      <h4 class="mb-md">Consistency Warnings (${A.violations.length})</h4>
      ${A.violations.map(e=>`<div class="text-sm mb-sm"><strong>[${O(e.type)}] Rule ${O(e.ruleId)}</strong>: ${O(e.label)}${e.resolvedByLocalChoice?` <em>(Recommendation warning addressed by the current local choice; disposition retained.)</em>`:``}</div>`).join(``)}
    </div>`:``}

    ${Z.warningCount?`
    <div class="card mb-xl" style="border-left:3px solid var(--accent-warning)">
      <h4 class="mb-md">Correlated Evidence Review (${Z.warningCount})</h4>
      <p class="text-xs text-secondary mb-md">Shared evidence is permitted, but it is not independent corroboration unless each metric has a distinct documented consequence analysis. This warning does not change scores, recommended levels, or closure.</p>
      ${Z.warnings.map(e=>`<div class="text-sm mb-sm"><strong>${O(e.metricIds.join(`, `))}</strong>: ${O(e.message)}</div>`).join(``)}
    </div>`:``}

    ${W.required?`
    <div class="card mb-xl" style="border-left:3px solid ${W.complete?`var(--accent-success)`:`var(--accent-warning)`}">
      <h4 class="mb-md">Rule 11 Disposition — ${W.complete?`Complete`:`Incomplete`}</h4>
      <p class="text-xs text-secondary mb-md">Rule 11 remains a warning and P12 remains recommended; this record does not suppress the warning or create automatic closure.</p>
      <table class="data-table"><tbody>
        <tr><th>Outcome</th><td>${O(Le)}</td></tr>
        <tr><th>Rationale / controls</th><td>${O(G?.rationale||`—`)}</td></tr>
        <tr><th>Asserted owner / approver role</th><td>${O(G?.ownerApprover||`—`)}</td></tr>
        <tr><th>Evidence</th><td>${O(G?.evidenceRef||`—`)}</td></tr>
        <tr><th>Review date</th><td>${O(G?.reviewDate||`—`)}</td></tr>
        <tr><th>Final Validation level</th><td>${O(B[27]||`—`)}</td></tr>
        <tr><th>Adjustment provenance</th><td>${K?.source===`rule-disposition`?`${O(K.source)} · Rule ${O(K.ruleId)} / ${O(K.propagationId)}`:q?.source===`rule-disposition`?`Original: ${O(q.source)} · Rule ${O(q.ruleId)} / ${O(q.propagationId)} (current choice subsequently edited)`:`—`}</td></tr>
      </tbody></table>
    </div>`:``}

    ${J.length?`
    <div class="card mb-xl" style="border-left:3px solid ${J.every(e=>e.complete)?`var(--accent-success)`:`var(--accent-warning)`}">
      <h4 class="mb-md">Governed Warning Dispositions — ${J.every(e=>e.complete)?`Complete`:`Incomplete`}</h4>
      <p class="text-xs text-secondary mb-md">Each triggered, unsatisfied warning is consciously dispositioned before software completeness can pass. The records do not suppress warnings or change process levels.</p>
      ${J.map(e=>{let t=e.record||{},n=l.find(e=>e.id===t.outcome)?.label||t.outcome||`—`;return`<details class="mb-sm"><summary class="text-sm"><strong>Rule ${O(e.ruleId)}</strong> — ${e.complete?`complete`:`missing ${O(e.missingFields.join(`, `))}`}</summary>
          <table class="data-table mt-sm"><tbody>
            <tr><th>Outcome</th><td>${O(n)}</td></tr>
            <tr><th>Rationale / controls</th><td>${O(t.rationale||`—`)}</td></tr>
            <tr><th>Asserted owner / approver role</th><td>${O(t.ownerApprover||`—`)}</td></tr>
            <tr><th>Evidence</th><td>${O(t.evidenceRef||`—`)}</td></tr>
            <tr><th>Review date</th><td>${O(t.reviewDate||`—`)}</td></tr>
          </tbody></table></details>`}).join(``)}
    </div>`:``}

    <h3 class="report-layer-heading">Trace and reference</h3>
    <div class="card mb-xl">
      <h4 class="mb-md">Full Process Tailoring Profile</h4>
      <p class="text-xs text-secondary mb-md">One process-level view: derived level, pilot-profile assignment, separate unverified local scenario, evidence status, and top drivers.</p>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Process</th>
              <th>Group</th>
              <th>Derived</th>
              <th>Manual adjustment</th>
              <th>Override</th>
              <th>Fix</th>
              <th>Pilot profile</th>
              <th>Local reduction scenario</th>
              <th>Evidence Status</th>
              <th>Top drivers</th>
            </tr>
          </thead>
          <tbody>
            ${g.map(e=>{let t=[`basic`,`standard`,`comprehensive`].includes(Ce[e.id])?Ce[e.id]:null,n=B[e.id]||`basic`,r=V[e.id]||n,i=R?.[e.id]||R?.[String(e.id)],a=A.overrides?.find(t=>t.processId===e.id),s=A.fixes?.find(t=>t.processId===e.id),c=o[e.group.toUpperCase()],l=H[e.id],u=we[e.id]||{},d=Array.isArray(u.triggerMetrics)&&u.triggerMetrics.length?u.triggerMetrics.join(`, `):`—`,f=ae(e.id,z,A.matrixMap,{...A.projectInfo,metricAssessments:A.metricAssessments||{},assuranceObligations:A.assuranceObligations||[]}),p=l===`corroborated`?`<span class="confidence-badge-inline corroborated" title="The framework threshold is met; evidence independence is not verified">Rule threshold met</span>`:l===`direct-consequence`?`<span class="confidence-badge-inline high" title="A mapped M5 or M7 score of 5 independently triggers Comprehensive under the framework policy; this is not multi-input corroboration or a floor elevation">Direct consequence</span>`:l===`available-with-justification`?`<span class="confidence-badge-inline available-with-justification" title="Standard is recommended; choosing Comprehensive requires recorded justification">Optional elevation</span>`:l===`floor-applied`?`<span class="confidence-badge-inline floor-applied" title="Comprehensive level set by safety, regulatory, or consistency floor">Floor</span>`:l===`high`?`<span class="confidence-badge-inline high" title="Supported by drivers/rules">Supported</span>`:`<span class="text-secondary">Not recorded</span>`,m=i?`<span class="manual-adjustment-cell"><strong>${O(i.level||n)}</strong><span class="text-xs text-secondary">${O(i.justification||`No justification recorded`)}</span></span>`:`<span class="text-tertiary">—</span>`;return`<tr>
                <td><span class="process-id">${e.id}</span></td>
                <td><a href="${O(C(e.id,n,`report`))}" aria-label="View ${O(T.levelLabels[n]||n)} details for ${O(e.name)}" style="color:var(--accent-primary-light);text-decoration:underline;text-underline-offset:2px;">${O(e.name)}</a></td>
                <td style="color:${c?.color||`inherit`}">${c?.name||e.group}</td>
                <td>${t?`<span class="level-badge ${t}">${t[0].toUpperCase()}</span>`:`<span class="text-secondary">Not recorded</span>`}</td>
                <td>${m}</td>
                <td>${a?`<span style="color:var(--accent-warning); font-size:11px;">${a.from}→${a.to}</span>`:`<span class="text-tertiary">—</span>`}</td>
                <td>${s?`<span style="color:var(--accent-success); font-size:11px;">${s.from}→${s.to}</span>`:`<span class="text-tertiary">—</span>`}</td>
                <td><span class="level-badge ${n}" style="font-weight:700;">${n[0].toUpperCase()}</span></td>
                <td>${r===n?`<span class="text-tertiary">—</span>`:`<span class="level-badge ${r}" style="font-weight:700;">${r[0].toUpperCase()}</span><br><span class="text-xs text-secondary">Unverified local scenario</span>`}</td>
                <td>${p}</td>
                <td class="text-xs text-secondary">${O(d)}${u.triggerScore?` (${u.triggerScore})`:``}<br>${O(f.slice(0,3).map(e=>`${e.metric}=${e.value} (${e.role})`).join(`, `)||`—`)}</td>
              </tr>`}).join(``)}
          </tbody>
        </table>
      </div>
    </div>

    ${A.overrides.length>0?`
    <div class="card mb-xl" style="border-left: 3px solid var(--accent-warning)">
      <h4 class="mb-md">Override Chain Documentation</h4>
      <p class="text-xs text-secondary mb-md">Traceability from metric thresholds to process level floors. Thresholds are framework policy; references do not prescribe these score cutoffs.</p>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Override Condition</th>
              <th>Trigger</th>
              <th>Affected Process</th>
              <th>Change</th>
              <th>Policy basis / reference</th>
            </tr>
          </thead>
          <tbody>
            ${A.overrides.map(e=>{let t=p.find(t=>t.id===e.overrideId||t.label===e.reason),n=e.condition||t?.condition||`—`;return`<tr>
                <td><strong>${O(e.reason)}</strong></td>
                <td><code style="font-size:11px; background:var(--bg-tertiary); padding:2px 6px; border-radius:4px;">${O(n)}</code></td>
                <td>${O(Q(e.processId))}</td>
                <td><span class="level-badge ${e.from}" style="opacity:0.6;">${O(e.from?.[0]?.toUpperCase()||``)}</span> → <span class="level-badge ${e.to}">${O(e.to?.[0]?.toUpperCase()||``)}</span></td>
                <td class="text-xs text-secondary">${O(t?.source||`—`)}</td>
              </tr>`}).join(``)}
          </tbody>
        </table>
      </div>
    </div>`:``}

    ${A.fixes?.length>0||A.violations?.length>0?`
    <div class="card mb-xl" style="border-left: 3px solid var(--accent-info)">
      <h4 class="mb-md">Propagation Chain Documentation</h4>
      <p class="text-xs text-secondary mb-md">Consistency rule enforcement showing how process dependencies were resolved.</p>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Type</th>
              <th>Trigger Process</th>
              <th>Required Process</th>
              <th>Action</th>
              <th>Rationale</th>
            </tr>
          </thead>
          <tbody>
            ${A.fixes?.map(e=>{let t=i?.find(t=>t.label?.includes(e.reason)||t.id===e.ruleId);return`<tr style="background: rgba(52,211,153,0.05);">
                <td><strong>Rule ${t?.id||`—`}</strong></td>
                <td><span style="background: rgba(239,68,68,0.15); color:#ef4444; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:600;">HC</span></td>
                <td>${O(t?.trigger?.process?We(t.trigger.process):`—`)}</td>
                <td>${O(Q(e.processId))}</td>
                <td><span class="level-badge ${e.from}" style="opacity:0.6;">${O(e.from?.[0]?.toUpperCase()||``)}</span> → <span class="level-badge ${e.to}">${O(e.to?.[0]?.toUpperCase()||``)}</span></td>
                <td class="text-xs text-secondary">${O(t?.rationale?.substring(0,80)||`—`)}...</td>
              </tr>`}).join(``)||``}
            ${A.violations?.filter(e=>e.type===`WN`).map(e=>{let t=i?.find(t=>t.id===e.ruleId);return`<tr style="background: rgba(251,191,36,0.05);">
                <td><strong>Rule ${e.ruleId}</strong></td>
                <td><span style="background: rgba(251,191,36,0.15); color:#f59e0b; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:600;">WN</span></td>
                <td>${O(t?.trigger?.process?We(t.trigger.process):`—`)}</td>
                <td>${O(Q(e.affectedProcess))}</td>
                <td><span style="color:var(--accent-warning); font-size:11px;">Review recommended</span></td>
                <td class="text-xs text-secondary">${O(e.rationale?.substring(0,80)||e.label)}...</td>
              </tr>`}).join(``)||``}
          </tbody>
        </table>
      </div>
    </div>`:``}

    <div class="card mb-xl">
      <h4 class="mb-md">Metric Scores Detail</h4>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Metric</th><th>Dimension</th><th>Score</th><th>Description</th><th>Justification note</th></tr></thead>
          <tbody>
            ${t.map(e=>{let t=z[e.id]||`—`,n=re.find(t=>t.id===e.dimension),r=A.metricAssessments?.[e.id]?.rationale||``;return`<tr>
                <td><strong>${e.id}</strong> ${e.name}</td>
                <td style="color:${n.color}">${n.name}</td>
                <td><strong>${t}</strong></td>
                <td class="text-xs text-secondary">${O(v(e,t))}</td>
                <td class="text-xs text-secondary metric-note-cell">${O(r||`—`)}</td>
              </tr>`}).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `;let $=document.createElement(`style`);$.textContent=`
    .report-summary-panel { padding:16px 0; margin-bottom:12px; gap:16px; }
    .report-summary-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
    .report-process-plan [hidden] { display:none !important; }
    @media screen and (max-width:600px) {
      #report-process-plan-table, #report-process-plan-table tbody { display:block; width:100%; }
      #report-process-plan-table thead { position:absolute; width:1px; height:1px; padding:0; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
      #report-process-plan-table tbody tr { display:grid; grid-template-columns:minmax(0,1fr) auto; border:1px solid var(--border-subtle); border-radius:8px; margin-bottom:12px; padding:12px; gap:8px; }
      #report-process-plan-table tbody th, #report-process-plan-table tbody td { display:block; position:static; min-width:0; padding:0; border:0; background:none; white-space:normal; overflow-wrap:anywhere; }
      #report-process-plan-table tbody th { text-transform:none; letter-spacing:normal; font-size:var(--font-size-sm); color:var(--text-primary); }
      #report-process-plan-table .report-plan-reason, #report-process-plan-table .report-plan-action { grid-column:1 / -1; }
      #report-process-plan-table .report-plan-reason::before { content:'Why: '; font-weight:600; }
    }
    @media print { .report-process-plan tr[data-plan-extra] { display:table-row !important; } }
    .se-type-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
    .se-type-badge.full { background: rgba(99,102,241,0.15); color: var(--accent-primary-light); }
    .se-type-badge.quick { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .se-type-badge.inherited { background: rgba(52,211,153,0.15); color: #34d399; }
    .se-status-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
    .se-status-badge.draft { background: rgba(148,163,184,0.15); color: var(--text-secondary); }
    .se-status-badge.under_review { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .se-status-badge.approved { background: rgba(52,211,153,0.15); color: #34d399; }
    .confidence-badge-inline { display:inline-flex; align-items:center; width:max-content; padding:2px 6px; border:1px solid var(--border-subtle); border-radius:4px; font-size:10px; font-weight:700; cursor:help; }
    .confidence-badge-inline.corroborated { color: #22c55e; }
    .confidence-badge-inline.available-with-justification { color: #f59e0b; }
    .confidence-badge-inline.floor-applied { color: #60a5fa; }
    .confidence-badge-inline.high { color: var(--text-tertiary); }
    .justification-flag { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 4px; background: rgba(245,158,11,0.15); color: #f59e0b; font-weight: 600; margin-left: 4px; cursor: help; }
    .manual-adjustment-cell { display:grid; gap:2px; min-width:160px; }
    .metric-note-cell { min-width: 240px; max-width: 420px; white-space: pre-wrap; }
    .report-scope-note { margin-top: 12px; padding: 10px 12px; border-radius: 8px; background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
    .pilot-record-banner { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px 16px; align-items:center; padding:12px 16px; border:1px solid rgba(245,158,11,.4); border-radius:10px; background:rgba(245,158,11,.08); }
    .pilot-record-banner strong,.pilot-record-banner span { grid-column:1; }
    .pilot-record-banner span { color:var(--text-secondary); font-size:12px; }
    .pilot-record-banner .btn { justify-self:start; }
    @media(max-width:600px) { .pilot-record-banner { grid-template-columns:minmax(0,1fr); gap:10px; } .pilot-record-banner::after { display:none; } }
    .pilot-record-banner[data-record-state="draft"]::after { content:'PILOT / WIP'; }
    .pilot-record-banner::after { content:'PILOT'; grid-column:2; grid-row:1 / span 2; color:var(--accent-warning); font-size:11px; font-weight:800; letter-spacing:.1em; transform:rotate(-3deg); }
    .report-layer-heading { margin:30px 0 12px; color:var(--text-primary); font-size:18px; }
    .report-gate-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:10px; margin-top:14px; }
    .report-gate { display:grid; gap:3px; padding:10px; border:1px solid var(--border-subtle); border-radius:8px; }
    .report-gate > span,.report-gate small { color:var(--text-secondary); font-size:11px; }
    .report-gate.passed strong { color:var(--accent-success); }
    .report-gate.incomplete strong { color:var(--accent-warning); }
  `,k.appendChild($),ye(k,he),k.querySelector(`#btn-toggle-process-plan`)?.addEventListener(`click`,e=>{let t=e.currentTarget.getAttribute(`aria-expanded`)!==`true`;k.querySelectorAll(`[data-plan-extra]`).forEach(e=>{e.hidden=!t}),e.currentTarget.setAttribute(`aria-expanded`,String(t)),e.currentTarget.textContent=t?`Show first 5 processes`:`Show all ${g.length} processes`}),k.querySelector(`#btn-open-process-guidance`)?.addEventListener(`click`,()=>S(`processes`)),k.querySelectorAll(`a[href^="#processes?"]`).forEach(e=>{e.addEventListener(`click`,t=>{if(t.defaultPrevented||t.button!==0||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey)return;t.preventDefault();let n=le(e.getAttribute(`href`));S(n.path,n.params)})}),k.querySelectorAll(`.right-sizing-approval-form`).forEach(e=>{let t=JSON.stringify(Object.fromEntries(new FormData(e))),n=()=>{let n=Object.fromEntries(new FormData(e)),r=JSON.stringify(n);if(r===t)return;t=r;let i=E(),a=(i.rightSizingProposals||[]).find(t=>Number(t.processId)===Number(e.dataset.processId));if(!a)return;let o=ne({assessmentTree:_e(i,a,n)}),s=e.querySelector(`.right-sizing-draft-status`);s&&(s.textContent=o?ge(E(),a)?.stale?`Draft from an earlier proposal. Review every field against the current proposal before recording.`:`Draft kept in this browser session. It has not been submitted or applied. Check any save warning before leaving.`:`Draft remains in memory; local save failed. Keep this page open and use Private backup.`)};e.addEventListener(`input`,n),e.addEventListener(`change`,n),e.addEventListener(`submit`,t=>{t.preventDefault();let n=E(),r=Number(e.dataset.processId),i=(n.rightSizingProposals||[]).find(e=>Number(e.processId)===r);if(!i){w(`This proposal is no longer current. Re-run the assessment.`,`warning`);return}let a=new FormData(e),o=ie(i,n.assessmentTree),l=Object.fromEntries(o.requiredRoles.map(e=>[e,{identity:String(a.get(`${e}-identity`)||``).trim(),authorityBasis:String(a.get(`${e}-basis`)||``).trim()}])),d={assessmentTree:n.assessmentTree,scores:n.scores,assuranceObligations:n.assuranceObligations,activeFloors:n.activeFloors,normativeLevels:n.normativeLevels||n.levels,frameworkVersion:T.version,metricDefinitionSet:T.metricDefinitionSet},f={id:`RS-${i.elementId||n.assessmentTree?.activeId||`default`}-${r}`,decision:`approved`,processId:r,scopeElementIds:o.scopeElementIds,governingBoundaryElementId:o.governingBoundaryElementId,from:i.from,to:i.proposedTo||i.to,snapshot:ee(i,d),rationale:String(a.get(`rationale`)||``).trim(),protectedOutputs:String(a.get(`protectedOutputs`)||``).trim(),protectedOutputImpact:i.protectedOutputImpact===!0,residualRisks:String(a.get(`residualRisks`)||``).trim(),riskAcceptanceOwner:String(a.get(`riskAcceptanceOwner`)||``).trim(),compensatingControls:String(a.get(`compensatingControls`)||``).trim(),rejectedAlternatives:String(a.get(`rejectedAlternatives`)||``).trim(),evidenceRef:String(a.get(`evidenceRef`)||``).trim(),reviewDate:String(a.get(`reviewDate`)||``),approvedAt:new Date().toISOString(),approvals:l},p=[...(n.rightSizingApprovalRecords||[]).filter(e=>e.id!==f.id),f],m=n.assessmentTree?.activeId||`default`,h={...n.projectInfo,metricAssessments:n.metricAssessments,assuranceObligations:n.assuranceObligations,rightSizingApprovalRecords:p,activeElementId:m,assessmentTree:n.assessmentTree,frameworkVersion:T.version,metricDefinitionSet:T.metricDefinitionSet},g=n.assessmentTree?.nodes?.[m],_=g?c(g,n):n.scores,v=oe(_,n.matrixMap,h),y=g?u(g,n,v,{...h,matrixMap:n.matrixMap,effectiveScores:_},g.manualAdjustments||{},!0):null,b=ue(v.levels,y?.adjustments||{}),x=s(v,b,_,h);g&&(g.rightSizingApprovalRecords=JSON.parse(JSON.stringify(p)),g.rightSizingDrafts&&delete g.rightSizingDrafts[r],g.assessmentResult={...v,levels:b,violations:x},g.levels={...b},g.locallyAdjustedLevels={...v.locallyAdjustedLevels||{}});let S=ne({levels:b,...m===n.assessmentTree?.rootId?{manualAdjustments:y?.adjustments||{}}:{},normativeLevels:v.normativeLevels,rightSizingApprovalRecords:p,rightSizingApprovalEvaluations:v.rightSizingApprovalEvaluations,locallyAdjustedLevels:v.locallyAdjustedLevels||{},localScenarioClosureFixes:v.localScenarioClosureFixes||[],localScenarioBudgetStatus:v.localScenarioBudgetStatus||null,locallyCompleteRightSizingRecordCount:v.locallyCompleteRightSizingRecordCount||0,approvedRightSizedLevels:{},effectiveRightSizingApprovalCount:0,budgetStatus:ce(b,_),fixes:v.fixes,violations:x,confidence:v.confidence,assessmentTree:n.assessmentTree}),C=v.rightSizingApprovalEvaluations?.find(e=>Number(e.proposal?.processId)===r)?.locallyComplete;w(S?C?`Asserted decision record saved; the local scenario was rechecked. External approval remains unverified and the pilot profile is unchanged.`:`Asserted decision record saved but remains structurally incomplete or invalid.`:`Asserted decision is kept in this session but could not be saved locally. Keep this page open and use Private backup.`,S?C?`success`:`warning`:`error`),I(k)})}),k.querySelector(`#btn-go-assess`)?.addEventListener(`click`,()=>S(`assessment`,{resume:`1`})),k.querySelector(`#btn-report-decisions`)?.addEventListener(`click`,()=>S(`adjust`)),k.querySelector(`#btn-export-json`).addEventListener(`click`,()=>{try{de(A),w(`Minimum-data JSON exported. It is not an authoritative organizational record.`,`success`)}catch(e){w(e.message,`error`)}}),k.querySelector(`#btn-export-html`).addEventListener(`click`,()=>{n(A,te),w(`Identifier-reduced HTML downloaded. It retains free text and evidence and is not de-identified.`,`warning`)})}export{I as renderReport};