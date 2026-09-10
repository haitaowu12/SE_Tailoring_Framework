import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateProcessDerivation, runFullAssessment } from '../src/utils/assessment-engine.js';
import { normalizeImportedConfig, validateConfig, buildExportConfig } from '../src/utils/export-import.js';
import { evaluateBaselineEligibility } from '../src/utils/assessment-integrity.js';
import { COMPREHENSIVE_POLICY } from '../src/data/metrics.js';
const metrics = ['M1', 'M2', 'M3', 'M4'];
const rank = { basic: 0, standard: 1, comprehensive: 2 };
const allScores = value => Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`M${i + 1}`, value]));
function expected(scores, map) {
  const rows = Object.entries(map);
  const max = Math.max(...rows.map(([m]) => scores[m]));
  if (max < 3) return 'basic';
  return rows.some(([lead, role]) => role === 'P' && scores[lead] === 5 && rows.some(([support, r]) =>
    support !== lead && scores[support] >= (r === 'P' ? 3 : 5))) ? 'comprehensive' : 'standard';
}
test('declared Comprehensive policy matches the owner-selected thresholds', () => {
  assert.equal(COMPREHENSIVE_POLICY.leadRole, 'P');
  assert.equal(COMPREHENSIVE_POLICY.leadScore, 5);
  assert.deepEqual(COMPREHENSIVE_POLICY.distinctSupport, { primaryMinimum: 3, secondaryMinimum: 5 });
  assert.deepEqual(COMPREHENSIVE_POLICY.directConsequenceExceptions, ['M5', 'M7']);
});
for (const role of ['P', 'S']) test(`all 25 lead/support score pairs with ${role} support`, () => {
  for (let lead = 1; lead <= 5; lead++) for (let support = 1; support <= 5; support++) {
    const map = { M1: 'P', M2: role }, scores = { M1: lead, M2: support };
    assert.equal(calculateProcessDerivation(23, scores, { 23: map }).level, expected(scores, map));
  }
});
test('one Primary cannot support itself; Secondary-only highs cannot trigger Comprehensive', () => {
  assert.equal(calculateProcessDerivation(23, { M1: 5 }, { 23: { M1: 'P' } }).level, 'standard');
  assert.equal(calculateProcessDerivation(23, { M1: 5, M2: 5 }, { 23: { M1: 'S', M2: 'S' } }).level, 'standard');
});
test('all 10000 four-driver configurations match an independent oracle and preserve role/rating order', () => {
  for (let roleBits = 0; roleBits < 16; roleBits++) {
    const map = Object.fromEntries(metrics.map((m, i) => [m, roleBits & (1 << i) ? 'P' : 'S']));
    for (let encoded = 0; encoded < 625; encoded++) {
      let n = encoded;
      const scores = Object.fromEntries(metrics.map(m => { const value = n % 5 + 1; n = Math.floor(n / 5); return [m, value]; }));
      const actual = calculateProcessDerivation(23, scores, { 23: map }).level;
      assert.equal(actual, expected(scores, map));
      for (const m of metrics) {
        if (map[m] === 'S') assert.ok(rank[calculateProcessDerivation(23, scores, { 23: { ...map, [m]: 'P' } }).level] >= rank[actual]);
        if (scores[m] < 5) assert.ok(rank[calculateProcessDerivation(23, { ...scores, [m]: scores[m] + 1 }, { 23: map }).level] >= rank[actual]);
      }
    }
  }
});
test('older policy imports preserve evidence but cannot present cached levels or adjustments as current', () => {
  const scores = { ...allScores(1), M1: 5, M4: 3 };
  const assessments = Object.fromEntries(Object.entries(scores).map(([m, score]) => [m, { score, status: 'assessed', rationale: 'Existing rationale', evidenceRefs: ['SAFE-REF'] }]));
  const config = buildExportConfig({ scores, metricAssessments: assessments, levels: { 23: 'standard' }, assessmentComplete: true });
  config.semantics.frameworkVersion = '4.1.1';
  config.manualAdjustments = { 23: { level: 'standard', justification: 'Old policy decision' } };
  const untouched = structuredClone(config);
  assert.equal(validateConfig(config).valid, true);
  const normalized = normalizeImportedConfig(config);
  assert.deepEqual(config, untouched, 'Import must not mutate the historical source');
  assert.deepEqual(normalized.scores, scores);
  assert.deepEqual(normalized.metricAssessments, assessments);
  assert.deepEqual(normalized.levels, {});
  assert.deepEqual(normalized.manualAdjustments, {});
  assert.equal(normalized.semanticMigration.reason, 'comprehensive-support-policy');
  assert.deepEqual(normalized.semanticMigration.preservedLegacyResult, untouched);
  assert.equal(normalized.assessmentComplete, false);
  assert.equal(evaluateBaselineEligibility(normalized).migrationBlocked, true);
  assert.equal(buildExportConfig(normalized).assessmentComplete, false);
  const result = runFullAssessment(scores);
  assert.equal(result.levels[23], 'comprehensive');
  assert.equal(evaluateBaselineEligibility({ ...normalized, levels: result.levels, violations: result.violations }, { derivationReviewed: true }).migrationBlocked, false);
  for (const node of Object.values(normalized.assessmentTree.nodes)) assert.equal(node.assessmentResult, null);
});

test('reduced exports omit private historical snapshots without clearing migration review', () => {
  const config = buildExportConfig({ scores: allScores(1) });
  config.semantics.frameworkVersion = '4.1.1';
  config.notes = 'PRIVATE HISTORICAL TEXT';
  config.projectInfo = { name: 'PRIVATE HISTORICAL PROJECT' };
  config.manualAdjustments = { 23: { level: 'basic', justification: 'PRIVATE HISTORICAL DECISION' } };
  const state = normalizeImportedConfig(config);
  state.notes = '';
  state.projectInfo = {};
  for (const mode of ['minimum-data', 'identifier-reduced']) {
    const exported = buildExportConfig(state, { mode });
    assert.equal(JSON.stringify(exported).includes('PRIVATE HISTORICAL'), false);
    assert.equal(exported.semanticMigration.legacyHistoryOmitted, true);
    assert.equal(exported.semanticMigration.status, 'review-required');
    assert.equal(exported.semanticMigration.preservedLegacyResult, undefined);
    assert.equal(evaluateBaselineEligibility(normalizeImportedConfig(exported)).migrationBlocked, true);
  }
  assert.deepEqual(buildExportConfig(state, { includeProjectIdentifiers: true }).semanticMigration.preservedLegacyResult, config);
  assert.deepEqual(state.semanticMigration.preservedLegacyResult, config, 'Export must leave local history intact');
});
