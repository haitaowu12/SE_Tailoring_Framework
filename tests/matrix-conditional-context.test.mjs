import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildMatrixPresentation } from '../src/views/matrix-view.js';
import { buildMatrixExportData } from '../src/utils/export-import.js';
import { calculateProcessLevel, getDriverAttribution } from '../src/utils/assessment-engine.js';
import { METRICS, CORE_PROCESSES, METRIC_PROCESS_MAP, CONDITIONAL_METRIC_PROCESS_DRIVERS } from '../src/data/se-tailoring-data.js';

const scores = Object.fromEntries(Array.from({ length: 16 }, (_, index) => [`M${index + 1}`, index === 14 ? 3 : 1]));
const metricAssessments = Object.fromEntries(Object.entries(scores).map(([id, score]) => [id, {
    score, status: 'assessed', definitionVersion: 3, qualifiers: [], evidenceRefs: [], rationale: ''
}]));
const obligation = processScope => ({ id: 'OBL-SYNTHETIC', type: 'regulatory-mandate', bindingStatus: 'confirmed', authority: 'Synthetic authority', sourceRef: 'Synthetic source', processScope });
function fixture(assuranceObligations = [obligation([13])]) {
    return { scores, metricAssessments, assuranceObligations,
        assessmentTree: { rootId: 'default', activeId: 'default', nodes: {
            default: { id: 'default', name: 'Root code', parentId: null, scores, metricAssessments, assuranceObligations }
        } }
    };
}

test('scoped M15 direct driver is visible when it derives Standard despite an absent canonical cell', () => {
    const state = fixture();
    const before = JSON.stringify(METRIC_PROCESS_MAP);
    const presentation = buildMatrixPresentation(state);
    assert.equal(METRIC_PROCESS_MAP[13].M15, undefined);
    assert.equal(calculateProcessLevel(13, scores, METRIC_PROCESS_MAP, state), 'standard');
    assert(getDriverAttribution(13, scores, METRIC_PROCESS_MAP, state).some(driver => driver.metric === 'M15' && driver.role === 'P'));
    assert.equal(presentation.map[13].M15, 'P*');
    assert.equal(presentation.conditionalDrivers.find(driver => driver.processId === 13).status, 'active');
    assert.match(presentation.caption, /102 shared driver allocations/);
    assert.match(presentation.caption, /7 conditional M15 relationships: 1 active, 6 inactive, 0 unavailable/);
    assert.equal(JSON.stringify(METRIC_PROCESS_MAP), before, 'overlay must not mutate canonical scoring data');
    assert.equal(presentation.canonicalCellCount, 102);
});

test('conditional Secondary roles and inactive cells are represented separately from primary roles', () => {
    const presentation = buildMatrixPresentation(fixture([obligation([12, 27, 30])]));
    for (const processId of [12, 27, 30]) assert.equal(presentation.map[processId].M15, 'S*');
    assert.equal(presentation.map[13].M15, 'C');
    assert.match(presentation.conditionalDrivers.find(driver => driver.processId === 13).reason, /no confirmed binding obligation/);
    assert.match(presentation.legend, /C = conditional relationship, currently inactive/);
    assert.equal(presentation.conditionalDrivers.length, CONDITIONAL_METRIC_PROCESS_DRIVERS.length);
});

test('conditional driver uses the actual engine predicate, including status, authority, source, and process scope', () => {
    for (const invalid of [
        { ...obligation([13]), bindingStatus: 'proposed' },
        { ...obligation([13]), authority: '' },
        { ...obligation([13]), sourceRef: '' },
        { ...obligation([13]), type: 'not-a-binding-type' },
        obligation([14])
    ]) assert.equal(buildMatrixPresentation(fixture([invalid])).map[13].M15, 'C');
});

test('active child conditional context cannot inherit root scopes or global root values', () => {
    const state = fixture();
    state.assessmentTree.activeId = 'child';
    state.assessmentTree.nodes.child = { id: 'child', name: 'Child code', parentId: 'default', scores: { ...scores, M15: 4 }, metricAssessments, assuranceObligations: [obligation([14])] };
    const presentation = buildMatrixPresentation(state);
    assert.equal(presentation.contextLabel, 'Active system element');
    assert.equal(presentation.map[13].M15, 'C');
    assert.equal(presentation.map[14].M15, 'P*');
    assert.equal(presentation.scores.M15, 4);
    assert.equal(presentation.map[9].M1, METRIC_PROCESS_MAP[9].M1);
});

test('missing active context and migration are shown as unavailable rather than inactive or unmapped', () => {
    const missing = fixture();
    missing.assessmentTree.activeId = 'missing';
    const unknown = buildMatrixPresentation(missing);
    assert.equal(unknown.map[13].M15, 'P?');
    assert.equal(unknown.map[12].M15, 'S?');
    assert(unknown.conditionalDrivers.every(driver => driver.status === 'unavailable'));
    const legacy = buildMatrixPresentation({ ...fixture(), semanticMigration: { status: 'review-required' } });
    assert.equal(legacy.map[13].M15, 'P?');
    assert.match(legacy.conditionalDrivers[0].reason, /semantic migration/);
    const childMissing = fixture();
    childMissing.assessmentTree.activeId = 'child';
    childMissing.assessmentTree.nodes.child = { id: 'child', parentId: 'default', scores, metricAssessments };
    assert.equal(buildMatrixPresentation(childMissing).map[13].M15, 'P?');
});

test('unconfirmed M15 still exposes conditional engine applicability but explicitly labels the preview', () => {
    const state = fixture();
    state.assessmentTree.nodes.default.metricAssessments = {};
    const presentation = buildMatrixPresentation(state);
    assert.equal(presentation.map[13].M15, 'P*');
    assert.match(presentation.conditionalDrivers.find(driver => driver.processId === 13).reason, /not a confirmed rating.*preview/);
});

test('display and both export actions consume the same context presentation without exposing obligation contents', () => {
    const source = readFileSync(new URL('../src/views/matrix-view.js', import.meta.url), 'utf8');
    assert.match(source, /exportMatrixCSV\(getState\(\), METRICS, CORE_PROCESSES, METRIC_PROCESS_MAP, buildMatrixPresentation\(getState\(\)\)\)/);
    assert.match(source, /exportMatrixPDF\(getState\(\), METRICS, CORE_PROCESSES, DIMENSIONS, METRIC_PROCESS_MAP, buildMatrixPresentation\(getState\(\)\)\)/);
    const presentation = buildMatrixPresentation(fixture());
    const exportedMetadata = JSON.stringify({ caption: presentation.caption, legend: presentation.legend, contextLabel: presentation.contextLabel, conditionalDrivers: presentation.conditionalDrivers });
    for (const privateValue of ['Root code', 'Synthetic authority', 'Synthetic source', 'OBL-SYNTHETIC']) assert(!exportedMetadata.includes(privateValue));
});


test('CSV and PDF shared export rows preserve every displayed role, conditional marker, status, and explanation', () => {
    const root = fixture([obligation([12, 13])]);
    const child = fixture();
    child.assessmentTree.activeId = 'child';
    child.assessmentTree.nodes.child = { id: 'child', name: 'Private child', parentId: 'default', scores, metricAssessments, assuranceObligations: [obligation([14])] };
    const unavailable = { ...fixture(), semanticMigration: { status: 'review-required' } };
    for (const state of [root, child, unavailable]) {
        const presentation = buildMatrixPresentation(state);
        const exported = buildMatrixExportData(state, METRICS, CORE_PROCESSES, METRIC_PROCESS_MAP, presentation);
        assert.equal(exported.body.length, CORE_PROCESSES.length);
        for (const row of exported.body) {
            for (const metric of METRICS) {
                assert.equal(row[exported.headers.indexOf(metric.id)], presentation.map[row[0]]?.[metric.id] || '', `${row[0]}/${metric.id}`);
            }
        }
        assert.deepEqual(exported.notes, [presentation.contextLabel, presentation.caption, presentation.legend]);
        assert.deepEqual(exported.conditional, presentation.conditionalDrivers.map(driver => [driver.processId, driver.processName, driver.metric, driver.role, driver.marker, driver.status, driver.reason]));
        const text = JSON.stringify(exported);
        for (const privateValue of ['Root code', 'Private child', 'Synthetic authority', 'Synthetic source', 'OBL-SYNTHETIC']) assert(!text.includes(privateValue));
    }
    const exporter = readFileSync(new URL('../src/utils/export-import.js', import.meta.url), 'utf8');
    for (const functionName of ['exportMatrixCSV', 'exportMatrixPDF']) {
        const body = exporter.slice(exporter.indexOf(`function ${functionName}(`));
        assert.match(body.slice(0, body.indexOf('/**')), /buildMatrixExportData\(state, metrics, processes, defaultMap, presentation\)/);
    }
});
