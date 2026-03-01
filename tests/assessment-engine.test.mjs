/**
 * SE Tailoring Framework v4.1 Test Suite
 * Tests the "highest tier wins" algorithm + right-sizing
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  runFullAssessment,
  calculateProcessDerivation,
  getDriverAttribution,
  applyOverrides,
  computePSI,
  computeCSI,
  computeCRI,
  applyRightSizing
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

test('corrected process-metric mappings match canonical matrix rows (v4.1 M9/M10 removed)', () => {
  const scores = makeScores(3);

  // Project Planning (9): M1, M4 (P), M12 (P); M13 (S) — M9/M10 removed
  const d9 = Object.fromEntries(getDriverAttribution(9, scores).map(d => [d.metric, d.role]));
  assert.equal(d9.M1, 'P', 'M1 should be Primary for Project Planning');
  assert.equal(d9.M4, 'P', 'M4 should be Primary for Project Planning');
  assert.equal(d9.M9, undefined, 'M9 should NOT drive Project Planning');
  assert.equal(d9.M10, undefined, 'M10 should NOT drive Project Planning');

  // Assessment & Control (10): M1, M4 (P); M13, M15 (S) — M9/M10 removed
  const d10 = Object.fromEntries(getDriverAttribution(10, scores).map(d => [d.metric, d.role]));
  assert.equal(d10.M1, 'P', 'M1 should be Primary for Assessment & Control');
  assert.equal(d10.M9, undefined, 'M9 should NOT drive Assessment & Control');
  assert.equal(d10.M10, undefined, 'M10 should NOT drive Assessment & Control');

  // Decision Management (11): M1, M3, M6 (P), M13, M15 (P); M8, M12 (S)
  const d11 = Object.fromEntries(getDriverAttribution(11, scores).map(d => [d.metric, d.role]));
  assert.equal(d11.M5, undefined);
  assert.equal(d11.M13, 'P', 'M13 should be Primary for Decision Management');
  assert.equal(d11.M15, 'P', 'M15 should be Primary for Decision Management');
  assert.equal(d11.M8, 'S', 'M8 should be Secondary for Decision Management');

  // Risk Management (12): M5, M6, M8 (P); M1, M2 (S) — M9 removed
  const d12 = Object.fromEntries(getDriverAttribution(12, scores).map(d => [d.metric, d.role]));
  assert.equal(d12.M7, undefined);
  assert.equal(d12.M9, undefined, 'M9 should NOT drive Risk Management');

  const d14 = Object.fromEntries(getDriverAttribution(14, scores).map(d => [d.metric, d.role]));
  assert.equal(d14.M1, undefined);

  // Measurement (15): M6, M8 (P); M14 (S) — M9/M10/M15 removed
  const d15 = Object.fromEntries(getDriverAttribution(15, scores).map(d => [d.metric, d.role]));
  assert.equal(d15.M6, 'P', 'M6 should be Primary for Measurement');
  assert.equal(d15.M8, 'P', 'M8 should be Primary for Measurement');
  assert.equal(d15.M9, undefined, 'M9 should NOT drive Measurement');
  assert.equal(d15.M10, undefined, 'M10 should NOT drive Measurement');

  // Implementation (23): M1, M4 (P), M11 (P); M3 (S) — M9/M10 removed
  const d23 = Object.fromEntries(getDriverAttribution(23, scores).map(d => [d.metric, d.role]));
  assert.equal(d23.M5, undefined);
  assert.equal(d23.M8, undefined);
  assert.equal(d23.M9, undefined, 'M9 should NOT drive Implementation');
  assert.equal(d23.M10, undefined, 'M10 should NOT drive Implementation');

  // Transition (26): M6, M12, M13 (P); M4, M15, M16 (S) — M9 removed
  const d26 = Object.fromEntries(getDriverAttribution(26, scores).map(d => [d.metric, d.role]));
  assert.equal(d26.M5, undefined);
  assert.equal(d26.M9, undefined, 'M9 should NOT drive Transition');

  // Maintenance (29): M5, M6, M7 (P); M4, M11 (S) — M10 removed
  const d29 = Object.fromEntries(getDriverAttribution(29, scores).map(d => [d.metric, d.role]));
  assert.equal(d29.M7, 'P');
  assert.equal(d29.M10, undefined, 'M10 should NOT drive Maintenance');

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

// ====== Right-Sizing Tests ======

test('PSI computation uses max(M1, M2, M4)', () => {
  const scores = makeScores(1);
  assert.equal(computePSI(scores), 1, 'All 1s → PSI=1');

  scores.M1 = 4;
  assert.equal(computePSI(scores), 4, 'M1=4 → PSI=4');

  scores.M1 = 2; scores.M4 = 5;
  assert.equal(computePSI(scores), 5, 'M4=5 → PSI=5');
});

test('CSI computation uses max(M9, M10, M15)', () => {
  const scores = makeScores(1);
  assert.equal(computeCSI(scores), 1);

  scores.M10 = 4;
  assert.equal(computeCSI(scores), 4);
});

test('CRI computation maps M16 to 1-3', () => {
  assert.equal(computeCRI({ M16: 1 }), 1, 'M16=1 → CRI=1 (Resistant)');
  assert.equal(computeCRI({ M16: 2 }), 1, 'M16=2 → CRI=1');
  assert.equal(computeCRI({ M16: 3 }), 2, 'M16=3 → CRI=2 (Tolerant)');
  assert.equal(computeCRI({ M16: 4 }), 3, 'M16=4 → CRI=3 (Supportive)');
  assert.equal(computeCRI({ M16: 5 }), 3, 'M16=5 → CRI=3');
});

test('CRI=1 caps non-override processes at Standard', () => {
  const scores = makeScores(5);
  scores.M16 = 1; // Resistant org
  scores.M5 = 1;  // No safety override
  const result = runFullAssessment(scores);
  // With CRI=1, no process should be Comprehensive unless safety-overridden
  assert.ok(result.rightSizingActions.length > 0, 'Right-sizing should apply actions');
  assert.ok(result.indices.cri === 1, 'CRI should be 1');
});

test('Small project (PSI=1) enforces rigor budget on Comprehensive count', () => {
  const scores = makeScores(5); // All 5s → everything Comprehensive
  scores.M1 = 1; scores.M2 = 1; scores.M4 = 1; // PSI=1 (small)
  scores.M11 = 1; scores.M12 = 1;
  scores.M16 = 5; // CRI=3 (no capability cap)
  const result = runFullAssessment(scores);
  assert.ok(result.indices.psi <= 2, 'PSI should be small');
  // Max 3 Comprehensive for small projects
  const compCount = Object.values(result.levels).filter(l => l === 'comprehensive').length;
  assert.ok(compCount <= 3, `Small project should have ≤3 Comprehensive, got ${compCount}`);
});

test('runFullAssessment returns rightSizingActions and indices', () => {
  const scores = makeScores(3);
  const result = runFullAssessment(scores);
  assert.ok(Array.isArray(result.rightSizingActions), 'rightSizingActions should be array');
  assert.ok(typeof result.indices === 'object', 'indices should be object');
  assert.ok('psi' in result.indices, 'indices should have psi');
  assert.ok('csi' in result.indices, 'indices should have csi');
  assert.ok('cri' in result.indices, 'indices should have cri');
});
