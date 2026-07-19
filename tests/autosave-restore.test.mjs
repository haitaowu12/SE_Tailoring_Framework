import test from 'node:test';
import assert from 'node:assert/strict';

import {
  autosaveRestoreNotice,
  buildAutosaveImportConfig,
  isCurrentAutosaveSemantics
} from '../src/utils/autosave-restore.js';
import { normalizeImportedConfig } from '../src/utils/export-import.js';

const METRIC_IDS = Array.from({ length: 16 }, (_, index) => `M${index + 1}`);
const scores = Object.fromEntries(METRIC_IDS.map(metricId => [metricId, 3]));
const assessed = Object.fromEntries(METRIC_IDS.map(metricId => [metricId, {
  score: 3,
  status: 'assessed',
  definitionVersion: 3,
  qualifiers: [],
  rationale: '',
  evidenceRefs: []
}]));

test('current autosave requires both framework version and definition-set identity', () => {
  assert.equal(isCurrentAutosaveSemantics({
    semantics: { frameworkVersion: '4.1.1', metricDefinitionSet: 'se-tailoring-m1-m16-v3' }
  }), true);
  assert.equal(isCurrentAutosaveSemantics({
    semantics: { frameworkVersion: '4.1.0', metricDefinitionSet: 'se-tailoring-m1-m16-v3' }
  }), false);
  assert.equal(isCurrentAutosaveSemantics({
    semantics: { frameworkVersion: '4.1.1', metricDefinitionSet: 'se-tailoring-m1-m16-v2' }
  }), false);
});

test('4.1.0 autosave is normalized through the coherence migration instead of restored as current', () => {
  const saved = {
    semantics: {
      frameworkVersion: '4.1.0',
      metricDefinitionSet: 'se-tailoring-m1-m16-v3',
      qualifierSchemaVersion: '1.1'
    },
    scores,
    metricAssessments: assessed,
    levels: { 9: 'standard' },
    assessmentComplete: true,
    assessmentDisposition: 'complete-baseline'
  };
  const config = buildAutosaveImportConfig(saved);
  assert.equal(config._version, '2.0');
  assert.equal(config.semantics.frameworkVersion, '4.1.0');

  const normalized = normalizeImportedConfig(config);
  assert.equal(normalized.semanticMigration.reason, 'completion-contract-coherence');
  assert.deepEqual(normalized.semanticMigration.reassessmentMetrics, METRIC_IDS);
  assert.equal(normalized.metricAssessments.M1.status, 'legacy-unconfirmed');
  assert.equal(normalized.assessmentComplete, false);
  assert.equal(normalized.assessmentDisposition, 'work-in-progress');

  const notice = autosaveRestoreNotice(false, normalized);
  assert.equal(notice.type, 'warning');
  assert.match(notice.message, /Reconfirm all 16 anchors/);
});
