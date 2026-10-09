import { resolveProtectedAncestry } from './inheritance-engine.js';
import { checkConsistency, applyOverrides } from './assessment-engine.js';
import {
    CONDITIONAL_METRIC_PROCESS_DRIVERS,
    M15_SCOPED_RULE_ESCALATIONS,
    METRICS,
    OVERRIDE_CONDITIONS
} from '../data/metrics.js';
import { assessRule11Disposition, assessWarningDispositions } from './rule-dispositions.js';
import { assessCsiResponse } from './csi-response.js';

const VALID_SCORE = score => Number.isInteger(score) && score >= 1 && score <= 5;
const CONFIRMED_STATUSES = new Set(['assessed', 'inherited-confirmed']);

export const BASELINE_GATE_DEFINITIONS = Object.freeze([
    { id: 'input-completeness', label: 'Input completeness', softwareBlocking: true, implementation: 'implemented' },
    { id: 'rule-warning-disposition', label: 'Rule/warning disposition', softwareBlocking: true, implementation: 'implemented' },
    { id: 'evidence-completeness', label: 'Evidence completeness', softwareBlocking: false, implementation: 'not-implemented' },
    { id: 'hierarchy-completeness', label: 'Hierarchy completeness', softwareBlocking: true, implementation: 'implemented-when-enabled' },
    { id: 'asserted-review', label: 'Asserted review', softwareBlocking: false, implementation: 'not-recorded' },
    { id: 'authenticated-approval', label: 'Authenticated approval', softwareBlocking: false, implementation: 'not-available' },
    { id: 'operational-release-authorization', label: 'Operational release authorization', softwareBlocking: false, implementation: 'not-available' }
]);

const GATE_BY_ID = Object.fromEntries(BASELINE_GATE_DEFINITIONS.map(gate => [gate.id, gate]));

const PROCESS_LABELS = {
    12: 'Risk Management',
    13: 'Configuration Management',
    14: 'Information Management',
    15: 'Measurement',
    16: 'Quality Assurance',
    25: 'Verification',
    27: 'Validation',
    30: 'Disposal'
};

/**
 * Assess whether every registry metric judgment is explicit enough to baseline.
 * Default/demo scores remain usable for preview, but do not count as assessed.
 */
export function assessMetricCompleteness(scores = {}, metricAssessments = {}) {
    const metrics = METRICS.map(metric => {
        const assessment = metricAssessments?.[metric.id] || {};
        const stateScore = scores?.[metric.id];
        const status = assessment.status || 'missing';
        const scoresAligned = VALID_SCORE(stateScore) && VALID_SCORE(assessment.score) && stateScore === assessment.score;
        const hasConfirmedScore = CONFIRMED_STATUSES.has(status) && scoresAligned;
        const complete = hasConfirmedScore;

        return {
            metricId: metric.id,
            status,
            score: VALID_SCORE(stateScore) ? stateScore : null,
            complete,
            reason: complete
                ? null
                : status === 'not-applicable'
                    ? 'Imported N/A is unsupported migration evidence and cannot pass software completeness'
                    : CONFIRMED_STATUSES.has(status)
                        ? 'Confirmed metric requires matching valid 1-5 assessment and active scores'
                        : `Metric status is ${status}`
        };
    });

    const incomplete = metrics.filter(metric => !metric.complete);
    return {
        complete: incomplete.length === 0,
        completeCount: metrics.length - incomplete.length,
        totalCount: metrics.length,
        incompleteMetricIds: incomplete.map(metric => metric.metricId),
        metrics
    };
}

/** Preserve scores from earlier schema-2 records without treating them as confirmed v4 judgments. */
export function preserveUnconfirmedMetricAssessments(scores = {}, metricAssessments = {}) {
    const normalized = { ...(metricAssessments || {}) };
    for (const metric of METRICS) {
        if (normalized[metric.id]) continue;
        const score = scores?.[metric.id];
        if (!VALID_SCORE(score)) continue;
        normalized[metric.id] = {
            score,
            status: 'legacy-unconfirmed',
            definitionVersion: 2,
            qualifiers: [],
            rationale: '',
            evidenceRefs: []
        };
    }
    return normalized;
}

/**
 * Conditional M15 driver roles and rule-severity scopes, annotated so the UI
 * cannot confuse a driver, a mandatory floor, and a rule-severity predicate.
 */
export function getM15ScopeOptions() {
    const floorProcessIds = new Set(
        OVERRIDE_CONDITIONS
            .filter(condition => condition.trigger?.type === 'binding-assurance')
            .flatMap(condition => condition.processes || [])
            .map(Number)
    );

    const ruleSeverityProcessIds = new Set(M15_SCOPED_RULE_ESCALATIONS.map(item => Number(item.processId)));
    const optionsByProcess = new Map(CONDITIONAL_METRIC_PROCESS_DRIVERS
        .filter(driver => driver.metric === 'M15')
        .map(driver => [Number(driver.processId), {
            processId: Number(driver.processId),
            label: PROCESS_LABELS[driver.processId] || `Process ${driver.processId}`,
            role: driver.role,
            floorCapable: floorProcessIds.has(Number(driver.processId)),
            ruleSeverityCapable: ruleSeverityProcessIds.has(Number(driver.processId))
        }]));

    for (const processId of ruleSeverityProcessIds) {
        if (optionsByProcess.has(processId)) continue;
        optionsByProcess.set(processId, {
            processId,
            label: PROCESS_LABELS[processId] || `Process ${processId}`,
            role: 'scope-only',
            floorCapable: false,
            ruleSeverityCapable: true
        });
    }

    return [...optionsByProcess.values()].sort((a, b) => a.processId - b.processId);
}

export function assessHierarchyCompleteness(assessmentTree = null) {
    const entries = Object.entries(assessmentTree?.nodes || {});
    if (!assessmentTree) return { complete: true, enabled: false, incompleteElementIds: [], assessedElementCount: 0 };
    if (!entries.length) return { complete: false, enabled: false, incompleteElementIds: [assessmentTree.rootId || 'missing-root'], assessedElementCount: 0 };
    const activeId = assessmentTree.activeId || assessmentTree.rootId || entries[0][0];
    const incompleteElementIds = entries.filter(([nodeId, node]) => {
        const ancestry = resolveProtectedAncestry(assessmentTree, nodeId);
        if (!ancestry.valid || ancestry.blockedMetrics.length) return true;
        // Active raw metric judgments and current result are evaluated separately below.
        if (nodeId === activeId) return false;
        if (!node?.assessmentResult) return true;
        const metrics = assessMetricCompleteness(node.scores, node.metricAssessments);
        const warnings = assessWarningDispositions(node.assessmentResult.violations, node.ruleDispositions, node.levels);
        const csi = assessCsiResponse(node.scores, node.csiResponse);
        const hard = assessHardConstraints({ ...node, scores: ancestry.effectiveScores, violations: node.assessmentResult.violations, activeFloors: node.assessmentResult.activeFloors });
        return !metrics.complete || !warnings.complete || !csi.complete || !hard.complete;
    }).map(([nodeId, node]) => node?.id || nodeId);
    return { complete: incompleteElementIds.length === 0, enabled: entries.length > 1, incompleteElementIds, assessedElementCount: entries.length };
}

/**
 * Single software-completeness decision seam. External review, authenticated
 * approval, and operational authorization remain separate unavailable gates.
 */
/** Hard constraints cannot be dispositioned away as ordinary warnings. */
export function assessHardConstraints(state = {}) {
    const levels = state.levels || {};
    const context = { ...(state.projectInfo || {}), metricAssessments: state.metricAssessments || {}, assuranceObligations: state.assuranceObligations || [] };
    const violations = [...(Array.isArray(state.violations) ? state.violations : []).filter(item => item?.type === 'HC')];
    if (Object.keys(levels).length) {
        violations.push(...checkConsistency(levels, state.scores || {}, context).filter(item => item.type === 'HC'));
        const order = ['basic', 'standard', 'comprehensive'];
        const floors = [...applyOverrides(levels, state.scores || {}, context).activeFloors, ...(Array.isArray(state.activeFloors) ? state.activeFloors : [])];
        for (const floor of floors) {
            if (!floor || typeof floor !== 'object') { violations.push({ type: 'HC', ruleId: 'invalid-floor', label: 'Recorded mandatory-floor provenance is invalid; recalculate the recommendation' }); continue; }
            if (order.indexOf(levels[floor.processId]) < order.indexOf(floor.minLevel)) violations.push({ type: 'HC', ruleId: `floor-${floor.processId}`, label: `Process ${floor.processId} is below its mandatory ${floor.minLevel} floor` });
        }
    }
    const unique = [...new Map(violations.map(item => [`${item.ruleId}:${item.affectedProcess || ''}`, item])).values()];
    return { complete: unique.length === 0, violations: unique };
}

export function evaluateBaselineEligibility(state = {}, options = {}) {
    const completeness = assessMetricCompleteness(state.scores, state.metricAssessments);
    const warningDispositions = assessWarningDispositions(state.violations, state.ruleDispositions, state.levels);
    const csiResponse = assessCsiResponse(state.scores, state.csiResponse);
    const recordedHierarchy = options.hierarchy || assessHierarchyCompleteness(state.assessmentTree);
    const activeId = state.assessmentTree?.activeId || state.assessmentTree?.rootId;
    const ancestry = state.assessmentTree ? resolveProtectedAncestry(state.assessmentTree, activeId, { scores: state.scores }) : null;
    const ancestryComplete = !ancestry || (ancestry.valid && ancestry.blockedMetrics.length === 0);
    const hierarchy = { ...recordedHierarchy, complete: recordedHierarchy.complete && ancestryComplete,
        incompleteElementIds: ancestryComplete ? recordedHierarchy.incompleteElementIds : [...new Set([...(recordedHierarchy.incompleteElementIds || []), ...(ancestry.blockedElementIds || []), activeId].filter(Boolean))] };
    const reassessmentMetrics = state.semanticMigration?.reassessmentMetrics || [];
    const migrationOutstandingMetricIds = reassessmentMetrics.filter(metricId =>
        !completeness.metrics.find(metric => metric.metricId === metricId)?.complete
    );
    const migrationBlocked = state.semanticMigration?.status === 'review-required'
        && (state.semanticMigration?.reason === 'comprehensive-support-policy'
            ? options.derivationReviewed !== true
            : reassessmentMetrics.length === 0 || migrationOutstandingMetricIds.length > 0);
    const explicitlyDemo = state.assessmentDisposition === 'demo';
    const derivationAuthoritative = options.derivationAuthoritative !== false;
    const inputComplete = completeness.complete && !migrationBlocked && !explicitlyDemo && derivationAuthoritative;
    const hardConstraints = assessHardConstraints(ancestry ? { ...state, scores: ancestry.effectiveScores } : state);
    const ruleWarningComplete = hardConstraints.complete && warningDispositions.complete && csiResponse.complete;
    const softwareChecksPassed = inputComplete && ruleWarningComplete && hierarchy.complete;

    return {
        softwareChecksPassed,
        hardConstraints,
        completeness,
        warningDispositions,
        csiResponse,
        hierarchy,
        migrationBlocked,
        migrationOutstandingMetricIds,
        explicitlyDemo,
        derivationAuthoritative,
        gates: [
            {
                ...GATE_BY_ID['input-completeness'],
                status: inputComplete ? 'passed' : 'incomplete',
                blocking: true,
                detail: inputComplete ? `${completeness.completeCount}/${completeness.totalCount} judgments confirmed` : `${completeness.completeCount}/${completeness.totalCount} judgments confirmed`
            },
            {
                ...GATE_BY_ID['rule-warning-disposition'],
                status: ruleWarningComplete ? 'passed' : 'incomplete',
                blocking: true,
                detail: ruleWarningComplete ? 'Hard constraints, triggered warnings and CSI response checks passed' : !hardConstraints.complete ? 'Hard constraints or mandatory floors remain unsatisfied' : 'One or more warning or CSI response records remain incomplete'
            },
            {
                ...GATE_BY_ID['evidence-completeness'],
                status: 'not-implemented',
                blocking: false,
                detail: 'No unified evidence-completeness gate exists in this prototype'
            },
            {
                ...GATE_BY_ID['hierarchy-completeness'],
                status: hierarchy.complete ? 'passed' : 'incomplete',
                blocking: true,
                detail: hierarchy.enabled ? `${hierarchy.incompleteElementIds.length} child element(s) incomplete` : 'Advanced hierarchy mode not enabled'
            },
            {
                ...GATE_BY_ID['asserted-review'],
                status: 'not-recorded',
                blocking: false,
                detail: 'No top-level review assertion is recorded'
            },
            {
                ...GATE_BY_ID['authenticated-approval'],
                status: 'not-available',
                blocking: false,
                detail: 'Static prototype cannot authenticate or verify approval identities'
            },
            {
                ...GATE_BY_ID['operational-release-authorization'],
                status: 'not-available',
                blocking: false,
                detail: 'Authorization must be recorded in an external governed system'
            }
        ]
    };
}

export function getAssessmentDisposition(state = {}) {
    const eligibility = evaluateBaselineEligibility(state);
    const rule11Disposition = assessRule11Disposition(state.violations, state.ruleDispositions, state.levels);
    const complete = !!state.assessmentComplete && eligibility.softwareChecksPassed;
    return {
        ...eligibility.completeness,
        disposition: eligibility.explicitlyDemo ? 'demo' : complete ? 'complete-baseline' : 'work-in-progress',
        complete,
        softwareChecksPassed: eligibility.softwareChecksPassed,
        gates: eligibility.gates,
        hierarchy: eligibility.hierarchy,
        migrationBlocked: eligibility.migrationBlocked,
        rule11Disposition,
        warningDispositions: eligibility.warningDispositions,
        csiResponse: eligibility.csiResponse
    };
}
