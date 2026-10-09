import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runFullAssessment } from '../src/utils/assessment-engine.js';
import { buildExportConfig, normalizeImportedConfig, validateConfig } from '../src/utils/export-import.js';
import { buildElementContext } from '../src/utils/element-context.js';

function nodeFixture(id, score, parentId = null) {
    const scores = Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`M${i + 1}`, score]));
    const metricAssessments = Object.fromEntries(Object.entries(scores).map(([id, value]) => [id, {
        score: value, status: 'assessed', definitionVersion: 3, qualifiers: [], rationale: `${id} context`, evidenceRefs: []
    }]));
    const result = runFullAssessment(scores, undefined, { metricAssessments });
    return { id, name: id, parentId, childIds: [], assessmentType: 'full', status: 'draft', scores, metricAssessments,
        ruleDispositions: {}, csiResponse: {}, assuranceObligations: [], rightSizingApprovalRecords: [],
        assessmentResult: result, levels: { ...result.levels }, manualAdjustments: {},
        decisionDrafts: { 9: { level: result.levels[9], justification: `${id} draft rationale` } }, decisionHistory: [] };
}
function hierarchyFixture() {
    const root = nodeFixture('default', 3);
    const child = nodeFixture('child', 1, 'default');
    root.childIds = ['child'];
    root.manualAdjustments = { 9: { level: 'comprehensive', justification: 'Root-only planning decision' } };
    root.levels[9] = 'comprehensive';
    root.assessmentResult.levels[9] = 'comprehensive';
    child.manualAdjustments = { 10: { level: 'standard', justification: 'Child-only control decision' } };
    child.levels[10] = 'standard';
    child.assessmentResult.levels[10] = 'standard';
    const state = {
        ...buildElementContext(child), projectInfo: { name: 'HIERARCHY-TEST' },
        manualAdjustments: root.manualAdjustments,
        assessmentTree: { rootId: 'default', activeId: 'child', nodes: { default: root, child } },
        assessmentComplete: false, assessmentDisposition: 'work-in-progress'
    };
    return { state, root, child };
}

test('active-child private backup roundtrip preserves independent root and child recommendations and decisions', () => {
    const { state, root, child } = hierarchyFixture();
    const backup = buildExportConfig(state, { mode: 'identified' });
    assert.deepEqual(validateConfig(backup).errors, []);
    const restored = normalizeImportedConfig(backup);
    assert.equal(restored.assessmentTree.activeId, 'child');
    assert.deepEqual(restored.scores, child.scores);
    assert.deepEqual(restored.metricAssessments, child.metricAssessments);
    assert.deepEqual(restored.levels, child.levels);
    assert.deepEqual(restored.derived, child.assessmentResult.derived);
    assert.deepEqual(restored.activeFloors, child.assessmentResult.activeFloors);
    assert.deepEqual(restored.budgetStatus, child.assessmentResult.budgetStatus);
    assert.deepEqual(restored.assessmentTree.nodes.default.scores, root.scores);
    assert.deepEqual(restored.assessmentTree.nodes.default.levels, root.levels);
    assert.deepEqual(restored.assessmentTree.nodes.default.manualAdjustments, root.manualAdjustments);
    assert.deepEqual(restored.manualAdjustments, root.manualAdjustments, 'legacy global adjustments remain root-canonical');
    assert.deepEqual(restored.assessmentTree.nodes.child.manualAdjustments, child.manualAdjustments);
    assert.equal(restored.levels[9], 'basic', 'root comprehensive adjustment must never enter the child');
    assert.equal(restored.levels[10], 'standard');
    assert.deepEqual(restored.assessmentTree.nodes.default.decisionDrafts, root.decisionDrafts);
    assert.deepEqual(restored.assessmentTree.nodes.child.decisionDrafts, child.decisionDrafts);
});

test('switching active elements hydrates all view fields and preserves canonical node data', async () => {
    const app = await import('../src/state.js?element-context');
    const { state, root, child } = hierarchyFixture();
    app.setState(state);
    assert.equal(app.setActiveElement('default'), true);
    assert.deepEqual(app.getState().scores, root.scores);
    assert.deepEqual(app.getState().levels, root.levels);
    assert.deepEqual(app.getState().derived, root.assessmentResult.derived);
    assert.equal(app.setActiveElement('child'), true);
    assert.deepEqual(app.getState().scores, child.scores);
    assert.deepEqual(app.getState().metricAssessments, child.metricAssessments);
    assert.deepEqual(app.getState().levels, child.levels);
    assert.deepEqual(app.getState().derived, child.assessmentResult.derived);
    assert.deepEqual(app.getState().manualAdjustments, root.manualAdjustments);
    assert.deepEqual(app.getState().assessmentTree.nodes.default.decisionDrafts, root.decisionDrafts);
    assert.deepEqual(app.getState().assessmentTree.nodes.child.decisionDrafts, child.decisionDrafts);
    assert.equal(app.setActiveElement('missing'), false);
    assert.equal(app.getState().assessmentTree.activeId, 'child');
});

test('an unassessed selected child cannot inherit a previous element recommendation or completeness', () => {
    const { root } = hierarchyFixture();
    const empty = { id: 'empty', scores: {}, metricAssessments: {}, levels: {}, assessmentResult: null };
    const hydrated = buildElementContext(empty);
    assert.deepEqual(hydrated.scores, {});
    assert.deepEqual(hydrated.levels, {});
    assert.deepEqual(hydrated.derived, {});
    assert.deepEqual(hydrated.violations, []);
    assert.notDeepEqual(hydrated.levels, root.levels);
});

test('Decisions selector uses the same active-element transition as System Elements', () => {
    const source = readFileSync(new URL('../src/views/manual-adjust.js', import.meta.url), 'utf8');
    assert.match(source, /if \(state\.assessmentTree\.activeId !== selectedId\) setActiveElement\(selectedId\)/);
    assert.match(source, /#decision-element'[\s\S]*if \(setActiveElement\(event\.target\.value\)\)/);
});
