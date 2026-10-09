/**
 * Shared App State
 *
 * v3.3: Added assessmentTree for hierarchical system element tailoring.
 * Each node holds an element's own metric scores, derived levels,
 * down-tailoring log, and parent/child relationships.
 * The 'default' root node is always a Full assessment.
 */
import { prepareDecisions, getRecommendation } from './utils/tailoring-decisions.js';
import { escapeHtml } from './utils/safe-text.js';
import { FRAMEWORK_SEMANTIC_VERSION, METRIC_DEFINITION_SET_ID, QUALIFIER_SCHEMA_VERSION } from './data/metrics.js';
import { evaluateBaselineEligibility, getAssessmentDisposition } from './utils/assessment-integrity.js';
import { assessCorrelatedEvidence } from './utils/correlated-evidence.js';
import { recordRuntimeIssue } from './utils/runtime-operations.js';
import { createAssessmentWorkspace } from './utils/assessment-workspace.js';
import { buildElementContext } from './utils/element-context.js';
import { buildAutosaveImportConfig, isCurrentAutosaveSemantics } from './utils/autosave-restore.js';
import { normalizeImportedConfig } from './utils/export-import.js';

const state = {
    // Hierarchical assessment tree (v3.3)
    assessmentTree: {
        rootId: 'default',
        activeId: 'default',
        nodes: {
            'default': {
                id: 'default',
                name: 'Program / SoS',
                parentId: null,
                childIds: [],
                assessmentType: 'full',       // 'full' | 'quick' | 'inherited'
                inheritedMetrics: {},          // { M7: true, M8: true, ... }
                overriddenMetrics: {},         // { M1: { parentValue: 4, childValue: 2, rationale: '...' } }
                downTailoringLog: [],          // governed reduction rationale; legacy outputSufficiency fields are import-only
                status: 'draft',              // 'draft' | 'under_review' | 'approved' | 'baselined'
                scores: {},                   // per-node metric scores
                metricAssessments: {},        // per-metric status, qualifiers, rationale, and evidence references
                assuranceObligations: [],      // confirmed/scoped binding assurance records for M15
                ruleDispositions: {},          // governed dispositions for triggered, unsatisfied warning rules
                csiResponse: {},               // governed response to CSI 4-5 schedule/budget stress
                correlatedEvidenceWarnings: [], // warning-only M5/M6/M8 evidence correlation review
                rightSizingApprovalRecords: [], // role-based, snapshot-bound reduction decisions
                levels: {},                   // per-node process levels (after assessment)
                manualMetrics: [],            // metric IDs manually set by user (never auto-overwritten)
                assessmentResult: null,       // full assessment result object
                hasIndependentSafetyAnalysis: false,
                safetyAllocationDecision: null,
                securityHierarchyDisposition: null,
                assuranceHierarchyDisposition: null,
                // Retained for visible migration only; booleans cannot authorize lowering.
                hasIndependentSecurityAnalysis: false,
                hasScopedAssuranceDecision: false,
                manualAdjustments: {}         // { processId: { level: 'comprehensive', justification: '...' } }
            }
        }
    },
    projectInfo: { name: '', date: '', team: '', phase: '' },
    scores: {},
    metricAssessments: {},
    assuranceObligations: [],
    ruleDispositions: {},
    csiResponse: {},
    correlatedEvidenceWarnings: [],
    semanticMigration: null,
    saResponses: {},
    saTier: null,
    derived: {},
    derivationDetails: {},
    levels: {},
    overrides: [],
    activeFloors: [],
    violations: [],
    fixes: [],
    rightSizingProposals: [],
    blockedRightSizingCandidates: [],
    proposedRightSizedLevels: {},
    proposalClosureFixes: [],
    proposalBudgetStatus: null,
    rightSizingApprovalRecords: [],
    rightSizingApprovalEvaluations: [],
    locallyAdjustedLevels: {},
    localScenarioClosureFixes: [],
    localScenarioBudgetStatus: null,
    locallyCompleteRightSizingRecordCount: 0,
    // Legacy external-authority fields remain empty in the static app.
    approvedRightSizedLevels: {},
    normativeLevels: {},
    effectiveRightSizingApprovalCount: 0,
    // Historical import-only records from pre-governance engine versions.
    rightSizingActions: [],
    budgetStatus: null,
    adoptionRisks: [],
    manualAdjustments: {},
    tradeoffs: [],
    notes: '',
    assessmentComplete: false,
    assessmentDisposition: 'work-in-progress',
    confidence: {},
    derivationStatus: {}
};

const listeners = [];

// A new assessment must never inherit fields, a tree, or decisions from the last one.
const initialState = JSON.parse(JSON.stringify(state));
let workspace = null;
let workspaceInitialized = false;
let workspaceUnlocked = false;
let workspaceError = null;
let workspaceDirty = false;
let hiddenSavedAssessmentIds = new Set();

export function createBlankAssessment() {
    return {
        ...JSON.parse(JSON.stringify(initialState)),
        semantics: { frameworkVersion: FRAMEWORK_SEMANTIC_VERSION, metricDefinitionSet: METRIC_DEFINITION_SET_ID, qualifierSchemaVersion: QUALIFIER_SCHEMA_VERSION }
    };
}

function reportStorageFailure(error, operation = 'save') {
    workspaceError = error;
    recordRuntimeIssue(error, `workspace-${operation}`);
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:storage-failure', {
            detail: { operation, message: error?.message || 'The assessment could not be saved.' }
        }));
    }
}

function ensureWorkspace() {
    if (workspaceInitialized) return workspace;
    workspaceInitialized = true;
    try {
        workspace = createAssessmentWorkspace(localStorage, { freshData: createBlankAssessment() });
        workspaceUnlocked = !workspace.hadSavedWork;
    } catch (error) {
        reportStorageFailure(error, 'restore');
    }
    return workspace;
}

function announceWorkspaceChange() {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app:workspace-changed'));
}

function assessmentSnapshot() {
    const integrity = getAssessmentDisposition(state);
    return JSON.parse(JSON.stringify({
        ...state,
        semantics: { frameworkVersion: FRAMEWORK_SEMANTIC_VERSION, metricDefinitionSet: METRIC_DEFINITION_SET_ID, qualifierSchemaVersion: QUALIFIER_SCHEMA_VERSION },
        correlatedEvidenceWarnings: assessCorrelatedEvidence(state.metricAssessments).warnings,
        assessmentComplete: integrity.complete,
        assessmentDisposition: integrity.disposition,
        assessmentIntegrity: integrity,
        savedAt: new Date().toISOString()
    }));
}

function replaceAssessment(data) {
    const currentSemantics = isCurrentAutosaveSemantics(data);
    const restored = currentSemantics && data.assessmentTree?.nodes
        ? data
        : normalizeImportedConfig(buildAutosaveImportConfig(data));
    // Preserve the singleton reference for existing views, but remove all old keys.
    Object.keys(state).forEach(key => delete state[key]);
    Object.assign(state, createBlankAssessment(), JSON.parse(JSON.stringify(restored)));
    state.approvedRightSizedLevels = {};
    state.effectiveRightSizingApprovalCount = 0;
    if (state.assessmentComplete) {
        state.assessmentComplete = evaluateBaselineEligibility(state).softwareChecksPassed;
        state.assessmentDisposition = state.assessmentComplete ? 'complete-baseline' : 'work-in-progress';
    }
    workspaceUnlocked = true;
    listeners.forEach(fn => fn(state));
    announceWorkspaceChange();
    return { currentSemantics, normalized: restored };
}

function notifyStateChanged() {
    listeners.forEach(fn => fn(state));
    // Save synchronously: a switch, immediate reload, or closed tab cannot outrun
    // a five-second debounce. Failure retains the current in-memory assessment.
    workspaceDirty = true;
    return flushAutosave();
}

export function getState() { return state; }

export function setState(updates) {
    const next = { ...state, ...updates };
    if (updates.assessmentComplete === true) {
        const eligibility = evaluateBaselineEligibility(next);
        next.assessmentComplete = eligibility.softwareChecksPassed;
        if (!next.assessmentComplete) next.assessmentDisposition = next.assessmentDisposition === 'demo' ? 'demo' : 'work-in-progress';
        else next.assessmentDisposition = 'complete-baseline';
    }
    Object.assign(state, next);
    return notifyStateChanged();
}

export function loadAutosave() {
    const library = ensureWorkspace();
    return library?.hadSavedWork ? library.getActive().data : null;
}

export function getAssessmentWorkspace() {
    const library = ensureWorkspace();
    // No saved names or contents appear behind the shared-device restore gate.
    return {
        assessments: library && workspaceUnlocked ? library.list().filter(entry => !hiddenSavedAssessmentIds.has(entry.id)) : [],
        hiddenCount: hiddenSavedAssessmentIds.size,
        activeId: library && workspaceUnlocked ? library.getActive().id : null,
        error: workspaceError,
        locked: !workspaceUnlocked
    };
}

export function flushAutosave() {
    const library = ensureWorkspace();
    if (!library || !workspaceUnlocked) return false;
    if (!workspaceDirty) return true;
    try {
        library.save(assessmentSnapshot());
        workspaceDirty = false;
        workspaceError = null;
        announceWorkspaceChange();
        return true;
    } catch (error) {
        reportStorageFailure(error, error.operation || 'save');
        return false;
    }
}

export function restoreWorkspaceAssessment() {
    const library = ensureWorkspace();
    if (!library) return null;
    hiddenSavedAssessmentIds.clear();
    const result = replaceAssessment(library.getActive().data);
    workspaceDirty = true;
    flushAutosave();
    return result;
}

function workspaceAction(action, { preserveCurrent = true } = {}) {
    const library = ensureWorkspace();
    if (!library) return false;
    if (preserveCurrent && workspaceUnlocked && !flushAutosave()) return false;
    try {
        const entry = action(library);
        workspaceError = null;
        workspaceDirty = false;
        replaceAssessment(entry.data);
        return true;
    } catch (error) {
        reportStorageFailure(error, error.operation || 'save');
        return false;
    }
}

export function createWorkspaceAssessment(name) {
    const library = ensureWorkspace();
    if (library && !workspaceUnlocked) hiddenSavedAssessmentIds = new Set(library.list().map(entry => entry.id));
    const blank = createBlankAssessment();
    blank.projectInfo.name = typeof name === 'string' ? name.trim().slice(0, 120) : '';
    blank.semantics = { frameworkVersion: FRAMEWORK_SEMANTIC_VERSION, metricDefinitionSet: METRIC_DEFINITION_SET_ID, qualifierSchemaVersion: QUALIFIER_SCHEMA_VERSION };
    return workspaceAction(library => library.create(blank, name));
}

export function revealSavedWorkspaceAssessments() {
    hiddenSavedAssessmentIds.clear();
    announceWorkspaceChange();
}

export function switchWorkspaceAssessment(id) {
    return workspaceAction(library => library.switchTo(id));
}

export function duplicateWorkspaceAssessment() {
    return workspaceAction(library => library.duplicate());
}

export function renameWorkspaceAssessment(name) {
    return workspaceAction(library => library.rename(name));
}

export function importWorkspaceAssessment(config, filename = '') {
    // No fallback to the currently selected assessment's tree or governance data.
    const imported = normalizeImportedConfig(config);
    imported.semantics = { frameworkVersion: FRAMEWORK_SEMANTIC_VERSION, metricDefinitionSet: METRIC_DEFINITION_SET_ID, qualifierSchemaVersion: QUALIFIER_SCHEMA_VERSION };
    const name = config.projectInfo?.name || filename.replace(/\.json$/i, '') || 'Imported assessment';
    return workspaceAction(library => library.create(imported, name));
}

export function clearAutosave() {
    const library = ensureWorkspace();
    try {
        if (library) library.erase();
        else {
            localStorage.removeItem('se-tailoring-autosave');
            localStorage.removeItem('se-tailoring-workspace-v1');
        }
        // Prevent pagehide/beforeunload from recreating the explicitly erased data.
        workspaceUnlocked = false;
        return true;
    } catch (error) {
        reportStorageFailure(error, 'erase');
        return false;
    }
}

export function subscribe(fn) {
    listeners.push(fn);
    return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
}

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `<span aria-hidden="true">${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    const timeout = type === 'error' ? 8000 : type === 'warning' ? 6000 : 4000;
    setTimeout(() => toast.remove(), timeout);
}

// ===== Tree Manipulation Helpers (v3.3) =====

const QUICK_OVERRIDE_METRICS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'M15'];
const ALL_METRICS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16'];

function generateId() {
    return `elem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Add a child element to the tree. Returns the new node ID.
 */
export function addChildElement(parentId, name, assessmentType = 'quick') {
    const tree = state.assessmentTree;
    const parent = tree.nodes[parentId];
    if (!parent) return null;

    const id = generateId();
    const parentScores = parent.scores || {};

    // Build inherited flags based on assessment type
    const inheritedMetrics = {};
    const scores = {};
    const metricAssessments = {};
    for (const m of ALL_METRICS) {
        if (assessmentType === 'inherited') {
            inheritedMetrics[m] = true;
        } else if (assessmentType === 'quick') {
            inheritedMetrics[m] = !QUICK_OVERRIDE_METRICS.includes(m);
        } else {
            inheritedMetrics[m] = false;
        }
        // Start with parent score as default
        scores[m] = parentScores[m] ?? 3;
        if (inheritedMetrics[m]) {
            const parentAssessment = parent.metricAssessments?.[m];
            const parentConfirmed = ['assessed', 'inherited-confirmed'].includes(parentAssessment?.status);
            metricAssessments[m] = {
                ...(parentAssessment || {}),
                score: scores[m],
                status: parentConfirmed ? 'inherited-confirmed' : 'unknown',
                definitionVersion: 3,
                qualifiers: parentAssessment?.qualifiers || [],
                evidenceRefs: parentAssessment?.evidenceRefs || []
            };
        }
    }

    tree.nodes[id] = {
        id,
        name,
        parentId,
        childIds: [],
        assessmentType,
        inheritedMetrics,
        overriddenMetrics: {},
        downTailoringLog: [],
        status: 'draft',
        scores,
        metricAssessments,
        assuranceObligations: [],
        ruleDispositions: {},
        csiResponse: {},
        correlatedEvidenceWarnings: [],
        rightSizingApprovalRecords: [],
        levels: {},
        manualMetrics: [],
        assessmentResult: null,
        hasIndependentSafetyAnalysis: false,
        safetyAllocationDecision: null,
        securityHierarchyDisposition: null,
        assuranceHierarchyDisposition: null,
        // Retained for visible migration only; booleans cannot authorize lowering.
        hasIndependentSecurityAnalysis: false,
        hasScopedAssuranceDecision: false,
        manualAdjustments: {}
    };
    parent.childIds.push(id);
    notifyStateChanged();
    return id;
}

/**
 * Remove an element and all its descendants from the tree.
 * Cannot remove the root node.
 */
export function removeElement(elementId) {
    const tree = state.assessmentTree;
    if (elementId === tree.rootId) return false;

    const node = tree.nodes[elementId];
    if (!node) return false;

    const removedIds = new Set();
    const pending = [elementId];
    while (pending.length > 0) {
        const id = pending.pop();
        const current = tree.nodes[id];
        if (!current || removedIds.has(id)) continue;
        removedIds.add(id);
        pending.push(...(current.childIds || []));
    }
    for (const id of removedIds) delete tree.nodes[id];
    // Remove from parent's childIds
    const parent = tree.nodes[node.parentId];
    if (parent) {
        parent.childIds = parent.childIds.filter(id => id !== elementId);
    }

    // If active was removed, switch to root
    if (removedIds.has(tree.activeId)) {
        tree.activeId = tree.rootId;
        hydrateActiveElementState();
    }

    notifyStateChanged();
    return true;
}

/** Refresh the backward-compatible view fields from the selected canonical node. */
export function hydrateActiveElementState() {
    const tree = state.assessmentTree;
    const node = tree.nodes[tree.activeId] || tree.nodes[tree.rootId];
    if (!node) return false;
    Object.assign(state, buildElementContext(node));
    // Global manualAdjustments is a legacy root-only field. Child choices belong
    // solely to that child's node; process views must not inherit root choices.
    state.manualAdjustments = JSON.parse(JSON.stringify(tree.nodes[tree.rootId]?.manualAdjustments || {}));
    const recordedComplete = node.assessmentDisposition === 'complete-baseline'
        || ['under_review', 'approved', 'baselined'].includes(node.status);
    state.assessmentDisposition = node.assessmentDisposition === 'demo' ? 'demo' : 'work-in-progress';
    state.assessmentComplete = recordedComplete && !!node.assessmentResult && evaluateBaselineEligibility(state, {
        derivationAuthoritative: node.assessmentResult?.authoritative !== false
    }).softwareChecksPassed;
    if (state.assessmentComplete) state.assessmentDisposition = 'complete-baseline';
    return true;
}

/** Set the active element and its complete assessment context together. */
export function setActiveElement(elementId) {
    const tree = state.assessmentTree;
    if (!tree.nodes[elementId]) return false;
    tree.activeId = elementId;
    hydrateActiveElementState();
    notifyStateChanged();
    return true;
}

/**
 * Get the active node object.
 */
export function getActiveNode() {
    const tree = state.assessmentTree;
    return tree.nodes[tree.activeId] || tree.nodes[tree.rootId];
}

/**
 * Get scores for a specific element. Falls back to default scores.
 */
export function getElementScores(elementId) {
    const node = state.assessmentTree.nodes[elementId];
    return node?.scores || {};
}

/**
 * Set scores for a specific element.
 */
export function setElementScores(elementId, scores) {
    const node = state.assessmentTree.nodes[elementId];
    if (!node) return;
    node.scores = { ...scores };
    notifyStateChanged();
}

/**
 * Store full assessment result for a specific element.
 */
export function setElementAssessmentResult(elementId, result) {
    const node = state.assessmentTree.nodes[elementId];
    if (!node) return;
    node.assessmentResult = result;
    node.levels = result.levels || {};
    const eligibility = evaluateBaselineEligibility({
        scores: node.scores,
        metricAssessments: node.metricAssessments,
        violations: result.violations,
        ruleDispositions: node.ruleDispositions,
        levels: node.levels,
        csiResponse: node.csiResponse,
        assuranceObligations: node.assuranceObligations || [],
        activeFloors: result.activeFloors || [],
        projectInfo: state.projectInfo,
        assessmentTree: { ...state.assessmentTree, activeId: elementId }
    }, {
        derivationAuthoritative: result?.authoritative === true,
        hierarchy: { complete: true, enabled: false, incompleteElementIds: [], assessedElementCount: 1 }
    });
    const baselineReady = eligibility.softwareChecksPassed;
    node.status = baselineReady ? 'under_review' : 'draft';
    node.assessmentDisposition = baselineReady ? 'complete-baseline' : 'work-in-progress';
    notifyStateChanged();
}

/**
 * Mark a metric as manually set by the user for a specific element.
 * Manual metrics are never overwritten by propagation.
 */
export function markMetricManual(elementId, metricId) {
    const node = state.assessmentTree.nodes[elementId];
    if (!node) return;
    if (!node.manualMetrics.includes(metricId)) {
        node.manualMetrics.push(metricId);
        notifyStateChanged();
    }
}

/**
 * Rename an element node.
 */
export function renameElement(elementId, newName) {
    const node = state.assessmentTree.nodes[elementId];
    if (!node) return;
    node.name = newName;
    notifyStateChanged();
}

/**
 * Get the breadcrumb path from root to a given element.
 * Returns array of { id, name }.
 */
export function getElementBreadcrumbs(elementId) {
    const tree = state.assessmentTree;
    const crumbs = [];
    let current = tree.nodes[elementId];
    while (current) {
        crumbs.unshift({ id: current.id, name: current.name });
        current = current.parentId ? tree.nodes[current.parentId] : null;
    }
    return crumbs;
}

/**
 * Get total element count in tree.
 */
export function getElementCount() {
    return Object.keys(state.assessmentTree.nodes).length;
}

/**
 * Get all elements as a flat list with depth info.
 */
export function getElementsFlat() {
    const tree = state.assessmentTree;
    const result = [];
    const pending = [{ id: tree.rootId, depth: 0 }];
    const visited = new Set();
    while (pending.length > 0) {
        const { id, depth } = pending.pop();
        if (visited.has(id)) throw new Error(`Assessment tree contains a cycle or duplicate path at ${id}`);
        const node = tree.nodes[id];
        if (!node) continue;
        visited.add(id);
        result.push({ ...node, depth });
        const children = Array.isArray(node.childIds) ? node.childIds : [];
        for (let index = children.length - 1; index >= 0; index -= 1) {
            pending.push({ id: children[index], depth: depth + 1 });
        }
    }
    if (visited.size !== Object.keys(tree.nodes || {}).length) {
        throw new Error('Assessment tree contains unreachable nodes');
    }
    return result;
}

/**
 * Set a manual adjustment for a specific process on a specific element.
 * If level is 'default', the adjustment is removed.
 */
export function setElementProcessAdjustment(elementId, processId, level, justification) {
    const node = state.assessmentTree.nodes[elementId];
    if (!node) return { errors: ['System element is unavailable.'] };
    const baseline = getRecommendation(node, state);
    return saveElementDecisions(elementId, {
        [processId]: { level: level === 'default' ? baseline.levels[processId] : level, justification: justification || '' }
    });
}

/** Save an explicit decision batch without overwriting its recommendation reference. */
export function saveElementDecisions(elementId, drafts) {
    const node = state.assessmentTree.nodes[elementId];
    if (!node) return { errors: ['System element is unavailable.'] };
    const result = prepareDecisions(node, state, drafts);
    if (result.errors.length) return result;
    node.decisionRecords = result.records;
    node.decisionHistory = [...(node.decisionHistory || []), ...result.changes];
    node.manualAdjustments = result.adjustments;
    node.decisionDrafts = {};
    node.levels = result.levels;
    if (node.assessmentResult) node.assessmentResult = { ...node.assessmentResult, levels: result.levels, violations: result.violations };
    if (elementId === state.assessmentTree.rootId) state.manualAdjustments = result.adjustments;
    if (elementId === state.assessmentTree.activeId) {
        state.levels = result.levels;
        state.violations = result.violations;
    }
    // Saving a local decision never grants external approval or passes a review gate.
    if (result.levelsChanged) {
        node.status = 'draft';
        node.assessmentDisposition = 'work-in-progress';
        state.assessmentComplete = false;
        state.assessmentDisposition = 'work-in-progress';
    }
    if (elementId === state.assessmentTree.activeId) hydrateActiveElementState();
    result.persisted = notifyStateChanged();
    return result;
}
