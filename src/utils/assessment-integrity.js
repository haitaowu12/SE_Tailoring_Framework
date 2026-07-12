import {
    CONDITIONAL_METRIC_PROCESS_DRIVERS,
    M15_SCOPED_RULE_ESCALATIONS,
    METRICS,
    OVERRIDE_CONDITIONS
} from '../data/metrics.js';
import { assessRule11Disposition, assessWarningDispositions } from './rule-dispositions.js';
import { assessCsiResponse } from './csi-response.js';
import { assessOutputSufficiency } from './output-sufficiency.js';

const VALID_SCORE = score => Number.isInteger(score) && score >= 1 && score <= 5;
const CONFIRMED_STATUSES = new Set(['assessed', 'inherited-confirmed']);

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
 * Assess whether all 16 metric judgments are explicit enough to baseline.
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
                    ? 'Imported N/A is unsupported migration evidence and cannot complete a current baseline'
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

export function getAssessmentDisposition(state = {}) {
    const completeness = assessMetricCompleteness(state.scores, state.metricAssessments);
    const rule11Disposition = assessRule11Disposition(state.violations, state.ruleDispositions, state.levels);
    const warningDispositions = assessWarningDispositions(state.violations, state.ruleDispositions, state.levels);
    const csiResponse = assessCsiResponse(state.scores, state.csiResponse);
    const migrationBlocked = state.semanticMigration?.status === 'review-required';
    const explicitlyDemo = state.assessmentDisposition === 'demo';
    const rootElementId = state.assessmentTree?.rootId || 'default';
    const outputSufficiency = assessOutputSufficiency(state.artifactHandoffs, [rootElementId]);
    const complete = !!state.assessmentComplete && completeness.complete && warningDispositions.complete && csiResponse.complete && outputSufficiency.complete && !migrationBlocked && !explicitlyDemo;
    return {
        ...completeness,
        disposition: explicitlyDemo ? 'demo' : complete ? 'complete-baseline' : 'work-in-progress',
        complete,
        migrationBlocked,
        rule11Disposition,
        warningDispositions,
        csiResponse,
        outputSufficiency
    };
}
