/**
 * Inheritance Engine — Hierarchical System Element Tailoring (v3.3)
 *
 * Implements metric inheritance, down-tailoring detection, safety override
 * propagation, and peer interface consistency checks per §3.13.
 */
import { runFullAssessment } from './assessment-engine.js';

const LEVELS = ['basic', 'standard', 'comprehensive'];
const levelIndex = l => LEVELS.indexOf(l);

const METRIC_IDS = [
    'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8',
    'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16'
];

/** Metrics that Quick assessments allow to override (M1–M6) */
const QUICK_OVERRIDE_METRICS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

/** Metrics that typically change at child level */
const TYPICAL_OVERRIDE_GROUPS = {
    oftenOverridden: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
    sometimesOverridden: ['M7', 'M8', 'M11', 'M12'],
    usuallyInherited: ['M9', 'M10', 'M13', 'M14', 'M15'],
    rarelyOverridden: ['M16']
};

/**
 * Generate a unique ID for a new assessment node.
 */
function generateId() {
    return `elem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Get inherited metric scores from a parent node.
 * Returns all 16 parent metric scores as defaults.
 *
 * @param {Object} parentScores - Parent's metric scores { M1: 4, M2: 5, ... }
 * @returns {Object} All 16 metrics with parent values
 */
export function getInheritedMetrics(parentScores) {
    const inherited = {};
    for (const m of METRIC_IDS) {
        inherited[m] = parentScores[m] ?? 3; // default to 3 if missing
    }
    return inherited;
}

/**
 * Create a child assessment node inheriting from a parent.
 *
 * @param {string} parentId - Parent node ID
 * @param {string} name - Element name (e.g., "WMS Subsystem")
 * @param {'full'|'quick'|'inherited'} type - Assessment type
 * @param {Object} parentScores - Parent's metric scores
 * @returns {Object} New child node with inherited defaults
 */
export function createChildAssessment(parentId, name, type, parentScores) {
    const id = generateId();
    const inherited = getInheritedMetrics(parentScores);

    // For inherited type, all metrics are inherited
    // For quick type, M1-M6 are overridable, rest inherited
    // For full type, all metrics are independently scored (but start with parent defaults)
    const inheritedFlags = {};
    for (const m of METRIC_IDS) {
        if (type === 'inherited') {
            inheritedFlags[m] = true;
        } else if (type === 'quick') {
            inheritedFlags[m] = !QUICK_OVERRIDE_METRICS.includes(m);
        } else {
            inheritedFlags[m] = false; // Full: all independent
        }
    }

    return {
        id,
        name,
        parentId,
        childIds: [],
        assessmentType: type,
        inheritedMetrics: inheritedFlags,
        overriddenMetrics: {},
        downTailoringLog: [],
        status: 'draft',
        scores: { ...inherited }
    };
}

/**
 * Compute the effective scores for a child node, merging inherited parent
 * scores with child-specific overrides.
 *
 * @param {Object} childNode - The child assessment node
 * @param {Object} parentScores - Parent's metric scores
 * @returns {Object} Effective scores for the child
 */
export function getEffectiveScores(childNode, parentScores) {
    const effective = {};
    for (const m of METRIC_IDS) {
        if (childNode.inheritedMetrics[m]) {
            effective[m] = parentScores[m] ?? 3;
        } else {
            effective[m] = childNode.scores?.[m] ?? parentScores[m] ?? 3;
        }
    }
    return effective;
}

/**
 * Detect down-tailored processes where child level < parent level.
 *
 * @param {Object} parentLevels - Parent process levels { pid: 'comprehensive', ... }
 * @param {Object} childLevels - Child process levels
 * @returns {Array} List of down-tailored processes with delta info
 */
export function detectDownTailoring(parentLevels, childLevels) {
    const downTailored = [];
    for (const [pid, parentLevel] of Object.entries(parentLevels)) {
        const childLevel = childLevels[pid] || 'basic';
        const delta = levelIndex(parentLevel) - levelIndex(childLevel);
        if (delta > 0) {
            downTailored.push({
                processId: Number(pid),
                parentLevel,
                childLevel,
                delta,                    // 1 = one level, 2 = two levels
                requiresSponsor: delta >= 2, // Comprehensive→Basic needs sponsor
                hasJustification: false
            });
        }
    }
    return downTailored;
}

/**
 * Validate that all down-tailored processes have sufficient justifications.
 *
 * @param {Array} downTailored - Output from detectDownTailoring
 * @param {Array} justifications - Array of { processId, justification, outputSufficiency, approver }
 * @returns {{ valid: boolean, missing: Array, incomplete: Array }}
 */
export function validateDownTailoring(downTailored, justifications = []) {
    const justMap = new Map(justifications.map(j => [j.processId, j]));
    const missing = [];
    const incomplete = [];

    for (const dt of downTailored) {
        const j = justMap.get(dt.processId);
        if (!j) {
            missing.push(dt.processId);
        } else {
            if (!j.justification || !j.outputSufficiency) {
                incomplete.push(dt.processId);
            }
            if (dt.requiresSponsor && (!j.approver || j.approver === 'PM')) {
                incomplete.push(dt.processId);
            }
        }
    }

    return {
        valid: missing.length === 0 && incomplete.length === 0,
        missing,
        incomplete
    };
}

/**
 * Check output sufficiency for down-tailored processes.
 * Maps critical parent process inputs to what the child must still produce.
 *
 * @param {number} processId - The down-tailored process ID
 * @param {string} childLevel - The child's level for this process
 * @returns {{ outputRequired: string, childEquivalent: string }|null}
 */
export function checkOutputSufficiency(processId, childLevel) {
    const SUFFICIENCY_MAP = {
        24: { // Integration
            outputRequired: 'Interface Control Documents',
            basicEquivalent: 'Interface descriptions in Project Notebook',
            standardEquivalent: 'Interface specifications with verification criteria'
        },
        25: { // Verification
            outputRequired: 'Verification evidence per element',
            basicEquivalent: 'Test reports or acceptance records',
            standardEquivalent: 'Verification reports with traceability'
        },
        13: { // Configuration Management
            outputRequired: 'Baseline identification per element',
            basicEquivalent: 'Version log or release notes',
            standardEquivalent: 'Configuration item list with baseline IDs'
        },
        19: { // System Requirements
            outputRequired: 'Allocated requirements trace',
            basicEquivalent: 'Requirements allocation table',
            standardEquivalent: 'Requirements database with traceability'
        }
    };

    const map = SUFFICIENCY_MAP[processId];
    if (!map) return null;

    return {
        outputRequired: map.outputRequired,
        childEquivalent: childLevel === 'basic'
            ? map.basicEquivalent
            : map.standardEquivalent
    };
}

/**
 * Propagate safety overrides from parent to child.
 * If parent M5 ≥ 4, child must inherit this unless it has an independent
 * safety analysis demonstrating lower M5.
 *
 * @param {Object} parentScores - Parent metric scores
 * @param {Object} childScores - Child metric scores
 * @param {boolean} hasIndependentSafetyAnalysis - Whether child has independent analysis
 * @returns {{ propagated: boolean, warnings: Array }}
 */
export function propagateSafetyOverrides(parentScores, childScores, hasIndependentSafetyAnalysis = false) {
    const warnings = [];
    let propagated = false;
    const parentM5 = parentScores.M5 ?? 3;
    const childM5 = childScores.M5 ?? 3;
    const parentM8 = parentScores.M8 ?? 3;
    const childM8 = childScores.M8 ?? 3;

    // Safety override propagation
    if (parentM5 >= 4 && childM5 < parentM5) {
        if (hasIndependentSafetyAnalysis) {
            warnings.push({
                type: 'info',
                metric: 'M5',
                message: `Child M5=${childM5} accepted (independent safety analysis provided). Parent M5=${parentM5}.`
            });
        } else {
            warnings.push({
                type: 'error',
                metric: 'M5',
                message: `Child M5=${childM5} < Parent M5=${parentM5}. Independent safety analysis required to justify lower safety classification.`,
                requiredAction: 'Provide independent safety analysis or inherit parent M5 value.'
            });
            propagated = true;
        }
    }

    // Regulatory override propagation
    if (parentM8 >= 4 && childM8 < parentM8) {
        if (hasIndependentSafetyAnalysis) {
            warnings.push({
                type: 'info',
                metric: 'M8',
                message: `Child M8=${childM8} accepted (independent regulatory analysis provided). Parent M8=${parentM8}.`
            });
        } else {
            warnings.push({
                type: 'warning',
                metric: 'M8',
                message: `Child M8=${childM8} < Parent M8=${parentM8}. Independent regulatory analysis recommended.`,
                requiredAction: 'Provide regulatory analysis or inherit parent M8 value.'
            });
        }
    }

    return { propagated, warnings };
}

/**
 * Check peer interface consistency between sibling elements.
 * Peer elements sharing interfaces must have compatible CM, Integration,
 * and Verification levels (within one level of each other).
 *
 * @param {Object} elementALevels - Process levels for element A
 * @param {Object} elementBLevels - Process levels for element B
 * @returns {Array} List of interface consistency violations
 */
export function checkPeerInterfaceConsistency(elementALevels, elementBLevels) {
    const violations = [];

    const INTERFACE_PROCESSES = [
        { id: 13, name: 'Configuration Management', rule: 'CM compatibility' },
        { id: 24, name: 'Integration', rule: 'Integration symmetry' },
        { id: 25, name: 'Verification', rule: 'Verification reciprocity' }
    ];

    for (const proc of INTERFACE_PROCESSES) {
        const levelA = levelIndex(elementALevels[proc.id] || 'basic');
        const levelB = levelIndex(elementBLevels[proc.id] || 'basic');
        const delta = Math.abs(levelA - levelB);

        if (delta > 1) {
            violations.push({
                processId: proc.id,
                processName: proc.name,
                rule: proc.rule,
                elementALevel: LEVELS[levelA],
                elementBLevel: LEVELS[levelB],
                delta,
                message: `${proc.name} levels differ by ${delta} (${LEVELS[levelA]} vs ${LEVELS[levelB]}). Maximum allowed difference is 1.`
            });
        }
    }

    return violations;
}

/**
 * Determine if a system element warrants its own assessment based on
 * divergence from parent metrics (§3.13.2.3 threshold rules).
 *
 * @param {Object} parentScores - Parent metric scores
 * @param {Object} elementCharacteristics - Rough characteristics of the element
 * @returns {{ needsAssessment: boolean, recommendedType: string, reasons: Array }}
 */
export function assessNeedForSeparateAssessment(parentScores, elementCharacteristics) {
    const reasons = [];
    const {
        hasSafetyDifference = false,
        hasDistinctContractor = false,
        hasDistinctRegulatory = false,
        hasNovelTechnology = false,
        metricDifferences = 0
    } = elementCharacteristics;

    if (hasSafetyDifference) reasons.push('Distinct safety classification');
    if (hasDistinctContractor) reasons.push('Distinct contractor');
    if (hasDistinctRegulatory) reasons.push('Distinct regulatory context');
    if (hasNovelTechnology) reasons.push('Novel technology');
    if (metricDifferences >= 3) reasons.push(`${metricDifferences} metrics differ by ≥2`);

    const needsAssessment = reasons.length > 0;
    let recommendedType = 'inherited';
    if (needsAssessment) {
        recommendedType = (hasSafetyDifference || hasDistinctContractor || hasNovelTechnology)
            ? 'full' : 'quick';
    }

    return { needsAssessment, recommendedType, reasons };
}

/**
 * Run a complete hierarchical assessment for a child element.
 * Inherits parent metrics, applies overrides, runs the full assessment engine,
 * then detects down-tailoring.
 *
 * @param {Object} childNode - The child assessment node
 * @param {Object} parentScores - Parent metric scores
 * @param {Object} parentLevels - Parent process levels
 * @param {Object} context - Project context for overrides
 * @returns {Object} Complete child assessment with down-tailoring analysis
 */
export function runChildAssessment(childNode, parentScores, parentLevels, context = {}) {
    // Step 1: Compute effective scores (inherited + overrides)
    const effectiveScores = getEffectiveScores(childNode, parentScores);

    // Step 2: Check safety override propagation
    const safetyCheck = propagateSafetyOverrides(
        parentScores,
        effectiveScores,
        childNode.hasIndependentSafetyAnalysis || false
    );

    // If safety overrides need propagation and no independent analysis,
    // enforce parent safety score
    if (safetyCheck.propagated) {
        effectiveScores.M5 = parentScores.M5;
    }

    // Step 3: Run the standard assessment engine
    const assessment = runFullAssessment(effectiveScores, undefined, context);

    // Step 4: Detect down-tailoring from parent
    const downTailored = detectDownTailoring(parentLevels, assessment.levels);

    // Step 5: Check output sufficiency for down-tailored processes
    const sufficiencyChecks = downTailored.map(dt => ({
        ...dt,
        sufficiency: checkOutputSufficiency(dt.processId, dt.childLevel)
    }));

    return {
        ...assessment,
        effectiveScores,
        downTailored: sufficiencyChecks,
        safetyCheck,
        inheritanceSummary: {
            totalMetrics: METRIC_IDS.length,
            inherited: Object.values(childNode.inheritedMetrics).filter(v => v).length,
            overridden: Object.values(childNode.inheritedMetrics).filter(v => !v).length
        }
    };
}

/**
 * Generate a COTS/commodity template justification for auto-generated
 * down-tailoring justifications (§3.13.6).
 *
 * @param {string} elementName - Name of the element
 * @param {number} processId - Process ID
 * @param {string} parentLevel - Parent level
 * @param {string} childLevel - Child level
 * @param {Object} childScores - Child metric scores
 * @returns {string} Auto-generated justification text
 */
export function generateCOTSJustification(elementName, processId, parentLevel, childLevel, childScores) {
    const m5 = childScores.M5 ?? 1;
    const m1 = childScores.M1 ?? 1;
    return `Element "${elementName}" is a COTS item with ${m5 <= 1 ? 'no' : 'minimal'} safety impact (M5=${m5}) ` +
        `and ${m1 <= 2 ? 'minimal' : 'moderate'} architectural complexity (M1=${m1}). ` +
        `Down-tailoring of Process ${processId} from ${parentLevel} to ${childLevel} ` +
        `is justified by the element's commodity nature and well-understood performance characteristics.`;
}

// ===== Bidirectional Propagation (v3.3 Phase 2) =====

/**
 * Propagate parent scores downstream to a child node.
 * Skips any metric in the child's manualMetrics list.
 * Returns a list of conflicts where manual values differ from proposed parent values.
 *
 * @param {Object} parentNode - Parent tree node (with .scores)
 * @param {Object} childNode - Child tree node (with .scores, .manualMetrics, .inheritedMetrics)
 * @returns {{ applied: Object, conflicts: Array, skipped: Array }}
 */
export function propagateDownstream(parentNode, childNode) {
    const applied = {};
    const conflicts = [];
    const skipped = [];
    const parentScores = parentNode.scores || {};
    const manualSet = new Set(childNode.manualMetrics || []);

    for (const m of METRIC_IDS) {
        const parentVal = parentScores[m] ?? 3;
        const childVal = childNode.scores?.[m] ?? 3;

        if (manualSet.has(m)) {
            // Manual metric — do NOT overwrite
            if (childVal !== parentVal) {
                conflicts.push({
                    metric: m,
                    parentValue: parentVal,
                    childValue: childVal,
                    source: 'manual',
                    message: `${m}: Parent=${parentVal}, Manual=${childVal}`
                });
            } else {
                skipped.push(m); // Same value, no conflict
            }
        } else {
            // Auto-propagate
            applied[m] = parentVal;
        }
    }

    return { applied, conflicts, skipped };
}

/**
 * Suggest upstream defaults from children to parent.
 * Uses MAX across all children for each metric as the proposed parent default.
 * Never overwrites manually-set parent metrics.
 *
 * @param {Array} childNodes - Array of child tree nodes (each with .scores)
 * @param {Object} parentNode - Parent tree node (with .scores, .manualMetrics)
 * @returns {{ suggested: Object, conflicts: Array }}
 */
export function suggestUpstream(childNodes, parentNode) {
    const suggested = {};
    const conflicts = [];
    const manualSet = new Set(parentNode.manualMetrics || []);
    const parentScores = parentNode.scores || {};

    // Compute MAX across all children for each metric
    for (const m of METRIC_IDS) {
        let maxVal = 0;
        for (const child of childNodes) {
            const val = child.scores?.[m] ?? 3;
            if (val > maxVal) maxVal = val;
        }
        if (maxVal === 0) maxVal = 3; // default if no children have scores

        if (manualSet.has(m)) {
            const parentVal = parentScores[m] ?? 3;
            if (parentVal !== maxVal) {
                conflicts.push({
                    metric: m,
                    suggestedValue: maxVal,
                    parentValue: parentVal,
                    source: 'manual',
                    message: `${m}: Suggested from children=${maxVal}, Manual parent=${parentVal}`
                });
            }
        } else {
            suggested[m] = maxVal;
        }
    }

    return { suggested, conflicts };
}

/**
 * Detect conflicts between proposed score changes and existing manual values.
 * Used for both upstream and downstream propagation previews.
 *
 * @param {Object} proposedScores - Proposed metric scores { M1: 4, ... }
 * @param {Object} currentScores - Current metric scores
 * @param {Array} manualMetrics - List of manually-set metric IDs
 * @returns {Array} List of conflict objects
 */
export function detectConflicts(proposedScores, currentScores, manualMetrics = []) {
    const conflicts = [];
    const manualSet = new Set(manualMetrics);

    for (const m of METRIC_IDS) {
        const proposed = proposedScores[m];
        const current = currentScores[m];
        if (proposed !== undefined && current !== undefined && proposed !== current && manualSet.has(m)) {
            conflicts.push({
                metric: m,
                proposedValue: proposed,
                currentValue: current,
                isManual: true,
                message: `${m}: Would change from ${current} to ${proposed} (manually set)`
            });
        }
    }

    return conflicts;
}

