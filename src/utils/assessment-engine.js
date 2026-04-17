/**
 * Assessment Engine — v4.1 Right-Sized Scoring Algorithm
 * 
 * Algorithm Steps:
 * 1. Get applicable metrics for each process
 * 2. Convert metric scores to tiers (highest score wins)
 * 3. Find MAX tier across all applicable metrics
 * 4. Apply overrides (safety, regulatory, project-context)
 * 5. Apply SA floor (Safety Assurance minimum levels)
 * 6. RIGHT-SIZE: Compute PSI/CSI/CRI → apply capability ceilings → enforce rigor budget
 * 7. Apply interdependencies (consistency rules)
 * 8. CORROBORATION: Compute confidence for Comprehensive processes
 */
import { METRIC_PROCESS_MAP, OVERRIDE_CONDITIONS, CONSISTENCY_RULES, PROPAGATION_RULES, CORE_PROCESSES, RIGOR_BUDGET, CAPABILITY_CEILINGS, PROCESS_PRIORITY_CLASSES } from '../data/se-tailoring-data.js';

const LEVELS = ['basic', 'standard', 'comprehensive'];
const levelIndex = l => LEVELS.indexOf(l);
const metricSort = (a, b) => Number(a.replace('M', '')) - Number(b.replace('M', ''));

const SA_TIERS = [
    { tier: 'I', name: 'Negligible', description: 'Standard SE processes sufficient', floor: null },
    { tier: 'II', name: 'Safety Relevant', description: 'Additional safety assurance activities needed', floor: 'basic' },
    { tier: 'III', name: 'Safety-Critical', description: 'Full safety assurance program required', floor: 'standard' }
];

const SA_PROCESSES = [12, 16, 19, 25, 27, 28, 29];

/**
 * Derive SA Criticality Tier from M5 (Safety Impact) score.
 * M5=1-3 → Tier I (Negligible), M5=4 → Tier II (Safety Relevant), M5=5 → Tier III (Safety Critical)
 */
export function calculateSATier(scores) {
    const m5 = scores?.M5 || 3;

    if (m5 === 5) return { ...SA_TIERS[2], score: m5 };
    if (m5 >= 4) return { ...SA_TIERS[1], score: m5 };
    return { ...SA_TIERS[0], score: m5 };
}

function levelFromScore(score) {
    if (score >= 5) return 'comprehensive';
    if (score >= 3) return 'standard';
    return 'basic';
}

function scoreOrDefault(scores, metricId) {
    const score = scores?.[metricId];
    return typeof score === 'number' ? score : 3;
}

function compareScore(lhs, op, rhs) {
    if (op === '>=') return lhs >= rhs;
    if (op === '=') return lhs === rhs;
    if (op === '<=') return lhs <= rhs;
    return false;
}

function getTechnicalProcessIds() {
    return CORE_PROCESSES.filter(p => p.group === 'technical').map(p => p.id);
}

function isOverrideTriggered(overrideCondition, scores = {}, context = {}) {
    const trigger = overrideCondition?.trigger;
    if (!trigger) return false;

    if (trigger.type === 'metric') {
        const score = scoreOrDefault(scores, trigger.metric);
        return compareScore(score, trigger.op, trigger.value);
    }

    if (trigger.type === 'context') {
        return context?.[trigger.field] === trigger.equals;
    }

    return false;
}

/**
 * Calculate process derivation details using v4.0 simplified algorithm.
 * 
 * Algorithm:
 * 1. Get all applicable metrics for the process (Primary and Secondary drivers)
 * 2. Find the MAX score across all applicable metrics (highest tier wins)
 * 3. Convert max score to level: 1-2=basic, 3-4=standard, 5=comprehensive
 * 4. Track which metrics drove the decision (all metrics with max score)
 * 
 * No weighted averaging. No conditional derivation. Simple highest-score-wins.
 */
export function calculateProcessDerivation(processId, scores, matrixMap = METRIC_PROCESS_MAP) {
    const map = matrixMap[processId];
    if (!map || Object.keys(map).length === 0) {
        return {
            level: 'basic',
            triggerMetrics: [],
            triggerScore: 3,
            triggerLevel: 'basic',
            allMetricScores: []
        };
    }

    const drivers = Object.entries(map)
        .filter(([, role]) => role === 'P' || role === 'S')
        .map(([metric, role]) => {
            const value = scoreOrDefault(scores, metric);
            return { metric, role, value, level: levelFromScore(value) };
        });

    if (drivers.length === 0) {
        return {
            level: 'basic',
            triggerMetrics: [],
            triggerScore: 3,
            triggerLevel: 'basic',
            allMetricScores: []
        };
    }

    const maxScore = Math.max(...drivers.map(d => d.value));
    const triggerMetrics = drivers
        .filter(d => d.value === maxScore)
        .map(d => d.metric)
        .sort(metricSort);
    let derivedLevel = levelFromScore(maxScore);
    let confidence = 'high';

    if (derivedLevel === 'comprehensive') {
        const applicableMetrics = Object.entries(matrixMap[processId] || {});

        // Count Primary drivers at Comprehensive (score=5)
        const primaryAtComprehensive = applicableMetrics.filter(([m, role]) => {
            return role === 'P' && scoreOrDefault(scores, m) === 5;
        }).length;

        // Count Secondary drivers at Standard+ (score>=3)
        const secondaryAtStandardPlus = applicableMetrics.filter(([m, role]) => {
            return role === 'S' && scoreOrDefault(scores, m) >= 3;
        }).length;

        // Corroboration check per Critical Review §5.3 / CHANGELOG v3.3.0:
        // Requires 2+ Primary drivers at Comprehensive, OR
        // 1 Primary at Comprehensive + ≥1 Secondary at Standard+
        const corroborated = (
            primaryAtComprehensive >= 2 ||
            (primaryAtComprehensive >= 1 && secondaryAtStandardPlus >= 1)
        );

        // Safety/criticality override: single M5=5 or M7=5 always corroborated
        // (these represent irreducible safety/regulatory constraints)
        const safetyCriticalSole = applicableMetrics.some(([m]) =>
            (m === 'M5' || m === 'M7') && scoreOrDefault(scores, m) === 5
        );

        if (corroborated || safetyCriticalSole) {
            confidence = 'corroborated';
        } else {
            derivedLevel = 'standard';
            confidence = 'available-with-justification';
        }
    }

    const allMetricScores = drivers.map(d => ({
        metric: d.metric,
        role: d.role,
        value: d.value,
        level: d.level
    }));

    return {
        level: derivedLevel,
        triggerMetrics,
        triggerScore: maxScore,
        triggerLevel: derivedLevel,
        confidence,
        allMetricScores
    };
}

/** Calculate individual process level from metric scores using highest-tier-wins */
export function calculateProcessLevel(processId, scores, matrixMap = METRIC_PROCESS_MAP) {
    return calculateProcessDerivation(processId, scores, matrixMap).level;
}

/** Calculate levels for all core processes */
export function calculateAllProcessLevels(scores, matrixMap = METRIC_PROCESS_MAP) {
    const levels = {};
    for (const p of CORE_PROCESSES) {
        levels[p.id] = calculateProcessLevel(p.id, scores, matrixMap);
    }
    return levels;
}

/** Calculate derivation details for all core processes */
export function calculateAllProcessDerivations(scores, matrixMap = METRIC_PROCESS_MAP) {
    const derivations = {};
    for (const p of CORE_PROCESSES) {
        derivations[p.id] = calculateProcessDerivation(p.id, scores, matrixMap);
    }
    return derivations;
}

/**
 * Apply override conditions (safety, regulatory, and project-context).
 * Overrides elevate process levels when specific conditions are met.
 */
export function applyOverrides(levels, scores, context = {}) {
    const applied = { ...levels };
    const overridesApplied = [];

    for (const ov of OVERRIDE_CONDITIONS) {
        if (isOverrideTriggered(ov, scores, context)) {
            for (const pid of ov.processes) {
                if (levelIndex(applied[pid] || 'basic') < levelIndex(ov.minLevel)) {
                    const prev = applied[pid];
                    applied[pid] = ov.minLevel;
                    overridesApplied.push({
                        processId: pid,
                        from: prev,
                        to: ov.minLevel,
                        reason: ov.label,
                        condition: ov.condition,
                        overrideId: ov.id,
                        overrideSource: ov.source,
                        triggerType: ov.trigger?.type || 'metric'
                    });
                }
            }
        }
    }
    return { levels: applied, overrides: overridesApplied };
}

/**
 * Get driver attribution for a process.
 * Returns all metrics (Primary and Secondary) that influence the process level.
 */
export function getDriverAttribution(processId, scores, matrixMap = METRIC_PROCESS_MAP) {
    const map = matrixMap[processId];
    if (!map) return [];

    const drivers = [];
    for (const [metric, role] of Object.entries(map)) {
        const val = scoreOrDefault(scores, metric);
        drivers.push({ metric, role, value: val, label: role === 'P' ? 'Primary' : 'Secondary' });
    }
    return drivers.sort((a, b) => (a.role === 'P' ? 0 : 1) - (b.role === 'P' ? 0 : 1) || b.value - a.value);
}

/**
 * Check consistency rules (interdependencies), return violations.
 * Interdependencies ensure related processes maintain appropriate level relationships.
 */
export function checkConsistency(levels, scores = {}) {
    const violations = [];
    const technicalIds = getTechnicalProcessIds();

    for (const rule of CONSISTENCY_RULES) {
        let triggered = false;

        if (rule.trigger.process === 'any_technical') {
            triggered = technicalIds.some(pid =>
                levelIndex(levels[pid] || 'basic') >= levelIndex(rule.trigger.level)
            );
        } else if (Array.isArray(rule.trigger.process)) {
            triggered = rule.trigger.process.some(pid => {
                const lvl = levels[pid] || 'basic';
                return rule.trigger.op === '>='
                    ? levelIndex(lvl) >= levelIndex(rule.trigger.level)
                    : rule.trigger.op === '='
                        ? lvl === rule.trigger.level
                        : false;
            });
        } else if (rule.trigger.process === 'all_technical') {
            triggered = technicalIds.every(pid => {
                const lvl = levels[pid] || 'basic';
                return rule.trigger.op === '>='
                    ? levelIndex(lvl) >= levelIndex(rule.trigger.level)
                    : rule.trigger.op === '='
                        ? lvl === rule.trigger.level
                        : rule.trigger.op === '<='
                            ? levelIndex(lvl) <= levelIndex(rule.trigger.level)
                            : false;
            });
        } else {
            const lvl = levels[rule.trigger.process] || 'basic';
            triggered = rule.trigger.op === '>='
                ? levelIndex(lvl) >= levelIndex(rule.trigger.level)
                : rule.trigger.op === '='
                    ? lvl === rule.trigger.level
                    : rule.trigger.op === '<='
                        ? levelIndex(lvl) <= levelIndex(rule.trigger.level)
                        : false;
        }

        if (triggered) {
            const reqProcess = rule.required.process;
            let violated = false;
            let affectedProcess = reqProcess;
            let currentLevel = levels[reqProcess] || 'basic';
            let violatingProcesses = [];

            if (reqProcess === 'all_technical') {
                violatingProcesses = technicalIds.filter(pid => {
                    const lvl = levels[pid] || 'basic';
                    if (rule.required.op === '<=') return levelIndex(lvl) > levelIndex(rule.required.level);
                    if (rule.required.op === '>=') return levelIndex(lvl) < levelIndex(rule.required.level);
                    if (rule.required.op === '=') return lvl !== rule.required.level;
                    return false;
                });
                violated = violatingProcesses.length > 0;
                affectedProcess = typeof rule.trigger.process === 'number' ? rule.trigger.process : 9;
                currentLevel = levels[affectedProcess] || 'basic';
            } else {
                const reqLvl = levels[reqProcess] || 'basic';
                currentLevel = reqLvl;
                if (rule.required.op === '>=') {
                    violated = levelIndex(reqLvl) < levelIndex(rule.required.level);
                } else if (rule.required.op === '<=') {
                    violated = levelIndex(reqLvl) > levelIndex(rule.required.level);
                } else if (rule.required.op === '=') {
                    violated = reqLvl !== rule.required.level;
                }
            }

            if (violated) {
                violations.push({
                    ruleId: rule.id,
                    type: rule.type,
                    label: rule.label,
                    rationale: rule.rationale,
                    severity: rule.type === 'HC' ? 'error' : 'warning',
                    affectedProcess,
                    currentLevel,
                    requiredLevel: rule.required.level,
                    requiredOp: rule.required.op,
                    violatingProcesses
                });
            }
        }
    }
    return violations;
}

/**
 * Simulate propagation when a process level changes.
 * Shows downstream effects on related processes via interdependency rules.
 */
export function simulatePropagation(processId, newLevel, currentLevels) {
    const changes = [];
    const technicalIds = getTechnicalProcessIds();

    const applyToTarget = (rule, targetId) => {
        const currentLevel = currentLevels[targetId] || 'basic';
        if (rule.minLevel && levelIndex(currentLevel) < levelIndex(rule.minLevel)) {
            changes.push({
                processId: targetId,
                from: currentLevel,
                to: rule.minLevel,
                type: rule.type,
                depth: rule.depth,
                ruleId: rule.ruleId || rule.id
            });
            return;
        }
        if (rule.maxLevel && levelIndex(currentLevel) > levelIndex(rule.maxLevel)) {
            changes.push({
                processId: targetId,
                from: currentLevel,
                to: rule.maxLevel,
                type: rule.type,
                depth: rule.depth,
                ruleId: rule.ruleId || rule.id
            });
        }
    };

    for (const rule of PROPAGATION_RULES) {
        let sourceTriggered = false;
        if (rule.source === 'any_technical') {
            sourceTriggered = technicalIds.includes(processId) && levelIndex(newLevel) >= levelIndex(rule.sourceLevel);
        } else {
            sourceTriggered = rule.source === processId && levelIndex(newLevel) >= levelIndex(rule.sourceLevel);
        }

        if (!sourceTriggered) continue;

        if (rule.target === 'all_technical') {
            for (const technicalId of technicalIds) {
                applyToTarget(rule, technicalId);
            }
            continue;
        }

        applyToTarget(rule, rule.target);
    }
    return changes;
}

// =====================================================================
// RIGHT-SIZING: Derived Indices & Rigor Governance
// =====================================================================

/**
 * Compute Project Scale Index (PSI) from complexity metrics.
 * PSI = max(M1, M2, M4) with M11/M12 as secondary modifiers.
 * Returns 1-5 ordinal scale.
 */
export function computePSI(scores) {
    const m1 = scoreOrDefault(scores, 'M1');
    const m2 = scoreOrDefault(scores, 'M2');
    const m4 = scoreOrDefault(scores, 'M4');
    const primary = Math.max(m1, m2, m4);

    const m11 = scoreOrDefault(scores, 'M11');
    const m12 = scoreOrDefault(scores, 'M12');
    const secondary = Math.max(m11, m12);

    // Secondary can nudge PSI up by 1 if both primary and secondary are high
    if (primary <= 2 && secondary >= 4) return Math.min(primary + 1, 5);
    return primary;
}

/**
 * Compute Constraint Stress Index (CSI) from constraint/pressure metrics.
 * CSI = max(M9, M10, M15) — schedule, budget, political pressure.
 * Returns 1-5 ordinal scale.
 */
export function computeCSI(scores) {
    return Math.max(
        scoreOrDefault(scores, 'M9'),
        scoreOrDefault(scores, 'M10'),
        scoreOrDefault(scores, 'M15')
    );
}

/**
 * Compute Capability/Readiness Index (CRI) from culture metric.
 * Maps M16 to 1-3 scale: 1-2→Resistant(1), 3→Tolerant(2), 4-5→Supportive(3).
 * Returns 1-3 ordinal scale.
 */
export function computeCRI(scores) {
    const m16 = scoreOrDefault(scores, 'M16');
    if (m16 >= 4) return 3;
    if (m16 >= 3) return 2;
    return 1;
}

/**
 * Get the process priority rank (lower = higher priority, harder to downgrade).
 * Returns 0 for core, 1 for context-sensitive, 2 for secondary.
 */
function getProcessPriority(processId) {
    if (PROCESS_PRIORITY_CLASSES.core.processes.includes(processId)) return 0;
    if (PROCESS_PRIORITY_CLASSES.contextSensitive.processes.includes(processId)) return 1;
    return 2;
}

/**
 * Check if a process was elevated by a safety/regulatory override.
 * Such processes are exempt from right-sizing downgrades.
 */
function isOverrideProtected(processId, overridesApplied) {
    return overridesApplied.some(o => o.processId === processId);
}

/**
 * Apply right-sizing: capability ceilings + rigor budget enforcement.
 * Returns adjusted levels and a log of all right-sizing actions taken.
 */
export function applyRightSizing(levels, scores, overridesApplied = []) {
    const psi = computePSI(scores);
    const csi = computeCSI(scores);
    const cri = computeCRI(scores);
    const adjusted = { ...levels };
    const actions = [];

    // --- Step 1: Apply capability ceilings based on CRI ---
    const ceiling = CAPABILITY_CEILINGS.find(c => c.cri === cri);
    if (ceiling && cri <= 2) {
        for (const p of CORE_PROCESSES) {
            if (isOverrideProtected(p.id, overridesApplied)) continue;

            let maxAllowed = ceiling.maxLevel;

            // CRI=2: data-intensive processes have special cap
            if (cri === 2 && ceiling.dataIntensiveProcesses?.includes(p.id) && psi < ceiling.psiExemptionThreshold) {
                maxAllowed = ceiling.dataIntensiveCap;
            }

            if (levelIndex(adjusted[p.id] || 'basic') > levelIndex(maxAllowed)) {
                const prev = adjusted[p.id];
                adjusted[p.id] = maxAllowed;
                actions.push({
                    processId: p.id,
                    from: prev,
                    to: maxAllowed,
                    type: 'capability_ceiling',
                    reason: `CRI=${cri} caps at ${maxAllowed} (${ceiling.label})`
                });
            }
        }
    }

    // --- Step 2: Enforce rigor budget based on PSI ---
    const budget = RIGOR_BUDGET.find(b => psi >= b.psiMin && psi <= b.psiMax);
    if (budget) {
        // Count current Comprehensive processes (excluding override-protected)
        const compProcesses = CORE_PROCESSES
            .filter(p => adjusted[p.id] === 'comprehensive')
            .map(p => p.id);

        if (compProcesses.length > budget.maxComprehensive) {
            // Sort by priority (secondary first = downgrade first), then by lowest driving metric
            const downgradeCandidates = compProcesses
                .filter(pid => !isOverrideProtected(pid, overridesApplied))
                .map(pid => ({
                    pid,
                    priority: getProcessPriority(pid),
                    maxMetric: getMaxDrivingMetric(pid, scores)
                }))
                .sort((a, b) => {
                    // Downgrade secondary before context-sensitive before core
                    if (a.priority !== b.priority) return b.priority - a.priority;
                    // Within same priority, downgrade lowest-scoring first
                    return a.maxMetric - b.maxMetric;
                });

            let excess = compProcesses.length - budget.maxComprehensive;
            for (const candidate of downgradeCandidates) {
                if (excess <= 0) break;
                adjusted[candidate.pid] = 'standard';
                actions.push({
                    processId: candidate.pid,
                    from: 'comprehensive',
                    to: 'standard',
                    type: 'rigor_budget',
                    reason: `PSI=${psi} (${budget.label}) limits Comprehensive to ${budget.maxComprehensive}`
                });
                excess--;
            }
        }

        // For small projects (PSI 1-2), also limit Standard count
        if (psi <= 2 && budget.typicalStandardRange) {
            const maxStd = budget.typicalStandardRange[1];
            const stdProcesses = CORE_PROCESSES
                .filter(p => adjusted[p.id] === 'standard')
                .map(p => p.id);

            if (stdProcesses.length > maxStd) {
                const stdCandidates = stdProcesses
                    .filter(pid => !isOverrideProtected(pid, overridesApplied))
                    .map(pid => ({
                        pid,
                        priority: getProcessPriority(pid),
                        maxMetric: getMaxDrivingMetric(pid, scores)
                    }))
                    .sort((a, b) => {
                        if (a.priority !== b.priority) return b.priority - a.priority;
                        return a.maxMetric - b.maxMetric;
                    });

                let stdExcess = stdProcesses.length - maxStd;
                for (const candidate of stdCandidates) {
                    if (stdExcess <= 0) break;
                    adjusted[candidate.pid] = 'basic';
                    actions.push({
                        processId: candidate.pid,
                        from: 'standard',
                        to: 'basic',
                        type: 'rigor_budget',
                        reason: `PSI=${psi} (${budget.label}) limits Standard to ${maxStd}`
                    });
                    stdExcess--;
                }
            }
        }
    }

    return { levels: adjusted, rightSizingActions: actions, indices: { psi, csi, cri } };
}

/** Helper: get the max driving metric score for a process */
function getMaxDrivingMetric(processId, scores) {
    const map = METRIC_PROCESS_MAP[processId];
    if (!map) return 0;
    return Math.max(...Object.keys(map).map(m => scoreOrDefault(scores, m)));
}

/**
 * Full assessment pipeline implementing v4.1 right-sized algorithm.
 * 
 * Execution Steps:
 * 1. Derive initial levels from metrics (highest tier wins for each process)
 * 2. Apply override conditions (safety, regulatory, project-context)
 * 3. Apply SA floor (Safety Assurance minimum levels based on M5)
 * 4. Apply interdependencies (consistency rules with auto-fix)
 * 
 * Returns complete assessment with derivation details, overrides, and violations.
 */
export function runFullAssessment(scores, matrixMap = METRIC_PROCESS_MAP, context = {}) {
    // Step 1: Derive initial levels using highest-tier-wins algorithm
    const derivationDetails = calculateAllProcessDerivations(scores, matrixMap);
    const derived = {};
    for (const [pid, detail] of Object.entries(derivationDetails)) {
        derived[pid] = detail.level;
    }

    // Step 2: Apply override conditions (safety, regulatory, project-context)
    const { levels: withOverrides, overrides } = applyOverrides(derived, scores, context);

    // Step 3: Apply SA floor (Safety Assurance minimum levels)
    let final = { ...withOverrides };
    const saOverrides = [];

    const saTier = calculateSATier(scores);
    if (saTier.floor) {
        for (const pid of SA_PROCESSES) {
            const currentLevel = final[pid] || 'basic';
            if (levelIndex(currentLevel) < levelIndex(saTier.floor)) {
                const prev = currentLevel;
                final[pid] = saTier.floor;
                saOverrides.push({
                    processId: pid,
                    from: prev,
                    to: saTier.floor,
                    reason: `SA Tier ${saTier.tier} Floor`,
                    condition: `M5 = ${scoreOrDefault(scores, 'M5')}`,
                    triggerType: 'metric'
                });
            }
        }
    }

    const allOverrides = [...overrides, ...saOverrides];

    // Step 4: RIGHT-SIZE — apply capability ceilings (CRI) and rigor budget (PSI)
    const { levels: afterRightSizing, rightSizingActions, indices } = applyRightSizing(final, scores, allOverrides);

    // Step 5: Apply interdependencies (consistency rules with auto-fix)
    final = { ...afterRightSizing };
    const fixes = [];
    let iterations = 0;
    let remainingViolations = checkConsistency(final, scores);

    while (iterations < 8) {
        const hcViolations = remainingViolations.filter(v => v.type === 'HC');
        if (hcViolations.length === 0) break;

        let fixedThisRound = false;
        for (const v of hcViolations) {
            if (v.ruleId === 12 || v.ruleId === '12') {
                const currentPlanning = final[9] || 'basic';
                if (levelIndex(currentPlanning) < levelIndex('standard')) {
                    final[9] = 'standard';
                    fixes.push({
                        processId: 9,
                        from: currentPlanning,
                        to: 'standard',
                        reason: 'Rule 12 strengthened fix (Planning floor)',
                        ruleId: 12
                    });
                    fixedThisRound = true;
                }
                continue;
            }

            if (v.requiredOp === '>=' && levelIndex(final[v.affectedProcess] || 'basic') < levelIndex(v.requiredLevel)) {
                const prev = final[v.affectedProcess];
                final[v.affectedProcess] = v.requiredLevel;
                fixes.push({
                    processId: v.affectedProcess,
                    from: prev,
                    to: v.requiredLevel,
                    reason: v.label,
                    ruleId: v.ruleId
                });
                fixedThisRound = true;
            }
        }

        if (!fixedThisRound) break;
        remainingViolations = checkConsistency(final, scores);
        iterations += 1;
    }

    // Step 6: Compute confidence for each process based on final levels
    const confidence = {};
    for (const p of CORE_PROCESSES) {
        const finalLevel = final[p.id];
        if (finalLevel === 'comprehensive') {
            const applicableMetrics = Object.entries(METRIC_PROCESS_MAP[p.id] || {});
            const metricsAtStandardOrAbove = applicableMetrics.filter(([m]) => {
                const score = scoreOrDefault(scores, m);
                return score >= 3;
            }).length;
            const metricsAtComprehensive = applicableMetrics.filter(([m]) => {
                const score = scoreOrDefault(scores, m);
                return score === 5;
            }).length;
            const soleCIsCriticality = metricsAtComprehensive === 1 && applicableMetrics.filter(([m]) => {
                const score = scoreOrDefault(scores, m);
                return score === 5;
            }).every(([m]) => m === 'M5' || m === 'M7');

            if (metricsAtStandardOrAbove >= 2 || metricsAtComprehensive >= 1) {
                confidence[p.id] = 'corroborated';
            } else if (soleCIsCriticality) {
                confidence[p.id] = 'corroborated';
            } else {
                confidence[p.id] = 'available-with-justification';
            }
        } else {
            confidence[p.id] = 'high';
        }
    }

    return {
        derived,
        derivationDetails,
        overrides: allOverrides,
        rightSizingActions: rightSizingActions || [],
        indices: indices || {},
        fixes,
        levels: final,
        violations: remainingViolations,
        scores,
        saTier,
        confidence
    };
}
