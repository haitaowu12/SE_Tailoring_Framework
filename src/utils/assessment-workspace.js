/** Browser-local independent assessments. A single atomic write commits each change.
 * Legacy autosave is never removed by migration, creation, import, or switching.
 */
export const WORKSPACE_STORAGE_KEY = 'se-tailoring-workspace-v1';
export const LEGACY_AUTOSAVE_KEY = 'se-tailoring-autosave';
export const WORKSPACE_VERSION = 1;

const clone = value => JSON.parse(JSON.stringify(value));
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const makeId = () => `assessment_${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`}`;
const timestamp = () => new Date().toISOString();

export function assessmentName(value, fallback = 'Untitled assessment') {
    return typeof value === 'string' && value.trim() ? value.trim().slice(0, 120) : fallback;
}

export class WorkspaceStorageError extends Error {
    constructor(message, operation = 'save') {
        super(message);
        this.name = 'WorkspaceStorageError';
        this.operation = operation;
    }
}

function validateWorkspace(value) {
    if (!isObject(value) || value.version !== WORKSPACE_VERSION || !Array.isArray(value.assessments)
        || !value.assessments.length || !Number.isInteger(value.revision) || value.revision < 0) {
        throw new WorkspaceStorageError('The saved assessment library cannot be read. Its original data has been preserved.', 'restore');
    }
    const ids = new Set();
    for (const entry of value.assessments) {
        if (!isObject(entry) || typeof entry.id !== 'string' || !entry.id || ids.has(entry.id)
            || typeof entry.name !== 'string' || !isObject(entry.data)) {
            throw new WorkspaceStorageError('The saved assessment library contains an invalid record. Its original data has been preserved.', 'restore');
        }
        ids.add(entry.id);
    }
    if (value.assessments.length && !ids.has(value.activeId)) {
        throw new WorkspaceStorageError('The saved assessment selection cannot be read. Its original data has been preserved.', 'restore');
    }
    return value;
}

export function createAssessmentWorkspace(storage, { freshData = {}, now = timestamp, id = makeId } = {}) {
    // Reading or parsing failures deliberately propagate; never replace unreadable storage.
    let expectedRaw = storage.getItem(WORKSPACE_STORAGE_KEY);
    let workspace;
    let hadSavedWork = false;
    const record = (data, name) => ({
        id: id(), name: assessmentName(name), createdAt: now(), updatedAt: now(), data: clone(data)
    });
    if (expectedRaw !== null) {
        workspace = validateWorkspace(JSON.parse(expectedRaw));
        hadSavedWork = workspace.assessments.length > 0;
    } else {
        const legacyRaw = storage.getItem(LEGACY_AUTOSAVE_KEY);
        const legacy = legacyRaw === null ? null : JSON.parse(legacyRaw);
        if (legacy !== null && !isObject(legacy)) {
            throw new WorkspaceStorageError('The previous autosave cannot be read. Its original data has been preserved.', 'restore');
        }
        hadSavedWork = legacy !== null;
        const first = record(legacy || freshData, assessmentName(legacy?.projectInfo?.name, legacy ? 'Recovered assessment' : 'Assessment 1'));
        workspace = { version: WORKSPACE_VERSION, revision: 0, activeId: first.id, assessments: [first] };
        if (legacy) workspace.migratedFromLegacyAt = now();
    }

    function commit(next) {
        // Prevent a stale tab from silently replacing another tab's library.
        if (storage.getItem(WORKSPACE_STORAGE_KEY) !== expectedRaw) {
            throw new WorkspaceStorageError('This assessment library changed in another tab. Keep this page open and download a private backup before reloading.', 'conflict');
        }
        next.revision = workspace.revision + 1;
        const raw = JSON.stringify(next);
        storage.setItem(WORKSPACE_STORAGE_KEY, raw);
        // Update in-memory state only after the write succeeds (including quota errors).
        workspace = next;
        expectedRaw = raw;
        return clone(workspace.assessments.find(entry => entry.id === workspace.activeId));
    }

    const activeRecord = () => workspace.assessments.find(entry => entry.id === workspace.activeId);
    return {
        hadSavedWork,
        getActive: () => clone(activeRecord()),
        list: () => workspace.assessments.map(({ data, ...entry }) => ({
            ...entry, active: entry.id === workspace.activeId,
            reviewedCount: Object.values(data.metricAssessments || {}).filter(metric => ['assessed', 'inherited-confirmed'].includes(metric?.status)).length,
            hasRecommendation: Object.keys(data.levels || {}).length > 0,
            assessmentComplete: data.assessmentComplete === true
        })),
        save(data) {
            const next = clone(workspace);
            const active = next.assessments.find(entry => entry.id === next.activeId);
            active.data = clone(data);
            if (typeof data.projectInfo?.name === 'string' && data.projectInfo.name.trim()) active.name = assessmentName(data.projectInfo.name);
            active.updatedAt = now();
            return commit(next);
        },
        create(data, name) {
            const next = clone(workspace);
            const entry = record(data, assessmentName(name, `Assessment ${next.assessments.length + 1}`));
            next.assessments.push(entry);
            next.activeId = entry.id;
            return commit(next);
        },
        switchTo(assessmentId) {
            if (!workspace.assessments.some(entry => entry.id === assessmentId)) throw new Error('Assessment not found.');
            return commit({ ...clone(workspace), activeId: assessmentId });
        },
        rename(name) {
            if (typeof name !== 'string' || !name.trim()) throw new Error('Enter an assessment name or non-identifying code.');
            const next = clone(workspace);
            const active = next.assessments.find(entry => entry.id === next.activeId);
            active.name = assessmentName(name);
            active.data.projectInfo = { ...(active.data.projectInfo || {}), name: active.name };
            active.updatedAt = now();
            return commit(next);
        },
        duplicate() {
            const current = activeRecord();
            const name = `${current.name} (copy)`;
            const data = clone(current.data);
            data.projectInfo = { ...(data.projectInfo || {}), name };
            return this.create(data, name);
        },
        erase() {
            // Delete the retained legacy source first, so a failed deletion cannot
            // resurrect it at the next load. Report failures without reloading.
            storage.removeItem(LEGACY_AUTOSAVE_KEY);
            storage.removeItem(WORKSPACE_STORAGE_KEY);
            expectedRaw = null;
        }
    };
}
