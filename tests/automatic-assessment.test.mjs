import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlankAssessment, setState, getState } from '../src/state.js';
import { checkAssessmentAutomatically } from '../src/views/assessment.js';

function fixture(overrides = {}) {
  const state = createBlankAssessment();
  const scores = Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`M${i + 1}`, 1]));
  Object.assign(scores, overrides);
  const metricAssessments = Object.fromEntries(Object.entries(scores).map(([id, score]) => [id, {
    score, status: 'assessed', definitionVersion: 3, qualifiers: [], rationale: '', evidenceRefs: []
  }]));
  state.scores = scores;
  state.metricAssessments = metricAssessments;
  Object.assign(state.assessmentTree.nodes.default, { scores, metricAssessments });
  setState(state);
}

function recordWarnings(rule11Outcome = 'basic-evidence-justified') {
  const state = getState();
  const records = Object.fromEntries(state.violations.map(warning => [String(warning.ruleId), {
    ruleId: warning.ruleId, outcome: String(warning.ruleId) === '11' ? rule11Outcome : 'accept-current',
    rationale: 'Synthetic tutorial decision', ownerApprover: 'Tutorial reviewer',
    evidenceRef: 'SE-DEMO', reviewDate: '2026-10-10'
  }]));
  state.assessmentTree.nodes.default.ruleDispositions = records;
  setState({ ruleDispositions: records });
  return records;
}

test('automatic checks complete confirmed inputs without an extra finalization action and revoke completion for unknown inputs', () => {
  fixture();
  checkAssessmentAutomatically();
  assert.equal(getState().assessmentComplete, true);
  getState().assessmentTree.nodes.default.metricAssessments.M1.status = 'unknown';
  checkAssessmentAutomatically();
  assert.equal(getState().assessmentComplete, false);
  assert.equal(getState().assessmentTree.nodes.default.assessmentDisposition, 'work-in-progress');
});

test('automatic checks require explicit complete warning records and reopen when evidence is removed', () => {
  fixture({ M2: 5, M4: 3 });
  checkAssessmentAutomatically();
  assert.equal(getState().assessmentComplete, false);
  const initialLevels = structuredClone(getState().levels);
  const records = recordWarnings();
  checkAssessmentAutomatically();
  assert.equal(getState().assessmentComplete, true);
  assert.deepEqual(getState().levels, initialLevels);
  getState().assessmentTree.nodes.default.ruleDispositions['17'].evidenceRef = '';
  checkAssessmentAutomatically();
  assert.equal(getState().assessmentComplete, false);
});

test('automatic checks do not apply a pending Validation elevation or clear imported semantic review', () => {
  fixture({ M2: 5, M4: 3 });
  checkAssessmentAutomatically();
  recordWarnings('elevated-validation');
  checkAssessmentAutomatically();
  assert.equal(getState().levels[27], 'basic');
  assert.equal(getState().manualAdjustments[27], undefined);
  assert.equal(getState().assessmentComplete, false);
  const migration = { status: 'review-required', message: 'Review imported derivation' };
  setState({ semanticMigration: migration });
  checkAssessmentAutomatically();
  assert.deepEqual(getState().semanticMigration, migration);
});


test('repeated automatic checks preserve an explicit demonstration disposition', () => {
  fixture();
  setState({ assessmentDisposition: 'demo' });
  checkAssessmentAutomatically();
  checkAssessmentAutomatically();
  assert.equal(getState().assessmentComplete, false);
  assert.equal(getState().assessmentDisposition, 'demo');
});


test('automatic checking does not invent a recommendation for a blank assessment', () => {
  setState(createBlankAssessment());
  checkAssessmentAutomatically();
  assert.equal(getState().assessmentComplete, false);
  assert.deepEqual(getState().levels, {});
  assert.equal(getState().assessmentTree.nodes.default.recommendationBaseline, undefined);
});


test('a satisfied finite migration still requires explicit review before automatic completion', () => {
  fixture();
  const migration = { status: 'review-required', reassessmentMetrics: ['M3'] };
  setState({ semanticMigration: migration });
  checkAssessmentAutomatically();
  assert.equal(getState().assessmentComplete, false);
  assert.equal(getState().assessmentDisposition, 'work-in-progress');
  assert.deepEqual(getState().semanticMigration, migration);
});
