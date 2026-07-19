/**
 * Inheritance Engine Test Suite — Hierarchical System Element Tailoring (v3.3)
 *
 * Tests metric inheritance, down-tailoring detection, safety override
 * propagation, peer interface consistency, and Quick/Inherited assessment modes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    getInheritedMetrics,
    createChildAssessment,
    getEffectiveScores,
    detectDownTailoring,
    validateDownTailoring,
    assessSafetyAllocationDecision,
    propagateSafetyOverrides,
    checkPeerInterfaceConsistency,
    assessNeedForSeparateAssessment,
    runChildAssessment,
    generateCOTSJustification
} from '../src/utils/inheritance-engine.js';

import { runFullAssessment } from '../src/utils/assessment-engine.js';
import { assessHierarchyDisposition } from '../src/utils/hierarchy-dispositions.js';

const METRIC_IDS = [
    'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8',
    'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16'
];

function makeScores(defaultValue = 3) {
    return Object.fromEntries(METRIC_IDS.map(id => [id, defaultValue]));
}

function makeSafetyAllocationDecision(overrides = {}) {
    return {
        status: 'confirmed',
        allocationDisposition: 'not-allocated-to-child',
        retainedResponsibility: 'parent',
        authority: 'System Safety Authority',
        evidenceRef: 'SAF-ALLOC-001',
        interfaceAssumptionsRef: 'IF-SAF-001',
        rationale: 'Hazard-control responsibility and verification evidence remain at the parent boundary.',
        reviewDate: '2026-07-10',
        ...overrides
    };
}

function makeHierarchyDisposition(metricId, overrides = {}) {
    return {
        status: 'confirmed',
        outcome: metricId === 'M8' ? 'lower-consequence-justified' : 'responsibility-retained-elsewhere',
        rationale: metricId === 'M8'
            ? 'The child boundary has a lower credible security consequence.'
            : 'The parent retains the external assurance obligation.',
        ownerApprover: metricId === 'M8' ? 'Security Authority' : 'Assurance Authority',
        reviewDate: '2026-07-11',
        decisionBasisRef: '',
        evidenceRef: '',
        ...overrides
    };
}

// ========== Metric Inheritance Tests ==========

test('getInheritedMetrics returns all 16 parent metrics', () => {
    const parent = makeScores(4);
    const inherited = getInheritedMetrics(parent);
    assert.equal(Object.keys(inherited).length, 16);
    for (const m of METRIC_IDS) {
        assert.equal(inherited[m], 4, `${m} should be inherited as 4`);
    }
});

test('createChildAssessment — Full type: no metrics inherited', () => {
    const parent = makeScores(4);
    const child = createChildAssessment('root', 'Signalling', 'full', parent);
    assert.equal(child.assessmentType, 'full');
    assert.equal(child.parentId, 'root');
    assert.equal(child.name, 'Signalling');
    for (const m of METRIC_IDS) {
        assert.equal(child.inheritedMetrics[m], false, `Full: ${m} should NOT be inherited`);
    }
    assert.equal(child.scores.M1, 4, 'Scores start with parent defaults');
});

test('createChildAssessment — Quick type explicitly reviews M8 security and M15 assurance', () => {
    const parent = makeScores(4);
    const child = createChildAssessment('root', 'Fare Collection', 'quick', parent);
    assert.equal(child.assessmentType, 'quick');
    // M1-M6 plus M8/M15 should NOT be inherited (overridable)
    for (const m of ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'M15']) {
        assert.equal(child.inheritedMetrics[m], false, `Quick: ${m} should be overridable`);
    }
    for (const m of ['M7', 'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M16']) {
        assert.equal(child.inheritedMetrics[m], true, `Quick: ${m} should be inherited`);
    }
});

test('createChildAssessment — Inherited type: all metrics inherited', () => {
    const parent = makeScores(4);
    const child = createChildAssessment('root', 'COTS Switch', 'inherited', parent);
    assert.equal(child.assessmentType, 'inherited');
    for (const m of METRIC_IDS) {
        assert.equal(child.inheritedMetrics[m], true, `Inherited: ${m} should be inherited`);
    }
});

test('getEffectiveScores merges inherited parent + child overrides', () => {
    const parent = makeScores(4);
    const child = createChildAssessment('root', 'WMS', 'quick', parent);
    // Override M1 and M5
    child.scores.M1 = 2;
    child.scores.M5 = 1;
    const effective = getEffectiveScores(child, parent);
    assert.equal(effective.M1, 2, 'Overridden M1 should use child value');
    assert.equal(effective.M5, 1, 'Overridden M5 should use child value');
    assert.equal(effective.M9, 4, 'Inherited M9 should use parent value');
    assert.equal(effective.M16, 4, 'Inherited M16 should use parent value');
});

// ========== Down-Tailoring Detection Tests ==========

test('detectDownTailoring identifies processes at lower level than parent', () => {
    const parentLevels = { 9: 'comprehensive', 12: 'standard', 18: 'comprehensive', 25: 'comprehensive' };
    const childLevels = { 9: 'basic', 12: 'standard', 18: 'basic', 25: 'standard' };

    const dt = detectDownTailoring(parentLevels, childLevels);

    assert.equal(dt.length, 3, 'Should detect 3 down-tailored processes');
    const p9 = dt.find(d => d.processId === 9);
    assert.equal(p9.delta, 2, 'P9: Comprehensive→Basic = delta 2');
    assert.equal(p9.requiresSponsor, true, 'P9: 2-level drop requires sponsor');

    const p25 = dt.find(d => d.processId === 25);
    assert.equal(p25.delta, 1, 'P25: Comprehensive→Standard = delta 1');
    assert.equal(p25.requiresSponsor, false, 'P25: 1-level drop does not require sponsor');
});

test('detectDownTailoring returns empty when child >= parent', () => {
    const parentLevels = { 9: 'basic', 12: 'standard' };
    const childLevels = { 9: 'standard', 12: 'comprehensive' };
    const dt = detectDownTailoring(parentLevels, childLevels);
    assert.equal(dt.length, 0, 'No down-tailoring when child >= parent');
});

// ========== Down-Tailoring Validation Tests ==========

test('validateDownTailoring rejects missing justifications', () => {
    const downTailored = [
        { processId: 9, delta: 2, requiresSponsor: true },
        { processId: 18, delta: 1, requiresSponsor: false }
    ];
    const justifications = [
        { processId: 9, justification: 'Simple element', approver: 'Sponsor' }
    ];
    const result = validateDownTailoring(downTailored, justifications);
    assert.equal(result.valid, false, 'Should be invalid — missing P18 justification');
    assert.ok(result.missing.includes(18));
});

test('validateDownTailoring rejects 2-level drop without sponsor', () => {
    const downTailored = [{ processId: 9, delta: 2, requiresSponsor: true }];
    const justifications = [
        { processId: 9, justification: 'Reason', approver: 'PM' }
    ];
    const result = validateDownTailoring(downTailored, justifications);
    assert.equal(result.valid, false, 'PM approval insufficient for 2-level drop');
    assert.ok(result.incomplete.includes(9));
});

test('validateDownTailoring accepts complete justifications', () => {
    const downTailored = [
        { processId: 9, delta: 1, requiresSponsor: false },
        { processId: 18, delta: 1, requiresSponsor: false }
    ];
    const justifications = [
        { processId: 9, justification: 'Low complexity', approver: 'PM' },
        { processId: 18, justification: 'Internal only', approver: 'PM' }
    ];
    const result = validateDownTailoring(downTailored, justifications);
    assert.equal(result.valid, true, 'All justifications complete');
});

test('P19/P20 down-tailoring validation requires a confirmed safety-allocation decision at a safety-relevant parent boundary', () => {
    const downTailored = [
        { processId: 19, delta: 1, requiresSponsor: false },
        { processId: 20, delta: 1, requiresSponsor: false }
    ];
    const justifications = downTailored.map(({ processId }) => ({
        processId,
        justification: 'Element boundary is narrower',
        approver: 'Safety Authority'
    }));

    const blocked = validateDownTailoring(downTailored, justifications, { parentM5: 4 });
    assert.equal(blocked.valid, false);
    assert.deepEqual(blocked.safetyAllocationBlocked, [19, 20]);

    const allowed = validateDownTailoring(downTailored, justifications, {
        parentM5: 4,
        safetyAllocationDecision: makeSafetyAllocationDecision()
    });
    assert.equal(allowed.valid, true);
    assert.deepEqual(allowed.safetyAllocationBlocked, []);
});

// ========== Safety Override Propagation Tests ==========

test('Safety override propagates when parent M5>=4 and child M5<4 without analysis', () => {
    const parent = makeScores(3);
    parent.M5 = 5;
    const child = makeScores(3);
    child.M5 = 1;
    const result = propagateSafetyOverrides(parent, child, false);
    assert.equal(result.propagated, true, 'Should propagate safety override');
    assert.ok(result.warnings.some(w => w.type === 'error' && w.metric === 'M5'));
});

test('Legacy independent-safety-analysis boolean is visible but cannot authorize lower inherited M5', () => {
    const parent = makeScores(3);
    parent.M5 = 5;
    const child = makeScores(3);
    child.M5 = 1;
    const result = propagateSafetyOverrides(parent, child, true);
    assert.equal(result.propagated, true);
    assert.equal(result.safetyAllocationDecision.status, 'legacy-unconfirmed');
    assert.equal(result.safetyAllocationDecision.legacyMigrationInput, true);
    assert.ok(result.warnings.some(w => w.type === 'error' && /legacy/i.test(w.message)));
});

test('Confirmed structured safety allocation permits lower inherited M5', () => {
    const parent = makeScores(3);
    parent.M5 = 5;
    const child = makeScores(3);
    child.M5 = 1;
    const result = propagateSafetyOverrides(parent, child, makeSafetyAllocationDecision());
    assert.equal(result.propagated, false);
    assert.equal(result.safetyAllocationDecision.valid, true);
    assert.ok(result.warnings.some(w => w.type === 'info' && w.metric === 'M5'));
});

test('Safety allocation validation requires exact disposition, retained responsibility, evidence, interfaces, rationale, and real review date', () => {
    assert.equal(assessSafetyAllocationDecision(makeSafetyAllocationDecision()).valid, true);
    const incomplete = assessSafetyAllocationDecision(makeSafetyAllocationDecision({
        allocationDisposition: 'allocated-to-child',
        evidenceRef: '',
        interfaceAssumptionsRef: '',
        reviewDate: '2026-02-30'
    }));
    assert.equal(incomplete.valid, false);
    assert.ok(incomplete.missingFields.includes('allocationDisposition'));
    assert.ok(incomplete.missingFields.includes('evidenceRef'));
    assert.ok(incomplete.missingFields.includes('interfaceAssumptionsRef'));
    assert.ok(incomplete.missingFields.includes('reviewDate'));
});

test('Legacy security boolean remains visible but never approves a lower child security score', () => {
    const parent = makeScores(3);
    parent.M8 = 5;
    const child = makeScores(3);
    child.M8 = 2;
    const result = propagateSafetyOverrides(parent, child, null, true);
    assert.ok(result.warnings.some(w =>
        w.type === 'error' &&
        w.metric === 'M8' &&
        /legacy/i.test(w.message)
    ));
    assert.deepEqual(result.blockedMetrics, ['M8']);
    assert.equal(result.securityHierarchyDisposition.status, 'legacy-unconfirmed');
});

test('Lower child M8 requires a complete confirmed disposition and optional references are not required', () => {
    assert.equal(assessHierarchyDisposition('M8', makeHierarchyDisposition('M8')).valid, true);
    const incomplete = assessHierarchyDisposition('M8', makeHierarchyDisposition('M8', {
        status: 'draft', rationale: '', reviewDate: '2026-02-30'
    }));
    assert.equal(incomplete.valid, false);
    assert.ok(incomplete.missingFields.includes('status'));
    assert.ok(incomplete.missingFields.includes('rationale'));
    assert.ok(incomplete.missingFields.includes('reviewDate'));

    const parent = makeScores(3);
    parent.M8 = 5;
    const child = makeScores(3);
    child.M8 = 2;
    const blocked = propagateSafetyOverrides(parent, child, null, incomplete);
    assert.deepEqual(blocked.blockedMetrics, ['M8']);
    const allowed = propagateSafetyOverrides(parent, child, null, makeHierarchyDisposition('M8'));
    assert.deepEqual(allowed.blockedMetrics, []);
    assert.ok(allowed.warnings.some(w => w.metric === 'M8' && w.type === 'info' && /does not verify/i.test(w.message)));
});

test('Lower child M15 requires a complete confirmed disposition and legacy boolean cannot authorize it', () => {
    const parent = makeScores(3);
    parent.M15 = 5;
    const child = makeScores(3);
    child.M15 = 2;
    const unresolved = propagateSafetyOverrides(parent, child, null, null, true);
    assert.ok(unresolved.warnings.some(w => w.metric === 'M15' && w.type === 'error' && /legacy/i.test(w.message)));
    assert.deepEqual(unresolved.blockedMetrics, ['M15']);
    const resolved = propagateSafetyOverrides(parent, child, null, null, makeHierarchyDisposition('M15'));
    assert.ok(resolved.warnings.some(w => w.metric === 'M15' && w.type === 'info'));
    assert.deepEqual(resolved.blockedMetrics, []);
});

test('M8 and M15 dispositions govern every lower child judgment, not only critical parent scores', () => {
    const parent = makeScores(3);
    const child = makeScores(3);
    child.M8 = 2;
    child.M15 = 2;

    const blocked = propagateSafetyOverrides(parent, child);
    assert.deepEqual(blocked.blockedMetrics.sort(), ['M15', 'M8']);

    const allowed = propagateSafetyOverrides(
        parent,
        child,
        null,
        makeHierarchyDisposition('M8'),
        makeHierarchyDisposition('M15')
    );
    assert.deepEqual(allowed.blockedMetrics, []);
});

test('runChildAssessment fails closed to parent M8/M15 unless dispositions are confirmed', () => {
    const parentScores = makeScores(3);
    parentScores.M8 = 5;
    parentScores.M15 = 5;
    const parentLevels = Object.fromEntries(Array.from({ length: 22 }, (_, index) => [index + 9, 'standard']));
    const child = createChildAssessment('root', 'Child', 'full', parentScores);
    child.scores.M8 = 2;
    child.scores.M15 = 2;

    const blocked = runChildAssessment(child, parentScores, parentLevels);
    assert.equal(blocked.effectiveScores.M8, 5);
    assert.equal(blocked.effectiveScores.M15, 5);
    assert.deepEqual(blocked.safetyCheck.blockedMetrics.sort(), ['M15', 'M8']);

    child.securityHierarchyDisposition = makeHierarchyDisposition('M8');
    child.assuranceHierarchyDisposition = makeHierarchyDisposition('M15');
    const allowed = runChildAssessment(child, parentScores, parentLevels);
    assert.equal(allowed.effectiveScores.M8, 2);
    assert.equal(allowed.effectiveScores.M15, 2);
    assert.deepEqual(allowed.safetyCheck.blockedMetrics, []);
});

test('No safety propagation when parent M5 < 4', () => {
    const parent = makeScores(3);
    parent.M5 = 3;
    const child = makeScores(3);
    child.M5 = 1;
    const result = propagateSafetyOverrides(parent, child, false);
    assert.equal(result.propagated, false, 'No propagation when parent M5 < 4');
    assert.equal(result.warnings.length, 0);
});

// ========== Peer Interface Consistency Tests ==========

test('Peer interface check detects 2-level CM difference', () => {
    const levelA = { 13: 'comprehensive', 24: 'standard', 25: 'comprehensive' };
    const levelB = { 13: 'basic', 24: 'standard', 25: 'standard' };
    const violations = checkPeerInterfaceConsistency(levelA, levelB);
    assert.equal(violations.length, 1, 'Should detect CM incompatibility');
    assert.equal(violations[0].processId, 13);
    assert.equal(violations[0].delta, 2);
});

test('Peer interface check passes when within one level', () => {
    const levelA = { 13: 'comprehensive', 24: 'comprehensive', 25: 'comprehensive' };
    const levelB = { 13: 'standard', 24: 'standard', 25: 'standard' };
    const violations = checkPeerInterfaceConsistency(levelA, levelB);
    assert.equal(violations.length, 0, 'All within one level — should pass');
});

// ========== Separate Assessment Threshold Tests ==========

test('Safety difference triggers full assessment recommendation', () => {
    const parent = makeScores(3);
    const result = assessNeedForSeparateAssessment(parent, { hasSafetyDifference: true });
    assert.equal(result.needsAssessment, true);
    assert.equal(result.recommendedType, 'full');
});

test('3+ metric differences triggers quick assessment', () => {
    const parent = makeScores(3);
    const result = assessNeedForSeparateAssessment(parent, { metricDifferences: 4 });
    assert.equal(result.needsAssessment, true);
    assert.equal(result.recommendedType, 'quick');
});

test('No differences returns inherited recommendation', () => {
    const parent = makeScores(3);
    const result = assessNeedForSeparateAssessment(parent, {});
    assert.equal(result.needsAssessment, false);
    assert.equal(result.recommendedType, 'inherited');
});

// ========== runChildAssessment Integration Test ==========

test('runChildAssessment produces complete hierarchical assessment', () => {
    const parentScores = makeScores(4);
    parentScores.M5 = 3; // No safety override to propagate
    const parentResult = runFullAssessment(parentScores);

    const child = createChildAssessment('root', 'WMS Subsystem', 'quick', parentScores);
    // Override complexity metrics low
    child.scores.M1 = 2;
    child.scores.M2 = 2;
    child.scores.M3 = 2;
    child.scores.M4 = 2;
    child.scores.M5 = 1;
    child.scores.M6 = 2;

    const childResult = runChildAssessment(child, parentScores, parentResult.levels);

    // Should have down-tailored processes
    assert.ok(childResult.downTailored.length > 0, 'Should detect down-tailored processes');

    assert.equal(childResult.inheritanceSummary.inherited, 8, '8 metrics inherited (Quick)');
    assert.equal(childResult.inheritanceSummary.overridden, 8, '8 metrics explicitly reviewed');

    // Should have valid levels
    assert.ok(childResult.levels, 'Should have process levels');
    assert.ok(Object.keys(childResult.levels).length > 0, 'Should have at least one level');
});

test('runChildAssessment blocks P19/P20 down-tailoring and reruns closure without a confirmed safety allocation', () => {
    const parentScores = makeScores(1);
    parentScores.M5 = 4;
    const parentLevels = Object.fromEntries(Array.from({ length: 22 }, (_, index) => [index + 9, 'basic']));
    parentLevels[19] = 'comprehensive';
    parentLevels[20] = 'comprehensive';

    const child = createChildAssessment('root', 'Safety-related child', 'quick', parentScores);
    child.scores.M5 = 2;
    child.hasIndependentSafetyAnalysis = true; // legacy-only migration input
    const result = runChildAssessment(child, parentScores, parentLevels);

    assert.equal(result.effectiveScores.M5, 4, 'Invalid legacy input must retain the parent M5');
    assert.equal(result.levels[19], 'comprehensive');
    assert.equal(result.levels[20], 'comprehensive');
    assert.deepEqual(result.safetyAllocationBlocks.map(block => block.processId), [19, 20]);
    assert.deepEqual(
        result.activeFloors.filter(floor => floor.overrideId === 'parent_safety_allocation_boundary').map(floor => floor.processId),
        [19, 20]
    );
    assert.ok(result.fixes.some(fix => [13, 25, 27].includes(fix.processId)), 'Restored P19 Comprehensive must rerun mandatory closure');
    assert.ok(!result.downTailored.some(item => [19, 20].includes(item.processId)));
    assert.ok(!result.rightSizingProposals.some(proposal => [19, 20].includes(proposal.processId)), 'Restored hierarchy floors must not be reviewable reductions');
    assert.ok(!result.blockedRightSizingCandidates.some(proposal => [19, 20].includes(proposal.processId)), 'Hierarchy-blocked processes use safety allocation records, not stale budget candidates');
    assert.equal(result.proposedRightSizedLevels[19], 'comprehensive');
    assert.equal(result.proposedRightSizedLevels[20], 'comprehensive');
    assert.equal(
        result.proposalBudgetStatus.comprehensiveCount,
        Object.values(result.proposedRightSizedLevels).filter(level => level === 'comprehensive').length,
        'Proposal budget metadata must describe the recomputed restored profile'
    );
});

test('runChildAssessment permits proposed P19/P20 down-tailoring with a confirmed safety allocation decision', () => {
    const parentScores = makeScores(1);
    parentScores.M5 = 4;
    const parentLevels = Object.fromEntries(Array.from({ length: 22 }, (_, index) => [index + 9, 'basic']));
    parentLevels[19] = 'comprehensive';
    parentLevels[20] = 'comprehensive';

    const child = createChildAssessment('root', 'Allocated child', 'quick', parentScores);
    child.scores.M5 = 2;
    child.safetyAllocationDecision = makeSafetyAllocationDecision();
    const result = runChildAssessment(child, parentScores, parentLevels);

    assert.equal(result.effectiveScores.M5, 2);
    assert.deepEqual(result.safetyAllocationBlocks, []);
    assert.ok(result.downTailored.some(item => item.processId === 19));
    assert.ok(result.downTailored.some(item => item.processId === 20));
});

// ========== COTS Justification Tests ==========

test('COTS justification generates appropriate text', () => {
    const scores = { M1: 1, M5: 1 };
    const text = generateCOTSJustification('Network Switch', 25, 'comprehensive', 'basic', scores);
    assert.ok(text.includes('Network Switch'), 'Should include element name');
    assert.ok(text.includes('COTS'), 'Should mention COTS');
    assert.ok(text.includes('no safety impact'), 'Should note no safety impact for M5=1');
    assert.ok(text.includes('Process 25'), 'Should include process ID');
});

// ========== Multi-Level Hierarchy Test ==========

test('Multi-level hierarchy: grandparent → parent → child inheritance works', () => {
    // Grandparent: high complexity program
    const gpScores = makeScores(4);
    gpScores.M5 = 5;
    const gpResult = runFullAssessment(gpScores);

    // Parent: moderate subsystem (Quick assessment)
    const parent = createChildAssessment('root', 'Civil Works', 'quick', gpScores);
    parent.scores.M5 = 3;
    parent.scores.M1 = 3;
    parent.scores.M2 = 3;
    const parentEffective = getEffectiveScores(parent, gpScores);
    const parentResult = runFullAssessment(parentEffective);

    // Child: simple component under parent
    const child = createChildAssessment(parent.id, 'Signage', 'quick', parentEffective);
    child.scores.M1 = 1;
    child.scores.M5 = 1;
    child.scores.M6 = 1;
    const childResult = runChildAssessment(child, parentEffective, parentResult.levels);

    // Child should produce valid levels
    assert.ok(childResult.levels, 'Child should have process levels');
    assert.ok(Object.keys(childResult.levels).length > 0, 'Child should have derived levels');

    // Safety propagation: Parent M5=3, so no propagation to child
    assert.equal(childResult.safetyCheck.propagated, false,
        'No safety propagation needed (parent M5=3 < 4)');

    assert.equal(childResult.inheritanceSummary.inherited, 8, '8 metrics inherited (Quick)');
    assert.equal(childResult.inheritanceSummary.overridden, 8, '8 metrics explicitly reviewed');

    // Effective scores should reflect child overrides merged with inherited parent values
    assert.equal(childResult.effectiveScores.M1, 1, 'Child M1 override applied');
    assert.equal(childResult.effectiveScores.M5, 1, 'Child M5 override applied');
    assert.equal(childResult.effectiveScores.M9, 4, 'M9 inherited from grandparent through parent');
});
