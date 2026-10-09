import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveProtectedAncestry, runChildAssessment } from '../src/utils/inheritance-engine.js';
import { getDriverAttribution } from '../src/utils/assessment-engine.js';

const metricIds = Array.from({ length: 16 }, (_, index) => `M${index + 1}`);
const makeScores = (overrides = {}) => ({ ...Object.fromEntries(metricIds.map(id => [id, 1])), ...overrides });
function node(id, parentId, scores = makeScores()) {
    return { id, parentId, scores, childIds: [], inheritedMetrics: {}, assessmentType: 'full',
        metricAssessments: Object.fromEntries(Object.entries(scores).map(([id, score]) => [id, { score, status: 'assessed', definitionVersion: 3, qualifiers: [] }])),
        assuranceObligations: [] };
}
function chain(rootOverrides = { M5: 5, M8: 5, M15: 5 }) {
    return { rootId: 'root', activeId: 'grandchild', nodes: {
        root: node('root', null, makeScores(rootOverrides)),
        child: node('child', 'root'),
        grandchild: node('grandchild', 'child')
    } };
}
function safetyDecision() {
    return { status: 'confirmed', allocationDisposition: 'not-allocated-to-child', retainedResponsibility: 'parent',
        authority: 'Synthetic safety role', evidenceRef: 'SAF-1', interfaceAssumptionsRef: 'IF-1', rationale: 'Responsibility remains at parent.', reviewDate: '2026-10-09' };
}
function disposition(metricId) {
    return { status: 'confirmed', outcome: metricId === 'M8' ? 'lower-consequence-justified' : 'lower-demand-justified',
        rationale: 'Confirmed child boundary.', ownerApprover: 'Synthetic accountable role', reviewDate: '2026-10-09' };
}
const basicLevels = Object.fromEntries(Array.from({ length: 22 }, (_, index) => [index + 9, 'basic']));

test('grandchild retains protected root M5, M8, and M15 without any intermediate cached assessment', () => {
    const tree = chain();
    const before = structuredClone(tree);
    const resolution = resolveProtectedAncestry(tree, 'grandchild');
    assert.equal(resolution.valid, true);
    assert.equal(resolution.complete, false);
    for (const metricId of ['M5', 'M8', 'M15']) {
        assert.equal(resolution.effectiveScores[metricId], 5);
        assert.equal(resolution.effectiveParentScores[metricId], 5);
        assert(resolution.blockedMetrics.includes(metricId));
    }
    assert.deepEqual(resolution.blockedElementIds, ['child', 'grandchild']);
    assert.deepEqual(resolution.path, ['root', 'child', 'grandchild']);
    assert.equal(resolution.boundaryChecks.length, 2);
    assert.deepEqual(tree, before, 'raw scores, dispositions, and absent results remain untouched');
});

test('fresh root changes supersede stale intermediate results and change effective snapshot inputs', () => {
    const tree = chain({ M5: 1, M8: 1, M15: 1 });
    tree.nodes.child.assessmentResult = { effectiveScores: makeScores(), levels: basicLevels };
    const initial = resolveProtectedAncestry(tree, 'grandchild');
    assert.equal(initial.effectiveScores.M5, 1);
    Object.assign(tree.nodes.root.scores, { M5: 5, M8: 4, M15: 3 });
    const changed = resolveProtectedAncestry(tree, 'grandchild');
    assert.equal(changed.effectiveScores.M5, 5);
    assert.equal(changed.effectiveScores.M8, 4);
    assert.equal(changed.effectiveScores.M15, 3);
    assert.notDeepEqual(changed.effectiveScores, initial.effectiveScores);
    assert.equal(tree.nodes.child.assessmentResult.effectiveScores.M5, 1, 'resolver neither trusts nor rewrites cached results');
});

test('confirmed safety, security, and assurance boundaries legitimately stop ancestor protection', () => {
    const tree = chain();
    tree.nodes.child.safetyAllocationDecision = safetyDecision();
    tree.nodes.child.securityHierarchyDisposition = disposition('M8');
    tree.nodes.child.assuranceHierarchyDisposition = disposition('M15');
    const result = resolveProtectedAncestry(tree, 'grandchild');
    assert.equal(result.valid, true);
    assert.equal(result.complete, true);
    assert.deepEqual(result.blockedMetrics, []);
    for (const metricId of ['M5', 'M8', 'M15']) assert.equal(result.effectiveScores[metricId], 1);
    assert(result.warnings.some(warning => warning.type === 'info' && warning.elementId === 'child'));
});

test('a boundary changes the downstream protected value rather than taking a maximum over every ancestor', () => {
    const tree = chain({ M5: 5, M8: 5, M15: 5 });
    Object.assign(tree.nodes.child.scores, { M5: 4, M8: 2, M15: 3 });
    tree.nodes.child.safetyAllocationDecision = safetyDecision();
    tree.nodes.child.securityHierarchyDisposition = disposition('M8');
    tree.nodes.child.assuranceHierarchyDisposition = disposition('M15');
    const result = resolveProtectedAncestry(tree, 'grandchild');
    assert.equal(result.effectiveScores.M5, 4);
    assert.equal(result.effectiveScores.M8, 2);
    assert.equal(result.effectiveScores.M15, 3);
    assert.deepEqual(result.blockedElementIds, ['grandchild']);
});

test('a valid target boundary does not hide an unresolved reduction earlier on the path', () => {
    const tree = chain({ M5: 5 });
    tree.nodes.grandchild.safetyAllocationDecision = safetyDecision();
    const result = resolveProtectedAncestry(tree, 'grandchild');
    assert.equal(result.effectiveScores.M5, 1, 'target boundary is legitimate');
    assert.equal(result.complete, false, 'ancestor reduction still requires resolution');
    assert.deepEqual(result.blockedMetrics, ['M5']);
    assert.deepEqual(result.blockedElementIds, ['child']);
});

test('legacy booleans and draft dispositions do not create effective ancestry boundaries', () => {
    const tree = chain();
    Object.assign(tree.nodes.child, { hasIndependentSafetyAnalysis: true, hasIndependentSecurityAnalysis: true, hasScopedAssuranceDecision: true });
    tree.nodes.grandchild.securityHierarchyDisposition = { ...disposition('M8'), status: 'draft' };
    const result = resolveProtectedAncestry(tree, 'grandchild');
    for (const metricId of ['M5', 'M8', 'M15']) assert.equal(result.effectiveScores[metricId], 5);
    assert.equal(result.blockedElementIds.length, 2);
});

test('M15 protection carries only the metric; ancestor obligation scope is not inherited', () => {
    const tree = chain({ M15: 5 });
    tree.nodes.root.assuranceObligations = [{ id: 'ROOT-ONLY', type: 'regulatory-mandate', bindingStatus: 'confirmed', authority: 'Role', sourceRef: 'Source', processScope: [13] }];
    const result = runChildAssessment(tree.nodes.grandchild, tree.nodes.child.scores, basicLevels, { assessmentTree: tree });
    assert.equal(result.effectiveScores.M15, 5);
    assert.equal(result.ancestryScope, 'full-tree');
    assert.equal(result.hierarchyComplete, false);
    assert(!getDriverAttribution(13, result.effectiveScores, undefined, tree.nodes.grandchild).some(driver => driver.metric === 'M15'));
    assert(!result.activeFloors.some(floor => floor.triggerMetric === 'M15' && floor.processId === 13));
    assert.deepEqual(tree.nodes.grandchild.assuranceObligations, []);
});

test('cycles, missing parents, and disconnected roots fail closed without modifying raw data', () => {
    const cases = [
        ['cycle', tree => { tree.nodes.child.parentId = 'grandchild'; }],
        ['missing-parent', tree => { tree.nodes.child.parentId = 'absent'; }],
        ['disconnected-root', tree => { tree.nodes.child.parentId = null; }],
        ['root-has-parent', tree => { tree.nodes.root.parentId = 'child'; }]
    ];
    for (const [code, change] of cases) {
        const tree = chain({ M5: 1, M8: 1, M15: 1 }); change(tree);
        const before = structuredClone(tree);
        const resolution = resolveProtectedAncestry(tree, 'grandchild');
        assert.equal(resolution.valid, false, code);
        assert.equal(resolution.authoritative, false, code);
        assert.equal(resolution.complete, false, code);
        assert(resolution.errors.some(error => error.code === code), code);
        assert(resolution.warnings.some(warning => warning.type === 'error' && warning.code === code), code);
        for (const metricId of ['M5', 'M8', 'M15']) assert.equal(resolution.effectiveScores[metricId], 5, code);
        assert.deepEqual(tree, before, code);
        const assessment = runChildAssessment(tree.nodes.grandchild, tree.nodes.child.scores, basicLevels, { assessmentTree: tree });
        assert.equal(assessment.authoritative, false, code);
        assert.equal(assessment.assessmentComplete, false, code);
        assert.equal(assessment.hierarchyComplete, false, code);
        assert.deepEqual(assessment.normativeLevels, {}, code);
    }
});

test('depth uses importer semantics: root depth zero and maximum twenty edges', () => {
    const tree = { rootId: 'n0', nodes: { n0: node('n0', null, makeScores({ M5: 5 })) } };
    for (let depth = 1; depth <= 21; depth += 1) tree.nodes[`n${depth}`] = node(`n${depth}`, `n${depth - 1}`);
    assert.equal(resolveProtectedAncestry(tree, 'n20').valid, true);
    const overLimit = resolveProtectedAncestry(tree, 'n21');
    assert.equal(overLimit.valid, false);
    assert.equal(overLimit.errors[0].code, 'depth-exceeded');
    assert.equal(resolveProtectedAncestry(tree, 'n2', { maxDepth: 2 }).valid, true);
    assert.equal(resolveProtectedAncestry(tree, 'n3', { maxDepth: 2 }).valid, false);
});

test('active draft overrides are resolved without mutating persisted scores and declared inheritance stays effective', () => {
    const tree = chain({ M5: 5, M8: 4, M15: 3 });
    const draft = makeScores({ M1: 4, M5: 2, M8: 2 });
    const result = resolveProtectedAncestry(tree, 'grandchild', { scores: draft });
    assert.equal(result.effectiveScores.M1, 4);
    assert.equal(result.effectiveScores.M5, 5);
    assert.equal(tree.nodes.grandchild.scores.M1, 1);
    assert.equal(draft.M5, 2);
    tree.nodes.child.inheritedMetrics = { M5: true, M8: true, M15: true };
    tree.nodes.grandchild.inheritedMetrics = { M5: true, M8: true, M15: true };
    const inherited = resolveProtectedAncestry(tree, 'grandchild');
    assert.deepEqual(inherited.blockedMetrics, []);
    assert.equal(inherited.effectiveScores.M5, 5);
});

test('tree-aware child assessment ignores stale raw parent protection and missing targets fail closed', () => {
    const tree = chain();
    const before = structuredClone(tree);
    const assessment = runChildAssessment(tree.nodes.grandchild, tree.nodes.child.scores, basicLevels, { assessmentTree: tree });
    assert.equal(assessment.effectiveScores.M5, 5);
    assert.equal(assessment.effectiveScores.M8, 5);
    assert.equal(assessment.effectiveScores.M15, 5);
    assert.equal(assessment.levels[19], 'comprehensive');
    assert.deepEqual(assessment.safetyCheck.blockedElementIds, ['child', 'grandchild']);
    assert.deepEqual(tree, before);
    const missing = runChildAssessment(node('missing', 'child'), tree.nodes.child.scores, basicLevels, { assessmentTree: tree });
    assert.equal(missing.authoritative, false);
    assert.equal(missing.ancestryResolution.errors[0].code, 'missing-element');
    const legacy = runChildAssessment(tree.nodes.grandchild, tree.nodes.child.scores, basicLevels);
    assert.equal(legacy.ancestryScope, 'direct-parent-only', 'legacy API explicitly identifies its ancestry limitation');
    assert.equal(legacy.ancestryResolution, null);
});
