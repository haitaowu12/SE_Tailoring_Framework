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

test('conditional derivation caps single Comprehensive trigger to Standard when uncorraborated', () => {
  const scores = makeScores(1);
  Object.assign(scores, {
    M9: 5,
    M10: 1,
    M11: 1,
    M1: 1,
    M2: 1,
    M4: 1
  });

  const detail = calculateProcessDerivation(23, scores);

  assert.equal(detail.level, 'standard');
  assert.equal(detail.triggerLevel, 'comprehensive');
  assert.equal(detail.conditionalRuleApplied, true);
  assert.deepEqual(detail.triggerMetrics, ['M9']);
});

test('conditional derivation returns Comprehensive with corroboration (1 Primary at C + 1 Secondary at S+)', () => {
  const scores = makeScores(1);
  Object.assign(scores, {
    M5: 5,
    M1: 3,
    M6: 1,
    M8: 1,
    M2: 1,
    M9: 1
  });

  const detail = calculateProcessDerivation(12, scores);

  assert.equal(detail.level, 'comprehensive');
  assert.equal(detail.conditionalRuleApplied, false);
  assert.equal(detail.triggerLevel, 'comprehensive');
});

test('weighted reference is advisory and does not change derived level', () => {
  const scores = makeScores(1);
  Object.assign(scores, {
    M9: 5,
    M10: 1,
    M11: 1,
    M1: 1,
    M2: 1,
    M4: 1
  });

  const detail = calculateProcessDerivation(23, scores);

  assert.equal(detail.level, 'standard');
  assert.equal(detail.triggerLevel, 'comprehensive');
  assert.equal(detail.weightedReferenceLevel, 'basic');
});

test('trigger metric ties are deterministic and ordered by metric number', () => {
  const scores = makeScores(1);
  Object.assign(scores, { M9: 5, M10: 5, M12: 1, M1: 1, M13: 1 });

  const detail = calculateProcessDerivation(9, scores);

  assert.deepEqual(detail.triggerMetrics, ['M9', 'M10']);
});

test('multi-contractor override is metric-driven (M4 >= 4)', () => {
  const levels = makeCoreLevels('basic');
  const scores = makeScores(1);
  scores.M4 = 4;

  const result = applyOverrides(levels, scores, {});

  assert.equal(result.levels[13], 'standard');
  assert.equal(result.levels[24], 'standard');
  assert.ok(result.overrides.some(o => o.processId === 13 && o.reason === 'Multi-Contractor Integration'));
  assert.ok(result.overrides.some(o => o.processId === 24 && o.reason === 'Multi-Contractor Integration'));
});

test('security-critical override triggers only from project context flag', () => {
  const levels = makeCoreLevels('basic');
  const scores = makeScores(1);

  const noContext = applyOverrides(levels, scores, { securityCritical: false });
  const withContext = applyOverrides(levels, scores, { securityCritical: true });

  assert.equal(noContext.levels[12], 'basic');
  assert.equal(noContext.levels[13], 'basic');
  assert.equal(noContext.levels[14], 'basic');

  assert.equal(withContext.levels[12], 'standard');
  assert.equal(withContext.levels[13], 'standard');
  assert.equal(withContext.levels[14], 'standard');
  assert.ok(withContext.overrides.some(o => o.reason === 'Security-Critical Systems'));
});

test('runFullAssessment remains backward compatible and supports context argument', () => {
  const scores = makeScores(1);

  const withoutContext = runFullAssessment(scores);
  const withContext = runFullAssessment(scores, undefined, { securityCritical: true });

  assert.equal(withoutContext.levels[13], 'basic');
  assert.equal(withContext.levels[13], 'standard');
  assert.ok(withContext.derivationDetails);
});

test('SA tier remains M5-driven and SA floor behavior is stable', () => {
  const scores = makeScores(1);
  scores.M5 = 3;

  const result = runFullAssessment(scores);

  assert.equal(result.saTier.tier, 'II');
  assert.equal(result.saTier.floor, 'standard');

  for (const pid of [12, 16, 19, 25, 27, 28, 29]) {
    const level = result.levels[pid];
    assert.ok(level === 'standard' || level === 'comprehensive');
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
