/**
 * Assessment Engine — Scoring algorithm & override logic
 */
import { METRIC_PROCESS_MAP, OVERRIDE_CONDITIONS, CONSISTENCY_RULES, PROPAGATION_RULES, CORE_PROCESSES } from '../data/se-tailoring-data.js';

const LEVELS = ['basic', 'standard', 'comprehensive'];
const levelIndex = l => LEVELS.indexOf(l);
const SCORE_WEIGHTS = { P: 2, S: 1 };
const metricSort = (a, b) => Number(a.replace('M', '')) - Number(b.replace('M', ''));

const SA_TIERS = [
    { tier: 'I', name: 'Negligible', description: 'Standard SE processes sufficient', floor: null },
    { tier: 'II', name: 'Safety Relevant', description: 'Additional safety assurance activities needed', floor: 'standard' },
    { tier: 'III', name: 'Safety-Critical', description: 'Full safety assurance program required', floor: 'comprehensive' }
];

const SA_PROCESSES = [12, 16, 19, 25, 27, 28, 29];

/**
 * Derive SA Criticality Tier from M5 (Safety Impact) score.
 * M5=1-2 → Tier I (Negligible), M5=3 → Tier II (Safety Relevant), M5=4-5 → Tier III (Safety Critical)
 */
export function calculateSATier(scores) {
    const m5 = scores?.M5 || 3;

    if (m5 >= 4) return { ...SA_TIERS[2], score: m5 };
    if (m5 >= 3) return { ...SA_TIERS[1], score: m5 };
    return { ...SA_TIERS[0], score: m5 };
}

function levelFromScore(score) {
    if (score >= 4) return 'comprehensive';
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

function applyConditionalHighestTierRule(drivers) {
    const primaryDrivers = drivers.filter(d => d.role === 'P');
    const secondaryDrivers = drivers.filter(d => d.role === 'S');

    const primaryAtC = primaryDrivers.filter(d => d.value >= 4);
    const secondaryAtSPlus = secondaryDrivers.filter(d => d.value >= 3);
    const secondaryAtC = secondaryDrivers.filter(d => d.value >= 4);
    const anyAtS = drivers.some(d => d.value >= 3);
    const allAtB = drivers.every(d => d.value <= 2);

    if (primaryAtC.length >= 2) {
        return 'comprehensive';
    }
    if (primaryAtC.length === 1 && secondaryAtSPlus.length >= 1) {
        return 'comprehensive';
    }
    if (primaryAtC.length === 1 && secondaryAtSPlus.length === 0) {
        return 'standard';
    }
    if (primaryAtC.length === 0 && secondaryAtC.length >= 1) {
        return 'standard';
    }
    if (anyAtS) {
        return 'standard';
    }
    if (allAtB) {
        return 'basic';
    }
    return 'basic';
}

/** Calculate process derivation details from metric scores */
export function calculateProcessDerivation(processId, scores, matrixMap = METRIC_PROCESS_MAP) {
    const map = matrixMap[processId];
    if (!map || Object.keys(map).length === 0) {
        return {
            level: 'basic',
            triggerMetrics: [],
            triggerScore: null,
            triggerLevel: 'basic',
            weightedReferenceScore: 3,
            weightedReferenceLevel: levelFromScore(3),
            conditionalRuleApplied: false
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
            triggerScore: null,
            triggerLevel: 'basic',
            weightedReferenceScore: 3,
            weightedReferenceLevel: levelFromScore(3),
            conditionalRuleApplied: false
        };
    }

    let weightedSum = 0;
    let totalWeight = 0;
    for (const d of drivers) {
        const weight = SCORE_WEIGHTS[d.role] || 1;
        weightedSum += d.value * weight;
        totalWeight += weight;
    }
    const weightedReferenceScore = totalWeight > 0 ? weightedSum / totalWeight : 3;
    const weightedReferenceLevel = levelFromScore(weightedReferenceScore);

    const maxScore = Math.max(...drivers.map(d => d.value));
    const triggerMetrics = drivers
        .filter(d => d.value === maxScore)
        .map(d => d.metric)
        .sort(metricSort);
    const triggerLevel = levelFromScore(maxScore);

    const conditionalLevel = applyConditionalHighestTierRule(drivers);
    const conditionalRuleApplied = conditionalLevel !== triggerLevel;
    const conditionalRuleReason = conditionalRuleApplied
        ? 'Comprehensive trigger not corroborated by conditional derivation rule'
        : null;

    return {
        level: conditionalLevel,
        triggerMetrics,
        triggerScore: maxScore,
        triggerLevel,
        weightedReferenceScore: Number(weightedReferenceScore.toFixed(2)),
        weightedReferenceLevel,
        conditionalRuleApplied,
        conditionalRuleReason
    };
}

/** Calculate individual process level from metric scores */
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

/** Apply override conditions (safety, regulatory, and project-context) */
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

/** Get driver attribution for a process */
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

/** Check consistency rules, return violations */
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
                // For rule 12, conservative auto-fix elevates Project Planning.
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

/** Simulate propagation when a process level changes */
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

/** Full assessment pipeline */
export function runFullAssessment(scores, matrixMap = METRIC_PROCESS_MAP, context = {}) {
    const derivationDetails = calculateAllProcessDerivations(scores, matrixMap);
    const derived = {};
    for (const [pid, detail] of Object.entries(derivationDetails)) {
        derived[pid] = detail.level;
    }
    const { levels: withOverrides, overrides } = applyOverrides(derived, scores, context);

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

    const fixes = [];
    let iterations = 0;
    let remainingViolations = checkConsistency(final, scores);

    while (iterations < 8) {
        const hcViolations = remainingViolations.filter(v => v.type === 'HC');
        if (hcViolations.length === 0) break;

        let fixedThisRound = false;
        for (const v of hcViolations) {
            // Rule 12 conservative auto-fix: elevate Project Planning to Standard (never downgrade technical work).
            if (v.ruleId === 12) {
                const currentPlanning = final[9] || 'basic';
                if (levelIndex(currentPlanning) < levelIndex('standard')) {
                    final[9] = 'standard';
                    fixes.push({
                        processId: 9,
                        from: currentPlanning,
                        to: 'standard',
                        reason: 'Rule 12 conservative fix (Planning floor)',
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

    return {
        derived,
        derivationDetails,
        overrides: [...overrides, ...saOverrides],
        fixes,
        levels: final,
        violations: remainingViolations,
        scores,
        saTier
    };
}
