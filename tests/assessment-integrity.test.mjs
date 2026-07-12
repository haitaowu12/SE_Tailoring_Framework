import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assessMetricCompleteness,
  getM15ScopeOptions,
  preserveUnconfirmedMetricAssessments
} from '../src/utils/assessment-integrity.js';
import { buildExportConfig, normalizeImportedConfig, validateConfig } from '../src/utils/export-import.js';
import { assessRule11Disposition, assessWarningDispositions, normalizeRuleDispositions } from '../src/utils/rule-dispositions.js';
import { assessCsiResponse } from '../src/utils/csi-response.js';
import { assessSafetyAllocationDecision } from '../src/utils/inheritance-engine.js';
import { createRequirementsArchitectureHandoff } from '../src/data/artifact-relationships.js';

const METRIC_IDS = Array.from({ length: 16 }, (_, index) => `M${index + 1}`);
const makeScores = value => Object.fromEntries(METRIC_IDS.map(metricId => [metricId, value]));
const makeAssessments = (scores, status = 'assessed') => Object.fromEntries(
  METRIC_IDS.map(metricId => [metricId, {
    score: scores[metricId], status, definitionVersion: 3, qualifiers: [], rationale: '', evidenceRefs: []
  }])
);

function acceptedHandoff(elementId = 'default') {
  return {
    ...createRequirementsArchitectureHandoff(elementId),
    requiredContent: 'Baselined requirements and traceability.',
    acceptanceCriteria: 'Complete, consistent, feasible, traceable, and approved.',
    evidenceStatus: 'accepted',
    evidenceRefs: 'REQ-TEST-1',
    acceptanceAuthority: 'Chief Engineer',
    reviewDate: '2099-12-31'
  };
}

test('default preview scores do not count as confirmed baseline judgments', () => {
  const completeness = assessMetricCompleteness(makeScores(3), {});
  assert.equal(completeness.complete, false);
  assert.equal(completeness.completeCount, 0);
  assert.deepEqual(completeness.incompleteMetricIds, METRIC_IDS);
});

test('all 16 explicitly assessed scores are baseline-complete', () => {
  const scores = makeScores(3);
  const completeness = assessMetricCompleteness(scores, makeAssessments(scores));
  assert.equal(completeness.complete, true);
  assert.equal(completeness.completeCount, 16);
});

test('only aligned assessed or inherited-confirmed 1-5 scores complete; unknown, missing, and N/A remain incomplete', () => {
  const scores = makeScores(3);
  const inherited = makeAssessments(scores, 'inherited-confirmed');
  assert.equal(assessMetricCompleteness(scores, inherited).complete, true);

  const cases = [
    { metricId: 'M1', assessment: { score: 3, status: 'unknown' } },
    { metricId: 'M2', assessment: undefined },
    { metricId: 'M3', assessment: { score: null, status: 'not-applicable' } },
    { metricId: 'M4', assessment: { score: 0, status: 'assessed' } },
    { metricId: 'M5', assessment: { score: 6, status: 'inherited-confirmed' } }
  ];
  for (const { metricId, assessment } of cases) {
    const assessments = makeAssessments(scores);
    if (assessment) assessments[metricId] = assessment;
    else delete assessments[metricId];
    const result = assessMetricCompleteness(scores, assessments);
    assert.equal(result.complete, false, `${metricId} should not complete the baseline`);
    assert.ok(result.incompleteMetricIds.includes(metricId));
  }
});

test('confirmed assessment record must match the active score', () => {
  const scores = makeScores(3);
  const assessments = makeAssessments(scores);
  assessments.M1.score = 4;
  const completeness = assessMetricCompleteness(scores, assessments);
  assert.equal(completeness.complete, false);
  assert.equal(completeness.incompleteMetricIds.includes('M1'), true);
});

test('confirmed assessment record cannot complete a baseline without an active executable score', () => {
  const scores = makeScores(3);
  const assessments = makeAssessments(scores);
  delete scores.M1;
  const completeness = assessMetricCompleteness(scores, assessments);
  assert.equal(completeness.complete, false);
  assert.equal(completeness.incompleteMetricIds.includes('M1'), true);
});

test('imported not-applicable remains unsupported and non-baselineable', () => {
  const scores = makeScores(3);
  const assessments = makeAssessments(scores);
  assessments.M7 = { score: null, status: 'not-applicable', definitionVersion: 3, qualifiers: [], rationale: '', evidenceRefs: [] };
  assert.equal(assessMetricCompleteness(scores, assessments).complete, false);
  assessments.M7.rationale = 'No physical system or environmental interaction is in the assessed boundary.';
  const completeness = assessMetricCompleteness(scores, assessments);
  assert.equal(completeness.complete, false);
  assert.match(completeness.metrics.find(metric => metric.metricId === 'M7').reason, /unsupported migration evidence/);
});

test('Unknown is explicit and non-baselineable while missing remains unanswered preview', () => {
  const scores = makeScores(3);
  const unknown = makeAssessments(scores);
  unknown.M4 = { score: null, status: 'unknown', definitionVersion: 3, qualifiers: [], evidenceRefs: [] };
  const unknownResult = assessMetricCompleteness(scores, unknown);
  assert.equal(unknownResult.complete, false);
  assert.equal(unknownResult.metrics.find(metric => metric.metricId === 'M4').status, 'unknown');

  delete unknown.M4;
  const missingResult = assessMetricCompleteness(scores, unknown);
  assert.equal(missingResult.metrics.find(metric => metric.metricId === 'M4').status, 'missing');
});

test('legacy schema-2 scores remain readable but become unconfirmed work in progress', () => {
  const scores = makeScores(3);
  const config = {
    _format: 'se-tailoring-config',
    _version: '2.0',
    semantics: {
      frameworkVersion: '4.1.0',
      metricDefinitionSet: 'se-tailoring-m1-m16-v3',
      qualifierSchemaVersion: '1.1'
    },
    metricScores: scores,
    processLevels: { 9: 'standard' },
    assessmentComplete: true
  };

  assert.equal(validateConfig(config).valid, true, 'Older schema-2 files remain importable');
  const normalized = normalizeImportedConfig(config);
  assert.equal(normalized.assessmentComplete, false);
  assert.equal(normalized.assessmentDisposition, 'work-in-progress');
  assert.equal(normalized.metricAssessments.M1.status, 'legacy-unconfirmed');
  assert.equal(normalized.levels[9], 'standard', 'Historical result is preserved as preview evidence');
});

test('current-semantic import with omitted handoffs migrates to an explicit incomplete record', () => {
  const scores = makeScores(3);
  const config = buildExportConfig({
    scores,
    metricAssessments: makeAssessments(scores),
    artifactHandoffs: [acceptedHandoff()],
    assessmentComplete: true
  });
  assert.equal(config.assessmentComplete, true);
  delete config.artifactHandoffs;

  const normalized = normalizeImportedConfig(config);
  assert.equal(normalized.assessmentComplete, false);
  assert.equal(normalized.assessmentDisposition, 'work-in-progress');
  assert.equal(normalized.artifactHandoffs.length, 1);
  assert.equal(normalized.artifactHandoffs[0].evidenceStatus, 'draft');
});

test('export cannot claim a complete baseline from implicit scores', () => {
  const config = buildExportConfig({ scores: makeScores(3), assessmentComplete: true });
  assert.equal(config.assessmentComplete, false);
  assert.equal(config.assessmentDisposition, 'work-in-progress');
  assert.equal(config.assessmentIntegrity.completeCount, 0);
});

test('confirmed export preserves proposals, historical actions, and active floors separately', () => {
  const scores = makeScores(3);
  const config = buildExportConfig({
    scores,
    metricAssessments: makeAssessments(scores),
    assessmentComplete: true,
    artifactHandoffs: [acceptedHandoff()],
    rightSizingProposals: [{ processId: 15, from: 'standard', proposedTo: 'basic', reason: 'PSI guidance' }],
    rightSizingActions: [{ processId: 14, from: 'standard', to: 'basic', reason: 'Legacy record' }],
    activeFloors: [{ processId: 13, overrideId: 'security_critical_cm', minLevel: 'standard', status: 'satisfied' }]
  });

  assert.equal(config.assessmentComplete, true);
  assert.equal(config.assessmentDisposition, 'complete-baseline');
  assert.equal(config.rightSizingProposals.length, 1);
  assert.equal(config.rightSizingActions.length, 1);
  assert.equal(config.activeFloors.length, 1);
});

test('CSI 4 and 5 require governed responses without changing levels or accepting proposals', () => {
  const scores = makeScores(3);
  scores.M9 = 4;
  const assessments = makeAssessments(scores);
  const levels = { 9: 'standard', 25: 'comprehensive' };
  const proposals = [{ processId: 15, from: 'standard', proposedTo: 'basic', applied: false }];
  const base = {
    scores, metricAssessments: assessments, levels, rightSizingProposals: proposals,
    artifactHandoffs: [acceptedHandoff()], assessmentComplete: true
  };
  assert.equal(buildExportConfig(base).assessmentComplete, false);

  const response = {
    responseType: 'feasibility-review', selectedActions: ['add-capacity', 'phase-delivery'],
    protectedOutputs: 'Verification evidence and safety case outputs', rationaleDecision: 'Add capacity and phase delivery.',
    ownerApprover: 'Delivery Director', evidenceRef: 'FR-4', reviewDate: '2026-07-10'
  };
  assert.equal(assessCsiResponse(scores, response).complete, true);
  const config = buildExportConfig({ ...base, csiResponse: response });
  assert.equal(config.assessmentComplete, true);
  assert.deepEqual(config.processLevels, levels);
  assert.deepEqual(config.rightSizingProposals, proposals);

  scores.M10 = 5;
  assessments.M10.score = 5;
  assert.equal(assessCsiResponse(scores, response).complete, false, 'CSI 5 must escalate to sponsor');
  const sponsorResponse = { ...response, responseType: 'sponsor-escalation', ownerApprover: 'Executive Sponsor' };
  assert.equal(assessCsiResponse(scores, sponsorResponse).complete, true);
});

test('CSI response and structured child hierarchy governance round-trip in current config', () => {
  const scores = makeScores(3);
  scores.M9 = 4;
  const decision = {
    status: 'confirmed', allocationDisposition: 'not-allocated-to-child', retainedResponsibility: 'parent',
    authority: 'Safety Authority', evidenceRef: 'ALLOC-5', interfaceAssumptionsRef: 'ICD-SAFE-2',
    rationale: 'Hazard responsibility is retained at the parent boundary.', reviewDate: '2026-07-10'
  };
  assert.equal(assessSafetyAllocationDecision(decision).valid, true);
  assert.equal(assessSafetyAllocationDecision(true).valid, false, 'legacy boolean never authorizes allocation');
  const config = buildExportConfig({
    scores,
    metricAssessments: makeAssessments(scores),
    assessmentComplete: true,
    csiResponse: {
      responseType: 'feasibility-review', selectedActions: ['extend-schedule'], protectedOutputs: 'Safety evidence',
      rationaleDecision: 'Extend the schedule.', ownerApprover: 'Chief Engineer', evidenceRef: 'CSI-4', reviewDate: '2026-07-10'
    },
    assessmentTree: {
      rootId: 'root', activeId: 'child', nodes: {
        root: { id: 'root', name: 'Parent', parentId: null, childIds: ['child'], assessmentType: 'full', status: 'draft', scores },
        child: {
          id: 'child', name: 'Child', parentId: 'root', childIds: [], assessmentType: 'quick', status: 'draft', scores,
          safetyAllocationDecision: decision,
          securityHierarchyDisposition: {
            status: 'confirmed', outcome: 'lower-consequence-justified',
            rationale: 'The child boundary has a lower credible security consequence.',
            ownerApprover: 'Security Authority', reviewDate: '2026-07-11', decisionBasisRef: '', evidenceRef: ''
          },
          assuranceHierarchyDisposition: {
            status: 'draft', outcome: 'responsibility-retained-elsewhere', rationale: '',
            ownerApprover: '', reviewDate: '', decisionBasisRef: '', evidenceRef: ''
          },
          hasIndependentSecurityAnalysis: true,
          hasScopedAssuranceDecision: true
        }
      }
    }
  });
  assert.equal(validateConfig(config).valid, true);
  const normalized = normalizeImportedConfig(config);
  assert.deepEqual(normalized.csiResponse.selectedActions, ['extend-schedule']);
  assert.deepEqual(normalized.assessmentTree.nodes.child.safetyAllocationDecision, decision);
  assert.equal(normalized.assessmentTree.nodes.child.securityHierarchyDisposition.status, 'confirmed');
  assert.equal(normalized.assessmentTree.nodes.child.assuranceHierarchyDisposition.status, 'draft');
  assert.equal(normalized.assessmentTree.nodes.child.hasIndependentSecurityAnalysis, true, 'legacy boolean remains visible');
  assert.equal(normalized.assessmentTree.nodes.child.hasScopedAssuranceDecision, true, 'legacy boolean remains visible');
});

test('hierarchy disposition schema rejects malformed outcomes and impossible dates but accepts incomplete drafts', () => {
  const scores = makeScores(3);
  const base = {
    _format: 'se-tailoring-config', _version: '2.0',
    semantics: { frameworkVersion: '4.1.0', metricDefinitionSet: 'se-tailoring-m1-m16-v3', qualifierSchemaVersion: 'se-tailoring-qualifiers-v1' },
    metricScores: scores, processLevels: {},
    assessmentTree: {
      rootId: 'root', activeId: 'child', nodes: {
        root: { id: 'root', name: 'Parent', parentId: null, childIds: ['child'], assessmentType: 'full', status: 'draft', scores },
        child: {
          id: 'child', name: 'Child', parentId: 'root', childIds: [], assessmentType: 'quick', status: 'draft', scores,
          securityHierarchyDisposition: { status: 'draft', outcome: '', rationale: '', ownerApprover: '', reviewDate: '' },
          assuranceHierarchyDisposition: { status: 'confirmed', outcome: 'not-an-outcome', rationale: 'x', ownerApprover: 'x', reviewDate: '2026-02-30' }
        }
      }
    }
  };
  const result = validateConfig(base);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => /assuranceHierarchyDisposition has invalid outcome/.test(error)));
  assert.ok(result.errors.some(error => /assuranceHierarchyDisposition has invalid reviewDate/.test(error)));
  assert.ok(!result.errors.some(error => /securityHierarchyDisposition/.test(error)), 'incomplete drafts are valid data and fail closed at assessment time');
});

test('M15 UI scope model distinguishes drivers, floors, and rule-severity-only scope', () => {
  const options = getM15ScopeOptions();
  assert.deepEqual(options.map(option => option.processId), [12, 13, 14, 15, 16, 25, 27, 30]);
  assert.deepEqual(options.filter(option => option.floorCapable).map(option => option.processId), [13, 14, 16, 25]);
  assert.deepEqual(options.filter(option => option.ruleSeverityCapable).map(option => option.processId), [15, 16]);
  assert.equal(options.find(option => option.processId === 15)?.role, 'scope-only');
});

test('preserving unconfirmed assessments never overwrites explicit current judgments', () => {
  const scores = makeScores(3);
  const normalized = preserveUnconfirmedMetricAssessments(scores, {
    M8: { score: 4, status: 'assessed', definitionVersion: 3, qualifiers: ['integrity'], evidenceRefs: [] }
  });
  assert.equal(normalized.M8.status, 'assessed');
  assert.equal(normalized.M8.score, 4);
  assert.equal(normalized.M1.status, 'legacy-unconfirmed');
});

test('triggered Rule 11 requires all governed disposition fields', () => {
  const violations = [{ ruleId: 11, type: 'WN', affectedProcess: 27, currentLevel: 'basic', requiredLevel: 'standard' }];
  const incomplete = assessRule11Disposition(violations, {
    11: { outcome: 'basic-evidence-justified', rationale: 'Operational demonstration retained.', ownerApprover: '', evidenceRef: 'VAL-7', reviewDate: '2026-07-10' }
  }, { 27: 'basic' });
  assert.equal(incomplete.complete, false);
  assert.deepEqual(incomplete.missingFields, ['ownerApprover']);

  const complete = assessRule11Disposition(violations, {
    11: { outcome: 'basic-evidence-justified', rationale: 'Operational demonstration retained.', ownerApprover: 'Chief Engineer', evidenceRef: 'VAL-7', reviewDate: '2026-07-10' }
  }, { 27: 'basic' });
  assert.equal(complete.complete, true);
});

test('Rule 11 rejects impossible calendar dates in assessment and import validation', () => {
  const violations = [{ ruleId: 11, type: 'WN', affectedProcess: 27, currentLevel: 'basic', requiredLevel: 'standard' }];
  const record = {
    ruleId: 11, propagationId: 'P12', outcome: 'basic-evidence-justified',
    rationale: 'Operational demonstration retained.', ownerApprover: 'Chief Engineer',
    evidenceRef: 'VAL-7', reviewDate: '2027-02-30'
  };
  const assessed = assessRule11Disposition(violations, { 11: record }, { 27: 'basic' });
  assert.equal(assessed.complete, false);
  assert.ok(assessed.missingFields.includes('reviewDate'));

  const configValidation = validateConfig({
    _format: 'se-tailoring-config', metricScores: {}, processLevels: {}, ruleDispositions: { 11: record }
  });
  assert.equal(configValidation.valid, false);
  assert.ok(configValidation.errors.some(error => error.includes('real ISO calendar date')));
});

test('elevated-validation outcome cannot complete while Validation remains Basic', () => {
  const violations = [{ ruleId: 11, type: 'WN', affectedProcess: 27, currentLevel: 'basic', requiredLevel: 'standard' }];
  const disposition = {
    11: { outcome: 'elevated-validation', rationale: 'Validation will be elevated.', ownerApprover: 'Chief Engineer', evidenceRef: 'VAL-8', reviewDate: '2026-07-10' }
  };
  const basic = assessRule11Disposition(violations, disposition, { 27: 'basic' });
  assert.equal(basic.complete, false);
  assert.ok(basic.missingFields.includes('validationLevel'));
  assert.equal(assessRule11Disposition(violations, disposition, { 27: 'standard' }).complete, true);
});

test('Rule 11 warning blocks complete export until disposition is complete', () => {
  const scores = makeScores(3);
  const state = {
    scores,
    metricAssessments: makeAssessments(scores),
    levels: { 27: 'basic' },
    violations: [{ ruleId: 11, type: 'WN', affectedProcess: 27, currentLevel: 'basic', requiredLevel: 'standard' }],
    artifactHandoffs: [acceptedHandoff()],
    assessmentComplete: true
  };
  const blocked = buildExportConfig(state);
  assert.equal(blocked.assessmentComplete, false);
  assert.equal(blocked.assessmentDisposition, 'work-in-progress');

  state.ruleDispositions = {
    11: { ruleId: 11, propagationId: 'P12', outcome: 'outside-assessed-boundary', rationale: 'Acceptance is owned by the parent programme.', ownerApprover: 'Programme Chief Engineer', evidenceRef: 'ICD-VAL-2', reviewDate: '2026-07-10' }
  };
  const complete = buildExportConfig(state);
  assert.equal(complete.assessmentComplete, true);
  assert.equal(complete.ruleDispositions['11'].propagationId, 'P12');
  const normalized = normalizeImportedConfig(complete);
  assert.equal(normalized.assessmentComplete, true);
  assert.equal(normalized.ruleDispositions['11'].outcome, 'outside-assessed-boundary');
});

test('every triggered unsatisfied active warning requires its own governed disposition', () => {
  const violations = [
    { ruleId: 7, type: 'WN', affectedProcess: 24, currentLevel: 'basic', requiredLevel: 'standard' },
    { ruleId: '8b', type: 'WN', affectedProcess: 9, currentLevel: 'standard', requiredLevel: 'comprehensive' },
    { ruleId: 18, type: 'HC', affectedProcess: 24, currentLevel: 'basic', requiredLevel: 'standard' }
  ];
  const first = assessWarningDispositions(violations, {}, { 9: 'standard', 24: 'basic' });
  assert.equal(first.complete, false);
  assert.deepEqual(first.requiredRuleIds, ['7', '8b']);
  assert.deepEqual(first.incompleteRuleIds, ['7', '8b']);

  const claimedSatisfied = assessWarningDispositions(violations, {
    7: {
      outcome: 'satisfy', rationale: 'Claimed satisfied without changing the level.', ownerApprover: 'Chief Engineer',
      evidenceRef: 'INT-DEC-7', reviewDate: '2027-06-30'
    }
  }, { 9: 'standard', 24: 'basic' });
  assert.ok(claimedSatisfied.assessments.find(item => item.ruleId === '7').missingFields.includes('relationshipLevel'));

  const records = {
    7: {
      outcome: 'accept-current', rationale: 'Integration is staged with interface controls.',
      ownerApprover: 'Chief Engineer', evidenceRef: 'INT-DEC-7', reviewDate: '2027-06-30'
    },
    '8b': {
      outcome: 'responsibility-elsewhere', rationale: 'Programme planning is owned by the parent organization.',
      ownerApprover: 'Programme Director', evidenceRef: 'PLAN-RACI-2', reviewDate: '2027-06-30'
    }
  };
  const complete = assessWarningDispositions(violations, records, { 9: 'standard', 24: 'basic' });
  assert.equal(complete.complete, true);
  assert.deepEqual(complete.incompleteRuleIds, []);
});

test('general warning dispositions require evidence and a real review date and round-trip active alphanumeric IDs', () => {
  const violations = [{ ruleId: '8b', type: 'WN', affectedProcess: 9, currentLevel: 'standard', requiredLevel: 'comprehensive' }];
  const invalid = {
    '8b': {
      ruleId: '8b', outcome: 'authorized-defer', rationale: 'Defer to the next planning increment.',
      ownerApprover: 'Programme Director', evidenceRef: '', reviewDate: '2027-02-30'
    }
  };
  const assessed = assessWarningDispositions(violations, invalid);
  assert.equal(assessed.complete, false);
  assert.deepEqual(assessed.incompleteRuleIds, ['8b']);
  assert.deepEqual(assessed.assessments[0].missingFields, ['evidenceRef', 'reviewDate']);

  const valid = { '8b': { ...invalid['8b'], evidenceRef: 'PLAN-DEF-4', reviewDate: '2027-02-28' } };
  assert.deepEqual(normalizeRuleDispositions(valid), valid);
  assert.equal(validateConfig({ _format: 'se-tailoring-config', metricScores: {}, processLevels: {}, ruleDispositions: invalid }).valid, false);
  assert.equal(validateConfig({ _format: 'se-tailoring-config', metricScores: {}, processLevels: {}, ruleDispositions: valid }).valid, true);
});

test('non-Rule-11 warning blocks complete export without changing process levels', () => {
  const scores = makeScores(3);
  const state = {
    scores,
    metricAssessments: makeAssessments(scores),
    levels: { 20: 'comprehensive', 24: 'basic' },
    violations: [{ ruleId: 7, type: 'WN', label: 'Architecture to Integration', affectedProcess: 24, currentLevel: 'basic', requiredLevel: 'standard' }],
    artifactHandoffs: [acceptedHandoff()],
    assessmentComplete: true
  };
  const blocked = buildExportConfig(state);
  assert.equal(blocked.assessmentComplete, false);
  assert.deepEqual(blocked.processLevels, state.levels);

  state.ruleDispositions = {
    7: {
      ruleId: 7, outcome: 'outside-boundary', rationale: 'Integration is outside this supplier assessment.',
      ownerApprover: 'System Integrator', evidenceRef: 'BOUNDARY-3', reviewDate: '2027-06-30'
    }
  };
  const complete = buildExportConfig(state);
  assert.equal(complete.assessmentComplete, true);
  assert.deepEqual(complete.processLevels, state.levels);
  assert.equal(complete.assessmentIntegrity.warningDispositions.complete, true);
});

test('an imported active warning cannot bypass disposition by omitting display severity', () => {
  const result = assessWarningDispositions([
    { ruleId: 14, affectedProcess: 11, currentLevel: 'basic', requiredLevel: 'standard' }
  ]);
  assert.equal(result.complete, false);
  assert.deepEqual(result.requiredRuleIds, ['14']);
});

test('config validation rejects unsupported or malformed rule dispositions', () => {
  const base = { _format: 'se-tailoring-config', metricScores: {}, processLevels: {} };
  const invalid = validateConfig({
    ...base,
    ruleDispositions: {
      11: { ruleId: 11, propagationId: 'P99', outcome: 'silently-ignore', rationale: 4 },
      13: { outcome: 'generalized' }
    }
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.some(error => error.includes('Unsupported rule disposition: 13')));
  assert.ok(invalid.errors.some(error => error.includes('invalid propagationId')));
  assert.ok(invalid.errors.some(error => error.includes('invalid outcome')));
});
