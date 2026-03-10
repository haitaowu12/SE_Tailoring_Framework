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
    checkOutputSufficiency,
    propagateSafetyOverrides,
    checkPeerInterfaceConsistency,
    assessNeedForSeparateAssessment,
    runChildAssessment,
    generateCOTSJustification
} from '../src/utils/inheritance-engine.js';

import { runFullAssessment } from '../src/utils/assessment-engine.js';

const METRIC_IDS = [
    'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8',
    'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16'
];

function makeScores(defaultValue = 3) {
    return Object.fromEntries(METRIC_IDS.map(id => [id, defaultValue]));
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

test('createChildAssessment — Quick type: M7-M16 inherited, M1-M6 overridable', () => {
    const parent = makeScores(4);
    const child = createChildAssessment('root', 'Fare Collection', 'quick', parent);
    assert.equal(child.assessmentType, 'quick');
    // M1-M6 should NOT be inherited (overridable)
    for (const m of ['M1', 'M2', 'M3', 'M4', 'M5', 'M6']) {
        assert.equal(child.inheritedMetrics[m], false, `Quick: ${m} should be overridable`);
    }
    // M7-M16 should be inherited
    for (const m of ['M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16']) {
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
        { processId: 9, justification: 'Simple element', outputSufficiency: 'Confirmed', approver: 'Sponsor' }
    ];
    const result = validateDownTailoring(downTailored, justifications);
    assert.equal(result.valid, false, 'Should be invalid — missing P18 justification');
    assert.ok(result.missing.includes(18));
});

test('validateDownTailoring rejects 2-level drop without sponsor', () => {
    const downTailored = [{ processId: 9, delta: 2, requiresSponsor: true }];
    const justifications = [
        { processId: 9, justification: 'Reason', outputSufficiency: 'OK', approver: 'PM' }
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
        { processId: 9, justification: 'Low complexity', outputSufficiency: 'Confirmed', approver: 'PM' },
        { processId: 18, justification: 'Internal only', outputSufficiency: 'Confirmed', approver: 'PM' }
    ];
    const result = validateDownTailoring(downTailored, justifications);
    assert.equal(result.valid, true, 'All justifications complete');
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

test('Safety override accepted when child has independent safety analysis', () => {
    const parent = makeScores(3);
    parent.M5 = 5;
    const child = makeScores(3);
    child.M5 = 1;
    const result = propagateSafetyOverrides(parent, child, true);
    assert.equal(result.propagated, false, 'Should not propagate with independent analysis');
    assert.ok(result.warnings.some(w => w.type === 'info' && w.metric === 'M5'));
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

// ========== Output Sufficiency Tests ==========

test('Output sufficiency returns equivalents for Integration', () => {
    const result = checkOutputSufficiency(24, 'basic');
    assert.ok(result);
    assert.equal(result.outputRequired, 'Interface Control Documents');
    assert.ok(result.childEquivalent.includes('Project Notebook'));
});

test('Output sufficiency returns null for unmapped processes', () => {
    const result = checkOutputSufficiency(30, 'basic'); // Disposal
    assert.equal(result, null, 'No sufficiency map for Disposal');
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

    // Inheritance summary should show 10 inherited, 6 overridden
    assert.equal(childResult.inheritanceSummary.inherited, 10, '10 metrics inherited (Quick)');
    assert.equal(childResult.inheritanceSummary.overridden, 6, '6 metrics overridden');

    // Should have valid levels
    assert.ok(childResult.levels, 'Should have process levels');
    assert.ok(Object.keys(childResult.levels).length > 0, 'Should have at least one level');
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

    // Inheritance summary: Quick assessment = 10 inherited, 6 overridden
    assert.equal(childResult.inheritanceSummary.inherited, 10, '10 metrics inherited (Quick)');
    assert.equal(childResult.inheritanceSummary.overridden, 6, '6 metrics overridden');

    // Effective scores should reflect child overrides merged with inherited parent values
    assert.equal(childResult.effectiveScores.M1, 1, 'Child M1 override applied');
    assert.equal(childResult.effectiveScores.M5, 1, 'Child M5 override applied');
    assert.equal(childResult.effectiveScores.M9, 4, 'M9 inherited from grandparent through parent');
});
