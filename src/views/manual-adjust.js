/** Decisions stay beside their recommendation, rationale and local history. */
import { CORE_PROCESSES, FRAMEWORK_META } from '../data/se-tailoring-data.js';
import { getState, setState, showToast, getElementsFlat, saveElementDecisions, getAssessmentWorkspace, setActiveElement } from '../state.js';
import { navigateTo, processDetailsHref } from '../router.js';
import { escapeHtml } from '../utils/safe-text.js';
import { getRecommendation, prepareDecisions, decisionNeedsReview } from '../utils/tailoring-decisions.js';
import { explainRecommendation } from '../utils/recommendation-explanation.js';
import { exportConfig } from '../utils/export-import.js';
import { describeDecisionSave } from '../utils/decision-save-feedback.js';

const label = level => FRAMEWORK_META.levelLabels[level] || level || '—';

export function renderManualAdjust(container, options = {}) {
  const requestedProcess = options.params?.get('process');
  const state = getState();
  const elements = getElementsFlat().filter(element => element.assessmentResult);
  if (!elements.length) {
    container.innerHTML = `<section class="card"><h2>Tailoring decisions</h2><p class="text-secondary mt-md">Review a recommendation first, then keep or adjust each process level and record why. Your decision record is available even while other assessment checks are unfinished.</p><button class="btn btn-primary mt-lg" id="btn-go-assess">Review recommendations</button></section>`;
    container.querySelector('#btn-go-assess').addEventListener('click', () => navigateTo('review'));
    return;
  }
  const selectedId = elements.some(el => el.id === options.elementId) ? options.elementId
    : elements.some(el => el.id === state.assessmentTree.activeId) ? state.assessmentTree.activeId : elements[0].id;
  if (state.assessmentTree.activeId !== selectedId) setActiveElement(selectedId);
  const node = state.assessmentTree.nodes[selectedId];
  const baseline = getRecommendation(node, state);
  const records = node.decisionRecords || {};
  const drafts = node.decisionDrafts || {};
  const choices = Object.fromEntries(CORE_PROCESSES.map(process => {
    const saved = records[process.id] || node.manualAdjustments?.[process.id] || {};
    return [process.id, { level: saved.level || baseline.levels[process.id] || 'basic', justification: saved.justification || '', owner: saved.owner || saved.ownerApprover || '', evidenceRef: saved.evidenceRef || '', reviewDate: saved.reviewDate || '', ...drafts[process.id] }];
  }));
  const reviewCount = Object.values(records).filter(record => decisionNeedsReview(record, baseline)).length;
  const history = node.decisionHistory || [];
  const pending = Object.keys(drafts).length;
  const storageFailed = !!getAssessmentWorkspace().error;
  const check = prepareDecisions(node, state, drafts);
  const feedbackFor = pid => describeDecisionSave({
    hasDraft: Object.hasOwn(node.decisionDrafts || {}, pid), recorded: !!records[pid], imported: !!node.manualAdjustments?.[pid],
    needsReview: decisionNeedsReview(records[pid], baseline), storageFailed: !!getAssessmentWorkspace().error,
    errors: node.decisionDrafts?.[pid] ? prepareDecisions(node, state, { [pid]: node.decisionDrafts[pid] }).errors : []
  });
  const errorsMarkup = errors => errors.length ? `<section class="card mb-lg"><h3 id="decision-error-title" tabindex="-1">Draft changes need attention</h3><p class="text-sm mt-sm">A bulk save records none of the pending decisions when any draft is blocked. Existing recorded decisions are unchanged. You can record a valid process separately.</p><ul>${errors.map(error => {
    const pid = error.match(/^Process (\d+):/)?.[1];
    const process = CORE_PROCESSES.find(item => String(item.id) === pid);
    return `<li>${escapeHtml(error)}${process ? ` <button type="button" class="btn btn-secondary btn-sm" data-review-decision="${pid}">Review ${escapeHtml(process.name)}</button>` : ''}</li>`;
  }).join('')}</ul><p class="text-xs text-secondary">${getAssessmentWorkspace().error ? 'Local save failed. Drafts are held in this tab only; download a private backup.' : 'Drafts remain saved locally; blocked changes have not been applied.'}</p></section>` : '';

  container.innerHTML = `
    <div class="decision-header"><div><span class="text-xs text-secondary">${escapeHtml(state.projectInfo?.name || 'Current assessment')}</span><h2>Tailoring decisions</h2><p class="text-secondary mt-sm">Keep or adjust the recommendation, record the reason, and return to it later.</p></div>
      <div class="flex gap-sm"><button class="btn btn-secondary" id="btn-review-inputs">Back to recommendations</button><button class="btn btn-secondary" id="btn-view-report">View report</button></div></div>
    <section class="card mt-lg mb-lg">
      <label for="decision-element" class="form-label">System element</label>
      <select class="select element-select" id="decision-element">${elements.map(el => `<option value="${escapeHtml(el.id)}" ${el.id === selectedId ? 'selected' : ''}>${escapeHtml(el.name)}</option>`).join('')}</select>
      <p class="text-sm text-secondary mt-sm">A decision records whether you keep or change a recommendation, and why. Typing saves a draft; Record this decision applies a valid choice. Recommendations include protected minimums and dependency rules; local records do not verify external approval.</p>
      <p class="text-xs text-secondary mt-sm"><a href="#help?topic=terms">Decision, evidence and save-state definitions</a> · <a href="#help?topic=method">How drivers and minimums select a level</a></p>
      ${baseline.source === 'legacy-reference' ? '<p class="text-sm mt-sm">This older record has no separate recommendation snapshot. Review and recalculate the inputs before treating this reference as the original recommendation.</p>' : ''}
      ${reviewCount ? `<p class="text-sm mt-sm" role="status">${reviewCount} saved decision(s) need reconfirmation because the recommendation inputs changed. Earlier reasons remain in history.</p>` : ''}
      <p class="text-sm mt-sm" id="decision-save-status" role="status">${Object.keys(records).length}/${CORE_PROCESSES.length} decisions recorded · ${pending} draft changes. ${storageFailed ? 'Local save failed; keep this tab open and download a private backup.' : 'Drafts are saved locally as you type.'}</p>
      <div class="flex gap-sm mt-md"><button class="btn btn-primary" id="btn-save">Save decisions</button><button class="btn btn-secondary" id="btn-reset">Stage all recommendations</button><button class="btn btn-secondary" id="btn-decision-backup">Private JSON backup</button></div>
      <p class="text-xs text-secondary mt-sm">Save records edited or explicitly kept choices. Untouched processes remain unrecorded. Private backup retains reasons and history. Minimum-data sharing export omits them.</p>
    </section>
    <div id="decision-errors" role="alert">${errorsMarkup(check.errors)}</div>
    <div class="decision-table-wrap"><table class="data-table decision-table"><caption class="text-secondary text-sm">Recommendation → local choice → reason and follow-up</caption><thead><tr><th>Process</th><th>Recommendation</th><th>Local choice</th><th>Decision record</th></tr></thead><tbody>
    ${CORE_PROCESSES.map(process => {
      const choice = choices[process.id];
      const record = records[process.id];
      const feedback = feedbackFor(process.id);
      return `<tr data-decision-process="${process.id}"><th scope="row"><a href="${escapeHtml(processDetailsHref(process.id, choice.level, 'adjust'))}">${escapeHtml(process.name)}</a><p class="text-xs text-secondary mt-sm" data-decision-state="${process.id}">${escapeHtml(feedback.label)}</p></th>
      <td><span data-recommendation="${process.id}">${escapeHtml(label(baseline.levels[process.id]))}</span><details class="mt-sm"><summary class="text-xs">Why this level?</summary><p class="text-xs text-secondary mt-sm">${escapeHtml(explainRecommendation(process.id, node.assessmentResult))}</p></details></td>
      <td><label class="text-xs"><input type="checkbox" data-pid="${process.id}" data-field="keep" ${(drafts[process.id] || record?.disposition === 'recommendation-retained') && choice.level === baseline.levels[process.id] ? 'checked' : ''}> Keep recommendation</label><label class="sr-only" for="decision-level-${process.id}">Local level for ${escapeHtml(process.name)}</label><select class="select adjust-select" data-pid="${process.id}" data-field="level" id="decision-level-${process.id}">${['basic', 'standard', 'comprehensive'].map(level => `<option value="${level}" ${choice.level === level ? 'selected' : ''}>${label(level)}</option>`).join('')}</select></td>
      <td><label class="form-label" for="decision-reason-${process.id}">Rationale${choice.level !== baseline.levels[process.id] ? ' (required for adjustment)' : ''}</label><textarea class="input adjust-justification" rows="2" data-pid="${process.id}" data-field="justification" id="decision-reason-${process.id}" placeholder="Why this level, what work is needed, and who provides it?" aria-describedby="decision-feedback-${process.id}">${escapeHtml(choice.justification)}</textarea>
      <details class="mt-sm"><summary class="text-xs">Owner, evidence and review date</summary>
      <label class="form-label" for="decision-owner-${process.id}">Owner / role</label><input class="input" id="decision-owner-${process.id}" data-pid="${process.id}" data-field="owner" value="${escapeHtml(choice.owner)}">
      <label class="form-label" for="decision-evidence-${process.id}">Evidence reference</label><input class="input" id="decision-evidence-${process.id}" data-pid="${process.id}" data-field="evidenceRef" placeholder="Safe reference to the plan, record or analysis supporting this choice" value="${escapeHtml(choice.evidenceRef)}">
      <label class="form-label" for="decision-date-${process.id}">Review date</label><input class="input" type="date" id="decision-date-${process.id}" data-pid="${process.id}" data-field="reviewDate" value="${escapeHtml(choice.reviewDate)}"></details><button type="button" class="btn btn-primary btn-sm mt-sm" data-save-process="${process.id}">Record this decision</button><p class="text-xs mt-sm" id="decision-feedback-${process.id}" data-decision-feedback="${process.id}" role="status">${escapeHtml(feedback.message)}</p></td></tr>`;
    }).join('')}
    </tbody></table></div>
    <details class="card mt-xl" id="decision-history"><summary>Decision history (${history.length} entries)</summary><p class="text-xs text-secondary mt-sm">Local, editable-file provenance; this is not a tamper-evident audit trail or verified approval.</p>
      ${history.length ? `<ol class="decision-history-list">${[...history].reverse().map(entry => `<li><strong>${escapeHtml(CORE_PROCESSES.find(process => String(process.id) === entry.processId)?.name || entry.processId)}: ${escapeHtml(label(entry.previousLevel))} → ${escapeHtml(label(entry.level))}</strong><p class="text-sm">${escapeHtml(entry.justification || 'Recommendation retained; no additional rationale entered.')}</p><p class="text-xs text-secondary">${escapeHtml(entry.recordedAt)} · Recommendation ${escapeHtml(label(entry.recommendationLevel))}${entry.owner ? ` · ${escapeHtml(entry.owner)}` : ''}${entry.evidenceRef ? ` · ${escapeHtml(entry.evidenceRef)}` : ''}${entry.reviewDate ? ` · Review ${escapeHtml(entry.reviewDate)}` : ''}</p></li>`).join('')}</ol>` : '<p class="mt-md">No decision history yet. Imported reasons are preserved above; their original timestamps are not inferred.</p>'}
    </details>
<div class="decision-footer mt-lg"><button type="button" class="btn btn-primary" id="btn-save-bottom">Save edited decisions</button><button type="button" class="btn btn-secondary" id="btn-report-bottom">View report</button></div>
    <style>.decision-footer{position:sticky;bottom:0;display:flex;gap:10px;padding:12px;background:var(--bg-primary);border-top:1px solid var(--border-subtle)}.decision-header{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.decision-header .btn{min-height:40px}.decision-header .flex,.card>.flex{flex-wrap:wrap}.decision-table-wrap{overflow-x:auto}.decision-table{min-width:720px;width:100%}.decision-table th{vertical-align:top}.decision-table td{vertical-align:top}.decision-table td:last-child{width:44%}.decision-table textarea{width:100%;min-width:240px}.decision-table .select{max-width:170px}.decision-table caption{text-align:left;padding:12px}.decision-history-list{padding-left:22px}.decision-history-list li{padding:14px 0;border-bottom:1px solid var(--border-subtle)}@media(max-width:600px){.decision-table,.decision-table tbody,.decision-table tr,.decision-table td,.decision-table th{display:block;min-width:0;width:auto}.decision-table thead{display:none}.decision-table tr{padding:16px 0;border-bottom:1px solid var(--border-subtle)}.decision-table td:last-child{width:auto}.decision-table textarea{min-width:0}.decision-table td{padding:8px 0}.decision-table .select{max-width:100%;width:100%}.decision-footer{flex-wrap:wrap}.decision-header .btn{white-space:normal}.decision-table-wrap{max-width:100%}.element-select{max-width:100%}}</style>`;

  if (requestedProcess) container.querySelector(`[data-decision-process="${CSS.escape(requestedProcess)}"]`)?.scrollIntoView({block:'center'});
  const refreshFeedback = () => {
    for (const process of CORE_PROCESSES) {
      const feedback = feedbackFor(process.id);
      const status = container.querySelector(`[data-decision-state="${process.id}"]`);
      const message = container.querySelector(`[data-decision-feedback="${process.id}"]`);
      if (status.textContent !== feedback.label) status.textContent = feedback.label;
      if (message.textContent !== feedback.message) message.textContent = feedback.message;
    }
    const errors = container.querySelector('#decision-errors');
    const markup = errorsMarkup(prepareDecisions(node, state, node.decisionDrafts || {}).errors);
    if (errors.innerHTML !== markup) errors.innerHTML = markup;
  };
  container.querySelector('#decision-errors').addEventListener('click', event => {
    const pid = event.target.closest('[data-review-decision]')?.dataset.reviewDecision;
    if (!pid) return;
    container.querySelector(`[data-decision-process="${pid}"]`)?.scrollIntoView({ block: 'center', behavior: 'instant' });
    container.querySelector(`#decision-level-${pid}`)?.focus({ preventScroll: true });
  });
  const persistDraft = (pid, field, value) => {
    node.decisionDrafts = { ...(node.decisionDrafts || {}), [pid]: { ...choices[pid], ...(node.decisionDrafts?.[pid] || {}), [field]: value } };
    const persisted = setState({ assessmentTree: state.assessmentTree });
    const status = container.querySelector('#decision-save-status');
    if (status) status.textContent = `${Object.keys(records).length}/${CORE_PROCESSES.length} decisions recorded · ${Object.keys(node.decisionDrafts).length} draft changes. ${persisted ? 'Draft saved locally.' : 'Local save failed. Draft is held in this tab only; back up before closing.'}`;
    refreshFeedback();
  };
  container.querySelectorAll('[data-field]').forEach(input => input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', () => {
    const pid = input.dataset.pid;
    if (input.dataset.field === 'keep') {
      if (!input.checked) { delete node.decisionDrafts?.[pid]; setState({ assessmentTree: state.assessmentTree }); }
      else persistDraft(pid, 'level', baseline.levels[pid]);
    } else persistDraft(pid, input.dataset.field, input.value);
    if (input.tagName === 'SELECT' || input.dataset.field === 'keep') {
      const focusSelector = input.id ? `#${input.id}` : `[data-pid="${pid}"][data-field="keep"]`;
      renderManualAdjust(container, { elementId: selectedId });
      container.querySelector(focusSelector)?.focus();
    }
  }));
  container.querySelector('#decision-element').addEventListener('change', event => {
    if (setActiveElement(event.target.value)) renderManualAdjust(container, { elementId: event.target.value });
  });
  container.querySelector('#btn-save').addEventListener('click', () => {
    const result = saveElementDecisions(selectedId, { ...(node.decisionDrafts || {}) });
    if (result.errors.length) showToast('Resolve the highlighted decision issues. Your drafts are retained.', 'warning');
    else if (!result.persisted) showToast('Decisions are held in this tab, but local save failed. Download a private backup before closing.', 'error');
    else showToast(result.changes.length ? 'Decisions saved with rationale and history. Review software checks before exporting a completed record.' : 'No changes to save; existing decisions retained.', 'success');
    renderManualAdjust(container, { elementId: selectedId });
    if (result.errors.length) container.querySelector('#decision-error-title')?.focus();
  });
  container.querySelectorAll('[data-save-process]').forEach(button => button.addEventListener('click', () => {
    const pid = button.dataset.saveProcess;
    const result = saveElementDecisions(selectedId, { [pid]: { ...choices[pid], ...(node.decisionDrafts?.[pid] || {}) } });
    if (result.errors.length) {
      refreshFeedback();
      container.querySelector(`[data-decision-feedback="${pid}"]`).textContent = `${feedbackFor(pid).message} ${result.errors.filter(error => !feedbackFor(pid).message.includes(error)).join(' ')}`.trim();
    } else {
      renderManualAdjust(container, { elementId: selectedId });
      container.querySelector(`[data-decision-feedback="${pid}"]`).textContent = result.persisted ? 'Decision recorded.' : 'Recorded in this tab; local storage failed. Back up before closing.';
    }
  }));
  container.querySelector('#btn-reset').addEventListener('click', () => {
    node.decisionDrafts = Object.fromEntries(CORE_PROCESSES.map(process => [process.id, { ...choices[process.id], level: baseline.levels[process.id] || 'basic' }]));
    setState({ assessmentTree: state.assessmentTree });
    renderManualAdjust(container, { elementId: selectedId });
    showToast('Recommendation choices staged. Save decisions to record the change; existing history is retained.', 'info');
  });
  container.querySelector('#btn-save-bottom').addEventListener('click', () => container.querySelector('#btn-save').click());
  container.querySelector('#btn-report-bottom').addEventListener('click', () => navigateTo('report'));
  container.querySelector('#btn-review-inputs').addEventListener('click', () => navigateTo('review'));
  container.querySelector('#btn-view-report').addEventListener('click', () => navigateTo('report'));
  container.querySelector('#btn-decision-backup').addEventListener('click', () => {
    if (window.confirm('Download a private backup containing project names, rationale, evidence references, local decisions and history? Store it securely; review before sharing. This does not verify external approval.')) {
      try { exportConfig(getState(), { mode: 'identified' }); } catch (error) { showToast(error.message, 'error'); }
    }
  });
}
