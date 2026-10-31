import{A as e,At as t,B as n,E as r,F as i,G as a,I as o,K as s,L as c,Mt as l,N as u,Nt as d,O as ee,P as f,Pt as p,R as m,T as h,Tt as g,U as _,V as te,Y as v,dt as ne,ft as re,g as y,h as ie,ht as b,i as x,j as S,jt as ae,k as oe,kt as C,l as w,nt as T,o as se,ot as ce,p as E,pt as D,tt as le,ut as ue,v as de,z as fe}from"./index-tTzzMvnf.js";import{t as pe}from"./recommendation-explanation-ClaEMXKn.js";function O(e){let t=Number(e);return Number.isFinite(t)?Math.min(5,Math.max(1,t)):3}function k(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function me(e,t){let n=h(e,t);if(n)return n;let r=e.guidedQuestions?.find(e=>Number(e.yesScore)===t);return r?.rationale||r?.text||`Anchor ${t}`}function he(e={}){return e.status===`assessed`?{label:`Confirmed`,className:`confirmed`}:e.status===`inherited-confirmed`?{label:`Inherited`,className:`inherited`}:e.status===`unknown`?{label:`Unknown`,className:`unknown`}:{label:`Unreviewed`,className:`unreviewed`}}function ge(e={},t={},n=[],r=[]){let i=new Set([`assessed`,`inherited-confirmed`]);return`<div class="ordinal-profile" aria-label="Grouped ordinal metric profile">
      <p class="ordinal-profile-note">Each row is an independent ordinal judgment. Do not infer distance, area, or a combined result across rows.</p>
      ${r.map(r=>{let a=n.filter(e=>e.dimension===r.id);return`<section class="ordinal-dimension-group" style="--dimension-color:${k(r.color)}" aria-labelledby="ordinal-${k(r.id)}">
          <h4 id="ordinal-${k(r.id)}">${k(r.name)}</h4>
          ${a.map(n=>{let r=t?.[n.id]||{},a=he(r),o=i.has(r.status)&&Number(r.score)===Number(e?.[n.id])?O(r.score):null,s=o?`${a.label} at anchor ${o}`:a.label;return`<div class="ordinal-metric-row" role="group" aria-label="${k(n.id)} ${k(n.name)}: ${k(s)}">
              <div class="ordinal-metric-heading">
                <span><strong>${k(n.id)}</strong> ${k(n.name)}</span>
                <span class="ordinal-state ${a.className}">${a.label}${o?` · ${o}`:``}</span>
              </div>
              <ol class="ordinal-anchor-scale">
                ${[1,2,3,4,5].map(e=>`<li data-score="${e}" class="ordinal-anchor${o===e?` selected`:``}" title="${k(me(n,e))}">
                  <span class="ordinal-anchor-number">${e}</span>
                  <span class="ordinal-anchor-marker" aria-hidden="true"></span>
                  <span class="ordinal-anchor-label">${k(me(n,e))}</span>
                </li>`).join(``)}
              </ol>
            </div>`}).join(``)}
        </section>`}).join(``)}
    </div>`}var A=e=>b.levelLabels[e]||e;function _e(e,t,n){let r=String(n.id),i=_(e,t),a=e.decisionRecords?.[r],o=e.decisionDrafts?.[r],s=e.manualAdjustments?.[r],c={level:i.levels[r],justification:``,...s,...a,...o},l=o?.reviewOutcome||(a||s||o?c.level===i.levels[r]?`keep`:`adjust`:``);return`<details class="process-review" ${o?`open`:``}>
    <summary>${o?`Unrecorded draft`:a?te(a,i)?`Reconfirm previous decision`:`Decision recorded: ${A(a.level)}`:s?`Review imported choice: ${A(s.level)}`:`Keep or change this recommendation`}</summary>
    <form data-process-review="${r}">
      <label>Decision for ${D(n.name)}<select class="select" name="outcome"><option value="">Choose a decision…</option><option value="keep" ${l===`keep`?`selected`:``}>Keep recommendation (${A(i.levels[r])})</option><option value="adjust" ${l===`adjust`?`selected`:``}>Change the level</option></select></label>
      <label ${l===`adjust`?``:`hidden`} data-level-field>Chosen level for ${D(n.name)}<select class="select" name="level">${[`basic`,`standard`,`comprehensive`].map(e=>`<option value="${e}" ${c.level===e?`selected`:``}>${A(e)}</option>`).join(``)}</select></label>
      <label>Decision rationale for ${D(n.name)}<textarea class="input" name="justification" rows="2" placeholder="Explain the project need, tradeoff or evidence.">${D(c.justification)}</textarea></label>
      <button class="btn btn-primary btn-sm" type="submit">Record decision for ${D(n.name)}</button>
      <a class="btn btn-secondary btn-sm" href="#adjust?process=${r}">Owner, evidence and history</a>
      <p class="text-xs text-secondary" role="status">${o?`Draft saved locally; current profile has not changed.`:a?`Framework: ${A(i.levels[r])}. Saved choice: ${A(a.level)}. ${D(a.justification||``)}`:s?`Imported choice: ${A(s.level)}. ${D(s.justification||``)} Record your review to retain or change it.`:`No team decision recorded yet.`}</p>
    </form>
  </details>`}function ve(e,t){e.querySelectorAll(`form[data-process-review]`).forEach(e=>{let n=e.dataset.processReview,r=w().assessmentTree.nodes[w().assessmentTree.activeId],i=()=>{let t=_(r,w());return{...r.decisionRecords?.[n]||r.manualAdjustments?.[n]||{},level:e.elements.outcome.value===`keep`?t.levels[n]:e.elements.level.value,justification:e.elements.justification.value,reviewOutcome:e.elements.outcome.value}},a=()=>{e.querySelector(`[data-level-field]`).hidden=e.elements.outcome.value!==`adjust`,r.decisionDrafts={...r.decisionDrafts||{},[n]:i()};let t=ie({assessmentTree:w().assessmentTree});e.querySelector(`[role="status"]`).textContent=t?`Draft saved locally; record the decision to apply it.`:`Local save failed. Keep this tab open and make a private backup.`};e.addEventListener(`input`,a),e.addEventListener(`change`,a),e.addEventListener(`submit`,a=>{if(a.preventDefault(),!e.elements.outcome.value){e.querySelector(`[role="status"]`).textContent=`Choose whether to keep or change the recommendation.`;return}let o=E(r.id,{[n]:i()});if(o.errors.length){e.querySelector(`[role="status"]`).textContent=o.errors.join(` `);return}if(!o.persisted){e.querySelector(`[role="status"]`).textContent=`Recorded in this tab, but local save failed. Back up before closing.`;return}t()})})}var j=[{id:`info`,title:`Project Info`,shortTitle:`Setup`},{id:`complexity`,title:`System Complexity`,shortTitle:`Complexity`},{id:`safety`,title:`Safety & Criticality`,shortTitle:`Criticality`},{id:`constraints`,title:`Project Constraints`,shortTitle:`Constraints`},{id:`stakeholder`,title:`Stakeholder Context`,shortTitle:`Context`},{id:`results`,title:`Results`,shortTitle:`Review`}],M=0,N=new Set([0]),P=`assess`,ye=!1,F={},I={},L={},R=[],z={},B={},be=u();function V(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function H(e,t={}){let n=L[e]||{};return{...n,...t,score:V(t,`score`)?t.score:n.score??F[e]??3,status:t.status||n.status||`unreviewed`,definitionVersion:3,qualifiers:Array.isArray(t.qualifiers)?t.qualifiers:n.qualifiers||[],rationale:t.rationale??n.rationale??``,evidenceRefs:Array.isArray(t.evidenceRefs)?t.evidenceRefs:n.evidenceRefs||[]}}function U({manualMetricId:e=null}={}){let t=JSON.parse(JSON.stringify(L)),n=JSON.parse(JSON.stringify(R)),r=JSON.parse(JSON.stringify(z)),i=JSON.parse(JSON.stringify(B)),a={...F},o=x(),s=w().assessmentDisposition===`demo`?`demo`:`work-in-progress`;o&&(o.scores={...a},o.metricAssessments=JSON.parse(JSON.stringify(t)),o.assuranceObligations=JSON.parse(JSON.stringify(n)),o.ruleDispositions=JSON.parse(JSON.stringify(r)),o.csiResponse=JSON.parse(JSON.stringify(i)),e&&!(o.manualMetrics||[]).includes(e)&&(o.manualMetrics=[...o.manualMetrics||[],e]),o.status=`draft`,o.assessmentDisposition=s),Object.assign(w(),{projectInfo:{...I},scores:a,metricAssessments:t,assuranceObligations:n,ruleDispositions:r,csiResponse:i,assessmentComplete:!1,assessmentDisposition:s}),Z(null,{automatic:!0})}function W(){let e=w(),t=x();return F={...t?.scores||e.scores||{}},I={securityCritical:!1,...e.projectInfo},L=structuredClone(t?.metricAssessments||e.metricAssessments||{}),R=structuredClone(t?.assuranceObligations||e.assuranceObligations||[]),z=structuredClone(t?.ruleDispositions||e.ruleDispositions||{}),B=structuredClone(t?.csiResponse||e.csiResponse||{}),Z(null,{automatic:!0})}function G(e,t,n){return t===`>=`?e>=n:t===`=`?e===n:t===`<=`&&e<=n}function xe(e,t,n={}){for(let r of d){let i=r.trigger||{},a=!1;if(i.type===`metric`?a=G(typeof t?.[i.metric]==`number`?t[i.metric]:3,i.op,i.value):i.type===`context`?a=n?.[i.field]===i.equals:i.type===`binding-assurance`&&(a=G(typeof t?.[i.metric]==`number`?t[i.metric]:3,i.op,i.value)&&(n.assuranceObligations||[]).some(t=>t.bindingStatus===`confirmed`&&g.includes(t.type)&&String(t.authority||``).trim()&&String(t.sourceRef||``).trim()&&(t.processScope||[]).map(Number).includes(Number(e)))),a&&r.processes.includes(e))return{excluded:!0,reason:r.label,minLevel:r.minLevel}}return{excluded:!1,reason:null,minLevel:null}}function K(n,r=null){if(!n.querySelector(`.assessment-container`)){P=[`review`,`issues`].includes(r?.assessmentMode)?r.assessmentMode:`assess`,P!==`assess`&&(M=j.length-1,N.add(M));let n=w(),i=x(),a=i?.scores||{};if(F=Object.keys(a).length>0?{...a}:{...n.scores},I={securityCritical:!1,...n.projectInfo},L=JSON.parse(JSON.stringify(i?.metricAssessments||n.metricAssessments||{})),R=JSON.parse(JSON.stringify(i?.assuranceObligations||n.assuranceObligations||[])),z=JSON.parse(JSON.stringify(i?.ruleDispositions||n.ruleDispositions||{})),B=JSON.parse(JSON.stringify(i?.csiResponse||n.csiResponse||{})),P===`assess`){let t=r?.params?.get(`step`),n=j.findIndex(e=>e.id===t);if(n>=0&&(M=n),r?.params?.get(`resume`)===`1`){let t=e(F,L).incompleteMetricIds[0],n=C.find(e=>e.metrics.includes(t));M=n?j.findIndex(e=>e.id===n.id):j.length-1}N.add(M)}t.forEach(e=>{F[e.id]===void 0&&(F[e.id]=3)})}let i=x(),a=i&&i.id!=="default",o=a?se(i.id):[],s=D(i?.name||``),c=[`full`,`quick`,`inherited`].includes(i?.assessmentType)?i.assessmentType:`full`,l=e(F,L),u=j[M],d=P===`review`?`Tailoring recommendations`:P===`issues`?`Open checks`:u.id===`info`?`Set up the assessment`:u.id===`results`?`Review the tailoring profile`:u.title,ee=P===`review`?`Start with exceptions and priorities. Open a process only when you need its work aid or derivation detail.`:P===`issues`?`Resolve only the items that prevent this assessment from being completed.`:u.id===`info`?`Identify the project context. You can return and edit this later.`:u.id===`results`?`Review the ratings, the reasons for each recommendation, and the decisions still needed.`:`Choose the closest anchor for each metric. Open scoring guidance only when you need help deciding.`;n.innerHTML=`
    <div class="assessment-container">
      ${a?`
      <div class="hierarchy-context-bar">
        <div class="hierarchy-crumbs">
          ${o.map((e,t)=>`<span class="h-crumb${e.id===i.id?` active`:``}">${D(e.name)}</span>${t<o.length-1?` <span class="h-sep">›</span> `:``}`).join(``)}
        </div>
        <div class="hierarchy-badges">
          <span class="se-type-badge ${c}">${c}</span>
          <button class="btn btn-ghost btn-sm" id="btn-back-to-tree">← Back to Elements</button>
        </div>
      </div>`:``}
      <div class="assessment-header">
        <div>
          <p class="eyebrow">${P===`assess`?`Tailoring assessment`:P===`review`?`Recommendation review`:`Completion review`}</p>
          <h2>${a?s+` — `:``}${d}</h2>
          <p class="text-secondary">${ee}</p>
        </div>
        <div class="assessment-coverage" aria-label="${l.completeCount} of ${t.length} metrics reviewed" aria-live="polite">
          <strong>${l.completeCount}/${t.length}</strong>
          <span>reviewed</span>
        </div>
      </div>
      <nav class="step-progress" aria-label="Assessment sections">
        ${j.map((e,t)=>`
          <button class="step-dot ${N.has(t)?`visited`:``} ${t===M?`current`:``}" type="button" data-step="${t}" aria-label="Go to ${D(e.title)} step" ${t===M?`aria-current="step"`:``}>
            <span class="step-index">${t+1}</span>
            <span class="step-label">${e.shortTitle}</span>
          </button>
        `).join(``)}
      </nav>
      <div id="step-content" class="step-content"></div>
      <div class="step-actions">
        <button class="btn btn-secondary" id="btn-prev" ${M===0?`disabled`:``}>← Back</button>
        <span class="step-indicator text-sm text-secondary">${u.shortTitle} · ${M+1}/${j.length}</span>
        <button class="btn btn-primary" id="btn-next">${M===j.length-1?`View Report`:`Next: ${j[M+1].shortTitle} →`}</button>
      </div>
    </div>
  `;let f=document.createElement(`style`);f.textContent=`
    .assessment-container { max-width: 1040px; margin: 0 auto; }
    .assessment-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 20px; }
    .assessment-header h2 { margin-top: 3px; }
    .assessment-header p:last-child { max-width: 720px; margin-top: 6px; }
    .assessment-coverage { flex: 0 0 auto; display: grid; justify-items: end; padding-left: 20px; border-left: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
    .assessment-coverage strong { color: var(--text-primary); font-size: 22px; line-height: 1; letter-spacing: 0; }
    .step-progress { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 4px; margin-bottom: 28px; padding: 4px; border: 1px solid var(--border-subtle); border-radius: 10px; background: var(--bg-secondary); }
    .step-dot { display: flex; align-items: center; justify-content: center; gap: 7px; min-width: 0; padding: 8px 9px; cursor: pointer; border: 0; border-radius: 7px; background: transparent; color: var(--text-secondary); font: inherit; transition: color .15s ease, background .15s ease; }
    .step-dot:hover { color: var(--text-primary); background: var(--bg-tertiary); }
    .step-dot.current { color: var(--text-primary); background: color-mix(in srgb, var(--accent-primary) 14%, var(--bg-tertiary)); }
    .step-index { display: inline-flex; width: 18px; height: 18px; align-items: center; justify-content: center; border: 1px solid var(--border-medium); border-radius: 50%; color: inherit; font-size: 10px; font-weight: 800; }
    .step-dot.current .step-index { border-color: var(--accent-primary); background: var(--accent-primary); color: #fff; }
    .step-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; color: inherit; font-size: 11px; font-weight: 700; white-space: nowrap; }
    .step-content { min-height: 360px; }
    .step-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--border-subtle); }
    .metric-group { margin-bottom: 24px; }
    .dimension-context { display: flex; justify-content: space-between; gap: 16px; padding: 9px 0; border-top: 2px solid var(--dimension-color); color: var(--text-secondary); font-size: 12px; }
    .metric-item { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 0; margin-bottom: 10px; transition: border-color 0.2s; overflow: clip; }
    .metric-item:hover { border-color: var(--border-medium); }
    .metric-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin: 0; padding: 16px 18px; cursor: pointer; list-style: none; }
    .metric-header::-webkit-details-marker { display: none; }
    .metric-header::after { content: '+'; align-self: center; color: var(--text-tertiary); font-size: 18px; line-height: 1; }
    .metric-item[open] .metric-header { border-bottom: 1px solid var(--border-subtle); }
    .metric-item[open] .metric-header::after { content: '−'; color: var(--accent-primary-light); }
    .metric-body { padding: 16px 18px 18px; }
    .metric-name { font-weight: 600; font-size: 15px; }
    .metric-header .metric-status { display: block; margin-top: 3px; font-size: 11px; font-weight: 500; }
    .metric-id { font-size: 12px; font-weight: 700; color: var(--accent-primary-light); background: rgba(99,102,241,0.12); padding: 2px 8px; border-radius: 4px; }
    .metric-score-display { margin-left: auto; align-self: center; font-size: 20px; font-weight: 800; min-width: 32px; text-align: right; transition: color 0.2s; }
    .metric-definition { font-size: 13px; color: var(--text-secondary); line-height: 1.55; margin: 12px 0; }
    .metric-definition strong { color: var(--text-primary); }
    .metric-anchor-choices { border: 0; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr; gap: 6px; }
    .metric-anchor-card { position: relative; display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; align-items: start; gap: 10px; min-height: 44px; border: 1px solid var(--border-subtle); border-radius: 7px; padding: 9px 11px; cursor: pointer; background: var(--bg-secondary); }
    .metric-anchor-card:hover { border-color: var(--border-medium); }
    .metric-anchor-card:focus-within { outline: 3px solid color-mix(in srgb, var(--accent-primary) 35%, transparent); outline-offset: 2px; }
    .metric-anchor-card.selected { border-color: var(--accent-primary); background: color-mix(in srgb, var(--accent-primary) 8%, var(--bg-secondary)); }
    .metric-anchor-card.preview { border-style: dashed; }
    .metric-anchor-card input { width: 16px; height: 16px; margin: 2px 0 0; accent-color: var(--accent-primary); cursor: pointer; }
    .metric-anchor-number { display: inline; margin-right: 8px; color: var(--text-primary); font-size: 13px; font-weight: 800; line-height: 1.1; }
    .metric-anchor-text { display: inline; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
    .metric-anchor-tag { align-self: start; font-size: 8px; font-weight: 700; color: var(--accent-warning); text-transform: uppercase; letter-spacing: .04em; }
    .metric-description { min-height: 44px; font-size: 12px; color: var(--text-secondary); margin-top: 8px; padding: 8px 10px; border-left: 2px solid var(--border-medium); background: transparent; }
    .metric-assessment-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 12px; }
    .metric-status { display: inline-flex; align-items: center; gap: 6px; color: var(--accent-success); }
    .metric-status::before { content: '✓'; font-weight: 800; }
    .metric-status.unknown, .metric-status.needs-review { color: var(--accent-warning); }
    .metric-status.unknown::before, .metric-status.needs-review::before { content: '•'; }
    .metric-unknown-toggle { display: inline-flex; align-items: center; gap: 6px; color: var(--text-secondary); cursor: pointer; }
    .metric-unknown-toggle input { accent-color: var(--accent-warning); }
    .metric-secondary-actions { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-subtle); }
    .metric-justification, .metric-advanced, .assessor-guidance { flex: 1 1 240px; }
    .metric-justification > summary, .metric-advanced > summary, .assessor-guidance > summary { display: flex; justify-content: space-between; gap: 12px; cursor: pointer; color: var(--text-secondary); font-size: 12px; font-weight: 600; list-style: none; }
    .metric-justification > summary::-webkit-details-marker, .metric-advanced > summary::-webkit-details-marker { display: none; }
    .metric-justification > summary::after, .metric-advanced > summary::after, .assessor-guidance > summary::after { content: '+'; color: var(--text-tertiary); font-size: 16px; line-height: 1; }
    .metric-justification[open] > summary::after, .metric-advanced[open] > summary::after, .assessor-guidance[open] > summary::after { content: '−'; color: var(--accent-primary-light); }
    .metric-justification label { display: block; margin-top: 10px; color: var(--text-secondary); }
    .metric-justification-input { min-height: 74px; resize: vertical; }
    .assessor-guidance-grid { display: grid; gap: 9px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-subtle); font-size: 12px; color: var(--text-secondary); }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    .result-guidance { max-width: 760px; color: var(--text-secondary); font-size: 13px; }
    .empty-results-state { max-width: 680px; margin: 56px auto; padding: 36px 24px; text-align: center; border-block: 1px solid var(--border-subtle); }
    .empty-results-state h3 { margin-top: 8px; }
    .info-form { display: grid; gap: 16px; max-width: 500px; margin: 0 auto; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
    .setup-context { margin-top: 4px; border-top: 1px solid var(--border-subtle); padding-top: 12px; }
    .setup-context > summary { display: flex; justify-content: space-between; gap: 16px; cursor: pointer; color: var(--text-secondary); font-size: 12px; font-weight: 700; }
    .setup-context > summary span { color: var(--text-tertiary); font-weight: 500; }
    .setup-context-fields { display: grid; gap: 14px; margin-top: 16px; }
    .section-heading-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
    .section-heading-row .eyebrow { margin-bottom: 3px; }
    .status-count { flex: 0 0 auto; border: 1px solid var(--border-subtle); border-radius: 999px; padding: 3px 9px; color: var(--text-secondary); font-size: 11px; font-weight: 700; }
    .assessment-result-tabs { display: inline-flex; gap: 3px; margin-bottom: 24px; padding: 3px; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-secondary); }
    .assessment-result-tabs button { border: 0; border-radius: 6px; padding: 7px 11px; background: transparent; color: var(--text-secondary); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
    .assessment-result-tabs button.active { background: var(--bg-tertiary); color: var(--text-primary); }
    .issues-hidden { display: none; }
    .results-overview { display: grid; grid-template-columns: minmax(220px, .55fr) minmax(460px, 1.45fr); gap: 30px; align-items: stretch; border-block: 1px solid var(--border-subtle); padding: 22px 0; }
    .results-summary { padding-right: 24px; border-right: 1px solid var(--border-subtle); }
    .results-visual { min-width: 0; }
    .result-stat { display: flex; align-items: baseline; gap: 10px; padding: 11px 0; border-bottom: 1px solid var(--border-subtle); }
    .result-stat strong { min-width: 54px; color: var(--text-primary); font-size: 26px; line-height: 1; }
    .result-stat span { color: var(--text-secondary); font-size: 12px; }
    .priority-guidance { padding-top: 6px; }
    .process-guidance-list { margin-top: 14px; border-top: 1px solid var(--border-subtle); }
    .result-card { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px; align-items: center; padding: 15px 12px 15px 16px; border-bottom: 1px solid var(--border-subtle); border-left: 3px solid var(--recommendation-level); background: transparent; }
    .result-card-main { min-width: 0; }
    .result-card-header { display: flex; justify-content: space-between; align-items: center; gap: 14px; margin-bottom: 5px; }
    .result-process { font-weight: 700; font-size: 14px; }
    .result-process-id { margin-left: 7px; color: var(--text-tertiary); font-size: 10px; font-weight: 700; }
    .result-why { display: flex; gap: 6px 14px; flex-wrap: wrap; color: var(--text-secondary); font-size: 11px; }
    .result-signals { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 7px; }
    .result-signals span { border: 1px solid color-mix(in srgb, var(--accent-warning) 45%, var(--border-subtle)); border-radius: 999px; padding: 2px 7px; color: var(--accent-warning); font-size: 9px; font-weight: 700; }
    .drivers-list { display: flex; gap: 7px 12px; flex-wrap: wrap; margin-top: 7px; color: var(--text-secondary); font-size: 11px; }
    .driver-item { display: inline-flex; gap: 5px; align-items: center; }
    .result-derivation { margin-top: 7px; }
    .result-derivation > summary { cursor: pointer; color: var(--text-tertiary); font-size: 10px; font-weight: 700; }
    .baseline-guidance-empty { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 14px; padding: 16px 0; border-block: 1px solid var(--border-subtle); }
    .baseline-guidance-empty p { max-width: 650px; color: var(--text-secondary); font-size: 13px; }
    .results-breakdown { margin-top: 24px; border: 1px solid var(--border-subtle); border-radius: 12px; background: var(--bg-card); }
    .results-breakdown > summary { padding: 16px 18px; cursor: pointer; color: var(--accent-primary-light); font-weight: 700; }
    .results-breakdown-body { padding: 0 18px 18px; }
    .governance-detail { background: transparent; }
    .action-queue { border-block: 1px solid var(--border-subtle); padding: 14px 0; margin-bottom: 20px; }
    .action-queue-list { display: grid; gap: 8px; margin: 12px 0 0; padding: 0; list-style: none; }
    .action-queue-item { display: grid; grid-template-columns: minmax(160px,.7fr) auto minmax(220px,1.3fr); gap: 12px; align-items: start; padding: 9px 0; border-top: 1px solid var(--border-subtle); }
    .action-queue-item:first-child { border-top: 0; }
    .action-queue-status { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: var(--accent-warning); }
    .action-queue-status.passed { color: var(--accent-success); }
    .action-queue-status.neutral { color: var(--accent-primary-light); }
    .causality-grid { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: 6px; margin-top: 10px; }
    .causality-grid > div { padding: 7px; border: 1px solid var(--border-subtle); border-radius: 6px; background: var(--bg-secondary); }
    .causality-grid dt { color: var(--text-tertiary); font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .causality-grid dd { margin: 3px 0 0; font-size: 11px; font-weight: 700; }
    .decision-workspace { margin-top: 26px; padding-block: 20px; border-block: 1px solid var(--border-subtle); }
    .decision-item { border-top: 1px solid var(--border-subtle); }
    .decision-item:first-of-type { margin-top: 16px; }
    .decision-item > summary { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 14px 0; cursor: pointer; list-style: none; }
    .decision-item > summary::-webkit-details-marker { display: none; }
    .decision-item > summary > span:first-child { display: grid; gap: 2px; }
    .decision-item > summary small { color: var(--text-tertiary); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
    .decision-item > summary strong { font-size: 13px; }
    .decision-state { flex: 0 0 auto; border-radius: 999px; padding: 3px 8px; background: color-mix(in srgb, var(--accent-warning) 12%, transparent); color: var(--accent-warning); font-size: 10px; font-weight: 800; }
    .decision-state.complete { background: color-mix(in srgb, var(--accent-success) 12%, transparent); color: var(--accent-success); }
    .decision-body { max-width: 780px; padding: 0 0 18px; }
    .decision-record-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 11px; margin-top: 12px; }
    .decision-record-fields.is-pending { display: none; }
    .decision-field { display: grid; gap: 5px; color: var(--text-secondary); font-size: 11px; font-weight: 600; }
    .decision-field-wide { grid-column: 1 / -1; }
    .decision-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px 14px; border: 0; margin: 0; padding: 0; color: var(--text-secondary); font-size: 11px; }
    .decision-actions legend { grid-column: 1 / -1; margin-bottom: 4px; color: var(--text-primary); font-weight: 700; }
    .decision-feedback { margin-top: 10px; color: var(--text-secondary); font-size: 11px; }
    @media (max-width: 760px) { .assessment-header { align-items: flex-start; } .assessment-coverage { padding-left: 12px; } .step-progress { grid-template-columns: 1fr; } .step-dot { display: none; } .step-dot.current { display: flex; } .results-overview { grid-template-columns: 1fr; } .results-summary { padding-right: 0; border-right: 0; border-bottom: 1px solid var(--border-subtle); padding-bottom: 18px; } .result-card { grid-template-columns: 1fr; } .baseline-guidance-empty { align-items: flex-start; flex-direction: column; } .step-label { white-space: normal; text-align: center; } .action-queue-item { grid-template-columns: 1fr; gap: 3px; } .causality-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } .decision-record-fields, .decision-actions { grid-template-columns: 1fr; } .decision-field-wide { grid-column: auto; } }
    @media (max-width: 480px) { .assessment-header { display: grid; grid-template-columns: minmax(0,1fr); gap: 10px; } .assessment-coverage { grid-auto-flow: column; justify-content: start; justify-items: start; align-items: baseline; gap: 4px; padding-left: 0; border-left: 0; } .step-actions { gap: 8px; } .step-indicator { display: none; } .step-actions .btn { min-width: 0; padding-inline: 11px; } #btn-next { margin-left: auto; } }
    .override-banner { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; padding: 14px; margin-bottom: 16px; }
    .violation-banner { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 14px; margin-bottom: 16px; }
    .fix-banner { background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3); border-radius: 10px; padding: 14px; margin-bottom: 16px; }
    .hierarchy-context-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 14px; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); border-radius: 8px; margin-bottom: 16px; }
    .hierarchy-crumbs { display: flex; align-items: center; gap: 4px; font-size: 13px; }
    .h-crumb { color: var(--text-secondary); }
    .h-crumb.active { color: var(--accent-primary-light); font-weight: 600; }
    .h-sep { color: var(--text-tertiary); }
    .hierarchy-badges { display: flex; align-items: center; gap: 8px; }
    .se-type-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
    .se-type-badge.full { background: rgba(99,102,241,0.15); color: var(--accent-primary-light); }
    .se-type-badge.quick { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .se-type-badge.inherited { background: rgba(52,211,153,0.15); color: #34d399; }
    .metric-inherited-lock { opacity: 0.5; pointer-events: none; position: relative; }
    .metric-inherited-lock::after { content: '↑ Inherited'; position: absolute; top: 8px; right: 12px; font-size: 10px; color: #34d399; background: rgba(52,211,153,0.15); padding: 1px 6px; border-radius: 3px; }
  `,n.appendChild(f),q(n),n.querySelector(`#btn-next`).addEventListener(`click`,()=>{M<j.length-1?(M++,N.add(M),Se(n)):Z(`#report`)}),n.querySelector(`#btn-prev`).addEventListener(`click`,()=>{M>0&&(M--,N.add(M),Se(n))}),n.querySelectorAll(`.step-dot`).forEach(e=>{e.addEventListener(`click`,()=>{M=parseInt(e.dataset.step),N.add(M),Se(n)})}),n.querySelector(`#btn-back-to-tree`)?.addEventListener(`click`,()=>ne(`elements`))}function Se(e){if(P!==`assess`&&M<j.length-1){ne(`assessment`,{step:j[M].id});return}K(e),window.scrollTo(0,0)}function q(e){let i=e.querySelector(`#step-content`),a=j[M];if(a.id===`info`){i.innerHTML=`
      <div class="info-form">
        <div class="form-group">
          <label class="form-label" for="proj-name">Project code</label>
          <input class="input" id="proj-name" autocomplete="off" placeholder="e.g., PILOT-07" value="${D(I.name||``)}">
        </div>
        <div class="form-group">
          <label class="form-label" for="proj-date">Date</label>
          <input class="input" id="proj-date" type="date" value="${D(I.date||n())}">
        </div>
        <div class="form-group">
          <label class="form-label" for="proj-team">Team code (optional)</label>
          <input class="input" id="proj-team" autocomplete="off" placeholder="e.g., COHORT-B" value="${D(I.team||``)}">
        </div>
        <div class="form-group">
          <label class="form-label" for="proj-phase">Project Phase</label>
          <select class="select" id="proj-phase">
            <option value="">Select phase...</option>
            <option value="concept" ${I.phase===`concept`?`selected`:``}>Concept / Pre-project</option>
            <option value="development" ${I.phase===`development`?`selected`:``}>Development</option>
            <option value="production" ${I.phase===`production`?`selected`:``}>Production</option>
            <option value="operations" ${I.phase===`operations`?`selected`:``}>Operations & Support</option>
            <option value="disposal" ${I.phase===`disposal`?`selected`:``}>Retirement / Disposal</option>
          </select>
        </div>
            <div class="form-group">
              <label class="form-label" for="proj-boundary">Assessed system or work-package boundary</label>
              <input class="input" id="proj-boundary" autocomplete="off" aria-describedby="boundary-help" placeholder="What is included, excluded and your team’s responsibility" value="${D(I.boundary||``)}">
            </div>
        <p class="text-sm text-secondary" id="boundary-help">Describe the system being assessed and the work your team is responsible for. If a wider programme provides plans or assurance, name the applicable record and responsible role in your decision rationale. Use one consistent boundary and life-cycle stage for all answers. <a href="#help?topic=start">Read the short walkthrough</a>.</p>
        <details class="setup-context">
          <summary>Decision purpose and responsibility <span>Optional</span></summary>
          <div class="setup-context-fields">

            <div class="form-group">
              <label class="form-label" for="proj-purpose">Tailoring decision</label>
              <input class="input" id="proj-purpose" autocomplete="off" placeholder="What work you will perform, reuse or request from the wider programme" value="${D(I.purpose||``)}">
            </div>
            <div class="form-group">
              <label class="form-label" for="proj-evidenceCutoff">Evidence cutoff</label>
              <input class="input" id="proj-evidenceCutoff" type="date" value="${D(I.evidenceCutoff||``)}">
            </div>
            <div class="form-group">
              <label class="form-label" for="proj-facilitator">Facilitator</label>
              <input class="input" id="proj-facilitator" autocomplete="off" value="${D(I.facilitator||``)}">
            </div>
            <div class="form-group">
              <label class="form-label" for="proj-owner">Accountable owner</label>
              <input class="input" id="proj-owner" autocomplete="off" value="${D(I.owner||``)}">
            </div>
          </div>
        </details>
      </div>
    `,[`proj-name`,`proj-date`,`proj-team`,`proj-phase`,`proj-boundary`,`proj-purpose`,`proj-evidenceCutoff`,`proj-facilitator`,`proj-owner`].forEach(e=>{let t=i.querySelector(`#${e}`);t.addEventListener(t.matches(`select`)?`change`:`input`,t=>{let n=e.replace(`proj-`,``);I[n]=t.target.value,U()})});return}if(a.id===`results`){Oe(i);return}let o=C.find(e=>e.id===a.id),s=t.filter(e=>e.dimension===a.id),c=s.filter(e=>[`assessed`,`inherited-confirmed`].includes(L?.[e.id]?.status)).length,l=Math.max(0,s.findIndex(e=>![`assessed`,`inherited-confirmed`].includes(L?.[e.id]?.status)));i.innerHTML=`
    <div class="dimension-context mb-md" style="--dimension-color:${o.color}">
      <span>${s.length} metrics</span>
      <span class="dimension-review-count" aria-live="polite">${c}/${s.length} reviewed in this section</span>
    </div>
    <div class="metric-group">
      ${s.map((e,t)=>{let n=L[e.id]||H(e.id),i=r[e.id],a=F[e.id]??3,o=n.status===`unknown`,s=n.status===`unreviewed`,c=[`not-applicable`,`migration-required`].includes(n.status),u=o||c?`—`:a,d=o?`Cannot assess yet — preview only`:n.status===`inherited-confirmed`?`Inherited score confirmed`:c?`Reassessment required`:s?`Unreviewed — preview ${a}`:`Assessed 1–5 score`;return`
        <details class="metric-item" name="assessment-metric" data-metric-id="${e.id}" ${t===l?`open`:``}>
          <summary class="metric-header">
            <div class="flex items-center gap-sm">
              <span class="metric-id">${e.id}</span>
              <span>
                <span class="metric-name">${e.name}</span>
                <span class="metric-status ${o||s?`unknown`:c?`needs-review`:`confirmed`}">${d}</span>
              </span>
            </div>
            <div class="metric-score-display" id="score-${e.id}">${u}</div>
          </summary>
          <div class="metric-body">
          <fieldset class="metric-anchor-choices" aria-describedby="guide-${e.id} desc-${e.id}">
            <legend class="sr-only">Select one ordinal anchor for ${D(e.id)} ${D(e.name)}</legend>
            ${[1,2,3,4,5].map(t=>{let r=[`assessed`,`inherited-confirmed`].includes(n.status)&&n.score===t,i=s&&a===t;return`<label class="metric-anchor-card${r?` selected`:``}${i?` preview`:``}">
                <input type="radio" class="metric-anchor-radio" name="metric-${e.id}" value="${t}" aria-label="${D(e.id)} score ${t}: ${D(h(e,t))}" ${r?`checked`:``}>
                <span><span class="metric-anchor-number">${t}</span><span class="metric-anchor-text">${D(h(e,t))}</span></span>
                ${i?`<span class="metric-anchor-tag">Preview</span>`:``}
              </label>`}).join(``)}
          </fieldset>
          <div class="metric-description" id="desc-${e.id}">${o?`A neutral preview is shown for orientation. Resolve this metric before finalizing.`:c?`Imported value needs a current 1–5 reassessment before software completeness can pass.`:s?`<strong>Preview ${a}:</strong> ${D(h(e,a))}`:`<strong>Anchor ${a}:</strong> ${D(h(e,a))}`}</div>
          <div class="metric-assessment-meta mt-sm">
            <span class="text-xs text-secondary">Select the closest evidence-backed anchor.</span>
            <label class="metric-unknown-toggle"><input type="checkbox" class="metric-unknown" data-metric="${e.id}" aria-label="Mark ${e.id} ${D(e.name)} as cannot assess yet" ${o?`checked`:``}> Cannot assess yet</label>
          </div>
          ${n.status===`not-applicable`?`<div class="text-xs mt-sm" style="color:var(--accent-warning);">Imported N/A cannot pass software completeness. Choose an assessed 1–5 score or explicitly record Unknown.</div>`:``}
          <div class="metric-secondary-actions">
            <details class="assessor-guidance">
              <summary>How to choose a rating</summary>
              <div class="assessor-guidance-grid" id="guide-${e.id}">
                <div class="metric-definition"><strong>Definition:</strong> ${D(i.definition)}<br><strong>Excludes:</strong> ${D(i.exclusions)}</div>
                <div><strong>Evidence examples:</strong> ${D(i.evidenceExamples)}</div>
                <div><strong>Counterexample:</strong> ${D(i.counterexample)}</div>
                <div><strong>Reassess when:</strong> ${D(i.reassessWhen)}</div>
                ${r[e.id]?`<div><button class="btn btn-sm btn-outline wizard-btn" data-metric="${e.id}" type="button">Help me choose</button></div>`:``}
              </div>
            </details>
            ${Ce(e.id)}
            ${e.id===`M15`?Y():``}
          </div>
          <div class="metric-wizard hidden" id="wizard-${e.id}" style="display: none; margin-top: 12px; padding: 16px; background: rgba(99,102,241,0.05); border-radius: 8px; border: 1px solid var(--accent-primary-light);"></div>
          </div>
        </details>`}).join(``)}
    </div>
  `,s.forEach(e=>{i.querySelectorAll(`input[name="metric-${e.id}"]`).forEach(t=>t.addEventListener(`change`,t=>{Te(e.id,Number(t.target.value),i)}));let t=i.querySelector(`.wizard-btn[data-metric="${e.id}"]`);t&&t.addEventListener(`click`,()=>Ee(e.id,i))}),we(i),i.querySelectorAll(`.metric-unknown`).forEach(t=>t.addEventListener(`change`,()=>{let n=t.dataset.metric;L[n]=H(n,{score:t.checked?null:F[n]??3,status:t.checked?`unknown`:`unreviewed`}),U(),K(e)})),i.querySelectorAll(`.metric-justification-input`).forEach(e=>e.addEventListener(`input`,()=>{let t=e.dataset.metric;L[t]=H(t,{rationale:e.value}),U()}))}function Ce(e){let t=L[e]||{},n=t.rationale||``,r=!!n.trim(),i=t.evidenceContext?`<div class="text-xs text-secondary mt-sm">If this metric shares imported evidence with M5, M6, or M8, use this note to record its distinct consequence analysis.</div>`:``;return`<details class="metric-justification mt-md">
    <summary><span>Justification note</span><span class="text-xs text-secondary">${r?`Recorded`:`Optional`}</span></summary>
    <label class="text-xs" for="metric-note-${e}">Optional context for this score</label>
    ${i}
    <textarea class="input mt-sm metric-justification-input" id="metric-note-${e}" data-metric="${e}" rows="3" placeholder="Capture the project fact, assumption, or decision behind this score.">${D(n)}</textarea>
  </details>`}function J(){return R[0]||{id:`AO-1`,type:`regulatory-mandate`,bindingStatus:`unconfirmed`,authority:``,sourceRef:``,processScope:[13,14,16,25],rationale:``}}function Y(){let e=J(),t=l.M15.filter(e=>e.floorEligible);return`<details class="metric-advanced mt-md"${R.length>0?` open`:``}>
    <summary><span>Binding assurance detail</span><span class="text-xs text-secondary">For scoped M15 drivers, floors, and rule severity</span></summary>
    <fieldset style="border:0;padding:12px 0 0;">
      <legend class="text-xs" style="font-weight:700;padding:0 4px;">Primary binding assurance obligation</legend>
      <div class="text-xs text-secondary mb-sm">A confirmed, source-backed, scoped record can activate conditional M15 drivers at any rating. M15≥4 can also activate the defined floors or mandatory support rules. The app does not verify the asserted obligation.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <label class="text-xs">Assurance type<select class="select" id="assurance-type" aria-label="Primary assurance type">${t.map(t=>`<option value="${t.id}" ${e.type===t.id?`selected`:``}>${D(t.label)}</option>`).join(``)}</select></label>
        <label class="text-xs" style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="assurance-confirmed" ${e.bindingStatus===`confirmed`?`checked`:``}> Binding status asserted</label>
        <label class="text-xs">Asserted authority role<input class="input" id="assurance-authority" aria-label="Asserted assurance authority role" placeholder="Asserted authority role (not verified)" value="${D(e.authority||``)}"></label>
        <label class="text-xs">Source reference<input class="input" id="assurance-source" aria-label="Assurance source reference" placeholder="Instrument / source reference" value="${D(e.sourceRef||``)}"></label>
      </div>
      <div class="text-xs mt-sm" style="margin-bottom:5px;color:var(--text-secondary);">Scope the obligation to every affected process. “Floor-capable” can enforce Standard; “driver-only” participates in derivation; “rule-severity only” can make the matching support warning mandatory without adding a metric driver or floor.</div>
      <div class="text-xs" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px 14px;">
        ${be.map(t=>`<label><input type="checkbox" class="assurance-scope" value="${t.processId}" ${(e.processScope||[]).map(Number).includes(t.processId)?`checked`:``}> ${D(t.label)} <span class="text-tertiary">(${t.role}; ${t.floorCapable?`floor-capable`:t.ruleSeverityCapable?`rule-severity only`:`driver-only`})</span></label>`).join(``)}
      </div>
    </fieldset>
  </details>`}function we(e){let t=[`assurance-type`,`assurance-confirmed`,`assurance-authority`,`assurance-source`];if(e.querySelector(`#assurance-type`)){let n=()=>{let t={...J(),type:e.querySelector(`#assurance-type`).value,bindingStatus:e.querySelector(`#assurance-confirmed`).checked?`confirmed`:`unconfirmed`,authority:e.querySelector(`#assurance-authority`).value.trim(),sourceRef:e.querySelector(`#assurance-source`).value.trim(),processScope:[...e.querySelectorAll(`.assurance-scope:checked`)].map(e=>Number(e.value))};R=[t,...R.slice(1)];let n=new Set(L.M15?.qualifiers||[]);n.add(t.type);let r=L.M15?.status;L.M15=H(`M15`,{score:F.M15??3,status:[`assessed`,`inherited-confirmed`,`unknown`].includes(r)?r:`unreviewed`,qualifiers:[...n]}),U()};t.forEach(t=>{let r=e.querySelector(`#${t}`);r?.addEventListener(r.matches(`select, input[type="checkbox"]`)?`change`:`input`,n)}),e.querySelectorAll(`.assurance-scope`).forEach(e=>e.addEventListener(`change`,n))}}function Te(e,n,i){let a=t.find(t=>t.id===e);r[e],F[e]=n,L[e]=H(e,{score:n,status:`assessed`}),U({manualMetricId:e});let o=i.querySelector(`.metric-item[data-metric-id="${e}"]`);o?.querySelectorAll(`.metric-anchor-card`).forEach(e=>{let t=e.querySelector(`.metric-anchor-radio`),r=Number(t?.value)===n;t&&(t.checked=r),e.classList.toggle(`selected`,r),e.classList.remove(`preview`),e.querySelector(`.metric-anchor-tag`)?.remove()});let s=i.querySelector(`#score-${e}`);s&&(s.textContent=n,s.style.color=`var(--text-primary)`);let c=i.querySelector(`#desc-${e}`);c&&(c.textContent=`Confirmed anchor ${n}: ${h(a,n)}`);let l=o?.querySelector(`.metric-status`);l&&(l.className=`metric-status confirmed`,l.textContent=`Assessed 1–5 score`);let u=o?.querySelector(`.metric-unknown`);u&&(u.checked=!1),X(i)}function X(n){let r=e(F,L),i=n.closest(`.assessment-container`)?.querySelector(`.assessment-coverage`);if(i){i.setAttribute(`aria-label`,`${r.completeCount} of ${t.length} metrics reviewed`);let e=i.querySelector(`strong`);e&&(e.textContent=`${r.completeCount}/${t.length}`)}let a=[...n.querySelectorAll(`.metric-item[data-metric-id]`)],o=n.querySelector(`.dimension-review-count`);o&&a.length&&(o.textContent=`${a.filter(e=>[`assessed`,`inherited-confirmed`].includes(L?.[e.dataset.metricId]?.status)).length}/${a.length} reviewed in this section`)}function Ee(e,n){let i=t.find(t=>t.id===e);r[e];let a=[5,4,3,2,1].map(e=>({text:`Does the available evidence support this description? ${h(i,e)}`,yesScore:e,rationale:h(i,e)})),o=n.querySelector(`#wizard-${e}`);if(!o)return;if(o.style.display===`block`){o.style.display=`none`;return}o.style.display=`block`;let s=0,c=[],l=()=>{let t=c.filter(e=>e.answer===`yes`).map(e=>e.question.yesScore),r=t.length?Math.max(...t):null;if(r===null){o.innerHTML=`<p class="text-sm">No rating is supported by these answers. Review the evidence or mark this question Unknown.</p><button class="btn btn-sm btn-outline unknown-wizard">Mark Unknown</button>`,o.querySelector(`.unknown-wizard`).addEventListener(`click`,()=>{let t=n.querySelector(`.metric-unknown[data-metric="${e}"]`);t&&!t.checked&&t.click()});return}let a=r<5?`Anchor ${r+1} was not selected because the recorded path did not support a higher-pressure indicator.`:`No higher adjacent anchor exists.`,s=r>1?`Anchor ${r-1} was not selected because at least one recorded indicator supports anchor ${r}.`:`No lower adjacent anchor exists.`;o.innerHTML=`
      <div class="text-sm font-semibold mb-sm">Recommended anchor ${r}</div>
      <div class="text-xs text-secondary mb-md">${D(h(i,r))}</div>
      <div class="text-xs mb-sm"><strong>Evidence path</strong></div>
      <ol class="text-xs text-secondary" style="padding-left:18px;display:grid;gap:5px;">
        ${c.map(({question:e,answer:t})=>`<li><strong>${t===`yes`?`Yes`:`No`}:</strong> ${D(e.text)}${t===`yes`?` — ${D(e.rationale)}`:``}</li>`).join(``)}
      </ol>
      <div class="text-xs text-secondary mt-sm"><strong>Adjacent anchors:</strong> ${D(s)} ${D(a)}</div>
      <div class="flex gap-sm mt-md" style="flex-wrap:wrap;">
        <button class="btn btn-sm btn-primary confirm-wizard">Confirm anchor ${r}</button>
        <button class="btn btn-sm btn-outline edit-wizard">Edit anchors</button>
        <button class="btn btn-sm btn-outline unknown-wizard">Mark Unknown</button>
      </div>
      <div class="text-xs text-secondary mt-sm">The recommendation does not create a judgment until you confirm it.</div>`,o.querySelector(`.confirm-wizard`).addEventListener(`click`,()=>{Te(e,r,n),o.innerHTML=`<div class="text-sm font-semibold text-success">Anchor ${r} confirmed.</div>`}),o.querySelector(`.edit-wizard`).addEventListener(`click`,()=>{o.style.display=`none`,n.querySelector(`input[name="metric-${e}"]`)?.focus()}),o.querySelector(`.unknown-wizard`).addEventListener(`click`,()=>{let t=n.querySelector(`.metric-unknown[data-metric="${e}"]`);t&&!t.checked&&t.click()})},u=()=>{if(s>=a.length){l();return}let e=a[s];o.innerHTML=`
      <div class="text-xs text-secondary mb-sm">Question ${s+1} of ${a.length}</div>
      <div class="text-sm font-semibold mb-md">${D(e.text)}</div>
      <p class="text-xs text-secondary mb-md">Use the same boundary and stage. No means the evidence does not support this description; missing evidence is not evidence of low impact.</p>
      <div class="flex gap-sm">
        <button class="btn btn-sm btn-primary yes-btn" style="min-width: 60px;">Yes</button>
        <button class="btn btn-sm btn-outline no-btn" style="min-width: 60px;">No</button>
      </div>
    `,o.querySelector(`.yes-btn`).addEventListener(`click`,()=>{c.push({question:e,answer:`yes`}),s++,u()}),o.querySelector(`.no-btn`).addEventListener(`click`,()=>{c.push({question:e,answer:`no`}),s++,u()})};u()}function De(e,t){let n=x();return!n||!e.assessmentTree?{valid:!0,effectiveScores:{...t},blockedMetrics:[],warnings:[],errors:[]}:v(e.assessmentTree,n.id,{scores:t})}function Oe(n){let r=w(),a=r.matrixMap||ae,l=x(),u={...I,metricAssessments:L,assuranceObligations:R,rightSizingApprovalRecords:l?.rightSizingApprovalRecords||r.rightSizingApprovalRecords||[],activeElementId:l?.id||`default`,assessmentTree:r.assessmentTree,frameworkVersion:b.version,metricDefinitionSet:b.metricDefinitionSet},d=De(r,F),h=ce(d.effectiveScores,a,u);h.hierarchyWarnings=d.warnings,d.valid===!1&&(h.authoritative=!1);let g=e(F,L),_=oe(r.assessmentTree);if(g.completeCount===0&&!ye){n.innerHTML=`
      <section class="empty-results-state" aria-labelledby="empty-results-title">
        <p class="eyebrow">0/${t.length} reviewed</p>
        <h3 id="empty-results-title">No recommendation yet</h3>
        <p class="text-secondary mt-sm">The midpoint values are interface previews, not assessed judgments. Review at least one metric before using a partial preview, or open the neutral what-if view explicitly.</p>
        <div class="flex gap-sm mt-lg" style="justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" type="button" id="btn-review-first-metric">Review the first metric</button>
          <button class="btn btn-secondary" type="button" id="btn-open-neutral-preview">Explore neutral what-if preview</button>
        </div>
        <p class="text-xs text-secondary mt-md">Any neutral what-if profile remains non-authoritative and cannot produce a pilot record.</p>
      </section>`,n.querySelector(`#btn-review-first-metric`)?.addEventListener(`click`,()=>{M=j.findIndex(e=>e.id===`complexity`),N.add(M),Se(document.getElementById(`main-content`))}),n.querySelector(`#btn-open-neutral-preview`)?.addEventListener(`click`,()=>{ye=!0,Oe(n)});return}let te=h.derivationDetails||{},v=h.saTier,y={I:`#3b82f6`,II:`#f59e0b`,III:`#ef4444`,IV:`#7c3aed`},ie={};p.forEach(e=>{ie[e.group]||(ie[e.group]=[]),ie[e.group].push(e)});let S=e=>p.find(t=>t.id===e)?.name||`Process ${e}`,se=F.M5||3,E=h.rightSizingProposals||[],le=h.blockedRightSizingCandidates||[],ue=h.rightSizingActions||[],O=h.activeFloors||[],k=m(h.violations,z,{...h.levels,27:`standard`}),me=z?.[`11`]?.outcome===`elevated-validation`&&k.required&&k.complete,he=r.manualAdjustments||{},A=l?.id===r.assessmentTree?.rootId?{...he,...l?.manualAdjustments||{}}:l?{...l.manualAdjustments||{}}:{...he};l&&(A=s(l,r,h,{...u,scores:F,matrixMap:a,effectiveScores:d.effectiveScores},A).adjustments);let be=A?.[27]||A?.[`27`],V=me&&h.levels?.[27]===`basic`&&![`standard`,`comprehensive`].includes(be?.level),H=V?{...A,27:{level:`standard`,source:`rule-disposition-preview`,ruleId:11,propagationId:`P12`}}:A,W=de(h.levels,H),G=h.locallyCompleteRightSizingRecordCount>0?de(h.locallyAdjustedLevels||{},H):{},K=m(h.violations,z,W),q=fe(h.violations,z,W),Ce=q.assessments.filter(e=>e.ruleId!==`11`),J=i(F,B),Y=(K.required&&(!K.complete||V)?1:0)+Ce.filter(e=>!e.complete).length+(J.required&&!J.complete?1:0)+ +!_.complete,we=Ce.findIndex(e=>!e.complete),Te=K.required||Ce.length>0||J.required,X=ee(L),Ee=e=>{let t=W[e.id]||h.levels[e.id]||`basic`,n=h.derived?.[e.id]||`basic`,i=h.normativeLevels?.[e.id]||h.levels[e.id]||t,o=(H?.[e.id]||H?.[String(e.id)])?.level||null,s=G?.[e.id]||G?.[String(e.id)]||null,c=s&&s!==t?s:null,d=te[e.id]||{};T(e.id,F,a,u);let ee=h.overrides.some(t=>t.processId===e.id),f=h.fixes.some(t=>t.processId===e.id),p=xe(e.id,F,u);Array.isArray(d.triggerMetrics)&&d.triggerMetrics.length&&d.triggerMetrics.join(`, `);let m=h.confidence?.[e.id]||d.confidence||`high`,_=[p.excluded?`Basic unavailable`:``,ee?`Mandatory floor`:``,f?`Dependency closure`:``,m===`available-with-justification`?`Justification needed`:``,o?`Manual adjustment`:``,c?`Local scenario differs`:``].filter(Boolean);return`<article class="result-card" style="--recommendation-level:var(--level-${t})">
      <div class="result-card-main">
        <div class="result-card-header">
          <div><span class="result-process">${D(e.name)}</span><span class="result-process-id">P${D(e.id)}</span></div>
          <span class="level-badge ${t}">${D(b.levelLabels[t]||t)}</span>
        </div>
        <p class="result-why">${D(pe(e.id,{...h,preview:!g.complete}))}</p>
        ${_.length?`<div class="result-signals">${_.map(e=>`<span>${D(e)}</span>`).join(``)}</div>`:``}
        ${l?.assessmentResult?_e(l,r,e,`review-${e.id}-${t}`):``}
        <details class="result-derivation">
          <summary>Full framework trace</summary>
          <p class="text-xs text-secondary">Mapped inputs: ${(d.allMetricScores||[]).map(e=>`${D(e.metric)} ${e.role===`P`?`Primary`:`Secondary`} ${D(e.value)}`).join(`; `)}</p><dl class="causality-grid" aria-label="Recommendation causality">
            <div><dt>Metric result</dt><dd>${D(n)}</dd></div>
            <div><dt>Rules and closure</dt><dd>${D(i)}</dd></div>
            <div><dt>Recorded adjustment</dt><dd>${o?D(o):`None`}</dd></div>
            <div><dt>Local scenario</dt><dd>${c?D(c):`No change`}</dd></div>
            <div><dt>Current chosen level</dt><dd>${D(t)}</dd></div>
          </dl>
        </details>
      </div>
      <a class="btn btn-secondary btn-sm process-detail-link" href="${D(re(e.id,t,`assessment`))}" aria-label="View ${D(e.name)} ${D(b.levelLabels[t]||t)} details">View guidance →</a>
    </article>`},ke=new Set([...h.overrides.map(e=>e.processId),...h.fixes.map(e=>e.processId),...h.violations.flatMap(e=>[e.processId,...e.processes||[]]),...p.filter(e=>W[e.id]===`comprehensive`).map(e=>e.id),...p.filter(e=>G[e.id]&&G[e.id]!==W[e.id]).map(e=>e.id),...p.filter(e=>h.confidence?.[e.id]===`available-with-justification`).map(e=>e.id)].filter(Boolean).map(Number)),Ae=p.filter(e=>ke.has(e.id)),je=g.complete&&q.complete&&J.complete&&_.complete&&d.valid!==!1&&d.blockedMetrics.length===0,Me=[{label:`Baseline authority status`,status:je?`software checks passed`:`work in progress`,passed:je,detail:je?`Internal software checks can pass; external approval and operational authorization remain unverified.`:`This preview is not an authoritative organizational baseline.`},{label:`Metrics still to resolve`,status:g.complete?`passed`:`${g.incompleteMetricIds.length} unresolved`,passed:g.complete,detail:g.complete?`All ${t.length} judgments are confirmed.`:g.incompleteMetricIds.join(`, `)},{label:`Critical floors`,status:O.length?`${O.length} active`:`none active`,passed:!0,detail:O.length?`Review each floor and its source condition below.`:`No mandatory metric/context floors are active in this preview.`},{label:`Mandatory closure changes`,status:h.fixes.length?`${h.fixes.length} applied`:`none`,passed:!0,detail:h.fixes.length?`Dependency closure elevated one or more process levels.`:`The profile already satisfies mandatory dependency closure.`},{label:`Warning dispositions`,status:q.complete?`passed`:`${q.incompleteRuleIds.length} unresolved`,passed:q.complete,detail:q.complete?`All triggered warnings are dispositioned.`:`Rules: ${q.incompleteRuleIds.join(`, `)||`none identified`}`},{label:`CSI response`,status:J.complete?`passed`:`response required`,passed:J.complete,detail:J.required?`Constraint response at CSI ${J.csi}.`:`No special constraint response is triggered.`},{label:`Hierarchy exceptions`,status:_.complete?`passed`:`${_.incompleteElementIds.length} incomplete`,passed:_.complete,detail:_.enabled?`Advanced element mode is enabled.`:`Advanced hierarchy mode is not enabled.`},{label:`Right-sizing proposals`,status:E.length?`Decision available — non-blocking`:`none`,passed:!0,neutral:E.length>0,detail:E.length?`Each proposal needs a recorded decision; no browser-local record changes the normative recommendation.`:`No proposed reductions await disposition.`},{label:`Local reduction records`,status:h.locallyCompleteRightSizingRecordCount>0?`${h.locallyCompleteRightSizingRecordCount} locally complete`:`none`,passed:!0,neutral:h.locallyCompleteRightSizingRecordCount>0,detail:h.locallyCompleteRightSizingRecordCount>0?`A separate unverified scenario is available. External approval is not authenticated, so the normative recommendation is unchanged.`:`No structurally complete local reduction record is active.`},{label:`Pilot process profile`,status:`available for review`,passed:!0,detail:`${Object.values(W).filter(e=>e===`basic`).length} Basic, ${Object.values(W).filter(e=>e===`standard`).length} Standard, ${Object.values(W).filter(e=>e===`comprehensive`).length} Comprehensive.`}],Ne=(P===`issues`?Me.filter(e=>!e.passed||e.label===`Pilot process profile`):Me).filter(e=>!e.passed&&e.label!==`Baseline authority status`||e.label===`Pilot process profile`||P!==`issues`&&e.neutral),Pe=`
    <section class="action-queue" aria-labelledby="assessment-action-queue-title">
      <div class="section-heading-row">
        <div>
          <p class="eyebrow">${P===`issues`?`Completion`:`Status`}</p>
          <h3 id="assessment-action-queue-title">Items to resolve</h3>
        </div>
        <span class="status-count">${Ne.filter(e=>!e.passed).length} open</span>
      </div>
      <p id="automatic-check-status" class="text-sm text-secondary mt-sm" role="status" aria-live="polite"></p>
      <ol class="action-queue-list">
        ${Ne.map(e=>`<li class="action-queue-item"><strong>${D(e.label)}</strong><span class="action-queue-status ${e.neutral?`neutral`:e.passed?`passed`:``}">${D(e.status)}</span><span class="text-xs text-secondary">${D(e.detail)}</span></li>`).join(``)}
      </ol>
    </section>
    ${g.complete?``:`<div class="override-banner" style="background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.4);">
      <strong>Work in progress</strong>
      <div class="text-sm mt-sm"><strong>${g.completeCount}/${g.totalCount} reviewed</strong></div>
      <div class="text-sm mt-sm">${g.incompleteMetricIds.length} metric judgment(s) remain unresolved: ${D(g.incompleteMetricIds.join(`, `))}. Preview values help with orientation but cannot be finalized until they are resolved.</div>
    </div>`}
    ${X.warningCount?`<div class="override-banner" style="background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.4);">
      <strong>Correlated evidence review (${X.warningCount})</strong>
      ${X.warnings.map(e=>`<div class="text-sm mt-sm">${D(e.message)}</div>`).join(``)}
      <div class="text-xs text-secondary mt-sm">Warning only: scores, recommended process levels, and closure are unchanged. If shared evidence is appropriate, add a distinct consequence analysis in the affected metrics' optional Justification note.</div>
    </div>`:``}`,Fe=Te?`
    <section class="decision-workspace mb-lg" aria-labelledby="decision-workspace-title">
      <div class="section-heading-row">
        <div>
          <p class="eyebrow">Decisions</p>
          <h3 id="decision-workspace-title">${Y?`${Y} item${Y===1?` needs`:`s need`} attention`:`Warning decisions recorded`}</h3>
          <p class="text-sm text-secondary mt-sm">Work one item at a time. The additional record fields appear after you choose a disposition.</p>
        </div>
        <span class="status-count">${Y} open</span>
      </div>
      ${K.required?`<details class="decision-item rule11-decision" ${V||!K.complete?`open`:``}>
        <summary>
          <span><small>Rule 11 · verification and validation</small><strong>Align validation evidence with the verification level</strong></span>
          <span class="decision-state ${K.complete||V?`complete`:``}">${V?`Ready to apply`:K.complete?`Recorded`:`Decision needed`}</span>
        </summary>
        <div class="decision-body">
          <p class="text-sm text-secondary">Comprehensive Verification prompts a review of Validation responsibility and evidence. Choose whether the evidence is sufficient or Validation should be raised. The warning remains visible either way.</p>
          <label class="decision-field mt-md">
            <span>Disposition</span>
            <select class="select" id="rule11-outcome" aria-label="Rule 11 disposition outcome">
              <option value="">Choose an outcome...</option>
              ${c.map(e=>`<option value="${e.id}" ${z?.[`11`]?.outcome===e.id?`selected`:``}>${D(e.label)}</option>`).join(``)}
            </select>
          </label>
          <div class="decision-record-fields ${z?.[`11`]?.outcome?``:`is-pending`}" id="rule11-record-fields">
            <label class="decision-field"><span>Owner or approver role</span><input class="input" id="rule11-owner" aria-label="Rule 11 asserted owner or approver role" value="${D(z?.[`11`]?.ownerApprover||``)}"></label>
            <label class="decision-field"><span>Evidence reference</span><input class="input" id="rule11-evidence" aria-label="Rule 11 evidence reference" value="${D(z?.[`11`]?.evidenceRef||``)}"></label>
            <label class="decision-field"><span>Review date</span><input class="input" id="rule11-date" aria-label="Rule 11 review date" type="date" value="${D(z?.[`11`]?.reviewDate||``)}"></label>
            <label class="decision-field decision-field-wide"><span>Rationale and controls</span><textarea class="input" id="rule11-rationale" aria-label="Rule 11 disposition rationale" rows="3">${D(z?.[`11`]?.rationale||``)}</textarea></label>
          </div>
          <div class="decision-feedback" id="rule11-disposition-status" role="status" aria-live="polite">${V?`Ready to apply your chosen Process 27 adjustment. Select Apply chosen P27 adjustment.`:K.complete?`Decision recorded.`:`Choose an outcome and complete its decision record.`}</div>
        </div>
      </details>`:``}
      <button type="button" class="btn btn-secondary btn-sm mt-sm" id="btn-apply-rule11-elevation" ${V?``:`hidden`}>Apply chosen P27 adjustment</button>
      ${Ce.map((e,t)=>{let n=D(e.ruleId),r=z?.[e.ruleId]||{};return`<details class="warning-disposition decision-item" data-rule-id="${n}" ${(!K.required||K.complete)&&t===we?`open`:``}>
          <summary>
            <span><small>Rule ${n}</small><strong>${D(e.violation?.label||`Triggered warning`)}</strong></span>
            <span class="warning-disposition-summary decision-state ${e.complete?`complete`:``}" aria-live="polite">${e.complete?`complete`:`needs decision`}</span>
          </summary>
          <div class="decision-body">
            <p class="text-sm text-secondary">Record how the project will handle this warning. The choice documents governance; it does not hide the warning or change a process level.</p>
            <label class="decision-field mt-md"><span>Disposition</span><select class="select warning-outcome" aria-label="Rule ${n} disposition outcome">
              <option value="">Choose an outcome...</option>
              ${o.map(e=>`<option value="${e.id}" ${r.outcome===e.id?`selected`:``}>${D(e.label)}</option>`).join(``)}
            </select></label>
            <div class="decision-record-fields ${r.outcome?``:`is-pending`}">
              <label class="decision-field"><span>Owner or approver role</span><input class="input warning-owner" aria-label="Rule ${n} asserted owner or approver role" value="${D(r.ownerApprover||``)}"></label>
              <label class="decision-field"><span>Evidence reference</span><input class="input warning-evidence" aria-label="Rule ${n} evidence reference" value="${D(r.evidenceRef||``)}"></label>
              <label class="decision-field"><span>Review date</span><input class="input warning-date" aria-label="Rule ${n} review date" type="date" value="${D(r.reviewDate||``)}"></label>
              <label class="decision-field decision-field-wide"><span>Rationale and controls</span><textarea class="input warning-rationale" aria-label="Rule ${n} rationale and controls" rows="2">${D(r.rationale||``)}</textarea></label>
            </div>
          </div>
        </details>`}).join(``)}
      ${J.required?`<details class="decision-item csi-decision" ${(!K.required||K.complete)&&we===-1&&!J.complete?`open`:``}>
        <summary>
          <span><small>Delivery feasibility · CSI ${J.csi}</small><strong>${J.expectedResponseType===`sponsor-escalation`?`Escalate delivery feasibility`:`Agree the feasibility response`}</strong></span>
          <span class="decision-state ${J.complete?`complete`:``}">${J.complete?`Recorded`:`Response needed`}</span>
        </summary>
        <div class="decision-body">
          <p class="text-sm text-secondary">High schedule or budget pressure needs an explicit response. This record does not lower required process rigor.</p>
          <input type="hidden" id="csi-response-type" value="${J.expectedResponseType}">
          <fieldset class="decision-actions mt-md">
            <legend>Response actions</legend>
            ${f.map(e=>`<label><input type="checkbox" class="csi-action" value="${e.id}" ${(B.selectedActions||[]).includes(e.id)?`checked`:``}> ${D(e.label)}</label>`).join(``)}
          </fieldset>
          <div class="decision-record-fields">
            <label class="decision-field decision-field-wide"><span>Protected outputs and evidence</span><textarea class="input" id="csi-protected-outputs" aria-label="CSI protected outputs and evidence" rows="2">${D(B.protectedOutputs||``)}</textarea></label>
            <label class="decision-field decision-field-wide"><span>Feasibility rationale and decision</span><textarea class="input" id="csi-rationale" aria-label="CSI rationale and decision" rows="2">${D(B.rationaleDecision||``)}</textarea></label>
            <label class="decision-field"><span>${J.csi>=5?`Sponsor or approver role`:`Owner or approver role`}</span><input class="input" id="csi-owner" aria-label="CSI asserted owner or approver role" value="${D(B.ownerApprover||``)}"></label>
            <label class="decision-field"><span>Evidence reference</span><input class="input" id="csi-evidence" aria-label="CSI evidence reference" value="${D(B.evidenceRef||``)}"></label>
            <label class="decision-field"><span>Review date</span><input class="input" id="csi-date" aria-label="CSI review date" type="date" value="${D(B.reviewDate||``)}"></label>
          </div>
          <div class="decision-feedback" id="csi-response-status" role="status" aria-live="polite">${J.complete?`Response recorded.`:`Incomplete: finish the response record.`}</div>
        </div>
      </details>`:``}
    </section>`:``;n.innerHTML=`
    <nav class="assessment-result-tabs" aria-label="Assessment review sections">
      <button type="button" class="${P===`issues`?``:`active`}" data-result-route="review" aria-pressed="${P!==`issues`}">Recommendations</button>
      <button type="button" class="${P===`issues`?`active`:``}" data-result-route="issues" aria-pressed="${P===`issues`}">Open checks${Y?` · ${Y}`:``}</button>
    </nav>
    ${d.valid===!1||d.blockedMetrics.length?`<section class="card mb-lg" role="alert"><strong>Protected ancestry needs review</strong><p>${d.valid===!1?`The ancestry is invalid. Shown protected scores are conservative preview values, not confirmed judgments.`:`${D(d.blockedMetrics.join(`, `))} reductions are unresolved in this element or an ancestor. Protected effective scores are retained.`}</p><p>Software completeness is blocked. <a href="#elements">Review the system-element boundaries</a>.</p></section>`:``}
    <div class="recommendation-overview ${P===`issues`?`issues-hidden`:``}">
    <h3 class="mb-sm">Tailoring profile</h3>
    <p class="result-guidance mb-lg">Start with the processes highlighted for review, then check the full profile against your project needs.</p>
    <div class="results-overview mb-lg">
      <section class="results-summary">
        <p class="eyebrow">At a glance</p>
        <div class="result-stat"><strong>${Ae.length}</strong><span>process${Ae.length===1?``:`es`} to review first</span></div>
        <div class="result-stat"><strong>${Object.keys(l?.decisionRecords||{}).length}/${p.length}</strong><span>process decisions recorded</span></div>
        <div class="result-stat"><strong>${g.completeCount}/${t.length}</strong><span>metric judgments confirmed</span></div>
        <p class="result-priority-note text-sm mt-lg">${Ae.length?`Start with the process list below. Routine recommendations remain in the full profile.`:`No process needs focused review. Continue with the baseline profile or open a work aid as needed.`}</p>
      </section>
      <section class="results-visual">${ge(F,L,t,C)}</section>
    </div>
    <section class="priority-guidance mb-lg">
      <div class="section-heading-row">
        <div>
          <p class="eyebrow">Recommendations</p>
          <h4>Review process recommendations</h4><p class="text-sm text-secondary mt-sm"><a href="#help?topic=method">How mapped drivers, minimums and rules select these levels</a></p>
        </div>
        <span class="text-xs text-secondary">${Ae.length?`${Ae.length} of ${p.length}`:`Baseline profile`}</span>
      </div>
      <div class="process-guidance-list">${[...Ae,...p.filter(e=>!ke.has(e.id))].map(Ee).join(``)}</div>
    </section>
    </div>
    ${P===`issues`?Pe:``}
    ${P!==`issues`&&X.warningCount?`<div class="override-banner"><strong>Correlated evidence review (${X.warningCount})</strong>${X.warnings.map(e=>`<p class="text-sm mt-sm">${D(e.message)}</p>`).join(``)}<p class="text-xs mt-sm">Warning only: scores, recommended process levels, and closure are unchanged. Add a distinct consequence analysis in the affected metrics' Justification note.</p></div>`:``}
    ${P===`issues`&&r.semanticMigration?.status===`review-required`?`<button type="button" class="btn btn-secondary mb-md" id="btn-confirm-framework-review">Review imported framework changes</button>`:``}
    ${Fe}

    <details class="results-breakdown governance-detail">
      <summary>Technical checks and governance trace</summary>
      <div class="results-breakdown-body">
    <div class="sa-tier-result mb-lg" style="background: ${y[v.tier]}15; border: 2px solid ${y[v.tier]}; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div class="text-sm text-secondary">Safety Assurance Criticality Tier (derived from M5: Safety Impact = ${se})</div>
        <div style="font-size: 24px; font-weight: 800; color: ${y[v.tier]}">Tier ${v.tier}: ${v.name}</div>
        <div class="text-sm">${v.description}</div>
      </div>
      <div style="text-align: right;">
        ${v.floor?`<div class="text-xs" style="color: ${y[v.tier]}">Min Floor: ${v.floor}</div>`:`<div class="text-xs text-secondary">No floor applied</div>`}
      </div>
    </div>
    
    ${E.length?`
      <div class="override-banner" style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3);">
        <strong>${E.length} Right-Sizing Proposal${E.length===1?``:`s`} — not applied</strong>
        <div class="text-xs text-secondary mt-sm mb-sm">Project scale: ${h.indices?.psi||`—`} · Delivery pressure: ${h.indices?.csi||`—`} · Adoption readiness: ${h.indices?.cri||`—`}</div>
        <div class="text-xs text-secondary mb-sm">Each proposal can be documented locally, but browser-local records cannot authenticate authority. The pilot profile below remains unchanged.</div>
        ${E.map(e=>`<div class="text-sm mt-sm">• <strong>${D(S(e.processId))}</strong>: ${D(e.from)} → proposed ${D(e.proposedTo||e.to)} <span class="text-xs text-secondary">(${D(e.reason)})</span></div>`).join(``)}
      </div>`:``}
    ${h.locallyCompleteRightSizingRecordCount>0?`
      <div class="override-banner" style="background:rgba(34,211,238,.07);border-color:rgba(34,211,238,.3);">
        <strong>Local reduction scenario — external approval unverified</strong>
        <div class="text-xs text-secondary mt-sm">${h.locallyCompleteRightSizingRecordCount} record(s) are structurally complete and policy-consistent. They do not change the normative recommendation in this static app.</div>
        ${p.filter(e=>G[e.id]&&G[e.id]!==W[e.id]).map(e=>`<div class="text-sm mt-sm">• <strong>${D(e.name)}</strong>: pilot profile ${D(W[e.id])} → local scenario ${D(G[e.id])}</div>`).join(``)}
      </div>`:``}
    ${ue.length?`<div class="override-banner" style="background:rgba(148,163,184,.08);border-color:rgba(148,163,184,.3);"><strong>Historical right-sizing records</strong><div class="text-xs text-secondary mt-sm">Imported pre-governance actions are retained for audit only and are not evidence of an approved v4 reduction.</div></div>`:``}
    ${le.length?`<div class="override-banner" style="background:rgba(239,68,68,.06);border-color:rgba(239,68,68,.25);"><strong>Blocked Right-Sizing Candidates (${le.length})</strong><div class="text-xs text-secondary mt-sm">These reductions are not approval candidates because mandatory closure would immediately restore the required level.</div></div>`:``}
    ${h.budgetStatus&&!h.budgetStatus.withinBudget?`
      <div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 10px; padding: 12px 16px; margin-bottom: 16px;">
        <div class="text-xs" style="font-weight: 700; color: var(--accent-warning);">Final Rigor-Budget Exception</div>
        <div class="text-sm mt-sm">Mandatory floors or closure leave ${h.budgetStatus.comprehensiveExcess} Comprehensive and ${h.budgetStatus.standardExcess} Standard process(es) above configured PSI guidance. Governance review is required.</div>
      </div>`:!E.length&&h.indices?`
      <div style="background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.25); border-radius: 10px; padding: 12px 16px; margin-bottom: 16px;">
        <div class="text-xs text-secondary" style="font-weight: 600;">Right-Sizing Indices</div>
        <div class="text-sm mt-sm">Project scale: ${h.indices.psi} · Delivery pressure: ${h.indices.csi} · Adoption readiness: ${h.indices.cri} — <span style="color:var(--accent-success)">No right-sizing proposals generated</span></div>
      </div>`:``}

    ${h.adoptionRisks?.length?`
      <div class="override-banner" style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.35);">
        <strong>Adoption Readiness Gaps (${h.adoptionRisks.length})</strong>
        <div class="text-xs text-secondary mt-sm mb-sm">Required rigor is preserved. Adoption readiness identifies support the organization may need to use the selected processes.</div>
        ${h.adoptionRisks.slice(0,8).map(e=>`<div class="text-sm mt-sm">• <strong>${D(S(e.processId))}</strong>: ${D(e.level)} <span class="text-xs text-secondary">(${D(e.guidance)})</span></div>`).join(``)}
        ${h.adoptionRisks.length>8?`<div class="text-xs text-secondary mt-sm">+ ${h.adoptionRisks.length-8} more readiness gaps in the report.</div>`:``}
      </div>`:``}

    ${h.overrides.length?`
      <div class="override-banner">
        <strong>Floor Elevations Applied (${h.overrides.length})</strong>
        ${h.overrides.map(e=>`<div class="text-sm mt-sm">• <strong>${S(e.processId)}</strong>: ${e.from} → ${e.to} (${e.reason})</div>`).join(``)}
      </div>`:``}
    ${O.length?`<div class="override-banner" style="background:rgba(14,165,233,.08);border-color:rgba(14,165,233,.3);">
      <strong>Active Mandatory Floors (${O.length})</strong>
      <div class="text-xs text-secondary mt-sm mb-sm">Triggered floors are recorded even when the metric-derived level already satisfied them; only actual elevations appear above. A mapped M5=5 or M7=5 may directly derive Comprehensive for processes beyond the named floor family; that metric attribution remains distinct from this floor record.</div>
      ${O.map(e=>{let t=h.overrides.some(t=>t.processId===e.processId&&(t.overrideId===e.overrideId||t.reason===e.reason||t.reason===e.label));return`<div class="text-sm mt-sm">• <strong>${D(S(e.processId))}</strong>: ${D(e.minLevel||e.requiredLevel||e.to||`minimum active`)} — ${t?`elevated by floor`:`already satisfied`} <span class="text-xs text-secondary">(${D(e.label||e.reason||e.condition||e.overrideId||`mandatory floor`)})</span></div>`}).join(``)}
    </div>`:``}
    ${h.fixes.length?`
      <div class="fix-banner">
        <strong>✓ Consistency Fixes Applied (${h.fixes.length})</strong>
        ${h.fixes.map(e=>`<div class="text-sm mt-sm">• <strong>${S(e.processId)}</strong>: ${e.from} → ${e.to} (${e.reason})</div>`).join(``)}
      </div>`:``}
    ${h.violations.length?`
      <div class="violation-banner">
        <strong>Remaining Warnings (${h.violations.length})</strong>
        ${h.violations.map(e=>`<div class="text-sm mt-sm">• Rule ${e.ruleId} [${e.type}]: ${e.label}</div>`).join(``)}
      </div>`:``}
      </div>
    </details>
    <details class="results-breakdown"><summary>Framework reference views</summary><div class="results-breakdown-body"><a href="#matrix">Metric-to-process mapping matrix</a> · <a href="#interdependency">Dependency rules</a></div></details>
  `;let Ie=document.createElement(`div`);Ie.className=`review-actions mb-md`,Ie.innerHTML=`<button type="button" class="btn btn-secondary btn-sm" id="btn-record-tailoring-decisions">Record tailoring decisions</button><button type="button" class="btn btn-primary btn-sm" id="btn-review-report">View report</button>`,Ie.querySelector(`#btn-review-report`).addEventListener(`click`,()=>Z(`#report`)),n.prepend(Ie),Ie.querySelector(`#btn-record-tailoring-decisions`).addEventListener(`click`,()=>Z(`#adjust`)),ve(n,()=>Oe(n)),n.querySelector(`#btn-confirm-framework-review`)?.addEventListener(`click`,()=>Z()),n.querySelector(`#btn-apply-rule11-elevation`)?.addEventListener(`click`,()=>Z());let Le=n.closest(`.assessment-container`)?.querySelector(`#btn-next`),Q=J,$=q,Re=V,ze=()=>{let e=$.incompleteRuleIds.length+(Re&&!$.incompleteRuleIds.includes(`11`)?1:0)+(Q.required&&!Q.complete?1:0)+(!_.complete||d.valid===!1||d.blockedMetrics.length?1:0)+ +(w().semanticMigration?.status===`review-required`),t=n.querySelector(`#decision-workspace-title`);t&&(t.textContent=e?`${e} item${e===1?` needs`:`s need`} attention`:`Warning decisions recorded`);let r=n.querySelector(`.decision-workspace .status-count`);r&&(r.textContent=`${e} open`);let i=n.querySelector(`#open-decision-stat`);i&&(i.querySelector(`strong`).textContent=String(e),i.querySelector(`span`).textContent=`decision${e===1?``:`s`} still needed`);let a=n.querySelector(`[data-result-route="issues"]`);a&&(a.textContent=`Open checks${e?` · ${e}`:``}`);let o=Me.find(e=>e.label===`Warning dispositions`);Object.assign(o,{passed:$.complete,status:$.complete?`passed`:`${$.incompleteRuleIds.length} unresolved`,detail:$.complete?`All triggered warnings are dispositioned.`:`Rules: ${$.incompleteRuleIds.join(`, `)}`});let s=Me.find(e=>e.label===`CSI response`);Object.assign(s,{passed:Q.complete,status:Q.complete?`passed`:`response required`});let c=Me.filter(e=>!e.passed&&e.label!==`Baseline authority status`||e.label===`Pilot process profile`||P!==`issues`&&e.neutral),l=n.querySelector(`.action-queue-list`);l&&(l.innerHTML=c.map(e=>`<li class="action-queue-item"><strong>${D(e.label)}</strong><span class="action-queue-status ${e.neutral?`neutral`:e.passed?`passed`:``}">${D(e.status)}</span><span class="text-xs text-secondary">${D(e.detail)}</span></li>`).join(``));let u=n.querySelector(`.action-queue .status-count`);u&&(u.textContent=`${c.filter(e=>!e.passed).length} open`);let ee=n.querySelector(`#automatic-check-status`);ee&&(ee.textContent=w().assessmentDisposition===`demo`?`This demonstration is saved as a demo and cannot produce a completed report.`:w().semanticMigration?.status===`review-required`?`Imported framework changes need an explicit review before the report is available.`:w().assessmentComplete?`Software checks passed. Your report is available. External approval is not verified.`:`Software checks update automatically. A draft report is available. Resolve open records before exporting a completed record.`),Le&&(Le.textContent=`View Report`);let f=n.querySelector(`#btn-apply-rule11-elevation`);f&&(f.hidden=!Re)};n.querySelectorAll(`[data-result-route]`).forEach(e=>{e.addEventListener(`click`,()=>ne(e.dataset.resultRoute))}),n.querySelectorAll(`.process-detail-link`).forEach(e=>{e.addEventListener(`click`,t=>{t.preventDefault(),Z(e.getAttribute(`href`))})});let Be=()=>{if(!K.required)return;let e=n.querySelector(`#rule11-outcome`)?.value||``;n.querySelector(`#rule11-record-fields`)?.classList.toggle(`is-pending`,!e),z={...z,11:{ruleId:11,propagationId:`P12`,outcome:e,rationale:n.querySelector(`#rule11-rationale`)?.value.trim()||``,ownerApprover:n.querySelector(`#rule11-owner`)?.value.trim()||``,evidenceRef:n.querySelector(`#rule11-evidence`)?.value.trim()||``,reviewDate:n.querySelector(`#rule11-date`)?.value||``}},U();let t=m(h.violations,z,W),r=m(h.violations,z,{...W,27:`standard`}),i=z?.[`11`]?.outcome===`elevated-validation`&&r.required&&r.complete&&h.levels?.[27]===`basic`&&![`standard`,`comprehensive`].includes(be?.level);Re=i,$=fe(h.violations,z,W);let a=n.querySelector(`#rule11-disposition-status`);a&&(a.textContent=i?`Ready to apply your chosen Process 27 adjustment. Select Apply chosen P27 adjustment.`:t.complete?`Decision recorded.`:`Choose an outcome and complete its decision record.`);let o=n.querySelector(`.rule11-decision .decision-state`);o&&(o.textContent=i?`Ready to apply`:t.complete?`Recorded`:`Decision needed`,o.classList.toggle(`complete`,t.complete||i));let s=n.querySelector(`.rule11-decision`);if((t.complete||i)&&s?.open){s.open=!1;let e=[...n.querySelectorAll(`.warning-disposition`)].find(e=>!e.querySelector(`.warning-disposition-summary`)?.classList.contains(`complete`));if(e)e.open=!0;else{let e=n.querySelector(`.csi-decision`);e&&!Q.complete&&(e.open=!0)}}ze()};for(let e of[`rule11-outcome`,`rule11-rationale`,`rule11-owner`,`rule11-evidence`,`rule11-date`]){let t=n.querySelector(`#${e}`);t?.addEventListener(e===`rule11-rationale`?`input`:`change`,Be),(e===`rule11-owner`||e===`rule11-evidence`)&&t?.addEventListener(`input`,Be)}let Ve=e=>{let t=e.dataset.ruleId,r=e.querySelector(`.warning-outcome`)?.value||``;e.querySelector(`.decision-record-fields`)?.classList.toggle(`is-pending`,!r),z={...z,[t]:{ruleId:/^\d+$/.test(t)?Number(t):t,outcome:r,rationale:e.querySelector(`.warning-rationale`)?.value.trim()||``,ownerApprover:e.querySelector(`.warning-owner`)?.value.trim()||``,evidenceRef:e.querySelector(`.warning-evidence`)?.value.trim()||``,reviewDate:e.querySelector(`.warning-date`)?.value||``}},U(),$=fe(h.violations,z,W);let i=$.assessments.find(e=>e.ruleId===t),a=e.querySelector(`.warning-disposition-summary`);if(a&&i&&(a.textContent=i.complete?`complete`:`needs decision`,a.classList.toggle(`complete`,i.complete)),i?.complete&&e.open){e.open=!1;let t=[...n.querySelectorAll(`.warning-disposition`)].find(t=>t!==e&&!t.querySelector(`.warning-disposition-summary`)?.classList.contains(`complete`));if(t)t.open=!0;else{let e=n.querySelector(`.csi-decision`);e&&!Q.complete&&(e.open=!0)}}ze()};n.querySelectorAll(`.warning-disposition`).forEach(e=>{e.querySelectorAll(`select, input, textarea`).forEach(t=>{t.addEventListener(t.matches(`select, input[type="date"]`)?`change`:`input`,()=>Ve(e))})});let He=()=>{if(!J.required)return;B={responseType:n.querySelector(`#csi-response-type`)?.value||``,selectedActions:[...n.querySelectorAll(`.csi-action:checked`)].map(e=>e.value),protectedOutputs:n.querySelector(`#csi-protected-outputs`)?.value.trim()||``,rationaleDecision:n.querySelector(`#csi-rationale`)?.value.trim()||``,ownerApprover:n.querySelector(`#csi-owner`)?.value.trim()||``,evidenceRef:n.querySelector(`#csi-evidence`)?.value.trim()||``,reviewDate:n.querySelector(`#csi-date`)?.value||``},U(),Q=i(F,B);let e=n.querySelector(`#csi-response-status`);e&&(e.textContent=Q.complete?`Response recorded.`:`Incomplete: finish the response record.`);let t=n.querySelector(`.csi-decision .decision-state`);t&&(t.textContent=Q.complete?`Recorded`:`Response needed`,t.classList.toggle(`complete`,Q.complete)),ze()};n.querySelectorAll(`.csi-action`).forEach(e=>e.addEventListener(`change`,He));for(let e of[`csi-protected-outputs`,`csi-rationale`,`csi-owner`,`csi-evidence`,`csi-date`]){let t=n.querySelector(`#${e}`);t?.addEventListener(`input`,He),e===`csi-date`&&t?.addEventListener(`change`,He)}Z(null,{automatic:!0}),ze()}function Z(t=null,{automatic:n=!1}={}){let r=typeof t==`string`&&t.startsWith(`#`),o=w(),c=x();if(n&&e(F,L).completeCount===0&&Object.keys(o.scores||{}).length===0)return ie({assessmentComplete:!1}),S(w());let l=o.matrixMap||ae,u={...I,metricAssessments:L,assuranceObligations:R,rightSizingApprovalRecords:c?.rightSizingApprovalRecords||o.rightSizingApprovalRecords||[]},d=De(o,F),f=ce(d.effectiveScores,l,u);f.hierarchyWarnings=d.warnings,d.valid===!1&&(f.authoritative=!1);let p=e(F,L),h=z?.[`11`],g=o.manualAdjustments||{},_=c?.id===o.assessmentTree.rootId?{...g,...c.manualAdjustments||{}}:{...c?.manualAdjustments||{}},te=de(f.levels,_),v=m(f.violations,z,{...te,27:`standard`}),re=!n&&!r&&h?.outcome===`elevated-validation`&&v.required&&v.complete&&f.levels?.[27]===`basic`&&te?.[27]===`basic`,b=re?{..._,27:{level:`standard`,justification:`Rule 11 disposition: ${h.rationale}`,source:`rule-disposition`,ruleId:11,propagationId:`P12`,ownerApprover:h.ownerApprover,evidenceRef:h.evidenceRef,reviewDate:h.reviewDate}}:_,C=c?s(c,o,f,{...u,scores:F,matrixMap:l,effectiveScores:d.effectiveScores},b,!0):null;C&&(b=C.adjustments);let T=de(re?{...f.levels,27:`standard`}:f.levels,b),se=f.locallyCompleteRightSizingRecordCount>0?de(f.locallyAdjustedLevels||{},b):{},E=Object.keys(b).length>0,D=re||E?{...f,levels:T,violations:a(f,T,d.effectiveScores,u),locallyAdjustedLevels:se,budgetStatus:le(T,F)}:{...f,locallyAdjustedLevels:se},pe=c?.id===o.assessmentTree.rootId?b:g;m(f.violations,z,T);let O=fe(f.violations,z,T),k=i(F,B),me=ee(L),he=d.valid!==!1&&d.blockedMetrics.length===0,ge=oe(o.assessmentTree),A=ge.incompleteElementIds.filter(e=>e!==c?.id),_e={...ge,complete:he&&A.length===0,incompleteElementIds:he?A:[...new Set([...A,c?.id].filter(Boolean))]},ve=S({...o,scores:F,metricAssessments:L,violations:D.violations,ruleDispositions:z,levels:T,csiResponse:B},{hierarchy:_e,derivationAuthoritative:D.authoritative===!0,derivationReviewed:!n&&!r}),j=ve.softwareChecksPassed&&!(n&&o.semanticMigration?.status===`review-required`),P=j&&(n||!r),ye=ve.explicitlyDemo?`demo`:P?`complete-baseline`:`work-in-progress`;if(c&&(c.metricAssessments=JSON.parse(JSON.stringify(L??{})),c.assuranceObligations=JSON.parse(JSON.stringify(R??[])),c.ruleDispositions=JSON.parse(JSON.stringify(z??{})),c.csiResponse=JSON.parse(JSON.stringify(B??{})),c.correlatedEvidenceWarnings=JSON.parse(JSON.stringify(me.warnings??[])),c.rightSizingApprovalRecords=JSON.parse(JSON.stringify(u.rightSizingApprovalRecords??[])),c.manualAdjustments=JSON.parse(JSON.stringify(b??{})),c.scores={...F},c.assessmentResult=D,c.levels={...D.levels||{}},c.status=P?`under_review`:`draft`,c.assessmentDisposition=ye),ie({projectInfo:{...I},scores:F,metricAssessments:L,assuranceObligations:R,ruleDispositions:z,csiResponse:B,correlatedEvidenceWarnings:me.warnings,semanticMigration:!n&&!r&&j?null:o.semanticMigration,saTier:D.saTier,derived:D.derived,derivationDetails:D.derivationDetails||{},levels:D.levels,overrides:D.overrides,activeFloors:D.activeFloors||[],rightSizingProposals:D.rightSizingProposals||[],blockedRightSizingCandidates:D.blockedRightSizingCandidates||[],proposedRightSizedLevels:D.proposedRightSizedLevels||{},proposalClosureFixes:D.proposalClosureFixes||[],proposalBudgetStatus:D.proposalBudgetStatus||null,rightSizingApprovalRecords:u.rightSizingApprovalRecords,rightSizingApprovalEvaluations:D.rightSizingApprovalEvaluations||[],locallyAdjustedLevels:D.locallyAdjustedLevels||{},localScenarioClosureFixes:D.localScenarioClosureFixes||[],localScenarioBudgetStatus:D.localScenarioBudgetStatus||null,locallyCompleteRightSizingRecordCount:D.locallyCompleteRightSizingRecordCount||0,approvedRightSizedLevels:{},normativeLevels:D.normativeLevels||{},effectiveRightSizingApprovalCount:0,rightSizingActions:[],budgetStatus:D.budgetStatus||null,adoptionRisks:D.adoptionRisks||[],indices:D.indices||{},violations:D.violations,fixes:D.fixes,confidence:D.confidence||{},derivationStatus:D.derivationStatus||D.confidence||{},manualAdjustments:pe,assessmentComplete:P,assessmentDisposition:ye}),n)return ve;if(c&&r&&(c.status=`draft`,c.assessmentDisposition=`work-in-progress`),r){y(C?.suspended?`Inputs changed. Previous choices and reasons are retained as drafts for review; the protected recommendation is shown.`:`Work in progress saved before opening process details.`,C?.suspended?`warning`:`info`);let e=ue(t);ne(e.path,e.params)}else if(j)y(`Software completeness checks passed for "${c?.name||`Project`}". External approval is not verified.`,`success`),M=0,N=new Set([0]),ne(`report`);else if(ve.explicitlyDemo)y(`Demonstration saved. Demo records cannot produce a completed report.`,`info`),K(document.querySelector(`.assessment-container`)?.parentElement||document.getElementById(`main-content`));else{let e=[];p.complete||e.push(`${p.incompleteMetricIds.length} metric judgment(s)`),O.complete||e.push(`${O.incompleteRuleIds.length} warning disposition(s)`),k.complete||e.push(`the CSI ${k.csi} response`),A.length&&e.push(`${A.length} other incomplete system element(s)`),he||e.push(d.valid===!1?`a valid system-element ancestry`:`${d.blockedMetrics.join(`/`)} child hierarchy disposition(s)`),y(`Work in progress saved. Complete ${e.join(` and `)} before software completeness can pass.`,`warning`),K(document.querySelector(`.assessment-container`)?.parentElement||document.getElementById(`main-content`))}}export{W as checkAssessmentAutomatically,K as renderAssessment};