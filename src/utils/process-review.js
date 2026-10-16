import { debounce } from './debounce.js';
import { getState, setState, saveElementDecisions } from '../state.js';
import { getRecommendation, decisionNeedsReview } from './tailoring-decisions.js';
import { escapeHtml } from './safe-text.js';
import { FRAMEWORK_META } from '../data/se-tailoring-data.js';

const label = level => FRAMEWORK_META.levelLabels[level] || level;

export function renderProcessReview(node, state, process) {
  const pid = String(process.id);
  const baseline = getRecommendation(node, state);
  const record = node.decisionRecords?.[pid];
  const draft = node.decisionDrafts?.[pid];
  const importedAdjustment = node.manualAdjustments?.[pid];
  const choice = { level: baseline.levels[pid], justification: '', ...importedAdjustment, ...record, ...draft };
  const outcome = draft?.reviewOutcome || (record || importedAdjustment || draft ? choice.level === baseline.levels[pid] ? 'keep' : 'adjust' : '');
  return `<details class="process-review" ${draft ? 'open' : ''}>
    <summary>${draft ? 'Unrecorded draft' : record ? decisionNeedsReview(record, baseline) ? 'Reconfirm previous decision' : `Decision recorded: ${label(record.level)}` : importedAdjustment ? `Review imported choice: ${label(importedAdjustment.level)}` : 'Keep or change this recommendation'}</summary>
    <form data-process-review="${pid}">
      <label>Decision for ${escapeHtml(process.name)}<select class="select" name="outcome"><option value="">Choose a decision…</option><option value="keep" ${outcome === 'keep' ? 'selected' : ''}>Keep recommendation (${label(baseline.levels[pid])})</option><option value="adjust" ${outcome === 'adjust' ? 'selected' : ''}>Change the level</option></select></label>
      <label ${outcome === 'adjust' ? '' : 'hidden'} data-level-field>Chosen level for ${escapeHtml(process.name)}<select class="select" name="level">${['basic','standard','comprehensive'].map(level => `<option value="${level}" ${choice.level === level ? 'selected' : ''}>${label(level)}</option>`).join('')}</select></label>
      <label>Decision rationale for ${escapeHtml(process.name)}<textarea class="input" name="justification" rows="2" placeholder="Explain the project need, tradeoff or evidence.">${escapeHtml(choice.justification)}</textarea></label>
      <button class="btn btn-primary btn-sm" type="submit">Record decision for ${escapeHtml(process.name)}</button>
      <a class="btn btn-secondary btn-sm" href="#adjust?process=${pid}">Owner, evidence and history</a>
      <p class="text-xs text-secondary" role="status">${draft ? 'Draft saved locally; current profile has not changed.' : record ? `Framework: ${label(baseline.levels[pid])}. Saved choice: ${label(record.level)}. ${escapeHtml(record.justification || '')}` : importedAdjustment ? `Imported choice: ${label(importedAdjustment.level)}. ${escapeHtml(importedAdjustment.justification || '')} Record your review to retain or change it.` : 'No team decision recorded yet.'}</p>
    </form>
  </details>`;
}

export function bindProcessReviews(container, onSaved) {
  container.querySelectorAll('form[data-process-review]').forEach(form => {
    const pid = form.dataset.processReview;
    const node = getState().assessmentTree.nodes[getState().assessmentTree.activeId];
    const fields = () => JSON.stringify([form.elements.outcome.value, form.elements.level.value, form.elements.justification.value]);
    let recordedFields;
    const read = () => {
      const baseline = getRecommendation(node, getState());
      const prior = node.decisionRecords?.[pid] || node.manualAdjustments?.[pid] || {};
      return { ...prior, level: form.elements.outcome.value === 'keep' ? baseline.levels[pid] : form.elements.level.value,
        justification: form.elements.justification.value, reviewOutcome: form.elements.outcome.value };
    };
    const persist = () => {
      // Removing the focused form can dispatch change after submit in Chromium.
      if (fields() === recordedFields) return;
      form.querySelector('[data-level-field]').hidden = form.elements.outcome.value !== 'adjust';
      node.decisionDrafts = { ...(node.decisionDrafts || {}), [pid]: read() };
      const saved = setState({assessmentTree: getState().assessmentTree});
      form.querySelector('[role="status"]').textContent = saved ? 'Draft saved locally; record the decision to apply it.' : 'Local save failed. Keep this tab open and make a private backup.';
    };
    const debouncedPersist = debounce(persist, 500);
    form.addEventListener('input', debouncedPersist);
    form.addEventListener('change', () => {
      debouncedPersist.cancel();
      persist();
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      // Submission reads the live fields; an older callback must never recreate
      // the draft after saveElementDecisions removes it, including save failures.
      debouncedPersist.cancel();
      if (!form.elements.outcome.value) { persist(); form.querySelector('[role="status"]').textContent = 'Choose whether to keep or change the recommendation.'; return; }
      const result = saveElementDecisions(node.id, { [pid]: read() });
      if (result.errors.length) { persist(); form.querySelector('[role="status"]').textContent = result.errors.join(' '); return; }
      recordedFields = fields();
      if (!result.persisted) { form.querySelector('[role="status"]').textContent = 'Recorded in this tab, but local save failed. Back up before closing.'; return; }
      onSaved();
    });
  });
}
