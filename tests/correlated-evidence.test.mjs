import test from 'node:test';
import assert from 'node:assert/strict';
import { assessCorrelatedEvidence, normalizeEvidenceContext } from '../src/utils/correlated-evidence.js';
import { runFullAssessment } from '../src/utils/assessment-engine.js';
import { buildExportConfig, normalizeImportedConfig, validateConfig } from '../src/utils/export-import.js';
import { METRIC_PROCESS_MAP } from '../src/data/se-tailoring-data.js';

const assessed = (score, evidenceContext) => ({ score, status: 'assessed', definitionVersion: 3, qualifiers: [], evidenceRefs: [], evidenceContext });

test('warns when M5, M6, and M8 reuse one episode without differentiated consequence analyses', () => {
  const result = assessCorrelatedEvidence({
    M5: assessed(5, { familyId: 'HAZ-1', episodeId: 'EV-1', consequencePathway: 'Shared scenario' }),
    M6: assessed(4, { familyId: 'HAZ-1', episodeId: 'EV-1', consequencePathway: 'Shared scenario' }),
    M8: assessed(5, { familyId: 'HAZ-1', episodeId: 'EV-1', consequencePathway: '' })
  });
  assert.equal(result.warningCount, 1);
  assert.deepEqual(result.warnings[0].metricIds, ['M5', 'M6', 'M8']);
  assert.match(result.warnings[0].effect, /scores, recommended levels, and closure are unchanged/);
});

test('allows shared evidence when each metric documents a distinct consequence analysis', () => {
  const result = assessCorrelatedEvidence({
    M5: assessed(5, { episodeId: 'EV-1', consequencePathway: 'Personnel injury through unsafe actuation' }),
    M6: assessed(4, { episodeId: 'EV-1', consequencePathway: 'Loss of passenger service and recovery capacity' }),
    M8: assessed(5, { episodeId: 'EV-1', consequencePathway: 'Unauthorized control-state manipulation' })
  });
  assert.equal(result.warningCount, 0);
});

test('detects an identical fully described context without family or episode IDs', () => {
  const shared = { eventRef: 'Cyber-physical hazard H-17', artifactRefs: ['FTA-17', 'HAZLOG-4'], assumptionsRef: 'ASM-9', assessorId: 'Assurance team', consequencePathway: '' };
  const result = assessCorrelatedEvidence({ M5: assessed(4, shared), M8: assessed(4, shared) });
  assert.equal(result.warningCount, 1);
  assert.deepEqual(result.warnings[0].metricIds, ['M5', 'M8']);
});

test('normalizes artifact text to a stable array', () => {
  assert.deepEqual(normalizeEvidenceContext({ artifactRefs: 'FTA-17, HAZLOG-4\nFTA-17' }).artifactRefs, ['FTA-17', 'HAZLOG-4']);
});

test('evidence metadata and warnings survive export/import without becoming a closure gate', () => {
  const metricScores = Object.fromEntries(Array.from({ length: 16 }, (_, index) => [`M${index + 1}`, 3]));
  const metricAssessments = Object.fromEntries(Object.entries(metricScores).map(([metricId, score]) => [metricId, assessed(score, {})]));
  metricAssessments.M5.evidenceContext = { episodeId: 'EV-2', consequencePathway: '' };
  metricAssessments.M8.evidenceContext = { episodeId: 'EV-2', consequencePathway: '' };
  const result = runFullAssessment(metricScores, METRIC_PROCESS_MAP, { metricAssessments });
  const state = { scores: metricScores, metricAssessments, levels: result.levels, derived: result.derived, assessmentComplete: true };

  const exported = buildExportConfig(state);
  const withoutSharedContext = buildExportConfig({ ...state, metricAssessments: Object.fromEntries(Object.entries(metricAssessments).map(([id, assessment]) => [id, { ...assessment, evidenceContext: {} }])) });
  assert.equal(validateConfig(exported).valid, true);
  assert.equal(exported.assessmentComplete, withoutSharedContext.assessmentComplete);
  assert.equal(exported.correlatedEvidenceWarnings.length, 1);
  const imported = normalizeImportedConfig(exported);
  assert.equal(imported.correlatedEvidenceWarnings.length, 1);
  assert.equal(imported.metricAssessments.M5.evidenceContext.episodeId, 'EV-2');
  assert.deepEqual(runFullAssessment(metricScores, METRIC_PROCESS_MAP, { metricAssessments }).levels, result.levels);
});
