/**
 * Shared App State
 *
 * v3.3: Added assessmentTree for hierarchical system element tailoring.
 * Each node holds an element's own metric scores, derived levels,
 * down-tailoring log, and parent/child relationships.
 * The 'default' root node is always a Full assessment.
 */
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
                downTailoringLog: [],          // [{ processId, parentLevel, childLevel, justification, outputSufficiency, approver }]
                status: 'draft',              // 'draft' | 'under_review' | 'approved' | 'baselined'
                scores: {},                   // per-node metric scores
                levels: {},                   // per-node process levels (after assessment)
                manualMetrics: [],            // metric IDs manually set by user (never auto-overwritten)
                assessmentResult: null,       // full assessment result object
                hasIndependentSafetyAnalysis: false,
                manualAdjustments: {}         // { CON: { level: 'C', justification: '...' } }
            }
        }
    },
    projectInfo: { name: '', date: '', team: '', phase: '' },
    scores: {},
    saResponses: {},
    saTier: null,
    derived: {},
    derivationDetails: {},
    levels: {},
    overrides: [],
    violations: [],
    fixes: [],
    manualAdjustments: {},
    tradeoffs: [],
    cultureType: null,
    notes: '',
    assessmentComplete: false
};

const listeners = [];

export function getState() { return state; }

export function setState(updates) {
    Object.assign(state, updates);
    listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
    listeners.push(fn);
    return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
}

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ===== Tree Manipulation Helpers (v3.3) =====

const QUICK_OVERRIDE_METRICS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];
const ALL_METRICS = ['M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M12','M13','M14','M15','M16'];

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
        levels: {},
        manualMetrics: [],
        assessmentResult: null,
        hasIndependentSafetyAnalysis: false,
        manualAdjustments: {}
    };
    parent.childIds.push(id);
    listeners.forEach(fn => fn(state));
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

    // Recursively remove children
    const removeRecursive = (id) => {
        const n = tree.nodes[id];
        if (!n) return;
        for (const childId of [...n.childIds]) {
            removeRecursive(childId);
        }
        delete tree.nodes[id];
    };
    removeRecursive(elementId);

    // Remove from parent's childIds
    const parent = tree.nodes[node.parentId];
    if (parent) {
        parent.childIds = parent.childIds.filter(id => id !== elementId);
    }

    // If active was removed, switch to root
    if (tree.activeId === elementId) {
        tree.activeId = tree.rootId;
    }

    listeners.forEach(fn => fn(state));
    return true;
}

/**
 * Set the active element (switches assessment context).
 */
export function setActiveElement(elementId) {
    const tree = state.assessmentTree;
    if (!tree.nodes[elementId]) return false;
    tree.activeId = elementId;
    listeners.forEach(fn => fn(state));
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
    listeners.forEach(fn => fn(state));
}

/**
 * Store full assessment result for a specific element.
 */
export function setElementAssessmentResult(elementId, result) {
    const node = state.assessmentTree.nodes[elementId];
    if (!node) return;
    node.assessmentResult = result;
    node.levels = result.levels || {};
    node.status = 'under_review';
    listeners.forEach(fn => fn(state));
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
    }
}

/**
 * Rename an element node.
 */
export function renameElement(elementId, newName) {
    const node = state.assessmentTree.nodes[elementId];
    if (!node) return;
    node.name = newName;
    listeners.forEach(fn => fn(state));
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
    const walk = (id, depth) => {
        const node = tree.nodes[id];
        if (!node) return;
        result.push({ ...node, depth });
        for (const childId of node.childIds) {
            walk(childId, depth + 1);
        }
    };
    walk(tree.rootId, 0);
    return result;
}

/**
 * Set a manual adjustment for a specific process on a specific element.
 * If level is 'default', the adjustment is removed.
 */
export function setElementProcessAdjustment(elementId, processId, level, justification) {
    const node = state.assessmentTree.nodes[elementId];
    if (node) {
        if (!node.manualAdjustments) {
            node.manualAdjustments = {};
        }
        if (level === 'default') {
            delete node.manualAdjustments[processId];
        } else {
            node.manualAdjustments[processId] = { level, justification };
        }
        listeners.forEach(fn => fn(state));
    }
}
