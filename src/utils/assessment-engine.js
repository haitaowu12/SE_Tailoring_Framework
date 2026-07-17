/**
 * Assessment Engine — Framework v4.0 executable algorithm
 * 
 * Algorithm Steps:
 * 1. Get applicable metrics for each process
 * 2. Remove M9/M10 direct constraint inflation from process-level derivation
 * 3. Convert metric scores to tiers and find MAX tier across applicable metrics
 * 4. Apply overrides (safety, regulatory, project-context)
 * 5. Apply SA display/floor logic (Safety Assurance minimum levels)
 * 6. RIGHT-SIZE: Compute PSI/CSI/CRI → enforce rigor budget and flag adoption-readiness gaps
 * 7. Apply interdependencies (consistency rules)
 * 8. CORROBORATION: Compute confidence for Comprehensive processes
 */
import { METRIC_PROCESS_MAP, CONDITIONAL_METRIC_PROCESS_DRIVERS, BINDING_ASSURANCE_QUALIFIERS, OVERRIDE_CONDITIONS, ACTIVE_CONSISTENCY_RULES, ACTIVE_PROPAGATION_RULES, CORE_PROCESSES, RIGOR_BUDGET, ADOPTION_READINESS_GUIDANCE, PROCESS_PRIORITY_CLASSES, FRAMEWORK_META } from '../data/se-tailoring-data.js';
import { evaluateRightSizingApprovals, getRightSizingApprovalRequirements } from './right-sizing-governance.js';

const LEVELS = ['basic', 'standard', 'comprehensive'];
const levelIndex = l => LEVELS.indexOf(l);
const metricSort = (a, b) => Number(a.replace('M', '')) - Number(b.replace('M', ''));

const SA_TIERS = [
    { tier: 'I', name: 'Baseline Safety Assurance', description: 'No safety assurance floor; manage safety considerations through process-level drivers and risk review', floor: null },
    { tier: 'II', name: 'Safety Relevant', description: 'Additional safety assurance activities needed', floor: 'basic' },
    { tier: 'III', name: 'Safety-Critical', description: 'Full safety assurance program required', floor: 'standard' }
];

/**
 * Derive SA Criticality Tier from M5 (Safety Impact) score.
 * M5=1-3 → Tier I (Baseline Safety Assurance, no floor), M5=4 → Tier II (Safety Relevant, Standard floor),
 * M5=5 → Tier III (Safety Critical, Comprehensive floor)
 */
export function calculateSATier(scores) {
    const m5 = scores?.M5 || 3;

    if (m5 === 5) return { ...SA_TIERS[2], floor: 'comprehensive', score: m5 };
    if (m5 >= 4) return { ...SA_TIERS[1], floor: 'standard', score: m5 };
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

function getConfirmedBindingObligation(context = {}, processId = null) {
    const obligations = Array.isArray(context?.assuranceObligations) ? context.assuranceObligations : [];
    return obligations.find(obligation => {
        if (!obligation || obligation.bindingStatus !== 'confirmed') return false;
        if (!BINDING_ASSURANCE_QUALIFIERS.includes(obligation.type)) return false;
        if (!String(obligation.authority || '').trim() || !String(obligation.sourceRef || '').trim()) return false;
        if (processId === null) return true;
        return Array.isArray(obligation.processScope) && obligation.processScope.map(Number).includes(Number(processId));
    }) || null;
}

function isCriticalEvidenceContext(rule, scores = {}, context = {}) {
    return scoreOrDefault(scores, 'M5') >= 4 ||
        scoreOrDefault(scores, 'M6') >= 4 ||
        scoreOrDefault(scores, 'M8') >= 4 ||
        (scoreOrDefault(scores, 'M15') >= 4 && !!getConfirmedBindingObligation(context, rule.required.process));
}

export function getEffectiveConsistencyType(rule, scores = {}, context = {}) {
    return ((rule.id === 16 || rule.id === 17) && isCriticalEvidenceContext(rule, scores, context))
        ? 'HC'
        : rule.type;
}

export function getEffectivePropagationType(rule, scores = {}, context = {}) {
    const consistencyRule = ACTIVE_CONSISTENCY_RULES.find(candidate => candidate.id === rule.ruleId);
    if (!consistencyRule) return rule.type;
    return getEffectiveConsistencyType(consistencyRule, scores, context) === 'HC' ? 'mandatory' : 'recommended';
}

function getTechnicalProcessIds() {
    return CORE_PROCESSES.filter(p => p.group === 'technical').map(p => p.id);
}

function getOverrideTriggerEvidence(overrideCondition, scores = {}, context = {}) {
    const trigger = overrideCondition?.trigger;
    if (!trigger) return null;

    if (trigger.type === 'metric') {
        const score = scoreOrDefault(scores, trigger.metric);
        return compareScore(score, trigger.op, trigger.value) ? { metric: trigger.metric, score } : null;
    }

    if (trigger.type === 'context') {
        return context?.[trigger.field] === trigger.equals ? { field: trigger.field, value: trigger.equals } : null;
    }

    if (trigger.type === 'binding-assurance') {
        const score = scoreOrDefault(scores, trigger.metric);
        if (!compareScore(score, trigger.op, trigger.value)) return null;
        const processId = overrideCondition.processes?.[0];
        const obligation = getConfirmedBindingObligation(context, processId);
        return obligation ? { metric: trigger.metric, score, obligation } : null;
    }

    return null;
}

function getEffectiveProcessMetricMap(processId, matrixMap = METRIC_PROCESS_MAP, context = {}) {
    const map = { ...(matrixMap?.[processId] || {}) };
    for (const driver of CONDITIONAL_METRIC_PROCESS_DRIVERS) {
        if (Number(driver.processId) !== Number(processId)) continue;
        if (driver.predicate === 'binding-assurance' && !getConfirmedBindingObligation(context, processId)) continue;
        const currentRole = map[driver.metric];
        map[driver.metric] = currentRole === 'P' || driver.role === 'P' ? 'P' : driver.role;
    }
    return map;
}

/**
 * Calculate process derivation details using the canonical max-tier plus
 * corroboration algorithm.
 * 
 * Algorithm:
 * 1. Get all applicable metrics for the process (Primary and Secondary drivers)
 * 2. Find the MAX score across all applicable metrics after matrix-level M9/M10 exclusion
 * 3. Convert max score to level: 1-2=basic, 3-4=standard, 5=comprehensive
 * 4. Downgrade thin Comprehensive triggers to Standard unless corroborated
 * 5. Track which metrics drove the decision (all metrics with max score)
 */
export function calculateProcessDerivation(processId, scores, matrixMap = METRIC_PROCESS_MAP, context = {}) {
    const activeMatrixMap = matrixMap || METRIC_PROCESS_MAP;
    const map = getEffectiveProcessMetricMap(processId, activeMatrixMap, context);
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
    const triggerLevel = derivedLevel;
    let confidence = 'high';

    if (derivedLevel === 'comprehensive') {
        const applicableMetrics = Object.entries(map);

        // Count Primary drivers at Comprehensive (score=5)
        const primaryAtComprehensive = applicableMetrics.filter(([m, role]) => {
            return role === 'P' && scoreOrDefault(scores, m) === 5;
        }).length;

        // Count Secondary drivers at Standard+ (score>=3)
        const secondaryAtStandardPlus = applicableMetrics.filter(([m, role]) => {
            return role === 'S' && scoreOrDefault(scores, m) >= 3;
        }).length;

        // Corroboration check per paper §3.4.4:
        // Requires 2+ Primary drivers at Comprehensive, OR
        // 1 Primary at Comprehensive + ≥1 Secondary at Standard+
        const corroborated = (
            primaryAtComprehensive >= 2 ||
            (primaryAtComprehensive >= 1 && secondaryAtStandardPlus >= 1)
        );

        // Direct critical-consequence derivation: a mapped M5=5 or M7=5 is
        // independently sufficient for Comprehensive. This is metric-derived
        // attribution, not a named override-floor event. applyOverrides()
        // records the separate, process-specific safety/environmental floors.
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
        triggerLevel,
        confidence,
        allMetricScores
    };
}

/** Calculate individual process level from metric scores using max-tier plus corroboration */
export function calculateProcessLevel(processId, scores, matrixMap = METRIC_PROCESS_MAP, context = {}) {
    return calculateProcessDerivation(processId, scores, matrixMap, context).level;
}

/** Calculate levels for all core processes */
export function calculateAllProcessLevels(scores, matrixMap = METRIC_PROCESS_MAP, context = {}) {
    const levels = {};
    for (const p of CORE_PROCESSES) {
        levels[p.id] = calculateProcessLevel(p.id, scores, matrixMap, context);
    }
    return levels;
}

/** Calculate derivation details for all core processes */
export function calculateAllProcessDerivations(scores, matrixMap = METRIC_PROCESS_MAP, context = {}) {
    const derivations = {};
    for (const p of CORE_PROCESSES) {
        derivations[p.id] = calculateProcessDerivation(p.id, scores, matrixMap, context);
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
    const activeFloors = [];

    for (const ov of OVERRIDE_CONDITIONS) {
        const triggerEvidence = getOverrideTriggerEvidence(ov, scores, context);
        if (triggerEvidence) {
            for (const pid of ov.processes) {
                const prev = applied[pid] || 'basic';
                const requiresElevation = levelIndex(prev) < levelIndex(ov.minLevel);
                const provenance = {
                    processId: pid,
                    minLevel: ov.minLevel,
                    observedLevel: prev,
                    status: requiresElevation ? 'elevated' : 'satisfied',
                    reason: ov.label,
                    condition: ov.condition,
                    overrideId: ov.id,
                    overrideSource: ov.source,
                    triggerType: ov.trigger?.type || 'metric',
                    triggerMetric: triggerEvidence.metric || null,
                    triggerScore: triggerEvidence.score ?? null,
                    obligationId: triggerEvidence.obligation?.id || null,
                    authority: triggerEvidence.obligation?.authority || null,
                    sourceRef: triggerEvidence.obligation?.sourceRef || null
                };
                activeFloors.push(provenance);

                if (requiresElevation) {
                    applied[pid] = ov.minLevel;
                    overridesApplied.push({
                        ...provenance,
                        from: prev,
                        to: ov.minLevel,
                    });
                }
            }
        }
    }
    return { levels: applied, overrides: overridesApplied, activeFloors };
}

/**
 * Get driver attribution for a process.
 * Returns all metrics (Primary and Secondary) that influence the process level.
 */
export function getDriverAttribution(processId, scores, matrixMap = METRIC_PROCESS_MAP, context = {}) {
    const activeMatrixMap = matrixMap || METRIC_PROCESS_MAP;
    const map = getEffectiveProcessMetricMap(processId, activeMatrixMap, context);
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
export function checkConsistency(levels, scores = {}, context = {}) {
    const violations = [];
    const technicalIds = getTechnicalProcessIds();

    for (const rule of ACTIVE_CONSISTENCY_RULES) {
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
            const effectiveType = getEffectiveConsistencyType(rule, scores, context);
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
                    type: effectiveType,
                    label: rule.label,
                    rationale: rule.rationale,
                    severity: effectiveType === 'HC' ? 'error' : 'warning',
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
export function previewDirectConsequences(processId, newLevel, currentLevels, scores = {}, context = {}) {
    const changes = [];
    const technicalIds = getTechnicalProcessIds();

    const applyToTarget = (rule, targetId) => {
        const currentLevel = currentLevels[targetId] || 'basic';
        if (rule.minLevel && levelIndex(currentLevel) < levelIndex(rule.minLevel)) {
            changes.push({
                processId: targetId,
                from: currentLevel,
                to: rule.minLevel,
                type: getEffectivePropagationType(rule, scores, context),
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
                type: getEffectivePropagationType(rule, scores, context),
                depth: rule.depth,
                ruleId: rule.ruleId || rule.id
            });
        }
    };

    for (const rule of ACTIVE_PROPAGATION_RULES) {
        let sourceTriggered = false;
        if (rule.source === 'any_technical') {
            const sourceMatches = rule.sourceOp === '='
                ? newLevel === rule.sourceLevel
                : levelIndex(newLevel) >= levelIndex(rule.sourceLevel);
            sourceTriggered = technicalIds.includes(processId) && sourceMatches;
        } else {
            const sourceMatches = rule.sourceOp === '='
                ? newLevel === rule.sourceLevel
                : levelIndex(newLevel) >= levelIndex(rule.sourceLevel);
            sourceTriggered = rule.source === processId && sourceMatches;
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

/** @deprecated Use previewDirectConsequences; this helper intentionally performs one-hop preview only. */
export const simulatePropagation = previewDirectConsequences;

/**
 * Apply mandatory upward floors until a least fixed point is reached.
 * Current hard constraints are monotone over the finite Basic < Standard < Comprehensive lattice.
 */
export function applyMandatoryClosure(levels, scores = {}, context = {}) {
    const closed = { ...levels };
    const fixes = [];
    let iterations = 0;

    while (true) {
        const violations = checkConsistency(closed, scores, context);
        const hardViolations = violations.filter(v => v.type === 'HC');
        if (hardViolations.length === 0) {
            return { levels: closed, fixes, violations, iterations };
        }

        let changed = false;
        for (const violation of hardViolations) {
            if (violation.requiredOp !== '>=' || typeof violation.affectedProcess !== 'number') continue;
            const current = closed[violation.affectedProcess] || 'basic';
            if (levelIndex(current) >= levelIndex(violation.requiredLevel)) continue;

            closed[violation.affectedProcess] = violation.requiredLevel;
            fixes.push({
                processId: violation.affectedProcess,
                from: current,
                to: violation.requiredLevel,
                reason: violation.label,
                ruleId: violation.ruleId
            });
            changed = true;
        }

        if (!changed) {
            return { levels: closed, fixes, violations: checkConsistency(closed, scores, context), iterations };
        }

        iterations += 1;
        const finiteLatticeElevationBound = CORE_PROCESSES.length * (LEVELS.length - 1);
        if (fixes.length > finiteLatticeElevationBound) {
            throw new Error('Mandatory closure exceeded the finite-lattice elevation bound; check for malformed or non-monotone hard rules.');
        }
    }
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

    // Secondary modifier: reclassify PSI one category higher if primary ≤ 2 but secondary ≥ 4 (rule-based reclassification, not numeric addition)
    if (primary <= 2 && secondary >= 4) return Math.min(primary + 1, 5);
    return primary;
}

/**
 * Compute Constraint Stress Index (CSI) from constraint/pressure metrics.
 * CSI = max(M9, M10) — schedule and budget pressure.
 * M15 is external governance/assurance demand in semantic version 4.0 and
 * therefore cannot be used as pressure to reduce required rigor.
 * Returns 1-5 ordinal scale.
 */
export function computeCSI(scores) {
    return Math.max(
        scoreOrDefault(scores, 'M9'),
        scoreOrDefault(scores, 'M10')
    );
}

/**
 * Derive the non-reductive governance response required by constraint stress.
 * CSI never changes process levels: it creates a feasibility response only.
 */
export function deriveCSIResponseRequirement(scoresOrCsi = {}) {
    const csi = typeof scoresOrCsi === 'number' ? scoresOrCsi : computeCSI(scoresOrCsi);
    if (!Number.isInteger(csi) || csi < 1 || csi > 5) {
        throw new RangeError('CSI response requirement expects an integer CSI from 1 to 5.');
    }
    if (csi <= 3) {
        return {
            csi,
            requirement: 'none',
            required: false,
            rationale: 'Constraint stress does not require an additional governed feasibility response.'
        };
    }
    if (csi === 4) {
        return {
            csi,
            requirement: 'feasibility-review',
            required: true,
            rationale: 'High schedule or budget pressure requires a documented feasibility review without lowering the normative rigor profile.'
        };
    }
    return {
        csi,
        requirement: 'sponsor-escalation',
        required: true,
        rationale: 'Extreme schedule or budget pressure requires sponsor escalation and explicit resolution of the feasibility conflict without automatic rigor reduction.'
    };
}

/**
 * Compute Adoption Readiness Index (CRI) from M16 enabling conditions.
 * CRI is derived by rule-based mapping into three readiness classes;
 * no arithmetic aggregation across metrics is performed.
 * Maps M16 to 1-3 scale: 1-2 constrained, 3 mixed, 4-5 strong.
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

function maxLevel(lhs, rhs) {
    return levelIndex(lhs) >= levelIndex(rhs) ? lhs : rhs;
}

/**
 * Return the active minimum floor for a process. This checks both recorded
 * overrides and active override conditions because a process may already meet
 * the floor before applyOverrides records a visible elevation.
 */
function getActiveOverrideFloor(processId, overridesApplied = [], scores = {}, context = {}) {
    let floor = null;

    for (const override of overridesApplied) {
        if (override.processId === processId && override.to) {
            floor = floor ? maxLevel(floor, override.to) : override.to;
        }
    }

    for (const overrideCondition of OVERRIDE_CONDITIONS) {
        if (overrideCondition.processes?.includes(processId) && getOverrideTriggerEvidence(overrideCondition, scores, context)) {
            floor = floor ? maxLevel(floor, overrideCondition.minLevel) : overrideCondition.minLevel;
        }
    }

    return floor;
}

/**
 * Flag adoption-readiness gaps without lowering required rigor.
 */
export function assessAdoptionReadiness(levels, scores) {
    const cri = computeCRI(scores);
    const guidance = ADOPTION_READINESS_GUIDANCE.find(g => g.cri === cri);
    if (!guidance?.triggerLevel) return [];

    const triggerIdx = levelIndex(guidance.triggerLevel);
    return CORE_PROCESSES
        .filter(p => levelIndex(levels[p.id] || 'basic') >= triggerIdx)
        .map(p => {
            const level = levels[p.id] || 'basic';
            const severity = level === 'comprehensive'
                ? guidance.comprehensiveSeverity
                : guidance.standardSeverity || guidance.comprehensiveSeverity;
            return {
                processId: p.id,
                level,
                cri,
                severity,
                type: 'adoption_readiness_gap',
                reason: `CRI=${cri} (${guidance.label}) requires implementation support for ${level} rigor`,
                guidance: guidance.notes
            };
        });
}

/**
 * Evaluate right-sizing: preserve normative levels and return governed reduction
 * proposals plus readiness-gap reporting. Proposals are never applied here;
 * accepting one requires a separate owner decision with justification and
 * consequential evidence and authority records.
 */
export function applyRightSizing(levels, scores, overridesApplied = [], context = {}) {
    const psi = computePSI(scores);
    const csi = computeCSI(scores);
    const cri = computeCRI(scores);
    const constraintResponseRequirement = deriveCSIResponseRequirement(csi);
    const normative = { ...levels };
    // A private planning copy allows proposals to be sequenced deterministically
    // without changing the normative profile returned to the caller.
    const proposedProfile = { ...levels };
    const proposals = [];
    const makeProposal = (processId, from, proposedTo, reason) => {
        const affectedMetricIds = Object.keys(getEffectiveProcessMetricMap(processId, METRIC_PROCESS_MAP, context)).sort(metricSort);
        const protectedMetricIds = affectedMetricIds
            .filter(metric => ['M5', 'M8', 'M15'].includes(metric));
        const proposal = {
            processId,
            elementId: context.activeElementId || context.elementId || 'default',
            scopeElementIds: context.scopeElementIds || [context.activeElementId || context.elementId || 'default'],
            from,
            proposedTo,
            to: proposedTo,
            protectedMetricIds,
            affectedMetricIds,
            protectedOutputImpact: false,
            type: 'rigor_budget_proposal',
            status: 'review-required',
            applied: false,
            reason
        };
        return { ...proposal, approvalRequirements: getRightSizingApprovalRequirements(proposal, context.assessmentTree) };
    };

    // Evaluate the rigor budget based on PSI. CRI is intentionally not a ceiling;
    // low readiness creates adoption risks, not permission to under-tailor.
    const budget = RIGOR_BUDGET.find(b => psi >= b.psiMin && psi <= b.psiMax);
    if (budget) {
        // Count current Comprehensive processes (excluding override-protected)
        const compProcesses = CORE_PROCESSES
            .filter(p => proposedProfile[p.id] === 'comprehensive')
            .map(p => p.id);

        if (compProcesses.length > budget.maxComprehensive) {
            // Sort by priority (secondary first = downgrade first), then by lowest driving metric
            const downgradeCandidates = compProcesses
                .filter(pid => {
                    const overrideFloor = getActiveOverrideFloor(pid, overridesApplied, scores, context);
                    return !overrideFloor || levelIndex(overrideFloor) < levelIndex('comprehensive');
                })
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
                const overrideFloor = getActiveOverrideFloor(candidate.pid, overridesApplied, scores, context);
                const targetLevel = overrideFloor && levelIndex(overrideFloor) > levelIndex('standard')
                    ? overrideFloor
                    : 'standard';
                if (proposedProfile[candidate.pid] === targetLevel) continue;
                proposedProfile[candidate.pid] = targetLevel;
                proposals.push(makeProposal(candidate.pid, 'comprehensive', targetLevel,
                    `PSI=${psi} (${budget.label}) proposes review of Comprehensive count above ${budget.maxComprehensive}`));
                excess--;
            }
        }

        // For small projects (PSI 1-2), also limit Standard count
        if (psi <= 2 && budget.typicalStandardRange) {
            const maxStd = budget.typicalStandardRange[1];
            const proposedStandardCount = CORE_PROCESSES
                .filter(p => proposedProfile[p.id] === 'standard')
                .length;
            // Do not stack a second contingent proposal onto a process already
            // proposed for Comprehensive -> Standard. Choose only processes
            // whose normative level is Standard, while sizing the proposal set
            // against the full contingent profile.
            const normativeStandardProcesses = CORE_PROCESSES
                .filter(p => normative[p.id] === 'standard')
                .map(p => p.id);

            if (proposedStandardCount > maxStd) {
                const stdCandidates = normativeStandardProcesses
                    .filter(pid => {
                        const overrideFloor = getActiveOverrideFloor(pid, overridesApplied, scores, context);
                        return !overrideFloor || levelIndex(overrideFloor) < levelIndex('standard');
                    })
                    .map(pid => ({
                        pid,
                        priority: getProcessPriority(pid),
                        maxMetric: getMaxDrivingMetric(pid, scores)
                    }))
                    .sort((a, b) => {
                        if (a.priority !== b.priority) return b.priority - a.priority;
                        return a.maxMetric - b.maxMetric;
                    });

                let stdExcess = proposedStandardCount - maxStd;
                for (const candidate of stdCandidates) {
                    if (stdExcess <= 0) break;
                    const overrideFloor = getActiveOverrideFloor(candidate.pid, overridesApplied, scores, context);
                    const targetLevel = overrideFloor && levelIndex(overrideFloor) > levelIndex('basic')
                        ? overrideFloor
                        : 'basic';
                    if (proposedProfile[candidate.pid] === targetLevel) continue;
                    proposedProfile[candidate.pid] = targetLevel;
                    proposals.push(makeProposal(candidate.pid, 'standard', targetLevel,
                        `PSI=${psi} (${budget.label}) proposes review of Standard count above ${maxStd}`));
                    stdExcess--;
                }
            }
        }
    }

    // A proposal that mandatory closure would immediately undo is not a viable
    // approval candidate. Preview closure on the contingent profile, preserve
    // blocked candidates for audit, and expose only closure-feasible proposals
    // for governance review.
    const proposalClosure = applyMandatoryClosure(proposedProfile, scores, context);
    const blockedRightSizingCandidates = proposals
        .filter(proposal => proposalClosure.levels[proposal.processId] !== proposal.proposedTo)
        .map(proposal => ({
            ...proposal,
            status: 'blocked-by-mandatory-closure',
            applied: false,
            closureLevel: proposalClosure.levels[proposal.processId]
        }));
    const rightSizingProposals = proposals.filter(proposal =>
        proposalClosure.levels[proposal.processId] === proposal.proposedTo
    );
    const proposalBudgetStatus = computeRigorBudgetStatus(proposalClosure.levels, scores);
    const adoptionRisks = assessAdoptionReadiness(normative, scores);
    return {
        levels: normative,
        rightSizingProposals,
        blockedRightSizingCandidates,
        // Legacy compatibility field. New engine results never report proposals
        // as completed right-sizing actions.
        rightSizingActions: [],
        proposedProfile: proposalClosure.levels,
        proposalClosureFixes: proposalClosure.fixes,
        proposalBudgetStatus,
        constraintResponseRequirement,
        adoptionRisks,
        indices: { psi, csi, cri }
    };
}

/** Report final rigor-budget fit after mandatory closure and protected floors. */
export function computeRigorBudgetStatus(levels, scores) {
    const psi = computePSI(scores);
    const budget = RIGOR_BUDGET.find(candidate => psi >= candidate.psiMin && psi <= candidate.psiMax) || null;
    const comprehensiveCount = CORE_PROCESSES.filter(process => levels[process.id] === 'comprehensive').length;
    const standardCount = CORE_PROCESSES.filter(process => levels[process.id] === 'standard').length;
    const maxStandard = psi <= 2 && budget?.typicalStandardRange ? budget.typicalStandardRange[1] : null;
    const comprehensiveExcess = budget ? Math.max(0, comprehensiveCount - budget.maxComprehensive) : 0;
    const standardExcess = maxStandard === null ? 0 : Math.max(0, standardCount - maxStandard);
    return {
        psi,
        label: budget?.label || 'Unclassified',
        maxComprehensive: budget?.maxComprehensive ?? null,
        maxStandard,
        comprehensiveCount,
        standardCount,
        comprehensiveExcess,
        standardExcess,
        withinBudget: comprehensiveExcess === 0 && standardExcess === 0
    };
}

/** Helper: get the max driving metric score for a process */
function getMaxDrivingMetric(processId, scores) {
    const map = METRIC_PROCESS_MAP[processId];
    if (!map) return 0;
    return Math.max(...Object.keys(map).map(m => scoreOrDefault(scores, m)));
}

/**
 * Full assessment pipeline implementing the framework v4.0 executable algorithm.
 * 
 * Execution Steps:
 * 1. Derive initial levels from metrics (max-tier with Comprehensive corroboration)
 * 2. Apply scoped floor conditions (safety, mission, environmental, security,
 *    binding assurance, novelty, and integration context)
 * 3. Apply SA floor (Safety Assurance minimum levels based on M5)
 * 4. Apply interdependencies (consistency rules with auto-fix)
 * 
 * Returns complete assessment with derivation details, overrides, and violations.
 */
function executeAssessment(scores, matrixMap = METRIC_PROCESS_MAP, context = {}) {
    // Step 1: Derive initial levels using max-tier plus corroboration
    const derivationDetails = calculateAllProcessDerivations(scores, matrixMap, context);
    const derived = {};
    for (const [pid, detail] of Object.entries(derivationDetails)) {
        derived[pid] = detail.level;
    }

    // Step 2: Apply override conditions (safety, regulatory, project-context)
    const { levels: withOverrides, overrides, activeFloors } = applyOverrides(derived, scores, context);

    // Step 3: Derive the SA tier for explanation. O1-O6 in OVERRIDE_CONDITIONS
    // are the single authoritative implementation of M5-based process floors.
    let final = { ...withOverrides };
    const saTier = calculateSATier(scores);
    const allOverrides = overrides;

    // Step 4: RIGHT-SIZE — propose governed reductions (PSI) and flag adoption gaps (CRI)
    const { levels: afterRightSizing, rightSizingActions, rightSizingProposals, blockedRightSizingCandidates, proposedProfile, proposalClosureFixes, proposalBudgetStatus, constraintResponseRequirement, adoptionRisks, indices } = applyRightSizing(final, scores, allOverrides, context);

    // Step 5: Apply monotone mandatory closure to the least fixed point.
    const closure = applyMandatoryClosure(afterRightSizing, scores, context);
    const normativeLevels = closure.levels;
    const approvalContext = {
        ...context,
        scores,
        activeFloors,
        normativeLevels,
        frameworkVersion: context.frameworkVersion || FRAMEWORK_META.version,
        metricDefinitionSet: context.metricDefinitionSet || FRAMEWORK_META.metricDefinitionSet
    };
    const approvalResult = evaluateRightSizingApprovals(
        rightSizingProposals,
        context.rightSizingApprovalRecords || [],
        approvalContext
    );
    // Approval can authorize a reduction, but cannot bypass mandatory closure.
    // Re-closing the approved profile makes that property executable rather than documentary.
    const approvedClosure = applyMandatoryClosure(approvalResult.levels, scores, context);
    final = approvedClosure.levels;
    const fixes = [...closure.fixes, ...approvedClosure.fixes];
    const remainingViolations = approvedClosure.violations;
    const budgetStatus = computeRigorBudgetStatus(final, scores);

    // Step 6: Compute evidence status for each process based on final levels.
    // Metric corroboration, criticality/assurance floors, and explicit-justification
    // cases are separate evidence states; do not collapse them into one label.
    const confidence = {};
    for (const p of CORE_PROCESSES) {
        const finalLevel = final[p.id];
        if (finalLevel === 'comprehensive') {
            const derivationConfidence = derivationDetails[p.id]?.confidence || 'high';
            const comprehensiveFloorApplied = allOverrides.some(override =>
                override.processId === p.id &&
                levelIndex(override.to) >= levelIndex('comprehensive') &&
                levelIndex(override.from || 'basic') < levelIndex('comprehensive')
            ) || fixes.some(f =>
                f.processId === p.id && levelIndex(f.to) >= levelIndex('comprehensive')
            );

            if (comprehensiveFloorApplied) {
                confidence[p.id] = 'floor-applied';
            } else if (derivationConfidence === 'corroborated') {
                confidence[p.id] = 'corroborated';
            } else {
                confidence[p.id] = 'available-with-justification';
            }
        } else if (derivationDetails[p.id]?.confidence === 'available-with-justification') {
            // Preserve the score-5 trigger disposition even though the default
            // final recommendation is Standard. This is a governed option, not
            // a claim that the final Standard result is weak evidence.
            confidence[p.id] = 'available-with-justification';
        } else {
            confidence[p.id] = 'high';
        }
    }

    return {
        derived,
        derivationDetails,
        overrides: allOverrides,
        activeFloors: activeFloors || [],
        rightSizingProposals: rightSizingProposals || [],
        blockedRightSizingCandidates: blockedRightSizingCandidates || [],
        rightSizingActions: rightSizingActions || [],
        proposedRightSizedLevels: proposedProfile || {},
        proposalClosureFixes: proposalClosureFixes || [],
        proposalBudgetStatus: proposalBudgetStatus || null,
        rightSizingApprovalEvaluations: approvalResult.evaluations || [],
        approvedRightSizedLevels: approvalResult.effectiveCount > 0 ? final : {},
        normativeLevels,
        effectiveRightSizingApprovalCount: approvalResult.effectiveCount || 0,
        constraintResponseRequirement: constraintResponseRequirement || deriveCSIResponseRequirement(scores),
        adoptionRisks: adoptionRisks || [],
        indices: indices || {},
        fixes,
        levels: final,
        violations: remainingViolations,
        scores,
        saTier,
        confidence,
        budgetStatus,
        closureIterations: closure.iterations + approvedClosure.iterations
    };
}

const REQUIRED_METRIC_IDS = Object.freeze(Array.from({ length: 16 }, (_, index) => `M${index + 1}`));
const isValidMetricScore = value => Number.isInteger(value) && value >= 1 && value <= 5;

function describeAssessmentInput(scores = {}) {
    const incompleteMetricIds = REQUIRED_METRIC_IDS.filter(metricId => !isValidMetricScore(scores?.[metricId]));
    return {
        complete: incompleteMetricIds.length === 0,
        incompleteMetricIds,
        assessedMetricCount: REQUIRED_METRIC_IDS.length - incompleteMetricIds.length,
        requiredMetricCount: REQUIRED_METRIC_IDS.length
    };
}

function applyAssessmentContract(result, input, forcePreview = false) {
    const authoritative = input.complete && !forcePreview;
    const derivationStatus = authoritative ? result.confidence : {};
    return {
        ...result,
        assessmentMode: authoritative ? 'normative' : 'preview',
        authoritative,
        inputCompleteness: input,
        incompleteMetricIds: input.incompleteMetricIds,
        // Preview levels remain available for interactive exploration but are
        // explicitly separate from the baselineable normative profile.
        previewLevels: result.levels,
        previewNormativeLevels: result.normativeLevels,
        normativeLevels: authoritative ? result.normativeLevels : {},
        derivationStatus,
        previewDerivationStatus: result.confidence,
        // Compatibility field: populated only for an authoritative result.
        confidence: derivationStatus
    };
}

/**
 * Interactive what-if assessment. It can display directional process pressure,
 * but it is never an authoritative or baselineable result.
 */
export function runPreviewAssessment(scores = {}, matrixMap = METRIC_PROCESS_MAP, context = {}) {
    const input = describeAssessmentInput(scores);
    return applyAssessmentContract(executeAssessment(scores, matrixMap, context), input, true);
}

/**
 * Normative assessment contract. All M1-M16 values must be explicit valid
 * ordinal judgments; otherwise the returned object is unmistakably a preview
 * and exposes no authoritative normative levels or derivation status.
 */
export function runFullAssessment(scores = {}, matrixMap = METRIC_PROCESS_MAP, context = {}) {
    const input = describeAssessmentInput(scores);
    return applyAssessmentContract(executeAssessment(scores, matrixMap, context), input, false);
}
