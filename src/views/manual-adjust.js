/** Decisions stay beside their recommendation, rationale and local history. */
import { CORE_PROCESSES, FRAMEWORK_META } from '../data/se-tailoring-data.js';
import { getState, setState, showToast, getElementsFlat, saveElementDecisions, getAssessmentWorkspace, setActiveElement } from '../state.js';
import { navigateTo, processDetailsHref } from '../router.js';
import { escapeHtml } from '../utils/safe-text.js';
import { getRecommendation, prepareDecisions, decisionNeedsReview } from '../utils/tailoring-decisions.js';
import { exportConfig } from '../utils/export-import.js';

const label = level => FRAMEWORK_META.levelLabels[level] || level || '—';

export function renderManualAdjust(container, options = {}) {
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
    return [process.id, { level: saved.level || baseline.levels[process.id] || 'basic', justification: saved.justification || '', owner: saved.owner || '', evidenceRef: saved.evidenceRef || '', reviewDate: saved.reviewDate || '', ...drafts[process.id] }];
  }));
  const reviewCount = Object.values(records).filter(record => decisionNeedsReview(record, baseline)).length;
  const history = node.decisionHistory || [];
  const pending = Object.keys(drafts).length;
  const storageFailed = !!getAssessmentWorkspace().error;
  const check = prepareDecisions(node, state, choices);

  container.innerHTML = `
    <div class="decision-header"><div><span class="text-xs text-secondary">${escapeHtml(state.projectInfo?.name || 'Current assessment')}</span><h2>Tailoring decisions</h2><p class="text-secondary mt-sm">Keep or adjust the recommendation, record the reason, and return to it later.</p></div>
      <div class="flex gap-sm"><button class="btn btn-secondary" id="btn-review-inputs">Review inputs</button><button class="btn btn-secondary" id="btn-view-report">View report</button></div></div>
    <section class="card mt-lg mb-lg">
      <label for="decision-element" class="form-label">System element</label>
      <select class="select element-select" id="decision-element">${elements.map(el => `<option value="${escapeHtml(el.id)}" ${el.id === selectedId ? 'selected' : ''}>${escapeHtml(el.name)}</option>`).join('')}</select>
      <p class="text-sm text-secondary mt-sm">Recommendations include mandatory floors and dependency closure. Your saved choices are browser-local decisions; external approval is not verified.</p>
      ${baseline.source === 'legacy-reference' ? '<p class="text-sm mt-sm">This older record has no separate recommendation snapshot. Review and recalculate the inputs before treating this reference as the original recommendation.</p>' : ''}
      ${reviewCount ? `<p class="text-sm mt-sm" role="status">${reviewCount} saved decision(s) need reconfirmation because the recommendation inputs changed. Earlier reasons remain in history.</p>` : ''}
      <p class="text-sm mt-sm" id="decision-save-status" role="status">${Object.keys(records).length}/${CORE_PROCESSES.length} decisions recorded · ${pending} draft changes. ${storageFailed ? 'Local save failed; keep this tab open and download a private backup.' : 'Drafts are saved locally as you type.'}</p>
      <div class="flex gap-sm mt-md"><button class="btn btn-primary" id="btn-save">Save decisions</button><button class="btn btn-secondary" id="btn-reset">Use recommendations</button><button class="btn btn-secondary" id="btn-decision-backup">Private JSON backup</button></div>
      <p class="text-xs text-secondary mt-sm">Save records the choices shown, including retained recommendations. Private backup retains reasons and history. Minimum-data sharing export omits them.</p>
    </section>
    <div id="decision-errors" role="alert">${check.errors.length ? `<section class="card mb-lg"><strong>Resolve before saving</strong><ul>${check.errors.map(error => `<li>${escapeHtml(error)}</li>`).join('')}</ul><p class="text-xs text-secondary">Draft changes remain saved locally.</p></section>` : ''}</div>
    <div class="decision-table-wrap"><table class="data-table decision-table"><caption class="text-secondary text-sm">Recommendation → local choice → reason and follow-up</caption><thead><tr><th>Process</th><th>Recommendation</th><th>Local choice</th><th>Decision record</th></tr></thead><tbody>
    ${CORE_PROCESSES.map(process => {
      const choice = choices[process.id];
      const record = records[process.id];
      return `<tr data-decision-process="${process.id}"><th scope="row"><a href="${escapeHtml(processDetailsHref(process.id, choice.level, 'adjust'))}">${escapeHtml(process.name)}</a><p class="text-xs text-secondary mt-sm">${record ? decisionNeedsReview(record, baseline) ? 'Review again' : 'Recorded' : node.manualAdjustments?.[process.id] ? 'Imported adjustment' : 'Not recorded'}</p></th>
      <td data-recommendation="${process.id}">${escapeHtml(label(baseline.levels[process.id]))}</td>
      <td><label class="sr-only" for="decision-level-${process.id}">Local level for ${escapeHtml(process.name)}</label><select class="select adjust-select" data-pid="${process.id}" data-field="level" id="decision-level-${process.id}">${['basic', 'standard', 'comprehensive'].map(level => `<option value="${level}" ${choice.level === level ? 'selected' : ''}>${label(level)}</option>`).join('')}</select></td>
      <td><label class="form-label" for="decision-reason-${process.id}">Rationale${choice.level !== baseline.levels[process.id] ? ' (required for adjustment)' : ''}</label><textarea class="input adjust-justification" rows="2" data-pid="${process.id}" data-field="justification" id="decision-reason-${process.id}" placeholder="Why this level and what will be done?">${escapeHtml(choice.justification)}</textarea>
      <details class="mt-sm"><summary class="text-xs">Owner, evidence and review date</summary>
      <label class="form-label" for="decision-owner-${process.id}">Owner / role</label><input class="input" id="decision-owner-${process.id}" data-pid="${process.id}" data-field="owner" value="${escapeHtml(choice.owner)}">
      <label class="form-label" for="decision-evidence-${process.id}">Evidence reference</label><input class="input" id="decision-evidence-${process.id}" data-pid="${process.id}" data-field="evidenceRef" value="${escapeHtml(choice.evidenceRef)}">
      <label class="form-label" for="decision-date-${process.id}">Review date</label><input class="input" type="date" id="decision-date-${process.id}" data-pid="${process.id}" data-field="reviewDate" value="${escapeHtml(choice.reviewDate)}"></details></td></tr>`;
    }).join('')}
    </tbody></table></div>
    <details class="card mt-xl" id="decision-history"><summary>Decision history (${history.length} entries)</summary><p class="text-xs text-secondary mt-sm">Local, editable-file provenance; this is not a tamper-evident audit trail or verified approval.</p>
      ${history.length ? `<ol class="decision-history-list">${[...history].reverse().map(entry => `<li><strong>${escapeHtml(CORE_PROCESSES.find(process => String(process.id) === entry.processId)?.name || entry.processId)}: ${escapeHtml(label(entry.previousLevel))} → ${escapeHtml(label(entry.level))}</strong><p class="text-sm">${escapeHtml(entry.justification || 'Recommendation retained; no additional rationale entered.')}</p><p class="text-xs text-secondary">${escapeHtml(entry.recordedAt)} · Recommendation ${escapeHtml(label(entry.recommendationLevel))}${entry.owner ? ` · ${escapeHtml(entry.owner)}` : ''}${entry.evidenceRef ? ` · ${escapeHtml(entry.evidenceRef)}` : ''}${entry.reviewDate ? ` · Review ${escapeHtml(entry.reviewDate)}` : ''}</p></li>`).join('')}</ol>` : '<p class="mt-md">No decision history yet. Imported reasons are preserved above; their original timestamps are not inferred.</p>'}
    </details>
    <style>.decision-header{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}.decision-header .flex,.card>.flex{flex-wrap:wrap}.decision-table-wrap{overflow-x:auto}.decision-table{min-width:720px;width:100%}.decision-table th{vertical-align:top}.decision-table td{vertical-align:top}.decision-table td:last-child{width:44%}.decision-table textarea{width:100%;min-width:240px}.decision-table .select{max-width:170px}.decision-table caption{text-align:left;padding:12px}.decision-history-list{padding-left:22px}.decision-history-list li{padding:14px 0;border-bottom:1px solid var(--border-subtle)}@media(max-width:600px){.decision-header .btn{white-space:normal}.decision-table-wrap{max-width:100%}.element-select{max-width:100%}}</style>`;

  const persistDraft = (pid, field, value) => {
    node.decisionDrafts = { ...(node.decisionDrafts || {}), [pid]: { ...choices[pid], ...(node.decisionDrafts?.[pid] || {}), [field]: value } };
    const persisted = setState({ assessmentTree: state.assessmentTree });
    const status = container.querySelector('#decision-save-status');
    if (status) status.textContent = `${Object.keys(records).length}/${CORE_PROCESSES.length} decisions recorded · ${Object.keys(node.decisionDrafts).length} draft changes. ${persisted ? 'Draft saved locally.' : 'Local save failed. Draft is held in this tab only; back up before closing.'}`;
  };
  container.querySelectorAll('[data-field]').forEach(input => input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', () => {
    persistDraft(input.dataset.pid, input.dataset.field, input.value);
    if (input.tagName === 'SELECT') {
      const id = input.id;
      renderManualAdjust(container, { elementId: selectedId });
      container.querySelector(`#${id}`)?.focus();
    }
  }));
  container.querySelector('#decision-element').addEventListener('change', event => {
    if (setActiveElement(event.target.value)) renderManualAdjust(container, { elementId: event.target.value });
  });
  container.querySelector('#btn-save').addEventListener('click', () => {
    const result = saveElementDecisions(selectedId, { ...choices, ...(node.decisionDrafts || {}) });
    if (result.errors.length) showToast('Resolve the highlighted decision issues. Your drafts are retained.', 'warning');
    else if (!result.persisted) showToast('Decisions are held in this tab, but local save failed. Download a private backup before closing.', 'error');
    else showToast(result.changes.length ? 'Decisions saved with rationale and history. Review software checks before exporting a completed record.' : 'No changes to save; existing decisions retained.', 'success');
    renderManualAdjust(container, { elementId: selectedId });
  });
  container.querySelector('#btn-reset').addEventListener('click', () => {
    node.decisionDrafts = Object.fromEntries(CORE_PROCESSES.map(process => [process.id, { ...choices[process.id], level: baseline.levels[process.id] || 'basic' }]));
    setState({ assessmentTree: state.assessmentTree });
    renderManualAdjust(container, { elementId: selectedId });
    showToast('Recommendation choices staged. Save decisions to record the change; existing history is retained.', 'info');
  });
  container.querySelector('#btn-review-inputs').addEventListener('click', () => navigateTo('review'));
  container.querySelector('#btn-view-report').addEventListener('click', () => navigateTo('report'));
  container.querySelector('#btn-decision-backup').addEventListener('click', () => {
    if (window.confirm('Download a private backup containing project names, rationale, evidence references, local decisions and history? Store it securely; review before sharing. This does not verify external approval.')) {
      try { exportConfig(getState(), { mode: 'identified' }); } catch (error) { showToast(error.message, 'error'); }
    }
  });
}
