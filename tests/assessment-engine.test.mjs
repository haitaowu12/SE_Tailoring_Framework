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
  deriveCSIResponseRequirement,
  computeCRI,
  applyRightSizing,
  checkConsistency,
  applyMandatoryClosure,
  previewDirectConsequences
} from '../src/utils/assessment-engine.js';
import { CONSISTENCY_RULES, PROPAGATION_RULES, ACTIVE_CONSISTENCY_RULES, ACTIVE_PROPAGATION_RULES, CONSISTENCY_RULE_MIGRATION, PROPAGATION_RULE_MIGRATION, METRIC_PROCESS_MAP } from '../src/data/se-tailoring-data.js';
import { buildExportConfig, validateConfig, normalizeImportedConfig } from '../src/utils/export-import.js';
import { evaluateBaselineEligibility } from '../src/utils/assessment-integrity.js';
import { PUBLICATION_CASES, PUBLICATION_CASE_FIXTURE_VERSION } from './fixtures/publication-cases.mjs';
import { CRITICALITY_DERIVATION_SCENARIOS } from './fixtures/criticality-derivation-scenarios.mjs';

const METRIC_IDS = [
  'M1', 'M2', 'M3', 'M4',
  'M5', 'M6', 'M7', 'M8',
  'M9', 'M10', 'M11', 'M12',
  'M13', 'M14', 'M15', 'M16'
];

function makeScores(defaultValue = 1) {
  return Object.fromEntries(METRIC_IDS.map(id => [id, defaultValue]));
}

function makeMetricAssessments(scores, overrides = {}) {
  return Object.fromEntries(METRIC_IDS.map(id => [id, {
    score: scores[id],
    status: 'assessed',
    definitionVersion: 3,
    qualifiers: [],
    rationale: 'Explicit test judgment',
    evidenceRefs: [],
    ...(overrides[id] || {})
  }]));
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
  assert.equal(detail.triggerLevel, 'comprehensive', 'Trigger tier must remain visible after the default recommendation is capped');
  assert.equal(detail.confidence, 'available-with-justification');
  assert.equal(runFullAssessment(scores).confidence[23], 'available-with-justification', 'Final reporting must preserve the governed Comprehensive option');
});

test(`legacy publication case fixtures remain frozen migration evidence (${PUBLICATION_CASE_FIXTURE_VERSION})`, () => {
  for (const [caseId, fixture] of Object.entries(PUBLICATION_CASES)) {
    assert.equal(fixture.definitionSet, 'se-tailoring-m1-m16-v1', `${caseId} must remain tagged with legacy definitions`);
    assert.equal(fixture.migrationStatus, 'reassessment-required');
    assert.equal(Object.keys(fixture.scores).length, 16);
    assert.equal(Object.values(fixture.expected).flat().length, 22);
  }
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
    const floor = result.activeFloors.find(active => active.processId === pid && active.overrideId === `safety_critical_${({ 12: 'risk', 16: 'qa', 19: 'requirements', 20: 'architecture', 25: 'verification', 27: 'validation' })[pid]}`);
    assert.equal(floor?.status, 'elevated', `Process ${pid} should expose the active safety floor provenance`);
  }
});

test('M5=5 safety processes derive Comprehensive without duplicate floor events', () => {
  const scores = makeScores(1);
  scores.M5 = 5;

  const result = runFullAssessment(scores);

  assert.equal(result.saTier?.tier, 'III');
  assert.equal(result.saTier?.floor, 'comprehensive');

  for (const pid of [12, 16, 19, 20, 25, 27]) {
    assert.equal(result.levels[pid], 'comprehensive', `Safety process P${pid} should be Comprehensive for M5=5`);
    assert.equal(result.confidence[pid], 'corroborated', `Process ${pid} should preserve metric-derived evidence status`);
    assert.equal(result.overrides.filter(override => override.processId === pid).length, 0, `Process ${pid} should not record a non-causal duplicate floor event`);
    assert.ok(
      result.activeFloors.some(floor => floor.processId === pid && floor.minLevel === 'comprehensive' && floor.status === 'satisfied'),
      `Process ${pid} should still expose its already-satisfied Comprehensive floor`
    );
  }
});

test('M5/M7 score-5 direct derivation remains distinct from named floor families', () => {
  for (const scenario of CRITICALITY_DERIVATION_SCENARIOS) {
    const scores = makeScores(1);
    scores[scenario.metricId] = scenario.triggerScore;

    const mappedProcesses = Object.entries(METRIC_PROCESS_MAP)
      .filter(([, metricMap]) => metricMap[scenario.metricId] === 'P' || metricMap[scenario.metricId] === 'S')
      .map(([processId]) => Number(processId))
      .sort((a, b) => a - b);
    assert.deepEqual(mappedProcesses, scenario.directComprehensiveProcesses, `${scenario.id}: fixture must track the canonical mapping`);

    const directlyComprehensive = mappedProcesses.filter(processId =>
      calculateProcessDerivation(processId, scores).level === 'comprehensive'
    );
    assert.deepEqual(directlyComprehensive, scenario.directComprehensiveProcesses, `${scenario.id}: every mapped process must retain direct score-5 derivation`);

    const floorResult = applyOverrides(makeCoreLevels('basic'), scores, {});
    const namedFloors = floorResult.activeFloors
      .filter(floor => floor.triggerMetric === scenario.metricId)
      .map(floor => floor.processId)
      .sort((a, b) => a - b);
    assert.deepEqual(namedFloors, scenario.namedFloorProcesses, `${scenario.id}: named floor family must remain independently scoped`);
    assert.ok(
      floorResult.activeFloors
        .filter(floor => floor.triggerMetric === scenario.metricId)
        .every(floor => floor.minLevel === scenario.namedFloorLevel),
      `${scenario.id}: named floor level must remain unchanged`
    );
    assert.ok(scenario.studyQuestions.length >= 2, `${scenario.id}: future validation hook must retain supportive and counterexample questions`);
  }
});

test('M5/M7 criticality exception activates only at the score-5 boundary', () => {
  for (const scenario of CRITICALITY_DERIVATION_SCENARIOS) {
    const boundaryScores = makeScores(1);
    boundaryScores[scenario.metricId] = scenario.boundaryScore;
    const triggerScores = makeScores(1);
    triggerScores[scenario.metricId] = scenario.triggerScore;

    for (const processId of scenario.directComprehensiveProcesses) {
      assert.notEqual(calculateProcessDerivation(processId, boundaryScores).level, 'comprehensive', `${scenario.id}: score 4 must not use the independently-sufficient exception`);
      const triggered = calculateProcessDerivation(processId, triggerScores);
      assert.equal(triggered.level, 'comprehensive', `${scenario.id}: score 5 must retain the independently-sufficient exception`);
      assert.equal(triggered.confidence, 'corroborated', `${scenario.id}: current evidence-status contract must remain stable`);
    }
  }
});

test('M7 reports direct Comprehensive derivation and floor-only Standard elevations separately', () => {
  const scores = makeScores(1);
  scores.M7 = 5;
  const result = runFullAssessment(scores);

  for (const processId of [28, 29, 30]) {
    assert.equal(result.derived[processId], 'comprehensive', `P${processId} must remain directly derived from mapped M7`);
    assert.equal(result.confidence[processId], 'corroborated', `P${processId} must retain metric-derived evidence status`);
    assert.ok(result.activeFloors.some(floor =>
      floor.processId === processId && floor.triggerMetric === 'M7' && floor.status === 'satisfied'
    ), `P${processId} must report the separate environmental floor as already satisfied`);
    assert.ok(!result.overrides.some(override => override.processId === processId && override.triggerMetric === 'M7'), `P${processId} must not report a non-causal floor elevation`);
  }

  for (const processId of [13, 14, 21]) {
    assert.equal(result.derived[processId], 'basic', `P${processId} is floor-only and must not manufacture an M7 mapping`);
    assert.equal(result.levels[processId], 'standard', `P${processId} must retain its named environmental Standard floor`);
    assert.ok(result.overrides.some(override =>
      override.processId === processId && override.triggerMetric === 'M7' && override.status === 'elevated'
    ), `P${processId} must report a causal floor elevation`);
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

test('active consistency baseline retires duplicate/vacuous identifiers and Rule 12 elevates planning conservatively', () => {
  const scores = makeScores(1);
  scores.M5 = 5;

  const result = runFullAssessment(scores);

  assert.equal(CONSISTENCY_RULES.length, 21, 'legacy catalog remains importable');
  assert.equal(ACTIVE_CONSISTENCY_RULES.length, 17);
  assert.ok(CONSISTENCY_RULE_MIGRATION.some(entry => entry.legacyId === '8a' && entry.replacementId === 12));
  assert.ok(CONSISTENCY_RULE_MIGRATION.some(entry => entry.legacyId === 13 && entry.disposition === 'retired-non-monotone'));
  assert.ok(result.fixes.some(f => f.processId === 9 && f.to === 'standard' && f.ruleId === 12));
  assert.ok(['standard', 'comprehensive'].includes(result.levels[9]));
  assert.equal(result.violations.filter(v => v.type === 'HC').length, 0);
});

test('active consistency rules contain no duplicate semantics or vacuous Basic floors', () => {
  const signatures = ACTIVE_CONSISTENCY_RULES.map(rule => JSON.stringify({
    trigger: rule.trigger,
    required: rule.required
  }));
  assert.equal(new Set(signatures).size, signatures.length);
  assert.ok(ACTIVE_CONSISTENCY_RULES.every(rule => rule.required.level !== 'basic'));
  assert.ok(ACTIVE_CONSISTENCY_RULES.every(rule => rule.provenance?.evidenceMaturity === 'design-rationale'));
  assert.ok(ACTIVE_CONSISTENCY_RULES.every(rule => rule.provenance?.expertReviewStatus === 'pending-structured-review'));
});

test('active direct-consequence catalog excludes retired duplicate/vacuous mappings', () => {
  assert.equal(PROPAGATION_RULES.length, 22);
  assert.equal(ACTIVE_PROPAGATION_RULES.length, 18);
  assert.ok(PROPAGATION_RULES.some(r => r.id === 'P1'));
  assert.ok(!ACTIVE_PROPAGATION_RULES.some(r => r.id === 'P8a'));
  assert.ok(!ACTIVE_PROPAGATION_RULES.some(r => r.id === 'P14'));
  assert.ok(PROPAGATION_RULES.some(r => r.id === 'P8b'));
  assert.ok(PROPAGATION_RULES.some(r => r.id === 'P21'));
  assert.ok(PROPAGATION_RULE_MIGRATION.some(entry => entry.legacyId === 'P14' && entry.disposition === 'retired-non-monotone'));
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

  // Decision Management (11): mission and general governance remain direct; security is not an unconditional driver
  const d11 = Object.fromEntries(getDriverAttribution(11, scores).map(d => [d.metric, d.role]));
  assert.equal(d11.M5, undefined);
  assert.equal(d11.M13, 'P', 'M13 should be Primary for Decision Management');
  assert.equal(d11.M15, 'P', 'M15 should be Primary for Decision Management');
  assert.equal(d11.M8, undefined, 'M8 security is not an unconditional Decision Management driver');

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
  assert.equal(d16.M6, undefined, 'Mission criticality no longer unconditionally drives Quality Assurance');
  assert.equal(d16.M3, 'S', 'M3 should be Secondary for Quality Assurance');

  const d18 = Object.fromEntries(getDriverAttribution(18, scores).map(d => [d.metric, d.role]));
  assert.equal(d18.M15, 'P', 'M15 should be Primary for Stakeholder Needs');
  assert.equal(d18.M5, 'S', 'M5 should be Secondary for Stakeholder Needs');

  // Measurement (15): mission consequence remains direct; security is not an unconditional driver
  const d15 = Object.fromEntries(getDriverAttribution(15, scores).map(d => [d.metric, d.role]));
  assert.equal(d15.M6, 'P', 'M6 should be Primary for Measurement');
  assert.equal(d15.M8, undefined, 'M8 security should not unconditionally drive Measurement');
  assert.equal(d15.M9, undefined, 'M9 should NOT drive Measurement');
  assert.equal(d15.M10, undefined, 'M10 should NOT drive Measurement');

  const d19 = Object.fromEntries(getDriverAttribution(19, scores).map(d => [d.metric, d.role]));
  assert.equal(d19.M5, 'P', 'M5 should be Primary for System Requirements');
  assert.equal(d19.M3, 'S', 'M3 should be Secondary for System Requirements');

  const d20 = Object.fromEntries(getDriverAttribution(20, scores).map(d => [d.metric, d.role]));
  assert.equal(d20.M4, 'P', 'M4 should be Primary for Architecture');

  const d21 = Object.fromEntries(getDriverAttribution(21, scores).map(d => [d.metric, d.role]));
  assert.equal(d21.M2, 'P', 'M2 should be Primary for Design');

  const d22 = Object.fromEntries(getDriverAttribution(22, scores).map(d => [d.metric, d.role]));
  assert.equal(d22.M6, 'P', 'M6 should be Primary for System Analysis in paper, practical matrix, and app');

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
  const scores = makeScores(3);
  const config = buildExportConfig({
    projectInfo: { name: 'Stakeholder demo' },
    scores,
    metricAssessments: makeMetricAssessments(scores),
    saResponses: { safetyCaseRequired: true },
    levels: { 9: 'basic' },
    derived: { 9: 'standard' },
    derivationDetails: { 9: { triggerMetrics: ['M1'] } },
    overrides: [{ processId: 9, from: 'basic', to: 'standard', reason: 'demo floor' }],
    violations: [{ ruleId: 16, type: 'WN', affectedProcess: 15, currentLevel: 'basic', requiredLevel: 'standard' }],
    ruleDispositions: {
      16: {
        ruleId: 16,
        outcome: 'accept-current',
        rationale: 'Measurement support is provided through the parent programme controls.',
        ownerApprover: 'Chief Engineer',
        evidenceRef: 'MEAS-DEC-16',
        reviewDate: '2099-12-31'
      }
    },
    fixes: [{ processId: 15, from: 'basic', to: 'standard' }],
    rightSizingActions: [{ processId: 9, from: 'comprehensive', to: 'standard' }],
    budgetStatus: { withinBudget: false, comprehensiveExcess: 1, standardExcess: 0 },
    adoptionRisks: [{ processId: 25, level: 'comprehensive', severity: 'high' }],
    manualAdjustments: {},
    tradeoffs: [],
    matrixMap: null,
    assessmentTree: null,
    saTier: { tier: 'II', floor: 'standard' },
    indices: { psi: 3, csi: 4, cri: 2 },
    confidence: { 9: 'floor-applied' },
    assessmentComplete: true,
    deliverablesChecked: ['9-basic-0'],
    notes: 'demo'
  });

  assert.equal(config._version, '2.0');
  assert.equal(config.semantics.frameworkVersion, '4.1.1');
  assert.equal(config.semantics.metricDefinitionSet, 'se-tailoring-m1-m16-v3');
  assert.equal(config.saResponses.safetyCaseRequired, true);
  assert.equal(config.violations.length, 1);
  assert.equal(config.fixes.length, 1);
  assert.equal(config.rightSizingActions.length, 1);
  assert.equal(config.budgetStatus.withinBudget, false);
  assert.equal(config.adoptionRisks.length, 1);
  assert.equal(config.saTier.tier, 'II');
  assert.equal(config.indices.csi, 4);
  assert.equal(config.confidence[9], 'floor-applied');
  assert.equal(Object.hasOwn(config, 'deliverablesChecked'), false);
  assert.equal(config.assessmentComplete, true);
  assert.equal(validateConfig(config).valid, true);

  const normalized = normalizeImportedConfig(config);
  assert.equal(normalized.budgetStatus.withinBudget, false);
  assert.equal(Object.hasOwn(normalized, 'deliverablesChecked'), false);
});

test('legacy imports preserve results but require semantic reassessment before review', () => {
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
  assert.equal(state.assessmentComplete, false);
  assert.equal(state.semanticMigration.status, 'review-required');
  assert.equal(state.semanticMigration.preservedLegacyResult.processLevels[9], 'standard');
  assert.equal(state.scores.M6, undefined);
  assert.equal(state.scores.M8, undefined);
  assert.equal(state.scores.M15, undefined);
  assert.equal(state.metricAssessments.M8.status, 'migration-required');
  const eligibility = evaluateBaselineEligibility(state);
  assert.equal(eligibility.softwareChecksPassed, false);
  assert.equal(eligibility.gates.find(gate => gate.id === 'input-completeness').status, 'incomplete');
});

test('schema 2.0 round-trips security qualifiers and scoped assurance obligations', () => {
  const scores = makeScores(3);
  scores.M8 = 4;
  scores.M15 = 4;
  const sourceState = {
    projectInfo: { name: 'Semantic v4' },
    scores,
    metricAssessments: makeMetricAssessments(scores, {
      M8: { score: 4, status: 'assessed', definitionVersion: 3, qualifiers: ['integrity', 'availability'], evidenceRefs: ['SEC-1'] },
      M15: { score: 4, status: 'assessed', definitionVersion: 3, qualifiers: ['regulatory-mandate'], evidenceRefs: ['AO-1'] }
    }),
    assuranceObligations: [{ id: 'AO-1', type: 'regulatory-mandate', bindingStatus: 'confirmed', authority: 'Rail regulator', sourceRef: 'entry-to-service approval', processScope: [13, 14, 16, 25] }],
    levels: makeCoreLevels('standard'),
    assessmentComplete: true
  };
  const config = buildExportConfig(sourceState);
  assert.equal(validateConfig(config).valid, true);
  const normalized = normalizeImportedConfig(config);
  assert.deepEqual(normalized.metricAssessments.M8.qualifiers, ['integrity', 'availability']);
  assert.equal(normalized.assuranceObligations[0].sourceRef, 'entry-to-service approval');
  assert.equal(normalized.semanticMigration, null);
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

test('baseline eligibility reports separate software and external-authority gates', () => {
  const completeScores = makeScores(3);
  const completeAssessment = {
    assessmentComplete: true,
    scores: completeScores,
    metricAssessments: makeMetricAssessments(completeScores)
  };
  const completeNode = {
    assessmentResult: { violations: [] },
    scores: completeScores,
    metricAssessments: makeMetricAssessments(completeScores)
  };
  const eligible = evaluateBaselineEligibility({
    ...completeAssessment,
    assessmentTree: {
      nodes: {
        default: completeNode
      }
    },
    violations: [],
    adoptionRisks: [],
    confidence: { 9: 'high' }
  });
  assert.equal(eligible.softwareChecksPassed, true);
  assert.deepEqual(
    eligible.gates.map(gate => [gate.id, gate.status]),
    [
      ['input-completeness', 'passed'],
      ['rule-warning-disposition', 'passed'],
      ['evidence-completeness', 'not-implemented'],
      ['hierarchy-completeness', 'passed'],
      ['asserted-review', 'not-recorded'],
      ['authenticated-approval', 'not-available'],
      ['operational-release-authorization', 'not-available']
    ]
  );

  const incompleteHierarchy = evaluateBaselineEligibility({
    ...completeAssessment,
    assessmentTree: {
      nodes: {
        default: completeNode,
        child: { assessmentResult: null }
      }
    },
    violations: [],
    adoptionRisks: [],
    confidence: { 9: 'high' }
  });
  assert.equal(incompleteHierarchy.softwareChecksPassed, false);
  assert.equal(incompleteHierarchy.gates.find(gate => gate.id === 'hierarchy-completeness').status, 'incomplete');

  const incompleteInputs = evaluateBaselineEligibility({ ...completeAssessment, metricAssessments: {} });
  assert.equal(incompleteInputs.softwareChecksPassed, false);
  assert.equal(incompleteInputs.gates.find(gate => gate.id === 'input-completeness').status, 'incomplete');
});

test('override baseline separates security and source-backed binding assurance floors', () => {
  const levels = makeCoreLevels('basic');

  const m8Result = applyOverrides(levels, { ...makeScores(1), M8: 4 }, {});
  for (const pid of [12, 13, 14, 20, 25]) {
    assert.equal(m8Result.levels[pid], 'standard', `M8>=4 should floor security-relevant process ${pid}`);
  }
  assert.equal(m8Result.levels[16], 'basic', 'M8 security must not activate the binding-assurance QA floor');
  const m8Extreme = applyOverrides(levels, { ...makeScores(1), M8: 5 }, {});
  assert.equal(m8Extreme.levels[25], 'standard', 'M8=5 alone must not manufacture a Comprehensive life-safety floor');

  const politicalOnly = applyOverrides(levels, { ...makeScores(1), M15: 5 }, {
    assuranceObligations: [{ id: 'VIS-1', type: 'political-visibility', bindingStatus: 'confirmed', authority: 'Public', sourceRef: 'media', processScope: [13, 14, 16, 25] }]
  });
  assert.equal(politicalOnly.levels[16], 'basic', 'Political visibility must never trigger assurance floors');

  const binding = applyOverrides(levels, { ...makeScores(1), M15: 4 }, {
    assuranceObligations: [{ id: 'AO-1', type: 'regulatory-mandate', bindingStatus: 'confirmed', authority: 'Rail regulator', sourceRef: 'approval instrument', processScope: [13, 14, 16, 25] }]
  });
  for (const pid of [13, 14, 16, 25]) assert.equal(binding.levels[pid], 'standard');
  assert.ok(binding.overrides.every(override => override.obligationId === 'AO-1'));

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

test('M15 escalates Rules 16 and 17 only for the obligation-scoped support process', () => {
  const levels = makeCoreLevels('basic');
  levels[20] = 'comprehensive';
  const scores = { ...makeScores(1), M15: 4 };
  const obligation = processScope => ({
    assuranceObligations: [{
      id: 'AO-1', type: 'regulatory-mandate', bindingStatus: 'confirmed',
      authority: 'Acceptance authority', sourceRef: 'approval instrument', processScope
    }]
  });

  const unrelated = checkConsistency(levels, scores, obligation([13]));
  assert.equal(unrelated.find(v => v.ruleId === 16)?.type, 'WN');
  assert.equal(unrelated.find(v => v.ruleId === 17)?.type, 'WN');

  const measurementScoped = checkConsistency(levels, scores, obligation([15]));
  assert.equal(measurementScoped.find(v => v.ruleId === 16)?.type, 'HC');
  assert.equal(measurementScoped.find(v => v.ruleId === 17)?.type, 'WN');

  const qaScoped = checkConsistency(levels, scores, obligation([16]));
  assert.equal(qaScoped.find(v => v.ruleId === 16)?.type, 'WN');
  assert.equal(qaScoped.find(v => v.ruleId === 17)?.type, 'HC');
});

test('Rule 11 remains an advisory Verification-to-Validation review for the M2/M4 counterexample', () => {
  const scores = makeScores(1);
  scores.M2 = 5;
  scores.M4 = 5;

  const result = runFullAssessment(scores);
  assert.equal(result.derived[25], 'comprehensive', 'Corroborated M2/M4 should derive Comprehensive Verification');
  assert.equal(result.levels[25], 'comprehensive');
  assert.equal(result.derived[27], 'basic', 'No Validation driver is present in this counterexample');
  assert.equal(result.levels[27], 'basic', 'Advisory Rule 11 must not auto-elevate Validation');
  assert.ok(!result.fixes.some(fix => fix.ruleId === 11), 'Mandatory closure must not apply a Rule 11 fix');

  const warning = result.violations.find(violation => violation.ruleId === 11);
  assert.equal(warning?.type, 'WN');
  assert.equal(warning?.severity, 'warning');
  assert.equal(warning?.affectedProcess, 27);
  assert.equal(warning?.requiredLevel, 'standard');

  const previewLevels = makeCoreLevels('basic');
  const preview = previewDirectConsequences(25, 'comprehensive', previewLevels, scores);
  const rule11Preview = preview.find(change => change.ruleId === 11);
  assert.equal(rule11Preview?.type, 'recommended');
  assert.equal(rule11Preview?.processId, 27);
  assert.equal(rule11Preview?.to, 'standard');

  assert.equal(ACTIVE_CONSISTENCY_RULES.find(rule => rule.id === 11)?.type, 'WN', 'Rule 11 identifier must remain advisory');
  assert.equal(ACTIVE_PROPAGATION_RULES.find(rule => rule.id === 'P12')?.ruleId, 11, 'P12 identifier must continue to reference Rule 11');
  for (const hardRuleId of [1, 2, 3, 4, 6, 9, 10, 12, 18]) {
    assert.equal(ACTIVE_CONSISTENCY_RULES.find(rule => rule.id === hardRuleId)?.type, 'HC', `Rule ${hardRuleId} must remain hard`);
  }
});

test('mandatory closure reaches an idempotent fixed point with no hard violations', () => {
  const levels = makeCoreLevels('basic');
  levels[19] = 'comprehensive';
  levels[24] = 'comprehensive';
  const scores = makeScores(1);

  const first = applyMandatoryClosure(levels, scores);
  assert.equal(first.violations.filter(v => v.type === 'HC').length, 0);
  assert.equal(first.levels[9], 'standard');
  assert.equal(first.levels[13], 'standard');
  assert.equal(first.levels[25], 'standard');
  assert.equal(first.levels[27], 'standard');

  const second = applyMandatoryClosure(first.levels, scores);
  assert.deepEqual(second.levels, first.levels);
  assert.equal(second.fixes.length, 0);
});

test('mandatory closure is inflationary and idempotent across generated profiles', () => {
  const levels = ['basic', 'standard', 'comprehensive'];
  for (let seed = 0; seed < 128; seed += 1) {
    const profile = {};
    for (let pid = 9; pid <= 30; pid += 1) {
      profile[pid] = levels[(seed * (pid + 3) + pid * pid) % levels.length];
    }
    const scores = makeScores(1);
    if (seed % 2 === 1) scores.M5 = 4;
    if (seed % 3 === 0) scores.M6 = 4;
    if (seed % 5 === 0) scores.M8 = 4;

    const closed = applyMandatoryClosure(profile, scores);
    for (let pid = 9; pid <= 30; pid += 1) {
      assert.ok(
        levels.indexOf(closed.levels[pid]) >= levels.indexOf(profile[pid]),
        `seed ${seed}, process ${pid}: mandatory closure lowered rigor`
      );
    }
    assert.equal(closed.violations.filter(violation => violation.type === 'HC').length, 0, `seed ${seed}: hard violation remained`);
    const repeated = applyMandatoryClosure(closed.levels, scores);
    assert.deepEqual(repeated.levels, closed.levels, `seed ${seed}: closure was not idempotent`);
    assert.equal(repeated.fixes.length, 0, `seed ${seed}: repeated closure still changed the profile`);
  }
});

test('synthetic legacy-vector algorithm scenario attributes Comprehensive QA without claiming v4 case validity', () => {
  const scores = {
    M1: 4, M2: 4, M3: 3, M4: 5,
    M5: 5, M6: 5, M7: 2, M8: 4,
    M9: 4, M10: 3, M11: 3, M12: 4,
    M13: 4, M14: 3, M15: 4, M16: 3
  };
  const result = runFullAssessment(scores);
  assert.equal(result.derivationDetails[16].level, 'comprehensive');
  assert.equal(result.confidence[16], 'corroborated');
  assert.equal(result.overrides.filter(override => override.processId === 16).length, 0);
  assert.equal(result.confidence[30], 'available-with-justification');
});

test('retired Rule 13 and P14 no longer emit non-monotone advice while Rule 14 remains active', () => {
  const levels = makeCoreLevels('basic');
  assert.ok(!checkConsistency(levels).some(violation => violation.ruleId === 13));
  assert.ok(!previewDirectConsequences(12, 'basic', levels).some(change => change.ruleId === 13));

  levels[12] = 'comprehensive';
  const rule14 = checkConsistency(levels).find(violation => violation.ruleId === 14);
  assert.equal(rule14?.type, 'WN');
  assert.ok(previewDirectConsequences(12, 'comprehensive', levels).some(change => change.ruleId === 14));
});

test('direct preview and final checker share context-sensitive severity', () => {
  const levels = makeCoreLevels('basic');
  const normal = previewDirectConsequences(20, 'comprehensive', levels, makeScores(1));
  assert.equal(normal.find(change => change.ruleId === 16)?.type, 'recommended');
  assert.equal(normal.find(change => change.ruleId === 17)?.type, 'recommended');

  const criticalScores = { ...makeScores(1), M5: 4 };
  const critical = previewDirectConsequences(20, 'comprehensive', levels, criticalScores);
  assert.equal(critical.find(change => change.ruleId === 16)?.type, 'mandatory');
  assert.equal(critical.find(change => change.ruleId === 17)?.type, 'mandatory');

  const m15Scores = { ...makeScores(1), M15: 4 };
  const scopedContext = {
    assuranceObligations: [{
      id: 'AO-1', type: 'regulatory-mandate', bindingStatus: 'confirmed',
      authority: 'Acceptance authority', sourceRef: 'approval instrument', processScope: [15]
    }]
  };
  const scoped = previewDirectConsequences(20, 'comprehensive', levels, m15Scores, scopedContext);
  assert.equal(scoped.find(change => change.ruleId === 16)?.type, 'mandatory');
  assert.equal(scoped.find(change => change.ruleId === 17)?.type, 'recommended');
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

test('CSI computation uses max(M9, M10) and excludes M15 assurance demand', () => {
  const scores = makeScores(1);
  assert.equal(computeCSI(scores), 1);

  scores.M10 = 4;
  assert.equal(computeCSI(scores), 4);
  scores.M15 = 5;
  assert.equal(computeCSI(scores), 4, 'Binding assurance demand must not create downgrade pressure');
});

test('CSI response requirements are non-reductive: 1-3 none, 4 feasibility review, 5 sponsor escalation', () => {
  for (const csi of [1, 2, 3]) {
    assert.deepEqual(deriveCSIResponseRequirement(csi), {
      csi,
      requirement: 'none',
      required: false,
      rationale: 'Constraint stress does not require an additional governed feasibility response.'
    });
  }
  assert.equal(deriveCSIResponseRequirement(4).requirement, 'feasibility-review');
  assert.equal(deriveCSIResponseRequirement(4).required, true);
  assert.equal(deriveCSIResponseRequirement(5).requirement, 'sponsor-escalation');
  assert.equal(deriveCSIResponseRequirement(5).required, true);
  assert.throws(() => deriveCSIResponseRequirement(0), RangeError);

  const baselineScores = makeScores(2);
  const baseline = runFullAssessment(baselineScores);
  const feasibility = runFullAssessment({ ...baselineScores, M9: 4 });
  const escalation = runFullAssessment({ ...baselineScores, M10: 5 });
  assert.deepEqual(feasibility.levels, baseline.levels, 'CSI=4 must not lower or raise process levels');
  assert.deepEqual(escalation.levels, baseline.levels, 'CSI=5 must not lower or raise process levels');
  assert.equal(baseline.constraintResponseRequirement.requirement, 'none');
  assert.equal(feasibility.constraintResponseRequirement.requirement, 'feasibility-review');
  assert.equal(escalation.constraintResponseRequirement.requirement, 'sponsor-escalation');
});

test('CRI computation maps M16 to 1-3', () => {
  assert.equal(computeCRI({ M16: 1 }), 1, 'M16=1 → CRI=1 (constrained enabling conditions)');
  assert.equal(computeCRI({ M16: 2 }), 1, 'M16=2 → CRI=1');
  assert.equal(computeCRI({ M16: 3 }), 2, 'M16=3 → CRI=2 (mixed enabling conditions)');
  assert.equal(computeCRI({ M16: 4 }), 3, 'M16=4 → CRI=3 (strong enabling conditions)');
  assert.equal(computeCRI({ M16: 5 }), 3, 'M16=5 → CRI=3');
});

test('CRI=1 preserves required rigor and flags adoption readiness gaps', () => {
  const scores = makeScores(5);
  scores.M16 = 1; // constrained enabling conditions
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
    'Comprehensive rigor with constrained enabling conditions should be a high-severity adoption gap'
  );
});

test('governed right-sizing is non-mutating and deterministic across generated profiles', () => {
  const levelNames = ['basic', 'standard', 'comprehensive'];
  for (let seed = 0; seed < 128; seed += 1) {
    const levels = {};
    for (let pid = 9; pid <= 30; pid += 1) {
      levels[pid] = levelNames[(seed * (pid + 5) + pid) % levelNames.length];
    }
    const scores = makeScores(1);
    scores.M1 = (seed % 2) + 1;
    scores.M2 = ((seed >> 1) % 2) + 1;
    scores.M4 = ((seed >> 2) % 2) + 1;

    const first = applyRightSizing(levels, scores);
    const repeated = applyRightSizing(levels, scores);

    assert.deepEqual(first.levels, levels, `seed ${seed}: normative levels changed`);
    assert.deepEqual(first.rightSizingProposals, repeated.rightSizingProposals, `seed ${seed}: proposals were not deterministic`);
    assert.deepEqual(first.rightSizingActions, [], `seed ${seed}: proposals leaked into legacy action history`);
    assert.equal(new Set(first.rightSizingProposals.map(proposal => proposal.processId)).size, first.rightSizingProposals.length, `seed ${seed}: process received stacked proposals`);
    assert.ok(first.rightSizingProposals.every(proposal => first.proposedProfile[proposal.processId] === proposal.proposedTo), `seed ${seed}: infeasible proposal survived mandatory-closure preview`);
    assert.ok(first.blockedRightSizingCandidates.every(proposal => first.proposedProfile[proposal.processId] !== proposal.proposedTo), `seed ${seed}: closure-blocked candidate was mislabeled`);
  }
});

test('Small project (PSI=1) preserves normative Comprehensive levels and emits governed proposals', () => {
  const scores = makeScores(5); // All 5s → everything Comprehensive
  scores.M1 = 1; scores.M2 = 1; scores.M4 = 1; // PSI=1 (small)
  scores.M11 = 1; scores.M12 = 1;
  scores.M5 = 1; scores.M6 = 1; scores.M7 = 1; scores.M8 = 1; // no criticality floors
  scores.M16 = 5; // CRI=3 (supportive adoption posture)
  const result = runFullAssessment(scores);
  assert.ok(result.indices.psi <= 2, 'PSI should be small');
  // A PSI budget is a governance review threshold, not an automatic downgrade.
  const compCount = Object.values(result.levels).filter(l => l === 'comprehensive').length;
  assert.ok(compCount > 3, `Normative profile should preserve its Comprehensive recommendations, got ${compCount}`);
  assert.equal(result.budgetStatus.withinBudget, false);
  assert.ok(result.rightSizingProposals.length > 0);
  assert.deepEqual(result.rightSizingActions, [], 'New results must not report governed proposals as completed actions');
  assert.ok(result.rightSizingProposals.every(proposal =>
    proposal.type === 'rigor_budget_proposal' &&
    proposal.status === 'review-required' &&
    proposal.applied === false &&
    proposal.proposedTo === proposal.to
  ));
  assert.ok(result.rightSizingProposals.every(proposal =>
    result.levels[proposal.processId] === proposal.from
  ), 'No proposal may mutate the normative final level');
});

test('protected safety floors produce a visible final rigor-budget exception', () => {
  const scores = makeScores(1);
  scores.M5 = 5;
  const result = runFullAssessment(scores);
  assert.equal(result.indices.psi, 1);
  assert.equal(result.budgetStatus.withinBudget, false);
  assert.ok(result.budgetStatus.comprehensiveExcess > 0);
  assert.ok(result.rightSizingProposals.length > 0, 'The regression scenario must exercise proposals and a final exception together');
  assert.ok(result.rightSizingProposals.every(proposal => proposal.applied === false));
  assert.ok(result.rightSizingProposals.every(proposal =>
    ![12, 16, 19, 20, 25, 27].includes(proposal.processId)
  ), 'Active Comprehensive safety floors must not appear as reduction proposals');
  assert.equal(result.violations.filter(violation => violation.type === 'HC').length, 0);
});

test('runFullAssessment returns governed right-sizing proposals, compatibility actions, and indices', () => {
  const scores = makeScores(3);
  const result = runFullAssessment(scores);
  assert.ok(Array.isArray(result.rightSizingProposals), 'rightSizingProposals should be array');
  assert.ok(Array.isArray(result.rightSizingActions), 'rightSizingActions should be array');
  assert.ok(Array.isArray(result.adoptionRisks), 'adoptionRisks should be array');
  assert.ok(typeof result.indices === 'object', 'indices should be object');
  assert.ok('psi' in result.indices, 'indices should have psi');
  assert.ok('csi' in result.indices, 'indices should have csi');
  assert.ok('cri' in result.indices, 'indices should have cri');
});
