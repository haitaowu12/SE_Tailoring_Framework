import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assessHierarchyCompleteness,
  evaluateBaselineEligibility
} from '../src/utils/assessment-integrity.js';

const METRIC_IDS = Array.from({ length: 16 }, (_, index) => `M${index + 1}`);
const makeScores = () => Object.fromEntries(METRIC_IDS.map(metricId => [metricId, 3]));
const makeAssessments = scores => Object.fromEntries(METRIC_IDS.map(metricId => [metricId, {
  score: scores[metricId],
  status: 'assessed',
  definitionVersion: 3,
  qualifiers: [],
  rationale: '',
  evidenceRefs: []
}]));

function completeNode(id, parentId = null) {
  const scores = makeScores();
  return {
    id,
    parentId,
    scores,
    metricAssessments: makeAssessments(scores),
    ruleDispositions: {},
    csiResponse: {},
    levels: {},
    assessmentResult: { violations: [] }
  };
}

test('active child cannot hide an incomplete root from hierarchy completeness', () => {
  const child = completeNode('child', 'root');
  const tree = {
    rootId: 'root',
    activeId: 'child',
    nodes: {
      root: { id: 'root', parentId: null, scores: {}, metricAssessments: {}, assessmentResult: null },
      child
    }
  };

  const hierarchy = assessHierarchyCompleteness(tree);
  assert.equal(hierarchy.complete, false);
  assert.deepEqual(hierarchy.incompleteElementIds, ['root']);

  const eligibility = evaluateBaselineEligibility({
    scores: child.scores,
    metricAssessments: child.metricAssessments,
    violations: [],
    ruleDispositions: {},
    levels: {},
    csiResponse: {},
    assessmentTree: tree
  });
  assert.equal(eligibility.softwareChecksPassed, false);
  assert.deepEqual(eligibility.hierarchy.incompleteElementIds, ['root']);
});

test('active root is checked through top-level state while complete children are checked through the tree', () => {
  const tree = {
    rootId: 'root',
    activeId: 'root',
    nodes: {
      root: { id: 'root', parentId: null, scores: {}, metricAssessments: {}, assessmentResult: null },
      child: completeNode('child', 'root')
    }
  };

  const hierarchy = assessHierarchyCompleteness(tree);
  assert.equal(hierarchy.complete, true);
  assert.deepEqual(hierarchy.incompleteElementIds, []);
  assert.equal(hierarchy.assessedElementCount, 2);
});
