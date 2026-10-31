import{$ as e,At as t,J as n,Pt as r,Q as i,S as a,X as o,Z as s,c,dt as l,ft as u,g as d,h as f,i as p,l as m,m as h,o as g,pt as _,q as v,s as y,t as b,u as x}from"./index-tTzzMvnf.js";var S=new Set([`full`,`quick`,`inherited`]),C=new Set([`draft`,`under_review`,`approved`,`baselined`]),w={draft:`Draft`,under_review:`Under review`,approved:`Approved`,baselined:`Baselined`};function T(e,t,n,r){let a=e.toLowerCase(),o=e===`M8`?`security consequence`:`external assurance demand`,c=e===`M8`?`Child M8 security disposition`:`Child M15 assurance disposition`;return`
    <fieldset class="mb-lg" style="border:1px solid ${n.valid?`rgba(52,211,153,.45)`:`rgba(245,158,11,.45)`};border-radius:10px;padding:14px 16px;">
      <legend style="font-weight:700;padding:0 6px;">${c} ${n.valid?`✓`:`incomplete`}</legend>
      <div class="text-xs text-secondary mb-sm">Required only to confirm a child score below a critical parent score. This record governs the decision; the framework does not prescribe artifacts or verify technical evidence adequacy.</div>
      ${r?`<div class="text-xs mb-sm" style="color:var(--accent-warning);">A legacy boolean is retained as unconfirmed migration input. It is visible but cannot authorize a lower child ${e} score.</div>`:``}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <select class="select" id="${a}-hierarchy-status" aria-label="${e} hierarchy disposition status">
          <option value="draft" ${t.status===`confirmed`?``:`selected`}>Draft</option>
          <option value="confirmed" ${t.status===`confirmed`?`selected`:``}>Confirmed</option>
        </select>
        <select class="select" id="${a}-hierarchy-outcome" aria-label="${e} hierarchy disposition outcome">
          <option value="">Select disposition outcome…</option>
          ${i[e].map(e=>`<option value="${e.id}" ${t.outcome===e.id?`selected`:``}>${e.label}</option>`).join(``)}
        </select>
        <input class="input" id="${a}-hierarchy-owner" placeholder="Asserted reviewer / approver role" value="${_(t.ownerApprover||``)}">
        <input class="input" id="${a}-hierarchy-date" aria-label="${e} hierarchy review date" type="date" value="${_(t.reviewDate||``)}">
        <input class="input" id="${a}-hierarchy-basis" placeholder="Decision-basis reference (optional)" value="${_(t.decisionBasisRef||``)}">
        <input class="input" id="${a}-hierarchy-evidence" placeholder="Evidence reference (optional)" value="${_(t.evidenceRef||``)}">
      </div>
      <textarea class="input mt-sm" id="${a}-hierarchy-rationale" rows="2" placeholder="Concise rationale for the lower child ${o}">${_(t.rationale||``)}</textarea>
      <details class="mt-sm">
        <summary class="text-xs">Recommended considerations before confirmation</summary>
        <ul class="text-xs text-secondary">${s[e].map(e=>`<li>${_(e)}</li>`).join(``)}</ul>
      </details>
      <div class="flex items-center gap-sm mt-sm">
        <button class="btn btn-secondary btn-sm" id="btn-save-${a}-hierarchy">Save ${e} disposition</button>
        <span class="text-xs" style="color:${n.valid?`var(--accent-success)`:`var(--accent-warning)`};">${n.valid?`Confirmed for hierarchy governance; evidence adequacy not verified.`:`Missing: ${_(n.missingFields.join(`, `)||n.status)}`}</span>
      </div>
    </fieldset>`}function E(e){return S.has(e)?e:`full`}function D(e){return C.has(e)?e:`draft`}function O(i){let s=m().assessmentTree;c();let S=p(),C=g(s.activeId),j=y(),M=_(S.name),N=E(S.assessmentType),P=D(S.status),F=S.parentId?s.nodes[S.parentId]:null,I=S.childIds.map(e=>s.nodes[e]).filter(Boolean),L=I.length>0,R=v(S.safetyAllocationDecision??(S.hasIndependentSafetyAnalysis===!0||null)),z=S.safetyAllocationDecision||{},B=S.securityHierarchyDisposition||{},V=S.assuranceHierarchyDisposition||{},H=e(`M8`,S.securityHierarchyDisposition??(S.hasIndependentSecurityAnalysis===!0||null)),U=e(`M15`,S.assuranceHierarchyDisposition??(S.hasScopedAssuranceDecision===!0||null));i.innerHTML=`
    <div class="se-elements-container">
      <div class="se-header">
        <h2>System Element Breakdown</h2>
        <p class="text-secondary">Build your system hierarchy and perform targeted assessments at each level</p>
      </div>

      <!-- Breadcrumbs -->
      <div class="se-breadcrumbs mb-lg">
        ${C.map((e,t)=>`
          <span class="se-crumb ${e.id===s.activeId?`active`:``}" data-id="${_(e.id)}">${_(e.name)}</span>
          ${t<C.length-1?`<span class="se-crumb-sep">›</span>`:``}
        `).join(``)}
      </div>

      <div class="se-layout">
        <!-- Left: Tree View -->
        <div class="se-tree-panel">
          <div class="se-panel-header">
            <h3>System Tree <span class="badge-count">${j}</span></h3>
            <button class="btn btn-sm btn-secondary" id="btn-export-breakdown" title="Export system breakdown without element display names; spreadsheet formula prefixes are literalized">Identifier-reduced CSV</button>
          </div>
          <div class="se-tree" id="se-tree">
            ${k(s.nodes,s.rootId,s.activeId,0)}
          </div>
          <div class="se-add-panel">
            <h4>Add Element</h4>
            <label class="text-xs text-secondary" for="new-element-name">Element name/code</label>
            <input class="input" id="new-element-name" placeholder="e.g. Navigation subsystem" type="text" />
            <label class="text-xs text-secondary" for="new-element-type">Assessment type</label>
            <select class="select" id="new-element-type">
              <option value="quick">Quick Assessment (M1-M6, M8, M15 review)</option>
              <option value="full">Full Assessment (all metrics)</option>
              <option value="inherited">Inherited (all from parent)</option>
            </select>
            <button class="btn btn-primary btn-sm" id="btn-add-element">+ Add to ${M}</button>
          </div>
        </div>

        <!-- Right: Element Detail -->
        <div class="se-detail-panel">
          <div class="se-detail-header">
            <div>
              <h3>${M}</h3>
              <span class="se-type-badge ${N}">${N}</span>
              <span class="se-status-badge ${P}">${w[P]}</span>
              ${S.parentId?`<span class="text-xs text-secondary">Parent: ${_(s.nodes[S.parentId]?.name||`—`)}</span>`:`<span class="text-xs text-secondary">Root element</span>`}
            </div>
            <div class="se-detail-actions">
              <button class="btn btn-primary btn-sm" id="btn-assess-element">Assess This Element</button>
              ${S.id===s.rootId?``:`<button class="btn btn-danger btn-sm" id="btn-remove-element">Remove element</button>`}
            </div>
          </div>

          <!-- Conflict Banner -->
          <div id="se-conflict-banner"></div>

          ${F?`
          <fieldset class="mb-lg" style="border:1px solid ${R.valid?`rgba(52,211,153,.45)`:`rgba(245,158,11,.45)`};border-radius:10px;padding:14px 16px;">
            <legend style="font-weight:700;padding:0 6px;">Child safety-allocation decision ${R.valid?`✓`:`incomplete`}</legend>
            <div class="text-xs text-secondary mb-sm">Use this record only when safety responsibility is demonstrably retained by the parent and not allocated to this child. It does not lower M5 by itself; normal down-tailoring justification still applies.</div>
            ${R.legacyMigrationInput?`<div class="text-xs mb-sm" style="color:var(--accent-warning);">Legacy independent-safety-analysis evidence was imported but is unconfirmed and cannot authorize a lower child safety allocation.</div>`:``}
            <div class="text-xs mb-sm"><strong>Disposition:</strong> not allocated to child · <strong>Responsibility retained by:</strong> parent</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <input class="input" id="safety-allocation-authority" placeholder="Asserted decision authority role" value="${_(z.authority||``)}">
              <input class="input" id="safety-allocation-evidence" placeholder="Allocation evidence reference" value="${_(z.evidenceRef||``)}">
              <input class="input" id="safety-allocation-interface" placeholder="Interface assumptions reference" value="${_(z.interfaceAssumptionsRef||``)}">
              <input class="input" id="safety-allocation-date" aria-label="Safety allocation review date" type="date" value="${_(z.reviewDate||``)}">
            </div>
            <textarea class="input mt-sm" id="safety-allocation-rationale" rows="2" placeholder="Rationale for retaining responsibility at the parent">${_(z.rationale||``)}</textarea>
            <div class="flex items-center gap-sm mt-sm">
              <button class="btn btn-secondary btn-sm" id="btn-save-safety-allocation">Save safety-allocation decision</button>
              <span class="text-xs" style="color:${R.valid?`var(--accent-success)`:`var(--accent-warning)`};">${R.valid?`Confirmed and evidence-backed.`:`Missing: ${_(R.missingFields.join(`, `)||R.status)}`}</span>
            </div>
          </fieldset>`:``}

          ${F?T(`M8`,B,H,S.hasIndependentSecurityAnalysis===!0):``}
          ${F?T(`M15`,V,U,S.hasScopedAssuranceDecision===!0):``}

          <!-- Metric Summary -->
          <div class="se-metric-summary">
            <h4>Metric Scores</h4>
            ${S.manualMetrics?.length?`<p class="text-xs text-secondary mb-sm" id="manual-metric-help">Manual scores are not automatically replaced by propagation. You can still edit them in the assessment.</p>`:``}
            <div class="se-metric-grid">
              ${t.map(e=>{let t=S.scores?.[e.id]??3,n=S.inheritedMetrics?.[e.id],r=S.manualMetrics?.includes(e.id);return`
                <div class="se-metric-chip ${n?`inherited`:``} ${r?`manual`:``}">
                  <span class="se-metric-id">${e.id}</span>
                  <span class="se-metric-val">${t}</span>
                  ${n?`<span class="se-inherit-icon" title="Inherited from parent">↑</span>`:``}
                  ${r?`<span class="se-manual-icon" aria-describedby="manual-metric-help" title="Manually set; not automatically replaced by propagation">Manual</span>`:``}
                </div>`}).join(``)}
            </div>
          </div>

          <!-- Assessment Result Summary -->
          ${S.assessmentResult?`
          <details class="se-result-summary-details">
            <summary class="se-result-summary-header" title="Click to expand/collapse process details">
              <div class="se-result-summary-title">
                <h4>Assessment Results</h4>
                <div class="se-level-counts">
                  <span class="level-badge basic">${Object.values(S.levels).filter(e=>e===`basic`).length} B</span>
                  <span class="level-badge standard">${Object.values(S.levels).filter(e=>e===`standard`).length} S</span>
                  <span class="level-badge comprehensive">${Object.values(S.levels).filter(e=>e===`comprehensive`).length} C</span>
                  <span style="font-size: 10px; margin-left: 4px; color: var(--text-tertiary);">▼</span>
                </div>
              </div>
            </summary>
            <div class="se-result-summary-content">
              <table class="data-table" style="font-size: 12px; margin-top: 8px;">
                <thead>
                  <tr>
                    <th>Process</th>
                    <th>Final Level</th>
                  </tr>
                </thead>
                <tbody>
                  ${r.map(e=>{let t=S.levels[e.id]||`basic`,n=S.manualAdjustments?.[e.id],r=n?n.level:t,i=!!n;return`
                    <tr>
                      <td>
                        <span class="process-id" style="font-size: 10px; padding: 1px 4px;">${e.id}</span> 
                        <a class="process-name-link" href="${_(u(e.id,r,`elements`))}" aria-label="View ${_(r)} details for ${_(e.name)}" title="View ${_(r)} details in Process Explorer">${_(e.name)}</a>
                      </td>
                      <td>
                        <span class="level-badge ${r}" style="font-size: 10px; padding: 2px 6px;">
                          ${r.charAt(0).toUpperCase()+r.slice(1)}${i?` ✎`:``}
                        </span>
                      </td>
                    </tr>`}).join(``)}
                </tbody>
              </table>
            </div>
          </details>`:`
          <div class="se-no-result">
            <p class="text-secondary">No assessment completed yet. Click "Assess This Element" to begin.</p>
          </div>`}

          <!-- Propagation Controls -->
          <div class="se-propagation">
            <h4>Propagation</h4>
            <div class="se-prop-actions">
              ${L?`
              <button class="btn btn-secondary btn-sm" id="btn-propagate-down" title="Push this element's scores to children (respects manual values)">
                ⬇ Propagate Defaults Down
              </button>`:``}
              ${F&&L?`
              <button class="btn btn-secondary btn-sm" id="btn-suggest-up" title="Suggest the highest child demand, or lowest enabling culture rating. Review the parent boundary before confirming.">
                ⬆ Suggest Upstream Defaults
              </button>`:``}
              ${F?`
              <button class="btn btn-secondary btn-sm" id="btn-pull-parent" title="Pull parent's scores as defaults (respects manual values)">
                ⬇ Pull from Parent
              </button>`:``}
            </div>
          </div>

          <!-- Children List -->
          ${L?`
          <div class="se-children">
            <h4>Child Elements (${I.length})</h4>
            <div class="se-children-list">
              ${I.map(e=>`
              <div class="se-child-card" data-id="${_(e.id)}">
                <div class="se-child-info">
                  <span class="se-child-name">${_(e.name)}</span>
                  <span class="se-type-badge ${E(e.assessmentType)}">${E(e.assessmentType)}</span>
                  <span class="se-status-badge ${D(e.status)}">${w[D(e.status)]}</span>
                </div>
                <div class="se-child-actions">
                  <button class="btn btn-ghost btn-sm se-nav-child" data-id="${_(e.id)}">Navigate →</button>
                </div>
              </div>`).join(``)}
            </div>
          </div>`:``}
        </div>
      </div>
    </div>
    `;let W=document.createElement(`style`);W.textContent=`
      .se-elements-container { max-width: 1200px; margin: 0 auto; }
      .se-header { text-align: center; margin-bottom: 24px; }
      .se-breadcrumbs { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 10px 14px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-subtle); }
      .se-crumb { font-size: 13px; cursor: pointer; padding: 3px 8px; border-radius: 4px; transition: all 0.2s; color: var(--text-secondary); }
      .se-crumb:hover { background: rgba(99,102,241,0.1); color: var(--text-primary); }
      .se-crumb.active { background: rgba(99,102,241,0.15); color: var(--accent-primary-light); font-weight: 600; }
      .se-crumb-sep { color: var(--text-tertiary); font-size: 14px; }
      .se-layout { display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }
      @media (max-width: 900px) { .se-layout { grid-template-columns: 1fr; } }

      .se-tree-panel { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px; position: sticky; top: 80px; }
      .se-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .badge-count { font-size: 12px; background: rgba(99,102,241,0.15); color: var(--accent-primary-light); padding: 2px 8px; border-radius: 10px; font-weight: 700; }
      .se-tree { max-height: 400px; overflow-y: auto; margin-bottom: 16px; }

      .se-tree-node { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 6px; cursor: pointer; transition: all 0.15s; font-size: 13px; }
      .se-tree-node:hover { background: rgba(99,102,241,0.08); }
      .se-tree-node.active { background: rgba(99,102,241,0.15); color: var(--accent-primary-light); font-weight: 600; }
      .se-tree-node .node-icon { font-size: 14px; opacity: 0.7; }
      .se-tree-node .node-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .se-tree-node .node-badge { font-size: 10px; padding: 1px 5px; border-radius: 3px; font-weight: 600; text-transform: uppercase; }
      .se-tree-node .node-status { width: 8px; height: 8px; border-radius: 50%; }
      .node-status.draft { background: var(--text-tertiary); }
      .node-status.under_review { background: var(--accent-warning); }
      .node-status.approved { background: var(--accent-success); }
      .node-status.baselined { background: var(--accent-primary); }

      .se-add-panel { border-top: 1px solid var(--border-subtle); padding-top: 14px; display: flex; flex-direction: column; gap: 8px; }
      .se-add-panel h4 { font-size: 13px; margin-bottom: 2px; }

      .se-detail-panel { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 20px; }
      .se-detail-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-subtle); }
      .se-detail-actions { display: flex; gap: 8px; }

      .se-type-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
      .se-type-badge.full { background: rgba(99,102,241,0.15); color: var(--accent-primary-light); }
      .se-type-badge.quick { background: rgba(245,158,11,0.15); color: #f59e0b; }
      .se-type-badge.inherited { background: rgba(52,211,153,0.15); color: #34d399; }
      .se-status-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
      .se-status-badge.draft { background: rgba(148,163,184,0.15); color: var(--text-secondary); }
      .se-status-badge.under_review { background: rgba(245,158,11,0.15); color: #f59e0b; }
      .se-status-badge.approved { background: rgba(52,211,153,0.15); color: #34d399; }

      .se-metric-summary { margin-bottom: 20px; }
      .se-metric-summary h4 { font-size: 14px; margin-bottom: 10px; }
      .se-metric-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 6px; }
      .se-metric-chip { display: flex; align-items: center; gap: 4px; padding: 6px 8px; background: var(--bg-tertiary); border-radius: 6px; font-size: 12px; position: relative; transition: all 0.15s; }
      .se-metric-chip.inherited { border-left: 2px solid rgba(52,211,153,0.5); }
      .se-metric-chip.manual { border-left: 2px solid rgba(245,158,11,0.5); }
      .se-metric-id { font-weight: 700; color: var(--text-secondary); font-size: 11px; }
      .se-metric-val { font-weight: 800; font-size: 15px; }
      .se-inherit-icon { font-size: 10px; color: #34d399; }
      .se-manual-icon { font-size: 10px; }

      .se-result-summary-details { margin-bottom: 20px; background: rgba(99,102,241,0.05); border-radius: 8px; border: 1px solid rgba(99,102,241,0.1); }
      .se-result-summary-header { padding: 14px; cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between; user-select: none; }
      .se-result-summary-header::-webkit-details-marker { display: none; }
      .se-result-summary-title { display: flex; align-items: center; justify-content: space-between; width: 100%; }
      .se-result-summary-title h4 { font-size: 14px; margin: 0; padding: 0; color: var(--text-primary); }
      .se-result-summary-content { padding: 0 14px 14px 14px; }
      .process-name-link { border: 0; background: transparent; padding: 0; color: var(--accent-primary-light); text-decoration: underline; cursor: pointer; font: inherit; text-align: left; }
      .process-name-link:focus-visible { outline: 2px solid var(--accent-primary-light); outline-offset: 2px; border-radius: 3px; }
      details[open] .se-result-summary-header { border-bottom: 1px dashed rgba(99,102,241,0.2); margin-bottom: 8px; }
      .se-level-counts { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
      .se-no-result { padding: 20px; text-align: center; background: rgba(148,163,184,0.05); border-radius: 8px; margin-bottom: 20px; }

      .se-propagation { margin-bottom: 20px; }
      .se-propagation h4 { font-size: 14px; margin-bottom: 10px; }
      .se-prop-actions { display: flex; gap: 8px; flex-wrap: wrap; }

      .se-children { margin-bottom: 20px; }
      .se-children h4 { font-size: 14px; margin-bottom: 10px; }
      .se-children-list { display: flex; flex-direction: column; gap: 6px; }
      .se-child-card { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-tertiary); border-radius: 8px; transition: all 0.15s; }
      .se-child-card:hover { background: rgba(99,102,241,0.08); }
      .se-child-info { display: flex; align-items: center; gap: 8px; }
      .se-child-name { font-weight: 600; font-size: 13px; }

      .se-conflict-banner { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; padding: 14px; margin-bottom: 16px; }
      .se-conflict-title { font-weight: 700; font-size: 14px; color: var(--accent-warning); margin-bottom: 8px; }
      .se-conflict-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(245,158,11,0.15); font-size: 13px; gap: 8px; }
      .se-conflict-actions { display: flex; gap: 6px; }
      .se-conflict-bulk { display: flex; gap: 8px; margin-top: 10px; }

      .btn-danger { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .btn-danger:hover { background: rgba(239,68,68,0.25); }
      .btn-accept { background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid rgba(52,211,153,0.3); font-size: 11px; padding: 2px 8px; border-radius: 4px; cursor: pointer; }
      .btn-reject { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); font-size: 11px; padding: 2px 8px; border-radius: 4px; cursor: pointer; }
    `,i.appendChild(W),i.querySelectorAll(`.se-tree-node`).forEach(e=>{e.addEventListener(`click`,()=>{h(e.dataset.id),O(i)})}),i.querySelectorAll(`.se-crumb`).forEach(e=>{e.addEventListener(`click`,()=>{h(e.dataset.id),O(i)})}),i.querySelector(`#btn-add-element`)?.addEventListener(`click`,()=>{let e=i.querySelector(`#new-element-name`),t=i.querySelector(`#new-element-type`),n=e.value.trim();if(!n){d(`Please enter an element name`,`warning`);return}b(s.activeId,n,t.value)&&(d(`Added "${n}" as child of "${S.name}"`,`success`),O(i))}),i.querySelector(`#btn-remove-element`)?.addEventListener(`click`,()=>{confirm(`Remove "${S.name}" and all its children? This cannot be undone.`)&&(x(S.id),d(`Removed "${S.name}"`,`success`),O(i))}),i.querySelector(`#btn-assess-element`)?.addEventListener(`click`,()=>{h(S.id),l(`assessment`)}),i.querySelector(`#btn-save-safety-allocation`)?.addEventListener(`click`,()=>{let e={status:`confirmed`,allocationDisposition:`not-allocated-to-child`,retainedResponsibility:`parent`,authority:i.querySelector(`#safety-allocation-authority`)?.value.trim()||``,evidenceRef:i.querySelector(`#safety-allocation-evidence`)?.value.trim()||``,interfaceAssumptionsRef:i.querySelector(`#safety-allocation-interface`)?.value.trim()||``,rationale:i.querySelector(`#safety-allocation-rationale`)?.value.trim()||``,reviewDate:i.querySelector(`#safety-allocation-date`)?.value||``},t=v(e);S.safetyAllocationDecision=e,f({assessmentTree:s}),d(t.valid?`Safety-allocation decision confirmed.`:`Safety-allocation decision saved as incomplete: ${t.missingFields.join(`, `)}`,t.valid?`success`:`warning`),O(i)});for(let t of[`M8`,`M15`]){let n=t.toLowerCase();i.querySelector(`#btn-save-${n}-hierarchy`)?.addEventListener(`click`,()=>{let r={status:i.querySelector(`#${n}-hierarchy-status`)?.value||`draft`,outcome:i.querySelector(`#${n}-hierarchy-outcome`)?.value||``,rationale:i.querySelector(`#${n}-hierarchy-rationale`)?.value.trim()||``,ownerApprover:i.querySelector(`#${n}-hierarchy-owner`)?.value.trim()||``,reviewDate:i.querySelector(`#${n}-hierarchy-date`)?.value||``,decisionBasisRef:i.querySelector(`#${n}-hierarchy-basis`)?.value.trim()||``,evidenceRef:i.querySelector(`#${n}-hierarchy-evidence`)?.value.trim()||``},a=e(t,r);t===`M8`?S.securityHierarchyDisposition=r:S.assuranceHierarchyDisposition=r,f({assessmentTree:s}),d(a.valid?`${t} hierarchy disposition confirmed; technical evidence adequacy was not verified.`:`${t} hierarchy disposition saved as incomplete: ${a.missingFields.join(`, `)}`,a.valid?`success`:`warning`),O(i)})}i.querySelectorAll(`.se-nav-child`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation(),h(e.dataset.id),O(i)})}),i.querySelector(`#btn-propagate-down`)?.addEventListener(`click`,()=>{let e=0,t=[];for(let r of I){let i=n(S,r);for(let[e,t]of Object.entries(i.applied))r.scores[e]=t;e+=Object.keys(i.applied).length,t=t.concat(i.conflicts.map(e=>({...e,childName:r.name,childId:r.id})))}t.length>0&&A(i,t,`downstream`),d(`Propagated ${e} metrics to ${I.length} children`+(t.length?` (${t.length} conflicts)`:``),`success`),O(i)}),i.querySelector(`#btn-pull-parent`)?.addEventListener(`click`,()=>{if(!F)return;let e=n(F,S);for(let[t,n]of Object.entries(e.applied))S.scores[t]=n;e.conflicts.length>0&&A(i,e.conflicts.map(e=>({...e,childName:S.name,childId:S.id})),`downstream`),d(`Pulled ${Object.keys(e.applied).length} metrics from parent`+(e.conflicts.length?` (${e.conflicts.length} conflicts)`:``),`success`),O(i)}),i.querySelector(`#btn-suggest-up`)?.addEventListener(`click`,()=>{if(!F)return;let e=o(I,F);for(let[t,n]of Object.entries(e.suggested))F.scores[t]=n;e.conflicts.length>0&&A(i,e.conflicts.map(e=>({metric:e.metric,parentValue:e.parentValue,childValue:e.suggestedValue,source:`manual`,childName:F.name,childId:F.id,message:e.message})),`upstream`),d(`Suggested ${Object.keys(e.suggested).length} metrics upstream to "${F.name}"`+(e.conflicts.length?` (${e.conflicts.length} conflicts)`:``),`success`),O(i)}),i.querySelector(`#btn-export-breakdown`)?.addEventListener(`click`,()=>{a(m(),r)})}function k(e,t,n,r){let i=e[t];if(!i)return``;let a=r*16,o=t===n,s=i.childIds&&i.childIds.length>0,c=D(i.status),l=`
    <div class="se-tree-node ${o?`active`:``}" data-id="${_(t)}" style="padding-left: ${a+8}px">
      <span class="node-name">${_(i.name)}</span>
      <span class="node-status ${c}" role="img" aria-label="Status: ${w[c]}" title="${w[c]}"></span>
    </div>`;if(s)for(let t of i.childIds)l+=k(e,t,n,r+1);return l}function A(e,t,n){let r=e.querySelector(`#se-conflict-banner`);!r||t.length===0||(r.innerHTML=`
    <div class="se-conflict-banner">
      <div class="se-conflict-title">${n===`downstream`?`Downstream Propagation`:`Upstream Suggestion`} — ${t.length} conflict${t.length===1?``:`s`} detected</div>
      <p class="text-xs text-secondary mb-md">These metrics have manually-set values that differ from the proposed propagation. Choose how to resolve each conflict.</p>
      ${t.map((e,t)=>`
      <div class="se-conflict-item" id="conflict-${t}">
        <div>
          <strong>${_(e.metric)}</strong>: Current manual value = <strong>${_(e.childValue??e.parentValue)}</strong>,
          Proposed = <strong>${_(e.parentValue??e.childValue)}</strong>
          ${e.childName?`(${_(e.childName)})`:``}
        </div>
        <div class="se-conflict-actions">
          <button class="btn-accept" data-idx="${t}" data-action="accept">Accept</button>
          <button class="btn-reject" data-idx="${t}" data-action="reject">Keep Manual</button>
        </div>
      </div>`).join(``)}
      <div class="se-conflict-bulk">
        <button class="btn btn-sm btn-secondary" id="btn-accept-all">Accept All</button>
        <button class="btn btn-sm btn-secondary" id="btn-reject-all">Keep All Manual</button>
      </div>
    </div>`,r.querySelectorAll(`[data-action]`).forEach(e=>{e.addEventListener(`click`,()=>{let i=parseInt(e.dataset.idx),a=t[i],o=m().assessmentTree.nodes[a.childId];e.dataset.action===`accept`&&o&&(o.scores[a.metric]=n===`downstream`?a.parentValue:a.childValue,o.manualMetrics=o.manualMetrics.filter(e=>e!==a.metric));let s=r.querySelector(`#conflict-${i}`);s&&(s.style.opacity=`0.3`),s.querySelector(`[data-action="accept"]`)?.setAttribute(`disabled`,`true`),s.querySelector(`[data-action="reject"]`)?.setAttribute(`disabled`,`true`)})}),r.querySelector(`#btn-accept-all`)?.addEventListener(`click`,()=>{for(let e of t){let t=m().assessmentTree.nodes[e.childId];t&&(t.scores[e.metric]=n===`downstream`?e.parentValue:e.childValue,t.manualMetrics=t.manualMetrics.filter(t=>t!==e.metric))}d(`Accepted all propagated values`,`success`),O(e)}),r.querySelector(`#btn-reject-all`)?.addEventListener(`click`,()=>{d(`Kept all manual values`,`info`),r.innerHTML=``}))}export{O as renderSystemElements};