import test from 'node:test';
import assert from 'node:assert/strict';
import { METRICS, METRIC_PROCESS_MAP } from '../src/data/se-tailoring-data.js';
import { runFullAssessment } from '../src/utils/assessment-engine.js';
import {
  assessRightSizingApproval,
  createRightSizingApprovalSnapshot,
  evaluateRightSizingApprovals,
  findNearestCommonGoverningBoundary,
  getRightSizingApprovalRequirements,
  validateRightSizingApprovalRecords
} from '../src/utils/right-sizing-governance.js';

const tree = {
  rootId: 'root',
  activeId: 'a',
  nodes: {
    root: { id: 'root', parentId: null },
    a: { id: 'a', parentId: 'root' },
    b: { id: 'b', parentId: 'root' },
    a1: { id: 'a1', parentId: 'a' }
  }
};

const baseProposal = {
  processId: 19,
  elementId: 'a1',
  scopeElementIds: ['a1'],
  from: 'standard',
  proposedTo: 'basic',
  protectedMetricIds: ['M5'],
  status: 'review-required'
};

const context = {
  assessmentTree: tree,
  scores: { M5: 3, M8: 2, M15: 1 },
  activeFloors: [],
  normativeLevels: { 19: 'standard' },
  asOfDate: '2026-07-10',
  frameworkVersion: '4.1.1',
  metricDefinitionSet: 'se-tailoring-m1-m16-v3'
};

function approvedRecord(proposal = baseProposal, overrides = {}) {
  return {
    id: 'RS-19-1',
    decision: 'approved',
    processId: proposal.processId,
    scopeElementIds: proposal.scopeElementIds,
    from: proposal.from,
    to: proposal.proposedTo,
    snapshot: createRightSizingApprovalSnapshot(proposal, context),
    rationale: 'The reduced activity set remains sufficient for the bounded scope.',
    protectedOutputs: 'Requirements baseline, traceability, and acceptance evidence remain protected.',
    protectedOutputImpact: false,
    residualRisks: 'Reduced review cadence may delay discovery of low-severity defects.',
    riskAcceptanceOwner: 'Named risk owner',
    compensatingControls: 'Targeted peer review and monthly evidence audit.',
    rejectedAlternatives: 'Retaining Standard was considered but rejected for this bounded scope.',
    evidenceRef: 'EVID-RS-19',
    reviewDate: '2026-12-31',
    approvals: {
      accountableProcessOwner: { identity: 'Person A', authorityBasis: 'Accountable for Process 19 in the approved responsibility model.' },
      assessmentLead: { identity: 'Person B', authorityBasis: 'Leads the governed assessment.' },
      independentAssuranceAuthority: { identity: 'Person C', authorityBasis: 'Independent acceptance authority for safety-related evidence.' }
    },
    ...overrides
  };
}

test('fixed assessment cardinality remains 16 metrics and 102 static mapping cells', () => {
  assert.equal(METRICS.length, 16);
  assert.equal(Object.values(METRIC_PROCESS_MAP).reduce((sum, map) => sum + Object.keys(map).length, 0), 102);
});

test('role requirements are based on reduction depth, protected involvement, and governing scope', () => {
  assert.deepEqual(getRightSizingApprovalRequirements(baseProposal, tree).requiredRoles,
    ['accountableProcessOwner', 'assessmentLead', 'independentAssuranceAuthority']);

  const twoLevelCrossElement = {
    ...baseProposal,
    from: 'comprehensive',
    proposedTo: 'basic',
    scopeElementIds: ['a1', 'b'],
    protectedMetricIds: []
  };
  const requirements = getRightSizingApprovalRequirements(twoLevelCrossElement, tree);
  assert.equal(requirements.governingBoundaryElementId, 'root');
  assert.deepEqual(requirements.requiredRoles,
    ['accountableProcessOwner', 'assessmentLead', 'technicalAuthority', 'governingBoundaryAuthority']);
  assert.equal(findNearestCommonGoverningBoundary(tree, ['a1', 'a']), 'a');
});

test('complete role-based record becomes effective and applies only the approved proposal', () => {
  const record = approvedRecord();
  const assessment = assessRightSizingApproval(record, baseProposal, context);
  assert.equal(assessment.valid, true);
  const evaluated = evaluateRightSizingApprovals([baseProposal], [record], context);
  assert.equal(evaluated.effectiveCount, 1);
  assert.equal(evaluated.levels[19], 'basic');
});

test('approval expires and any relevant assessment change invalidates its snapshot', () => {
  const record = approvedRecord();
  assert.equal(assessRightSizingApproval(record, baseProposal, { ...context, asOfDate: '2027-01-01' }).status, 'expired');
  const changed = assessRightSizingApproval(record, baseProposal, { ...context, scores: { ...context.scores, M5: 4 } });
  assert.equal(changed.status, 'invalidated');
  assert.ok(changed.reasons.includes('assessment-or-scope-changed'));
  const impossibleDate = assessRightSizingApproval(approvedRecord(baseProposal, { reviewDate: '2026-99-99' }), baseProposal, context);
  assert.equal(impossibleDate.valid, false);
  assert.ok(impossibleDate.reasons.includes('review-date-required'));
});

test('mandatory floors, closure, allocation, and binding assurance are non-overridable', () => {
  const record = approvedRecord();
  const scenarios = [
    { proposal: baseProposal, context: { ...context, activeFloors: [{ processId: 19, minLevel: 'standard' }] }, reason: 'mandatory-floor-protected' },
    { proposal: { ...baseProposal, nonOverridableConstraint: true }, context, reason: 'mandatory-closure-protected' },
    { proposal: { ...baseProposal, allocationRuleProtected: true }, context, reason: 'safety-security-allocation-protected' },
    { proposal: { ...baseProposal, bindingAssuranceFloorProtected: true }, context, reason: 'binding-assurance-floor-protected' }
  ];
  for (const scenario of scenarios) {
    const scenarioRecord = { ...record, snapshot: createRightSizingApprovalSnapshot(scenario.proposal, scenario.context) };
    const result = assessRightSizingApproval(scenarioRecord, scenario.proposal, scenario.context);
    assert.equal(result.valid, false);
    assert.ok(result.reasons.includes(scenario.reason));
  }
});

test('incomplete evidence, authority basis, and incorrect cross-element boundary fail closed', () => {
  const proposal = { ...baseProposal, scopeElementIds: ['a1', 'b'] };
  const record = approvedRecord(proposal, {
    snapshot: createRightSizingApprovalSnapshot(proposal, context),
    governingBoundaryElementId: 'a',
    residualRisks: '',
    approvals: {
      accountableProcessOwner: { identity: 'Person A', authorityBasis: '' },
      assessmentLead: { identity: 'Person B', authorityBasis: 'Assessment authority' },
      independentAssuranceAuthority: { identity: 'Person C', authorityBasis: 'Independent authority' },
      governingBoundaryAuthority: { identity: 'Person D', authorityBasis: 'Boundary authority' }
    }
  });
  const result = assessRightSizingApproval(record, proposal, context);
  assert.equal(result.valid, false);
  assert.ok(result.reasons.includes('residualRisks-required'));
  assert.ok(result.reasons.includes('accountableProcessOwner-approval-required'));
  assert.ok(result.reasons.includes('nearest-common-governing-boundary-required'));
});

test('import validation rejects malformed approval containers and decisions', () => {
  assert.deepEqual(validateRightSizingApprovalRecords('bad'), ['rightSizingApprovalRecords must be an array']);
  const errors = validateRightSizingApprovalRecords([{ decision: 'maybe', processId: null, from: 'x', to: 'basic' }]);
  assert.ok(errors.some(error => error.includes('invalid decision')));
  assert.ok(errors.some(error => error.includes('invalid levels')));
  assert.ok(errors.some(error => error.includes('approvals must be an object')));
});

test('full engine applies a current approval then re-runs mandatory closure', () => {
  const scores = Object.fromEntries(Array.from({ length: 16 }, (_, index) => [`M${index + 1}`, 5]));
  Object.assign(scores, { M1: 1, M2: 1, M4: 1, M5: 1, M6: 1, M7: 1, M8: 1, M11: 1, M12: 1, M16: 5 });
  const first = runFullAssessment(scores, undefined, { activeElementId: 'root', assessmentTree: tree });
  const proposal = first.rightSizingProposals[0];
  assert.ok(proposal, 'fixture must produce a closure-feasible proposal');
  const approvalContext = {
    ...context,
    assessmentTree: tree,
    scores,
    activeFloors: first.activeFloors,
    normativeLevels: first.normativeLevels
  };
  const requirements = getRightSizingApprovalRequirements(proposal, tree);
  const record = {
    ...approvedRecord(proposal),
    id: `RS-${proposal.processId}`,
    processId: proposal.processId,
    scopeElementIds: requirements.scopeElementIds,
    governingBoundaryElementId: requirements.governingBoundaryElementId,
    from: proposal.from,
    to: proposal.proposedTo,
    snapshot: createRightSizingApprovalSnapshot(proposal, approvalContext),
    approvals: Object.fromEntries(requirements.requiredRoles.map(role => [role, { identity: `${role} person`, authorityBasis: `${role} delegated authority` }]))
  };
  const second = runFullAssessment(scores, undefined, {
    activeElementId: 'root',
    assessmentTree: tree,
    rightSizingApprovalRecords: [record]
  });
  assert.equal(second.effectiveRightSizingApprovalCount, 1);
  assert.equal(second.levels[proposal.processId], proposal.proposedTo);
  assert.equal(second.violations.filter(violation => violation.type === 'HC').length, 0);
});
