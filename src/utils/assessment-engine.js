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
            weightedReferenceLevel: levelFromScore(3)
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
            weightedReferenceLevel: levelFromScore(3)
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

    return {
        level: triggerLevel,
        triggerMetrics,
        triggerScore: maxScore,
        triggerLevel,
        weightedReferenceScore: Number(weightedReferenceScore.toFixed(2)),
        weightedReferenceLevel
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

/** Apply override conditions (safety, regulatory, etc.) */
export function applyOverrides(levels, scores) {
    const applied = { ...levels };
    const overridesApplied = [];

    for (const ov of OVERRIDE_CONDITIONS) {
        let triggered = false;
        if (ov.id === 'life_safety' && (scores.M5 || 3) >= 5) triggered = true;
        else if (ov.id === 'safety_critical' && (scores.M5 || 3) >= 4) triggered = true;
        else if (ov.id === 'mission_critical' && (scores.M6 || 3) >= 4) triggered = true;
        else if (ov.id === 'high_regulatory' && (scores.M8 || 3) >= 4) triggered = true;
        else if (ov.id === 'env_critical' && (scores.M7 || 3) >= 5) triggered = true;
        else if (ov.id === 'novel_tech' && (scores.M3 || 3) >= 4) triggered = true;

        if (triggered) {
            for (const pid of ov.processes) {
                if (levelIndex(applied[pid] || 'basic') < levelIndex(ov.minLevel)) {
                    const prev = applied[pid];
                    applied[pid] = ov.minLevel;
                    overridesApplied.push({ processId: pid, from: prev, to: ov.minLevel, reason: ov.label, condition: ov.condition });
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
export function checkConsistency(levels) {
    const violations = [];

    for (const rule of CONSISTENCY_RULES) {
        let triggered = false;

        if (rule.trigger.process === 'any_technical') {
            // Rule 7: any technical process >= standard
            triggered = CORE_PROCESSES.filter(p => p.group === 'technical')
                .some(p => levelIndex(levels[p.id] || 'basic') >= levelIndex(rule.trigger.level));
        } else if (Array.isArray(rule.trigger.process)) {
            triggered = rule.trigger.process.some(pid => {
                const lvl = levels[pid] || 'basic';
                return rule.trigger.op === '>=' ? levelIndex(lvl) >= levelIndex(rule.trigger.level) : lvl === rule.trigger.level;
            });
        } else {
            const lvl = levels[rule.trigger.process] || 'basic';
            triggered = rule.trigger.op === '>='
                ? levelIndex(lvl) >= levelIndex(rule.trigger.level)
                : rule.trigger.op === '='
                    ? lvl === rule.trigger.level
                    : false;
        }

        if (triggered) {
            const reqProcess = rule.required.process;
            const reqLvl = levels[reqProcess] || 'basic';
            let violated = false;

            if (rule.required.op === '>=') {
                violated = levelIndex(reqLvl) < levelIndex(rule.required.level);
            } else if (rule.required.op === '<=') {
                violated = levelIndex(reqLvl) > levelIndex(rule.required.level);
            }

            if (violated) {
                violations.push({
                    ruleId: rule.id,
                    type: rule.type,
                    label: rule.label,
                    rationale: rule.rationale,
                    severity: rule.type === 'HC' ? 'error' : 'warning',
                    affectedProcess: reqProcess,
                    currentLevel: reqLvl,
                    requiredLevel: rule.required.level,
                    requiredOp: rule.required.op
                });
            }
        }
    }
    return violations;
}

/** Simulate propagation when a process level changes */
export function simulatePropagation(processId, newLevel, currentLevels) {
    const changes = [];
    for (const rule of PROPAGATION_RULES) {
        if (rule.source === processId && levelIndex(newLevel) >= levelIndex(rule.sourceLevel)) {
            const target = rule.target;
            if (target === 'all_technical') continue;
            const curLvl = currentLevels[target] || 'basic';
            if (levelIndex(curLvl) < levelIndex(rule.minLevel)) {
                changes.push({ processId: target, from: curLvl, to: rule.minLevel, type: rule.type, depth: rule.depth });
            }
        }
    }
    return changes;
}

/** Full assessment pipeline */
export function runFullAssessment(scores, matrixMap = METRIC_PROCESS_MAP) {
    const derivationDetails = calculateAllProcessDerivations(scores, matrixMap);
    const derived = {};
    for (const [pid, detail] of Object.entries(derivationDetails)) {
        derived[pid] = detail.level;
    }
    const { levels: withOverrides, overrides } = applyOverrides(derived, scores);

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
                    reason: `SA Tier ${saTier.tier} Floor`
                });
            }
        }
    }

    const violations = checkConsistency(final);

    const fixes = [];
    for (const v of violations.filter(v => v.type === 'HC')) {
        if (v.requiredOp === '>=' && levelIndex(final[v.affectedProcess] || 'basic') < levelIndex(v.requiredLevel)) {
            const prev = final[v.affectedProcess];
            final[v.affectedProcess] = v.requiredLevel;
            fixes.push({ processId: v.affectedProcess, from: prev, to: v.requiredLevel, reason: v.label });
        }
    }

    const remainingViolations = checkConsistency(final);

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
