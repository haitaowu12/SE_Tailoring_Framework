/**
 * SE Tailoring Framework Test Suite
 * Tests the max-tier + corroboration algorithm and right-sizing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  runFullAssessment,
  calculateSATier,
  calculateProcessDerivation,
  getDriverAttribution,
  applyOverrides,
  computePSI,
  computeCSI,
  computeCRI,
  applyRightSizing,
  checkConsistency
} from '../src/utils/assessment-engine.js';
import { CONSISTENCY_RULES, PROPAGATION_RULES, METRIC_PROCESS_MAP } from '../src/data/se-tailoring-data.js';
import { buildExportConfig, validateConfig, normalizeImportedConfig } from '../src/utils/export-import.js';
import { getReportReadiness } from '../src/views/report.js';

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

test('single uncorroborated high metric caps default recommendation at Standard', () => {
  const scores = makeScores(1);
  Object.assign(scores, {
    M1: 5,
    M4: 1,
    M11: 1,
    M2: 1
  });

  const detail = calculateProcessDerivation(23, scores);

  assert.equal(detail.level, 'standard', 'Thin Comprehensive trigger should default to Standard');
  assert.equal(detail.triggerScore, 5);
  assert.equal(detail.confidence, 'available-with-justification');
});

test('primary Comprehensive plus secondary Standard corroborates Comprehensive', () => {
  const scores = makeScores(1);
  Object.assign(scores, {
    M1: 5,
    M2: 3
  });

  const detail = calculateProcessDerivation(23, scores);

  assert.equal(detail.level, 'comprehensive');
  assert.equal(detail.confidence, 'corroborated');
});

test('secondary-only Comprehensive trigger does not bypass corroboration', () => {
  const scores = makeScores(1);
  Object.assign(scores, {
    M1: 5
  });

  const detail = calculateProcessDerivation(12, scores);

  assert.equal(detail.level, 'standard');
  assert.equal(detail.weightedReferenceLevel, undefined, 'Weighted reference removed');
});

test('trigger metric ties are deterministic across applicable metrics', () => {
  const scores = makeScores(1);
  Object.assign(scores, { M1: 5, M4: 5, M12: 1 });

  const detail = calculateProcessDerivation(9, scores);

  assert.deepEqual(detail.triggerMetrics, ['M1', 'M4']);
});

test('process-specific safety overrides apply M5=4 floors', () => {
  const levels = makeCoreLevels('basic');
  const scores = makeScores(1);
  scores.M5 = 4;  // Safety-Critical

  const result = applyOverrides(levels, scores, {});

  for (const pid of [12, 16, 19, 20, 25, 27]) {
    assert.equal(result.levels[pid], 'standard', `Process ${pid} should be Standard for M5=4`);
  }
});

test('SA floor integration makes M5=5 safety processes Comprehensive', () => {
  const scores = makeScores(1);
  scores.M5 = 5;

  const result = runFullAssessment(scores);

  assert.equal(result.saTier?.tier, 'III');
  assert.equal(result.saTier?.floor, 'comprehensive');

  for (const pid of [12, 16, 19, 20, 25, 27]) {
    assert.equal(result.levels[pid], 'comprehensive', `Safety process P${pid} should be Comprehensive for M5=5`);
    assert.equal(result.confidence[pid], 'floor-applied', `Process ${pid} should show floor-applied evidence status`);
  }
});

test('M5=3 safety tier names the safety consideration without implying negligible impact', () => {
  const scores = makeScores(1);
  scores.M5 = 3;

  const tier = calculateSATier(scores);

  assert.equal(tier.tier, 'I');
  assert.equal(tier.floor, null);
  assert.doesNotMatch(tier.name, /negligible/i);
  assert.match(tier.description, /no safety assurance floor/i);
});

test('metric-corroborated Comprehensive keeps corroborated evidence status', () => {
  const scores = makeScores(1);
  Object.assign(scores, {
    M1: 5,
    M2: 3,
    M4: 5,
    M11: 3,
    M16: 5
  });

  const result = runFullAssessment(scores);

  assert.equal(result.levels[23], 'comprehensive');
  assert.equal(result.confidence[23], 'corroborated');
});

test('consistency baseline matches canonical rule catalog and Rule 12 HC fix elevates planning conservatively', () => {
  const scores = makeScores(1);
  scores.M5 = 5;

  const result = runFullAssessment(scores);

  assert.equal(CONSISTENCY_RULES.length, 21);
  assert.ok(result.fixes.some(f => f.processId === 9 && f.to === 'standard' && f.ruleId === '8a'));
  assert.ok(['standard', 'comprehensive'].includes(result.levels[9]));
  assert.equal(result.violations.filter(v => v.type === 'HC').length, 0);
});

test('canonical propagation catalog contains P1..P21 including split rules', () => {
  assert.equal(PROPAGATION_RULES.length, 22);
  assert.ok(PROPAGATION_RULES.some(r => r.id === 'P1'));
  assert.ok(PROPAGATION_RULES.some(r => r.id === 'P8a'));
  assert.ok(PROPAGATION_RULES.some(r => r.id === 'P8b'));
  assert.ok(PROPAGATION_RULES.some(r => r.id === 'P21'));
});

test('process-metric mappings match canonical paper matrix with M9/M10 direct inflation removed', () => {
  const scores = makeScores(3);

  // Project Planning (9): M1, M4, M12 (P); M13 (S) — M9/M10 removed
  const d9 = Object.fromEntries(getDriverAttribution(9, scores).map(d => [d.metric, d.role]));
  assert.equal(d9.M1, 'P', 'M1 should be Primary for Project Planning');
  assert.equal(d9.M4, 'P', 'M4 should be Primary for Project Planning');
  assert.equal(d9.M12, 'P', 'M12 should be Primary for Project Planning');
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

  const d13 = Object.fromEntries(getDriverAttribution(13, scores).map(d => [d.metric, d.role]));
  assert.equal(d13.M4, 'P', 'M4 should be Primary for Configuration Management');
  assert.equal(d13.M1, 'S', 'M1 should be Secondary for Configuration Management');

  const d14 = Object.fromEntries(getDriverAttribution(14, scores).map(d => [d.metric, d.role]));
  assert.equal(d14.M2, 'S', 'M2 should be Secondary for Information Management');
  assert.equal(d14.M15, undefined);

  const d16 = Object.fromEntries(getDriverAttribution(16, scores).map(d => [d.metric, d.role]));
  assert.equal(d16.M6, 'P', 'M6 should be Primary for Quality Assurance');
  assert.equal(d16.M3, 'S', 'M3 should be Secondary for Quality Assurance');

  const d18 = Object.fromEntries(getDriverAttribution(18, scores).map(d => [d.metric, d.role]));
  assert.equal(d18.M15, 'P', 'M15 should be Primary for Stakeholder Needs');
  assert.equal(d18.M5, 'S', 'M5 should be Secondary for Stakeholder Needs');

  // Measurement (15): M6, M8 (P); M14 (S) — M9/M10/M15 removed
  const d15 = Object.fromEntries(getDriverAttribution(15, scores).map(d => [d.metric, d.role]));
  assert.equal(d15.M6, 'P', 'M6 should be Primary for Measurement');
  assert.equal(d15.M8, 'P', 'M8 should be Primary for Measurement');
  assert.equal(d15.M9, undefined, 'M9 should NOT drive Measurement');
  assert.equal(d15.M10, undefined, 'M10 should NOT drive Measurement');

  const d19 = Object.fromEntries(getDriverAttribution(19, scores).map(d => [d.metric, d.role]));
  assert.equal(d19.M5, 'P', 'M5 should be Primary for System Requirements');
  assert.equal(d19.M3, 'S', 'M3 should be Secondary for System Requirements');

  const d20 = Object.fromEntries(getDriverAttribution(20, scores).map(d => [d.metric, d.role]));
  assert.equal(d20.M4, 'P', 'M4 should be Primary for Architecture');

  const d21 = Object.fromEntries(getDriverAttribution(21, scores).map(d => [d.metric, d.role]));
  assert.equal(d21.M2, 'P', 'M2 should be Primary for Design');

  // Implementation (23): M1, M4, M11 (P); M2 (S) — M9/M10 removed
  const d23 = Object.fromEntries(getDriverAttribution(23, scores).map(d => [d.metric, d.role]));
  assert.equal(d23.M5, undefined);
  assert.equal(d23.M8, undefined);
  assert.equal(d23.M2, 'S', 'M2 should be Secondary for Implementation');
  assert.equal(d23.M9, undefined, 'M9 should NOT drive Implementation');
  assert.equal(d23.M10, undefined, 'M10 should NOT drive Implementation');

  const d24 = Object.fromEntries(getDriverAttribution(24, scores).map(d => [d.metric, d.role]));
  assert.equal(d24.M1, 'S', 'M1 should be Secondary for Integration');

  const d25 = Object.fromEntries(getDriverAttribution(25, scores).map(d => [d.metric, d.role]));
  assert.equal(d25.M1, 'S', 'M1 should be Secondary for Verification');

  // Transition (26): M6, M12, M13 (P); M15 (S) — M9/M10/M16 removed
  const d26 = Object.fromEntries(getDriverAttribution(26, scores).map(d => [d.metric, d.role]));
  assert.equal(d26.M5, undefined);
  assert.equal(d26.M13, 'P', 'M13 should be Primary for Transition');
  assert.equal(d26.M4, undefined);
  assert.equal(d26.M9, undefined, 'M9 should NOT drive Transition');
  assert.equal(d26.M16, undefined, 'M16 should NOT drive Transition');

  for (const [processId, mapping] of Object.entries(METRIC_PROCESS_MAP)) {
    assert.equal(mapping.M16, undefined, `M16 should not directly drive process ${processId}`);
  }

  // Maintenance (29): M5, M6, M7 (P); M4, M11 (S) — M10 removed
  const d29 = Object.fromEntries(getDriverAttribution(29, scores).map(d => [d.metric, d.role]));
  assert.equal(d29.M6, 'P');
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

test('config validation rejects unknown metrics, unknown processes, and malformed fields', () => {
  const maliciousConfig = {
    _format: 'se-tailoring-config',
    projectInfo: [],
    metricScores: { M1: 3, M99: 5 },
    processLevels: { 9: 'basic', 999: 'comprehensive' },
    overrides: {}
  };

  const validation = validateConfig(maliciousConfig);

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes('projectInfo must be an object'));
  assert.ok(validation.errors.includes('Unknown metric id: M99'));
  assert.ok(validation.errors.includes('Unknown process id: 999'));
  assert.ok(validation.errors.includes('overrides must be an array'));
});

test('export config preserves report-critical assessment state for round trip', () => {
  const config = buildExportConfig({
    projectInfo: { name: 'Stakeholder demo' },
    scores: { M1: 3 },
    saResponses: { safetyCaseRequired: true },
    levels: { 9: 'basic' },
    derived: { 9: 'standard' },
    derivationDetails: { 9: { triggerMetrics: ['M1'] } },
    overrides: [{ processId: 9, from: 'basic', to: 'standard', reason: 'demo floor' }],
    violations: [{ ruleId: 16, affectedProcess: 15, currentLevel: 'basic', requiredLevel: 'standard' }],
    fixes: [{ processId: 15, from: 'basic', to: 'standard' }],
    rightSizingActions: [{ processId: 9, from: 'comprehensive', to: 'standard' }],
    adoptionRisks: [{ processId: 25, level: 'comprehensive', severity: 'high' }],
    manualAdjustments: {},
    tradeoffs: [],
    matrixMap: null,
    assessmentTree: null,
    cultureType: 'balanced',
    saTier: { tier: 'II', floor: 'standard' },
    indices: { psi: 3, csi: 4, cri: 2 },
    confidence: { 9: 'floor-applied' },
    assessmentComplete: true,
    deliverablesChecked: ['9-basic-0'],
    notes: 'demo'
  });

  assert.equal(config._version, '1.1');
  assert.equal(config.saResponses.safetyCaseRequired, true);
  assert.equal(config.violations.length, 1);
  assert.equal(config.fixes.length, 1);
  assert.equal(config.rightSizingActions.length, 1);
  assert.equal(config.adoptionRisks.length, 1);
  assert.equal(config.saTier.tier, 'II');
  assert.equal(config.indices.csi, 4);
  assert.equal(config.confidence[9], 'floor-applied');
  assert.deepEqual(config.deliverablesChecked, ['9-basic-0']);
  assert.equal(config.assessmentComplete, true);
  assert.equal(validateConfig(config).valid, true);
});

test('legacy imports hydrate the default element so complete reports stay reviewable', () => {
  const config = {
    _format: 'se-tailoring-config',
    projectInfo: { name: 'Legacy import' },
    metricScores: makeScores(3),
    processLevels: Object.fromEntries(Array.from({ length: 22 }, (_, index) => [index + 9, 'standard'])),
    derivedLevels: Object.fromEntries(Array.from({ length: 22 }, (_, index) => [index + 9, 'standard'])),
    assessmentComplete: true
  };

  const state = normalizeImportedConfig(config);

  assert.equal(state.assessmentTree.nodes.default.assessmentResult.levels[9], 'standard');
  assert.equal(state.assessmentTree.nodes.default.status, 'under_review');
  assert.deepEqual(state.assessmentTree.nodes.default.scores, config.metricScores);
  assert.equal(getReportReadiness(state), 'Ready for review');
});

test('legacy top-level manual adjustments migrate into the default element and final levels', () => {
  const config = {
    _format: 'se-tailoring-config',
    metricScores: makeScores(3),
    processLevels: { 9: 'standard' },
    manualAdjustments: {
      9: { level: 'comprehensive', justification: 'Stakeholder-directed rigor' },
      10: { to: 'basic', justification: 'Legacy schema' }
    },
    assessmentComplete: true
  };

  const state = normalizeImportedConfig(config);

  assert.equal(state.levels[9], 'comprehensive');
  assert.equal(state.levels[10], 'basic');
  assert.equal(state.assessmentTree.nodes.default.manualAdjustments[9].level, 'comprehensive');
  assert.equal(state.assessmentTree.nodes.default.manualAdjustments[10].level, 'basic');
  assert.equal(state.assessmentTree.nodes.default.manualAdjustments[9].justification, 'Stakeholder-directed rigor');
});

test('config validation rejects malformed nested assessment tree and review records', () => {
  const config = {
    _format: 'se-tailoring-config',
    metricScores: { M1: 3 },
    processLevels: { 9: 'basic' },
    overrides: [{ processId: 999, from: 'basic', to: 'unsafe' }],
    fixes: [{ processId: 15, from: 'bad', to: 'standard' }],
    violations: [{ affectedProcess: 15, currentLevel: 'basic', requiredLevel: 'bad' }],
    deliverablesChecked: [{ bad: true }],
    assessmentTree: {
      rootId: 'root',
      activeId: 'missing',
      nodes: {
        root: {
          id: 'root',
          name: '<script>',
          childIds: ['child'],
          assessmentType: 'unknown',
          status: 'draft',
          scores: { M99: 4 }
        }
      }
    }
  };

  const validation = validateConfig(config);

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes('assessmentTree activeId must reference an existing node'));
  assert.ok(validation.errors.includes('assessmentTree node root has invalid assessmentType'));
  assert.ok(validation.errors.includes('assessmentTree node root has unknown metric M99'));
  assert.ok(validation.errors.includes('overrides[0] has invalid processId'));
  assert.ok(validation.errors.includes('overrides[0] has invalid to level'));
  assert.ok(validation.errors.includes('deliverablesChecked must contain short string keys'));
});

test('config validation rejects import payloads that could poison rendered classes or element state', () => {
  const config = {
    _format: 'se-tailoring-config',
    metricScores: { M1: 3 },
    processLevels: { 9: 'basic' },
    matrixMap: {
      9: {
        M1: 'P onmouseover=alert(1)',
        M99: 'P'
      }
    },
    saTier: {
      tier: 'III onclick=alert(1)',
      name: 'Safety',
      description: 'Bad tier class injection',
      floor: 'unsafe',
      score: 6
    },
    manualAdjustments: {
      9: {
        level: 'unsafe',
        justification: 123
      }
    },
    assessmentTree: {
      rootId: 'root',
      activeId: 'root',
      nodes: {
        root: {
          id: 'root',
          name: 'Root',
          childIds: ['missing'],
          assessmentType: 'full',
          status: 'draft',
          scores: { M1: 3 },
          levels: { 9: 'basic' },
          manualAdjustments: {
            9: { level: 'bad', justification: [] }
          }
        }
      }
    }
  };

  const validation = validateConfig(config);

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes('matrixMap[9][M1] must be P or S'));
  assert.ok(validation.errors.includes('matrixMap[9] has unknown metric id: M99'));
  assert.ok(validation.errors.includes('saTier has invalid tier'));
  assert.ok(validation.errors.includes('saTier has invalid floor'));
  assert.ok(validation.errors.includes('saTier has invalid score'));
  assert.ok(validation.errors.includes('manualAdjustments[9] has invalid level'));
  assert.ok(validation.errors.includes('manualAdjustments[9] justification must be a string'));
  assert.ok(validation.errors.includes('assessmentTree node root references missing child missing'));
  assert.ok(validation.errors.includes('assessmentTree node root manualAdjustments[9] has invalid level'));
});

test('report readiness requires adoption gaps and weak evidence statuses to be reviewed', () => {
  assert.equal(getReportReadiness({
    assessmentComplete: true,
    assessmentTree: {
      nodes: {
        default: { assessmentResult: {} }
      }
    },
    violations: [],
    adoptionRisks: [],
    confidence: { 9: 'high' }
  }), 'Ready for review');

  assert.equal(getReportReadiness({
    assessmentComplete: true,
    assessmentTree: {
      nodes: {
        default: { assessmentResult: {} },
        child: { assessmentResult: null }
      }
    },
    violations: [],
    adoptionRisks: [],
    confidence: { 9: 'high' }
  }), 'Draft / incomplete');

  assert.equal(getReportReadiness({
    assessmentComplete: true,
    assessmentTree: {
      nodes: {
        default: { assessmentResult: {} }
      }
    },
    violations: [],
    adoptionRisks: [{ processId: 25, level: 'comprehensive' }],
    confidence: { 9: 'high' }
  }), 'Review required');

  assert.equal(getReportReadiness({
    assessmentComplete: true,
    assessmentTree: {
      nodes: {
        default: { assessmentResult: {} }
      }
    },
    violations: [],
    adoptionRisks: [],
    confidence: { 9: 'available-with-justification' }
  }), 'Review required');
});

test('override baseline includes paper O14/O16/O18/O21/O23-O26 floors', () => {
  const levels = makeCoreLevels('basic');

  const m8Result = applyOverrides(levels, { ...makeScores(1), M8: 4 }, {});
  assert.equal(m8Result.levels[16], 'standard', 'M8>=4 should floor QA to Standard');

  const m3Result = applyOverrides(levels, { ...makeScores(1), M3: 4 }, {});
  assert.equal(m3Result.levels[11], 'standard', 'M3>=4 should floor Decision Management to Standard');
  assert.equal(m3Result.levels[25], 'standard', 'M3>=4 should floor Verification to Standard');

  const m7Result = applyOverrides(levels, { ...makeScores(1), M7: 5 }, {});
  for (const pid of [13, 14, 21, 28, 29, 30]) {
    assert.equal(m7Result.levels[pid], 'standard', `M7=5 should floor process ${pid} to Standard`);
  }
});

test('Rules 16 and 17 become hard constraints in critical evidence contexts', () => {
  const levels = makeCoreLevels('basic');
  levels[20] = 'comprehensive';
  levels[15] = 'basic';
  levels[16] = 'basic';

  const warnings = checkConsistency(levels, { ...makeScores(1), M5: 1, M6: 1, M8: 1 });
  assert.equal(warnings.find(v => v.ruleId === 16)?.type, 'WN');
  assert.equal(warnings.find(v => v.ruleId === 17)?.type, 'WN');

  const hardConstraints = checkConsistency(levels, { ...makeScores(1), M5: 4 });
  assert.equal(hardConstraints.find(v => v.ruleId === 16)?.type, 'HC');
  assert.equal(hardConstraints.find(v => v.ruleId === 17)?.type, 'HC');
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

test('CRI=1 preserves required rigor and flags adoption readiness gaps', () => {
  const scores = makeScores(5);
  scores.M16 = 1; // Resistant org
  scores.M5 = 1;  // No safety override
  const result = runFullAssessment(scores);

  assert.ok(result.indices.cri === 1, 'CRI should be 1');
  assert.ok(
    Object.values(result.levels).some(level => level === 'comprehensive'),
    'Low readiness must not downgrade technically required Comprehensive rigor'
  );
  assert.ok(
    result.rightSizingActions.every(action => action.type !== 'capability_ceiling'),
    'CRI should not create capability-ceiling downgrades'
  );
  assert.ok(result.adoptionRisks.length > 0, 'Low readiness should flag adoption support needs');
  assert.ok(
    result.adoptionRisks.some(risk => risk.level === 'comprehensive' && risk.severity === 'high'),
    'Comprehensive rigor in resistant cultures should be a high-severity adoption gap'
  );
});

test('Small project (PSI=1) enforces rigor budget on Comprehensive count', () => {
  const scores = makeScores(5); // All 5s → everything Comprehensive
  scores.M1 = 1; scores.M2 = 1; scores.M4 = 1; // PSI=1 (small)
  scores.M11 = 1; scores.M12 = 1;
  scores.M5 = 1; scores.M6 = 1; scores.M7 = 1; scores.M8 = 1; // no criticality floors
  scores.M16 = 5; // CRI=3 (supportive adoption posture)
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
  assert.ok(Array.isArray(result.adoptionRisks), 'adoptionRisks should be array');
  assert.ok(typeof result.indices === 'object', 'indices should be object');
  assert.ok('psi' in result.indices, 'indices should have psi');
  assert.ok('csi' in result.indices, 'indices should have csi');
  assert.ok('cri' in result.indices, 'indices should have cri');
});
