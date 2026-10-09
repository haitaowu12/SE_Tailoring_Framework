import { escapeHtml } from './safe-text.js';
import { CORE_PROCESSES } from '../data/se-tailoring-data.js';
import { getRecommendation, decisionNeedsReview } from './tailoring-decisions.js';

/** Shared screen/download ledger, escaped at every user-authored boundary. */
export function renderDecisionLedger(state) {
  const nodes = Object.values(state.assessmentTree?.nodes || {});
  const entries = nodes.flatMap(node => Object.values(node.decisionRecords || {}).map(record => ({ node, record })));
  const history = nodes.flatMap(node => (node.decisionHistory || []).map(record => ({ node, record })));
  const name = id => CORE_PROCESSES.find(process => String(process.id) === String(id))?.name || `Process ${id}`;
  return `<section class="card mb-xl decision-ledger"><h3>Saved tailoring decisions</h3>
    <p class="text-sm text-secondary">${entries.length} process decisions recorded · ${history.length} history entries. Browser-local assertions; external approval is not verified.</p>
    ${entries.length ? `<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Element / process</th><th>Recommendation</th><th>Local choice</th><th>Reason / follow-up</th></tr></thead><tbody>${entries.map(({node, record}) => `<tr><td>${escapeHtml(node.name)} / ${escapeHtml(name(record.processId))}</td><td>${escapeHtml(record.recommendationLevel)}</td><td>${decisionNeedsReview(record, getRecommendation(node, state)) ? `Previous choice: ${escapeHtml(record.level)} (not applied; review again). Current profile: ${escapeHtml(node.levels?.[record.processId] || '—')}` : escapeHtml(record.level)}</td><td>${escapeHtml(record.justification || 'No additional rationale entered')}${record.owner ? `<br>Owner: ${escapeHtml(record.owner)}` : ''}${record.evidenceRef ? `<br>Evidence: ${escapeHtml(record.evidenceRef)}` : ''}${record.reviewDate ? `<br>Review: ${escapeHtml(record.reviewDate)}` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="mt-sm">No explicit process decisions have been recorded. A calculated recommendation does not itself record a team decision.</p>'}
    ${history.length ? `<details class="mt-md"><summary>Decision change history</summary><ol>${history.map(({node,record}) => `<li>${escapeHtml(record.recordedAt)} · ${escapeHtml(node.name)} / ${escapeHtml(name(record.processId))}: ${escapeHtml(record.previousLevel)} → ${escapeHtml(record.level)}. ${escapeHtml(record.justification || 'Recommendation retained; no additional rationale entered.')}</li>`).join('')}</ol></details>` : ''}</section>`;
}
