/**
 * SE Tailoring Framework v4.0 Test Suite
 * Tests the simplified "highest tier wins" algorithm
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  runFullAssessment,
  calculateProcessDerivation,
  getDriverAttribution,
  applyOverrides
} from '../src/utils/assessment-engine.js';
import { CONSISTENCY_RULES, PROPAGATION_RULES } from '../src/data/se-tailoring-data.js';
import { validateConfig } from '../src/utils/export-import.js';

const METRIC_IDS = [
  'M1', 'M2', 'M3', 'M4',
  'M5', 'M6', 'M7', 'M8',
  'M9', 'M10', 'M11', 'M12',
  'M13', 'M14', 'M15', 'M16'
];

function makeScores(defaultValue = 1) {
  return Object.fromEntries(METRIC_IDS.map(id => [id, defaultValue]));
}

function makeCoreLevels(defaultLevel = 'basic') {
  const levels = {};
  for (let pid = 9; pid <= 30; pid += 1) {
    levels[pid] = defaultLevel;
  }
  return levels;
}

// v4.0 Tests: Highest Tier Wins Algorithm

test('v4.0: single high metric triggers that level (no conditional capping)', () => {
  const scores = makeScores(1);
  Object.assign(scores, {
    M9: 5,  // Single Comprehensive trigger
    M10: 1,
    M11: 1
  });

  const detail = calculateProcessDerivation(23, scores);

  assert.equal(detail.level, 'comprehensive', 'v4.0: Single high metric should trigger Comprehensive');
  assert.equal(detail.triggerLevel, 'comprehensive');
  assert.equal(detail.conditionalRuleApplied, undefined, 'v4.0: Conditional derivation removed');
});

test('v4.0: highest tier wins regardless of Primary/Secondary', () => {
  const scores = makeScores(1);
  Object.assign(scores, {
    M5: 3,  // Primary at Standard
    M1: 5   // Secondary at Comprehensive
  });

  const detail = calculateProcessDerivation(12, scores);

  assert.equal(detail.level, 'comprehensive', 'Secondary metric at 5 should trigger Comprehensive');
  assert.equal(detail.weightedScore, undefined, 'v4.0: Weighted score removed');
});

test('v4.0: no weighted reference calculations', () => {
  const scores = makeScores(1);
  Object.assign(scores, {
    M9: 5,
    M10: 1,
    M11: 1
  });

  const detail = calculateProcessDerivation(23, scores);

  assert.equal(detail.level, 'comprehensive', 'Highest tier wins');
  assert.equal(detail.weightedReferenceLevel, undefined, 'v4.0: Weighted reference removed');
});

test('v4.0: trigger metric ties are deterministic', () => {
  const scores = makeScores(1);
  Object.assign(scores, { M9: 5, M10: 5, M12: 1 });

  const detail = calculateProcessDerivation(9, scores);

  assert.ok(detail.triggerMetrics.includes('M9'));
  assert.ok(detail.triggerMetrics.includes('M10'));
});

test('v4.0: process-specific overrides (not blanket)', () => {
  const levels = makeCoreLevels('basic');
  const scores = makeScores(1);
  scores.M5 = 4;  // Safety-Critical

  const result = applyOverrides(levels, scores, {});

  // Verify specific processes are affected
  assert.ok(
    result.levels[25] === 'standard' || result.overrides.some(o => o.processId === 25),
    'Verification should be affected by M5=4'
  );
  assert.ok(
    result.levels[27] === 'standard' || result.overrides.some(o => o.processId === 27),
    'Validation should be affected by M5=4'
  );
});

test('v4.0: SA floor integration', () => {
  const scores = makeScores(1);
  scores.M5 = 3;  // Safety Relevant

  const result = runFullAssessment(scores);

  assert.ok(['II', 'III'].includes(result.saTier?.tier) || result.saFloorApplied);
  
  // Verify safety processes elevated
  for (const pid of [12, 16, 19, 25, 27, 28, 29]) {
    const level = result.levels[pid];
    assert.ok(
      level === 'standard' || level === 'comprehensive',
      `Safety process P${pid} should be ≥ Standard for M5=3`
    );
  }
});

test('consistency baseline is 17 rules and Rule 12 HC fix elevates planning conservatively', () => {
  const scores = makeScores(1);
  scores.M5 = 5;

  const result = runFullAssessment(scores);

  assert.equal(CONSISTENCY_RULES.length, 17);
  assert.ok(result.fixes.some(f => f.processId === 9 && f.to === 'standard' && f.ruleId === 12));
  assert.equal(result.levels[9], 'standard');
  assert.equal(result.violations.filter(v => v.type === 'HC').length, 0);
});

test('canonical propagation catalog contains P1..P18', () => {
  assert.equal(PROPAGATION_RULES.length, 18);
  assert.ok(PROPAGATION_RULES.some(r => r.id === 'P1'));
  assert.ok(PROPAGATION_RULES.some(r => r.id === 'P18'));
});

test('corrected process-metric mappings match canonical matrix rows', () => {
  const scores = makeScores(3);

  const d11 = Object.fromEntries(getDriverAttribution(11, scores).map(d => [d.metric, d.role]));
  assert.equal(d11.M5, undefined);

  const d12 = Object.fromEntries(getDriverAttribution(12, scores).map(d => [d.metric, d.role]));
  assert.equal(d12.M7, undefined);

  const d14 = Object.fromEntries(getDriverAttribution(14, scores).map(d => [d.metric, d.role]));
  assert.equal(d14.M1, undefined);

  const d23 = Object.fromEntries(getDriverAttribution(23, scores).map(d => [d.metric, d.role]));
  assert.equal(d23.M5, undefined);
  assert.equal(d23.M8, undefined);

  const d26 = Object.fromEntries(getDriverAttribution(26, scores).map(d => [d.metric, d.role]));
  assert.equal(d26.M5, undefined);

  const d29 = Object.fromEntries(getDriverAttribution(29, scores).map(d => [d.metric, d.role]));
  assert.equal(d29.M7, 'P');

  const d30 = Object.fromEntries(getDriverAttribution(30, scores).map(d => [d.metric, d.role]));
  assert.equal(d30.M5, undefined);
  assert.equal(d30.M6, 'S');
});

test('config validation accepts old and new schema variants', () => {
  const oldConfig = {
    _format: 'se-tailoring-config',
    metricScores: { M1: 3 },
    processLevels: { 9: 'basic' }
  };

  const newConfig = {
    _format: 'se-tailoring-config',
    projectInfo: { securityCritical: true },
    metricScores: { M1: 3 },
    processLevels: { 9: 'basic' },
    derivedLevels: { 9: 'standard' },
    derivationDetails: {
      9: {
        triggerMetrics: ['M9'],
        triggerScore: 3,
        triggerLevel: 'standard',
        weightedReferenceScore: 2.8,
        weightedReferenceLevel: 'standard'
      }
    }
  };

  assert.equal(validateConfig(oldConfig).valid, true);
  assert.equal(validateConfig(newConfig).valid, true);
});
