/**
 * Assessment Engine — Scoring algorithm & override logic
 */
import { METRIC_PROCESS_MAP, OVERRIDE_CONDITIONS, CONSISTENCY_RULES, PROPAGATION_RULES, CORE_PROCESSES } from '../data/se-tailoring-data.js';

const LEVELS = ['basic', 'standard', 'comprehensive'];
const levelIndex = l => LEVELS.indexOf(l);
const levelFromIndex = i => LEVELS[Math.max(0, Math.min(2, i))];

/** Calculate individual process level from metric scores */
export function calculateProcessLevel(processId, scores, matrixMap = METRIC_PROCESS_MAP) {
    const map = matrixMap[processId];
    if (!map) return 'basic';

    let primarySum = 0, primaryCount = 0, primaryMax = 0;
    let secondarySum = 0, secondaryCount = 0;

    for (const [metric, role] of Object.entries(map)) {
        const val = scores[metric] || 3;
        if (role === 'P') {
            primarySum += val;
            primaryCount++;
            if (val > primaryMax) primaryMax = val;
        }
        else if (role === 'S') {
            secondarySum += val;
            secondaryCount++;
        }
    }

    // Baseline primary average
    let primaryAvg = primaryCount > 0 ? primarySum / primaryCount : 3;

    // Non-linear dynamics: extreme primary drivers pull the average up 
    // to account for "highest water mark" complexity constraints.
    if (primaryCount > 0 && primaryMax > primaryAvg) {
        primaryAvg = primaryAvg + 0.5 * (primaryMax - primaryAvg);
    }

    const secondaryAvg = secondaryCount > 0 ? secondarySum / secondaryCount : 3;

    let weighted;
    if (primaryCount > 0 && secondaryCount > 0) {
        // Primary drivers weighted 2x, secondary 1x
        weighted = (primaryAvg * 2 + secondaryAvg) / 3;
    } else if (primaryCount > 0) {
        weighted = primaryAvg;
    } else if (secondaryCount > 0) {
        weighted = secondaryAvg;
    } else {
        weighted = 3;
    }

    // Adjusted thresholds to be responsive to non-linear shifts
    if (weighted >= 3.8) return 'comprehensive';
    if (weighted >= 2.4) return 'standard';
    return 'basic';
}

/** Calculate levels for all core processes */
export function calculateAllProcessLevels(scores, matrixMap = METRIC_PROCESS_MAP) {
    const levels = {};
    for (const p of CORE_PROCESSES) {
        levels[p.id] = calculateProcessLevel(p.id, scores, matrixMap);
    }
    return levels;
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
        const val = scores[metric] || 3;
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
    const derived = calculateAllProcessLevels(scores, matrixMap);
    const { levels: withOverrides, overrides } = applyOverrides(derived, scores);
    const violations = checkConsistency(withOverrides);

    // Auto-fix HC violations
    const final = { ...withOverrides };
    const fixes = [];
    for (const v of violations.filter(v => v.type === 'HC')) {
        if (v.requiredOp === '>=' && levelIndex(final[v.affectedProcess] || 'basic') < levelIndex(v.requiredLevel)) {
            const prev = final[v.affectedProcess];
            final[v.affectedProcess] = v.requiredLevel;
            fixes.push({ processId: v.affectedProcess, from: prev, to: v.requiredLevel, reason: v.label });
        }
    }

    // Re-check after fixes
    const remainingViolations = checkConsistency(final);

    return {
        derived,
        overrides,
        fixes,
        levels: final,
        violations: remainingViolations,
        scores
    };
}
