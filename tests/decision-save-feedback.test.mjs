import test from 'node:test';
import assert from 'node:assert/strict';
import { describeDecisionSave } from '../src/utils/decision-save-feedback.js';
import { runFullAssessment } from '../src/utils/assessment-engine.js';
import { captureRecommendation } from '../src/utils/tailoring-decisions.js';
import { WORKSPACE_STORAGE_KEY } from '../src/utils/assessment-workspace.js';
import { buildExportConfig } from '../src/utils/export-import.js';

test('a stored draft is not described as a recorded decision, even when an earlier decision exists', () => {
  const feedback = describeDecisionSave({ hasDraft: true, recorded: true });
  assert.equal(feedback.label, 'Draft saved locally');
  assert.match(feedback.message, /not a recorded decision/);
  assert.equal(feedback.blocked, false);
});

test('protected minimum and missing rationale remain distinct from storage failure', () => {
  const floor = describeDecisionSave({ hasDraft: true, errors: ['Process 12: comprehensive minimum is protected (Life-Safety).'] });
  assert.equal(floor.label, 'Change blocked by minimum');
  assert.match(floor.message, /Draft saved locally/);
  assert.match(floor.message, /applied level is unchanged/);
  const rationale = describeDecisionSave({ hasDraft: true, errors: ['Process 10: record why the choice differs from the recommendation.'] });
  assert.equal(rationale.label, 'Change needs review');
  assert.doesNotMatch(rationale.message, /Local save failed/);
});

test('failed storage never claims that a draft or newly recorded decision is durable', () => {
  const draft = describeDecisionSave({ hasDraft: true, storageFailed: true });
  assert.equal(draft.label, 'Draft held in this tab');
  assert.match(draft.message, /Local save failed/);
  const recorded = describeDecisionSave({ recorded: true, storageFailed: true });
  assert.equal(recorded.label, 'Recorded in this tab only');
  assert.match(recorded.message, /private backup/);
  const blocked = describeDecisionSave({ hasDraft: true, storageFailed: true, errors: ['Process 12: comprehensive minimum is protected.'] });
  assert.equal(blocked.label, 'Change blocked by minimum');
  assert.match(blocked.message, /Local save failed/);
  assert.doesNotMatch(blocked.message, /Draft saved locally/);
});

test('imported and stale choices retain their provenance boundary', () => {
  assert.equal(describeDecisionSave({ imported: true }).label, 'Imported adjustment');
  assert.equal(describeDecisionSave({ recorded: true, needsReview: true }).label, 'Decision needs review');
});

async function openFixture(t, name) {
  const data = new Map();
  const storage = { failWrites: false, getItem: key => data.get(key) ?? null,
    setItem(key, value) { if (this.failWrites) throw new DOMException('Synthetic quota failure', 'QuotaExceededError'); data.set(key, value); },
    removeItem: key => data.delete(key) };
  const prior = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  globalThis.localStorage = storage;
  t.after(() => prior ? Object.defineProperty(globalThis, 'localStorage', prior) : delete globalThis.localStorage);
  const app = await import(`../src/state.js?decision-feedback-${name}`);
  app.loadAutosave();
  const scores = Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`M${i + 1}`, i === 4 ? 5 : 3]));
  const metricAssessments = Object.fromEntries(Object.entries(scores).map(([id, score]) => [id, { score, status: 'assessed', definitionVersion: 3, qualifiers: [], rationale: 'Synthetic test', evidenceRefs: [] }]));
  const result = runFullAssessment(scores, undefined, { metricAssessments });
  const node = { id: 'default', parentId: null, childIds: [], scores, metricAssessments, levels: result.levels, assessmentResult: result, manualAdjustments: {}, decisionDrafts: {
    10: { level: 'comprehensive', justification: 'Additional local control justified by this synthetic scenario' },
    12: { level: 'standard', justification: 'Synthetic blocked reduction' }
  } };
  captureRecommendation(node, result, { effectiveScores: scores });
  app.setState({ ...result, scores, metricAssessments, assessmentTree: { rootId: 'default', activeId: 'default', nodes: { default: node } } });
  return { app, storage, node };
}

test('a blocked bulk save preserves both drafts, while recording one valid process leaves the protected draft intact', async t => {
  const { app, storage, node } = await openFixture(t, 'batch');
  const before = storage.getItem(WORKSPACE_STORAGE_KEY);
  const baseline = structuredClone(node.recommendationBaseline);
  const blocked = app.saveElementDecisions('default', structuredClone(node.decisionDrafts));
  assert.match(blocked.errors.join(' '), /minimum is protected/);
  assert.equal(storage.getItem(WORKSPACE_STORAGE_KEY), before, 'a rejected batch does not write a partial decision set');
  assert.equal(Object.keys(node.decisionRecords || {}).length, 0);
  assert.equal(Object.keys(node.decisionDrafts).length, 2);
  const saved = app.saveElementDecisions('default', { 10: node.decisionDrafts[10] });
  assert.deepEqual(saved.errors, []);
  assert.equal(saved.persisted, true);
  assert.equal(node.levels[12], 'comprehensive');
  assert.equal(node.decisionRecords[10].level, 'comprehensive');
  assert.deepEqual(Object.keys(node.decisionDrafts), ['12']);
  assert.deepEqual(node.recommendationBaseline, baseline);
  const fresh = await import('../src/state.js?decision-feedback-reopen');
  fresh.loadAutosave();
  assert.ok(fresh.restoreWorkspaceAssessment());
  const restored = fresh.getState().assessmentTree.nodes.default;
  assert.equal(restored.decisionHistory.length, 1);
  assert.equal(restored.decisionDrafts[12].level, 'standard');
  assert.equal(restored.levels[12], 'comprehensive');
});

test('a quota failure retains the decision in memory and private backup, then an explicit retry persists without duplicate history', async t => {
  const { app, storage, node } = await openFixture(t, 'quota');
  const before = storage.getItem(WORKSPACE_STORAGE_KEY);
  storage.failWrites = true;
  const saved = app.saveElementDecisions('default', { 10: node.decisionDrafts[10] });
  assert.deepEqual(saved.errors, []);
  assert.equal(saved.persisted, false);
  assert.equal(storage.getItem(WORKSPACE_STORAGE_KEY), before);
  const backup = buildExportConfig(app.getState(), { mode: 'identified' });
  assert.equal(backup.assessmentTree.nodes.default.decisionHistory.length, 1);
  assert.equal(backup.assessmentTree.nodes.default.decisionDrafts[12].level, 'standard');
  storage.failWrites = false;
  const retry = app.saveElementDecisions('default', { 10: node.decisionRecords[10] });
  assert.equal(retry.persisted, true);
  assert.equal(node.decisionHistory.length, 1);
  assert.notEqual(storage.getItem(WORKSPACE_STORAGE_KEY), before);
});
