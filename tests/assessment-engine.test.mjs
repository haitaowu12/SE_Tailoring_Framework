import test from 'node:test';
import assert from 'node:assert/strict';

import { runFullAssessment, calculateProcessDerivation, getDriverAttribution } from '../src/utils/assessment-engine.js';
import { CONSISTENCY_RULES } from '../src/data/se-tailoring-data.js';
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

test('highest-tier derivation wins across mixed P/S drivers', () => {
  const scores = makeScores(1);
  Object.assign(scores, {
    M1: 1,
    M2: 1,
    M4: 1,
    M9: 5,
    M10: 1,
    M11: 1
  });

  const result = runFullAssessment(scores);
  const detail = result.derivationDetails[23];

  assert.equal(result.derived[23], 'comprehensive');
  assert.deepEqual(detail.triggerMetrics, ['M9']);
  assert.equal(detail.triggerScore, 5);
  assert.equal(detail.weightedReferenceLevel, 'basic');
  assert.equal(detail.weightedReferenceScore, 1.44);
});

test('trigger metric ties are deterministic and ordered by metric number', () => {
  const scores = makeScores(1);
  Object.assign(scores, { M9: 5, M10: 5, M12: 1, M1: 1, M13: 1 });

  const detail = calculateProcessDerivation(9, scores);
  assert.deepEqual(detail.triggerMetrics, ['M9', 'M10']);
  assert.equal(detail.level, 'comprehensive');
});

test('weighted reference is advisory and does not change derived level', () => {
  const scores = makeScores(1);
  Object.assign(scores, {
    M1: 1,
    M2: 1,
    M4: 1,
    M9: 5,
    M10: 1,
    M11: 1
  });

  const detail = calculateProcessDerivation(23, scores);
  assert.equal(detail.level, 'comprehensive');
  assert.equal(detail.weightedReferenceLevel, 'basic');
});

test('expanded override set applies floors (environmental override on process 21)', () => {
  const scores = makeScores(1);
  scores.M7 = 5;

  const result = runFullAssessment(scores);
  const p21 = result.overrides.find(o => o.processId === 21 && o.reason === 'Environmental Critical');

  assert.equal(result.derived[21], 'basic');
  assert.equal(result.levels[21], 'standard');
  assert.ok(p21);
});

test('SA tier remains M5-driven and SA floor is enforced', () => {
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

test('consistency rules contain 12 entries and HC violations are auto-fixed', () => {
  const scores = makeScores(1);
  scores.M3 = 5;

  const result = runFullAssessment(scores);

  assert.equal(CONSISTENCY_RULES.length, 12);
  assert.ok(result.fixes.some(f => f.processId === 9));
  assert.equal(result.levels[9], 'standard');
  assert.equal(result.violations.filter(v => v.type === 'HC').length, 0);
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
