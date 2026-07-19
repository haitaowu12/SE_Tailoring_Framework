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
    if (entries.length <= 1) {
        return { complete: true, enabled: false, incompleteElementIds: [], assessedElementCount: entries.length };
    }

    // The active node is evaluated through the top-level state by
    // evaluateBaselineEligibility(). Every other represented node—including the
    // root when a child is active—must independently satisfy the hierarchy gate.
    const activeId = assessmentTree?.activeId || assessmentTree?.rootId || entries[0][0];
    const nodesRequiringTreeCheck = entries.filter(([nodeId]) => nodeId !== activeId);
    const incompleteElementIds = nodesRequiringTreeCheck.filter(([, node]) => {
        if (!node?.assessmentResult) return true;
        const metrics = assessMetricCompleteness(node.scores, node.metricAssessments);
        const warnings = assessWarningDispositions(node.assessmentResult.violations, node.ruleDispositions, node.levels);
        const csi = assessCsiResponse(node.scores, node.csiResponse);
        return !metrics.complete || !warnings.complete || !csi.complete;
    }).map(([nodeId, node]) => node?.id || nodeId);

    return {
        complete: incompleteElementIds.length === 0,
        enabled: true,
        incompleteElementIds,
        assessedElementCount: entries.length
    };
}

/**
 * Single software-completeness decision seam. External review, authenticated
 * approval, and operational authorization remain separate unavailable gates.
 */
export function evaluateBaselineEligibility(state = {}, options = {}) {
    const completeness = assessMetricCompleteness(state.scores, state.metricAssessments);
    const warningDispositions = assessWarningDispositions(state.violations, state.ruleDispositions, state.levels);
    const csiResponse = assessCsiResponse(state.scores, state.csiResponse);
    const hierarchy = options.hierarchy || assessHierarchyCompleteness(state.assessmentTree);
    const reassessmentMetrics = state.semanticMigration?.reassessmentMetrics || [];
    const migrationOutstandingMetricIds = reassessmentMetrics.filter(metricId =>
        !completeness.metrics.find(metric => metric.metricId === metricId)?.complete
    );
    const migrationBlocked = state.semanticMigration?.status === 'review-required'
        && (reassessmentMetrics.length === 0 || migrationOutstandingMetricIds.length > 0);
    const explicitlyDemo = state.assessmentDisposition === 'demo';
    const derivationAuthoritative = options.derivationAuthoritative !== false;
    const inputComplete = completeness.complete && !migrationBlocked && !explicitlyDemo && derivationAuthoritative;
    const ruleWarningComplete = warningDispositions.complete && csiResponse.complete;
    const softwareChecksPassed = inputComplete && ruleWarningComplete && hierarchy.complete;

    return {
        softwareChecksPassed,
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
                detail: ruleWarningComplete ? 'Triggered warnings and CSI response checks passed' : 'One or more warning or CSI response records remain incomplete'
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
