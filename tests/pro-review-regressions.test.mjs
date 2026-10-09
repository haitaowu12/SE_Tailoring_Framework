// Native regression from the independent source-review challenge.
// This verifies software integrity, not professional validity of the rule policy.
import test from 'node:test';
import assert from 'node:assert/strict';
import { assessHierarchyCompleteness, evaluateBaselineEligibility } from '../src/utils/assessment-integrity.js';

function node(id, parentId = null) {
  const scores = Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`M${i + 1}`, 1]));
  return {
    id, parentId, scores,
    metricAssessments: Object.fromEntries(Object.entries(scores).map(([metric, score]) => [metric, { score, status: 'assessed' }])),
    levels: Object.fromEntries(Array.from({ length: 22 }, (_, i) => [i + 9, 'basic'])),
    ruleDispositions: {}, csiResponse: {},
    assessmentResult: { violations: [], activeFloors: [] }
  };
}

test('inactive child hard violations block completeness with explicit or missing cached violations', () => {
  const root = node('root');
  const child = node('child', 'root');
  const tree = { rootId: 'root', activeId: 'root', nodes: { root, child } };
  const state = { ...root, violations: [], assessmentTree: tree };
  assert.equal(evaluateBaselineEligibility(state).softwareChecksPassed, true, 'otherwise complete all-Basic profile is accepted');

  child.levels[19] = 'comprehensive';
  for (const cached of [
    [{ ruleId: 2, type: 'HC', severity: 'error', affectedProcess: 25, requiredLevel: 'standard', requiredOp: '>=' }],
    []
  ]) {
    child.assessmentResult.violations = cached;
    assert.equal(evaluateBaselineEligibility(state).softwareChecksPassed, false);
    assert.deepEqual(assessHierarchyCompleteness(tree).incompleteElementIds, ['child']);
  }

  child.levels[19] = 'basic';
  assert.equal(evaluateBaselineEligibility(state).softwareChecksPassed, true, 'removing the contradiction restores eligibility');
});
