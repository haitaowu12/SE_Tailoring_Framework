import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ACTIVE_CONSISTENCY_RULES,
  FRAMEWORK_SEMANTIC_VERSION,
  METRICS,
  METRIC_DEFINITION_SET_ID,
  METRIC_MIGRATION,
  METRIC_PROCESS_MAP,
  METRIC_QUALIFIER_DEFINITIONS
} from '../src/data/metrics.js';

test('semantic 4.1 retains exactly M1-M16 and all 102 mapping cells', () => {
  assert.equal(FRAMEWORK_SEMANTIC_VERSION, '4.1.0');
  assert.equal(METRIC_DEFINITION_SET_ID, 'se-tailoring-m1-m16-v3');
  assert.deepEqual(METRICS.map(metric => metric.id), Array.from({ length: 16 }, (_, index) => `M${index + 1}`));
  assert.equal(Object.values(METRIC_PROCESS_MAP).reduce((count, map) => count + Object.keys(map).length, 0), 102);
});

test('M3 paired intended-use boundary does not infer low uncertainty from mature components alone', () => {
  const m3 = METRICS.find(metric => metric.id === 'M3');
  const score2Prompt = m3.guidedQuestions.find(question => question.yesScore === 2)?.text || '';
  const score4Prompt = m3.guidedQuestions.find(question => question.yesScore === 4)?.text || '';

  assert.match(score2Prompt, /mature and supported by representative evidence/i);
  assert.match(score2Prompt, /familiar application, configuration, operating environment, scale, and realization method/i);
  assert.match(score4Prompt, /application, configuration, operating environment, scale, or realization method/i);
  assert.doesNotMatch(score2Prompt, /even if (?:used )?in a new configuration/i);
  assert.equal(METRIC_MIGRATION.metrics.M3.classification, 'reassessment-required');
});

test('M3 qualifiers cover component readiness and application/configuration uncertainty without adding metrics', () => {
  const qualifierIds = METRIC_QUALIFIER_DEFINITIONS.M3.map(qualifier => qualifier.id);
  assert.deepEqual(qualifierIds, [
    'component-readiness',
    'application-novelty',
    'configuration-integration-novelty',
    'environment-representativeness',
    'scale-up-realization-novelty',
    'evidence-maturity'
  ]);
});

test('Rules 3, 9, 16, and 17 preserve their approved behavior', () => {
  const rules = Object.fromEntries(ACTIVE_CONSISTENCY_RULES.map(rule => [String(rule.id), rule]));
  assert.equal(rules['3'].type, 'HC');
  assert.equal(rules['9'].type, 'HC');
  assert.equal(rules['16'].type, 'WN');
  assert.equal(rules['17'].type, 'WN');
  assert.deepEqual(rules['16'].required, { process: 15, level: 'standard', op: '>=' });
  assert.deepEqual(rules['17'].required, { process: 16, level: 'standard', op: '>=' });
});

test('portable wording removes unsupported universal and stigmatizing shortcuts', () => {
  for (const metricId of ['M9', 'M10', 'M12', 'M14', 'M16']) {
    const metric = METRICS.find(item => item.id === metricId);
    assert.doesNotMatch(JSON.stringify(metric), />\$500K|10-15%|>20%|political whims|cultural barriers|>8 hour spread/i);
  }
  assert.match(METRICS.find(metric => metric.id === 'M16')?.note || '', /Higher M16 indicates stronger organizational conditions/);
});
