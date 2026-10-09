import test from 'node:test';
import assert from 'node:assert/strict';
import { createAssessmentWorkspace, WORKSPACE_STORAGE_KEY, LEGACY_AUTOSAVE_KEY } from '../src/utils/assessment-workspace.js';

function memoryStorage(initial = {}) {
    const data = new Map(Object.entries(initial));
    return {
        failWrites: false,
        getItem(key) { return data.get(key) ?? null; },
        setItem(key, value) {
            if (this.failWrites) throw new DOMException('Storage is full', 'QuotaExceededError');
            data.set(key, value);
        },
        removeItem(key) { data.delete(key); }
    };
}
function open(storage, freshData = { scores: {}, projectInfo: {} }) {
    let sequence = 0;
    return createAssessmentWorkspace(storage, { freshData, id: () => `test-${++sequence}`, now: () => '2026-10-09T12:00:00.000Z' });
}

test('legacy autosave is preserved byte-for-byte and migrated without losing decision or tree data', () => {
    const legacy = JSON.stringify({ projectInfo: { name: 'PILOT-07' }, scores: { M1: 4 }, notes: 'Draft', assessmentTree: { nodes: { default: { decisionHistory: [{ outcome: 'retain' }] } } } });
    const storage = memoryStorage({ [LEGACY_AUTOSAVE_KEY]: legacy });
    const library = open(storage);
    assert.equal(library.hadSavedWork, true);
    assert.equal(library.getActive().name, 'PILOT-07');
    assert.equal(storage.getItem(WORKSPACE_STORAGE_KEY), null, 'initial inspection does not change storage');
    library.save(library.getActive().data);
    assert.equal(storage.getItem(LEGACY_AUTOSAVE_KEY), legacy);
    assert.deepEqual(open(storage).getActive().data, JSON.parse(legacy));
});

test('Start Fresh creates an independent assessment while preserving all previous work', () => {
    const storage = memoryStorage({ [LEGACY_AUTOSAVE_KEY]: JSON.stringify({ notes: 'Keep me', scores: { M1: 5 } }) });
    const library = open(storage);
    const previous = library.getActive();
    library.create({ scores: {}, notes: '' }, 'PILOT-08');
    assert.equal(library.list().length, 2);
    assert.equal(library.getActive().name, 'PILOT-08');
    assert.deepEqual(library.getActive().data.scores, {});
    assert.deepEqual(library.switchTo(previous.id).data, previous.data);
    assert.notEqual(storage.getItem(LEGACY_AUTOSAVE_KEY), null);
});

test('create, duplicate, rename, and switch make independent durable records', () => {
    const storage = memoryStorage();
    const library = open(storage);
    library.save({ scores: { M1: 4 }, notes: 'Original', assessmentTree: { nodes: { default: { decisionDrafts: { 9: { rationale: 'A' } } } } } });
    const original = library.getActive();
    const duplicate = library.duplicate();
    assert.notEqual(duplicate.id, original.id);
    assert.equal(duplicate.name, `${original.name} (copy)`);
    duplicate.data.scores.M1 = 1;
    duplicate.data.assessmentTree.nodes.default.decisionDrafts[9].rationale = 'B';
    library.save(duplicate.data);
    library.rename('PILOT-07 · option B');
    library.switchTo(original.id);
    assert.deepEqual(library.getActive().data, original.data);
    const reopened = open(storage);
    assert.equal(reopened.getActive().id, original.id);
    assert.equal(reopened.list().length, 2);
    assert.equal(reopened.switchTo(duplicate.id).data.scores.M1, 1);
    assert.equal(reopened.getActive().name, 'PILOT-07 · option B');
});

test('mutating a returned snapshot cannot change another assessment or bypass persistence', () => {
    const library = open(memoryStorage(), { scores: { M1: 4 } });
    const external = library.getActive();
    external.data.scores.M1 = 5;
    assert.equal(library.getActive().data.scores.M1, 4);
});

test('quota errors keep selection, original saved data, and all assessments unchanged', () => {
    const storage = memoryStorage();
    const library = open(storage);
    library.save({ notes: 'Original saved work' });
    const original = library.getActive();
    const raw = storage.getItem(WORKSPACE_STORAGE_KEY);
    storage.failWrites = true;
    assert.throws(() => library.save({ notes: 'Unsaved edit' }), /Storage is full/);
    assert.throws(() => library.create({ notes: 'New' }, 'Another'), /Storage is full/);
    assert.throws(() => library.duplicate(), /Storage is full/);
    assert.deepEqual(library.getActive(), original);
    assert.equal(library.list().length, 1);
    assert.equal(storage.getItem(WORKSPACE_STORAGE_KEY), raw);
});

test('stale browser tabs cannot overwrite a newer library', () => {
    const storage = memoryStorage();
    const first = open(storage);
    first.save({ notes: 'Initial' });
    const second = open(storage);
    first.save({ notes: 'New work from first tab' });
    const raw = storage.getItem(WORKSPACE_STORAGE_KEY);
    assert.throws(() => second.save({ notes: 'Stale work' }), /changed in another tab/);
    assert.equal(storage.getItem(WORKSPACE_STORAGE_KEY), raw);
    assert.equal(second.getActive().data.notes, 'Initial');
});

test('corrupt or future workspace storage is preserved and never replaced by legacy data', () => {
    for (const raw of ['{broken', JSON.stringify({ version: 999, revision: 1, assessments: [] }), JSON.stringify({ version: 1, revision: 1, activeId: 'missing', assessments: [] })]) {
        const storage = memoryStorage({ [WORKSPACE_STORAGE_KEY]: raw, [LEGACY_AUTOSAVE_KEY]: '{"notes":"legacy"}' });
        assert.throws(() => open(storage));
        assert.equal(storage.getItem(WORKSPACE_STORAGE_KEY), raw);
        assert.equal(storage.getItem(LEGACY_AUTOSAVE_KEY), '{"notes":"legacy"}');
    }
});

test('explicit erasure removes both the library and retained legacy source', () => {
    const storage = memoryStorage({ [LEGACY_AUTOSAVE_KEY]: '{"notes":"legacy"}' });
    const library = open(storage);
    library.create({}, 'Another');
    library.erase();
    assert.equal(storage.getItem(WORKSPACE_STORAGE_KEY), null);
    assert.equal(storage.getItem(LEGACY_AUTOSAVE_KEY), null);
});

const semantics = { frameworkVersion: '4.2.0', metricDefinitionSet: 'se-tailoring-m1-m16-v3', qualifierSchemaVersion: '1.1' };

test('app state replaces all old fields and trees when creating, importing, or switching assessments', async () => {
    globalThis.localStorage = memoryStorage();
    const state = await import('../src/state.js?workspace-isolation');
    assert.equal(state.loadAutosave(), null);
    assert.deepEqual(state.createBlankAssessment().semantics, semantics, 'new blank assessments carry current semantics');
    state.setState({ projectInfo: { name: 'Original', team: 'TEAM-A' }, scores: { M1: 5 }, notes: 'Original note', onlyInOriginal: true });
    const originalId = state.getAssessmentWorkspace().activeId;
    assert.equal(JSON.parse(localStorage.getItem(WORKSPACE_STORAGE_KEY)).assessments[0].data.notes, 'Original note', 'setState saves synchronously');
    assert.equal(state.createWorkspaceAssessment('Option B'), true);
    assert.equal(state.getState().projectInfo.name, 'Option B');
    assert.deepEqual(state.getState().scores, {});
    assert.equal(state.getState().onlyInOriginal, undefined);
    state.getState().assessmentTree.nodes.default.childIds = ['child-original'];
    state.getState().assessmentTree.nodes['child-original'] = { id: 'child-original', name: 'Previous child' };
    state.setState({ notes: 'Option B note' });
    assert.equal(state.importWorkspaceAssessment({ _format: 'se-tailoring-config', _version: '2.0', semantics, projectInfo: { name: 'Import C' }, metricScores: { M1: 2 } }), true);
    assert.equal(state.getState().assessmentTree.nodes['child-original'], undefined, 'import without a tree starts with its own tree');
    assert.equal(state.getState().projectInfo.team, undefined);
    assert.equal(state.getState().notes, '');
    assert.equal(state.getAssessmentWorkspace().assessments.length, 3);
    assert.equal(state.switchWorkspaceAssessment(originalId), true);
    assert.equal(state.getState().notes, 'Original note');
    assert.equal(state.getState().scores.M1, 5);
    assert.equal(state.getState().onlyInOriginal, true);
    delete globalThis.localStorage;
});

test('app blocks switching on storage failure while retaining unsaved edits in memory', async () => {
    globalThis.localStorage = memoryStorage();
    const state = await import('../src/state.js?workspace-quota');
    state.loadAutosave();
    state.setState({ notes: 'Original saved note' });
    const originalId = state.getAssessmentWorkspace().activeId;
    state.createWorkspaceAssessment('Second');
    const secondId = state.getAssessmentWorkspace().activeId;
    localStorage.failWrites = true;
    state.setState({ notes: 'Important unsaved note' });
    assert.equal(state.switchWorkspaceAssessment(originalId), false);
    assert.equal(state.getAssessmentWorkspace().activeId, secondId);
    assert.equal(state.getState().notes, 'Important unsaved note');
    localStorage.failWrites = false;
    assert.equal(state.flushAutosave(), true);
    assert.equal(state.switchWorkspaceAssessment(originalId), true);
    assert.equal(state.switchWorkspaceAssessment(secondId), true);
    assert.equal(state.getState().notes, 'Important unsaved note');
    delete globalThis.localStorage;
});
