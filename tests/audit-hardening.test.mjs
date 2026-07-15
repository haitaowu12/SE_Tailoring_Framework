import test from 'node:test';
import assert from 'node:assert/strict';

import { runFullAssessment, runPreviewAssessment } from '../src/utils/assessment-engine.js';
import { FRAMEWORK_SEMANTIC_VERSION, METRIC_DEFINITION_SET_ID, QUALIFIER_SCHEMA_VERSION } from '../src/data/metrics.js';
import { propagateSafetyOverrides } from '../src/utils/inheritance-engine.js';
import { csvCell, IMPORT_LIMITS, normalizeImportedConfig, validateConfig } from '../src/utils/export-import.js';

const scores = value => Object.fromEntries(Array.from({ length: 16 }, (_, index) => [`M${index + 1}`, value]));

function node(id, parentId, childIds = []) {
  return {
    id,
    name: id,
    parentId,
    childIds,
    assessmentType: 'full',
    status: 'draft',
    scores: {},
    levels: {},
    manualAdjustments: {},
    ruleDispositions: {},
    csiResponse: {},
    rightSizingApprovalRecords: []
  };
}

function config(assessmentTree, overrides = {}) {
  return {
    _format: 'se-tailoring-config',
    _version: '2.0',
    semantics: {
      frameworkVersion: FRAMEWORK_SEMANTIC_VERSION,
      metricDefinitionSet: METRIC_DEFINITION_SET_ID,
      qualifierSchemaVersion: QUALIFIER_SCHEMA_VERSION
    },
    metricScores: {},
    processLevels: {},
    assessmentTree,
    ...overrides
  };
}

test('incomplete direct assessment is explicit preview with no authoritative profile or status', () => {
  const result = runFullAssessment({});
  assert.equal(result.assessmentMode, 'preview');
  assert.equal(result.authoritative, false);
  assert.equal(result.incompleteMetricIds.length, 16);
  assert.equal(Object.keys(result.normativeLevels).length, 0);
  assert.equal(Object.keys(result.derivationStatus).length, 0);
  assert.equal(Object.keys(result.confidence).length, 0);
  assert.equal(Object.keys(result.previewLevels).length, 22);
  assert.equal(Object.keys(result.previewDerivationStatus).length, 22);
});

test('complete direct assessment is normative and exposes derivationStatus with legacy alias', () => {
  const result = runFullAssessment(scores(3));
  assert.equal(result.assessmentMode, 'normative');
  assert.equal(result.authoritative, true);
  assert.deepEqual(result.derivationStatus, result.confidence);
  assert.equal(Object.keys(result.normativeLevels).length, 22);

  const preview = runPreviewAssessment(scores(3));
  assert.equal(preview.authoritative, false);
  assert.equal(Object.keys(preview.normativeLevels).length, 0);
});

test('active hierarchy guard blocks invalid M5 reduction consistently with M8 and M15', () => {
  const parent = { ...scores(3), M5: 5, M8: 5, M15: 5 };
  const child = { ...scores(3), M5: 1, M8: 1, M15: 1 };
  const result = propagateSafetyOverrides(parent, child);
  assert.deepEqual(result.blockedMetrics.sort(), ['M15', 'M5', 'M8']);
});

test('tree validation rejects cycles, parent asymmetry, unreachable nodes, and excessive depth', () => {
  const cyclic = { rootId: 'root', activeId: 'root', nodes: {
    root: node('root', null, ['child']),
    child: node('child', 'root', ['root'])
  } };
  assert.equal(validateConfig(config(cyclic)).valid, false);

  const asymmetric = { rootId: 'root', activeId: 'root', nodes: {
    root: node('root', null, ['child']),
    child: node('child', null, [])
  } };
  assert.equal(validateConfig(config(asymmetric)).valid, false);

  const unreachable = { rootId: 'root', activeId: 'root', nodes: {
    root: node('root', null, []),
    orphan: node('orphan', null, [])
  } };
  assert.equal(validateConfig(config(unreachable)).valid, false);

  const nodes = {};
  for (let depth = 0; depth <= IMPORT_LIMITS.maxTreeDepth + 1; depth += 1) {
    const id = `n${depth}`;
    nodes[id] = node(id, depth === 0 ? null : `n${depth - 1}`, depth <= IMPORT_LIMITS.maxTreeDepth ? [`n${depth + 1}`] : []);
  }
  const deep = { rootId: 'n0', activeId: 'n0', nodes };
  assert.equal(validateConfig(config(deep)).valid, false);
});

test('payload bounds reject excessive text', () => {
  const tree = { rootId: 'root', activeId: 'root', nodes: { root: node('root', null) } };
  const result = validateConfig(config(tree, { notes: 'x'.repeat(IMPORT_LIMITS.maxTextLength + 1) }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('exceeds')));
});

test('4.0/v2 imports preserve compatible judgments and require only M3 reassessment', () => {
  const oldScores = scores(3);
  const old = {
    _format: 'se-tailoring-config',
    _version: '2.0',
    semantics: { frameworkVersion: '4.0.0', metricDefinitionSet: 'se-tailoring-m1-m16-v2', qualifierSchemaVersion: '1.0' },
    metricScores: oldScores,
    metricAssessments: Object.fromEntries(Object.entries(oldScores).map(([metricId, score]) => [metricId, { score, status: 'assessed', definitionVersion: 2, qualifiers: [] }])),
    processLevels: {},
    assuranceObligations: [{ id: 'A-1', type: 'contractual-assurance', bindingStatus: 'unconfirmed', processScope: [] }]
  };
  assert.equal(validateConfig(old).valid, true);
  const normalized = normalizeImportedConfig(old);
  assert.equal(normalized.scores.M3, undefined);
  assert.equal(normalized.metricAssessments.M3.status, 'migration-required');
  assert.equal(normalized.metricAssessments.M3.legacyScore, 3);
  for (const metricId of ['M6', 'M8', 'M15']) assert.equal(normalized.scores[metricId], 3);
  assert.equal(normalized.assuranceObligations.length, 1);
  assert.deepEqual(normalized.semanticMigration.reassessmentMetrics, ['M3']);
  assert.equal(normalized.assessmentComplete, false);
});

test('CSV cells literalize spreadsheet formula prefixes before quoting', () => {
  for (const value of ['=1+1', '+SUM(A1:A2)', '-2+3', '@cmd', '\t=HYPERLINK("x")']) {
    const cell = csvCell(value);
    assert.ok(cell.startsWith("'") || cell.startsWith("\"'"));
  }
  assert.equal(csvCell('standard'), 'standard');
});
