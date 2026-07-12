import { RELATIONSHIP_STUDIES, HANDOFF_EVIDENCE_STATUSES, createRequirementsArchitectureHandoff } from '../data/artifact-relationships.js';
import { getState, setState, showToast } from '../state.js';
import { assessArtifactHandoff, ensureArtifactHandoffsForElements } from '../utils/output-sufficiency.js';
import { escapeHtml } from '../utils/safe-text.js';

const field = (label, name, value, { type = 'text', help = '', required = false } = {}) => `
  <label class="form-group">
    <span class="form-label">${escapeHtml(label)}${required ? ' *' : ''}</span>
    ${type === 'textarea'
        ? `<textarea class="form-input" name="${name}" rows="3">${escapeHtml(value || '')}</textarea>`
        : `<input class="form-input" name="${name}" type="${type}" value="${escapeHtml(value || '')}">`}
    ${help ? `<span class="text-xs text-secondary">${escapeHtml(help)}</span>` : ''}
  </label>`;

function renderEditor(record, elementOptions) {
  const assessment = assessArtifactHandoff(record);
  return `
    <form class="card mb-xl handoff-editor" data-artifact-id="${escapeHtml(record.artifactId)}" style="border-left:3px solid ${assessment.complete ? 'var(--accent-success)' : 'var(--accent-warning)'}">
      <div class="flex justify-between items-center mb-md">
        <div>
          <h4>Requirements → Architecture artifact</h4>
          <p class="text-xs text-secondary mt-sm">Artifact prerequisite and acceptance gate. It does not compare or change process levels.</p>
        </div>
        <span class="level-badge ${assessment.complete ? 'standard' : 'basic'}">${assessment.disposition}</span>
      </div>
      <div class="grid-2">
        ${field('Typed artifact ID', 'artifactId', record.artifactId, { required: true, help: 'Format: ART:TYPE:element:local-id' })}
        <label class="form-group"><span class="form-label">Evidence status *</span><select class="form-input" name="evidenceStatus">${HANDOFF_EVIDENCE_STATUSES.map(status => `<option value="${status.id}" ${record.evidenceStatus === status.id ? 'selected' : ''}>${status.label}</option>`).join('')}</select></label>
        <label class="form-group"><span class="form-label">Provider element *</span><select class="form-input" name="providerElementId">${elementOptions(record.providerElementId)}</select><span class="text-xs text-secondary">Process 19 · System Requirements Definition</span></label>
        <label class="form-group"><span class="form-label">Accepting consumer element *</span><select class="form-input" name="consumerElementId">${elementOptions(record.consumerElementId)}</select><span class="text-xs text-secondary">Process 20 · Architecture Definition</span></label>
      </div>
      ${field('Required content', 'requiredContent', record.requiredContent, { type: 'textarea', required: true, help: 'Identify the requirements baseline, interfaces, constraints, assumptions, and traceability needed for architecture work.' })}
      ${field('Acceptance criteria', 'acceptanceCriteria', record.acceptanceCriteria, { type: 'textarea', required: true })}
      ${field('Evidence references', 'evidenceRefs', record.evidenceRefs, { type: 'textarea', required: true, help: 'Controlled references or links supporting the handoff judgment.' })}
      <div class="grid-2">
        ${field('Known gaps', 'gaps', record.gaps, { type: 'textarea', help: 'Required for a governed-review disposition.' })}
        ${field('Equivalent evidence / compensating controls', 'equivalentEvidence', record.equivalentEvidence, { type: 'textarea', help: 'Required for a governed-review disposition.' })}
        ${field('Acceptance authority', 'acceptanceAuthority', record.acceptanceAuthority, { required: true })}
        ${field('Review date', 'reviewDate', record.reviewDate, { type: 'date', required: true, help: 'Acceptance or governed review expires after this date.' })}
      </div>
      ${assessment.baselineBlocked ? `<div class="alert alert-warning mb-md"><strong>Baseline blocked:</strong> ${escapeHtml(assessment.missingFields.join(', '))}. Choose Accepted when the criteria are met, or document a complete, time-bounded Governed review.</div>` : `<div class="alert alert-success mb-md"><strong>Baseline gate satisfied:</strong> ${assessment.disposition === 'accepted' ? 'the accepting authority has accepted the artifact' : 'a time-bounded governed review covers the documented gaps'}.</div>`}
      <div class="flex gap-sm"><button class="btn btn-primary" type="submit">Save handoff</button><button class="btn btn-secondary btn-remove-handoff" type="button">Remove</button></div>
    </form>`;
}

export function renderOutputSufficiency(container) {
  const state = getState();
  const tree = state.assessmentTree;
  const rootId = tree?.rootId || 'default';
  const elements = Object.values(tree?.nodes || {}).sort((a, b) => a.name.localeCompare(b.name));
  const records = ensureArtifactHandoffsForElements(state.artifactHandoffs, elements.map(element => element.id));
  if (records.length !== (state.artifactHandoffs || []).length) setState({ artifactHandoffs: records });
  const elementOptions = selected => elements.map(element => `<option value="${escapeHtml(element.id)}" ${selected === element.id ? 'selected' : ''}>${escapeHtml(element.name)}</option>`).join('');

  container.innerHTML = `
    <div class="mb-xl"><h2>Artifact Handoffs</h2><p class="text-secondary mt-sm">Pilot output sufficiency at the Requirements-to-Architecture boundary while keeping candidate relationships separate from rigor floors.</p></div>
    <div class="card mb-xl">
      <h4 class="mb-md">Relationship study registry</h4>
      <table class="data-table"><thead><tr><th>Relationship</th><th>Classification</th><th>Governance</th><th>Effect</th></tr></thead><tbody>
        ${RELATIONSHIP_STUDIES.map(study => `<tr><td><strong>${escapeHtml(study.label)}</strong>${study.pilot ? '<br><span class="text-xs">Active pilot</span>' : '<br><span class="text-xs text-secondary">Non-normative study</span>'}</td><td>${escapeHtml(study.classification)}</td><td>${escapeHtml(study.governance)}</td><td class="text-xs">${escapeHtml(study.normativeEffect)}</td></tr>`).join('')}
      </tbody></table>
    </div>
    <div class="alert alert-info mb-xl"><strong>Safe contract:</strong> an incomplete pilot handoff blocks baseline. A complete governed review may temporarily satisfy the gate when its gaps, equivalent evidence or compensating controls, authority, evidence, and current review date are recorded. Neither outcome elevates Requirements, Architecture, CM, or Information Management.</div>
    <div id="handoff-list">${records.map(record => renderEditor(record, elementOptions)).join('')}</div>
    <button class="btn btn-secondary" id="btn-add-handoff">Add element handoff</button>`;

  container.querySelectorAll('.handoff-editor').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form);
      const updated = {
        artifactId: String(data.get('artifactId') || '').trim(),
        relationshipId: 'requirements-to-architecture',
        providerElementId: String(data.get('providerElementId') || ''),
        providerProcessId: 19,
        consumerElementId: String(data.get('consumerElementId') || ''),
        consumerProcessId: 20,
        requiredContent: String(data.get('requiredContent') || '').trim(),
        acceptanceCriteria: String(data.get('acceptanceCriteria') || '').trim(),
        evidenceStatus: String(data.get('evidenceStatus') || 'draft'),
        evidenceRefs: String(data.get('evidenceRefs') || '').trim(),
        gaps: String(data.get('gaps') || '').trim(),
        equivalentEvidence: String(data.get('equivalentEvidence') || '').trim(),
        acceptanceAuthority: String(data.get('acceptanceAuthority') || '').trim(),
        reviewDate: String(data.get('reviewDate') || '')
      };
      const previousId = form.dataset.artifactId;
      setState({ artifactHandoffs: getState().artifactHandoffs.map(record => record.artifactId === previousId ? updated : record) });
      showToast('Artifact handoff saved.', 'success');
      renderOutputSufficiency(container);
    });
    form.querySelector('.btn-remove-handoff').addEventListener('click', () => {
      setState({ artifactHandoffs: getState().artifactHandoffs.filter(record => record.artifactId !== form.dataset.artifactId) });
      renderOutputSufficiency(container);
    });
  });

  container.querySelector('#btn-add-handoff').addEventListener('click', () => {
    const existing = new Set(getState().artifactHandoffs.map(record => record.providerElementId));
    const target = elements.find(element => !existing.has(element.id)) || elements[0];
    if (!target) return;
    const record = createRequirementsArchitectureHandoff(target.id);
    record.artifactId = `${record.artifactId}-${Date.now().toString(36)}`;
    setState({ artifactHandoffs: [...getState().artifactHandoffs, record] });
    renderOutputSufficiency(container);
  });
}
