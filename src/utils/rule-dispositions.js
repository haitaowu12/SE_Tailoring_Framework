import { ACTIVE_CONSISTENCY_RULES } from '../data/metrics.js';
import { isValidIsoCalendarDate } from './date-validation.js';

export const GENERAL_WARNING_OUTCOMES = [
    { id: 'satisfy', label: 'Recommended relationship satisfied' },
    { id: 'accept-current', label: 'Current levels accepted with controls' },
    { id: 'responsibility-elsewhere', label: 'Responsibility assigned elsewhere' },
    { id: 'outside-boundary', label: 'Outside the assessed boundary' },
    { id: 'authorized-defer', label: 'Authorized, time-bounded deferral' }
];

export const RULE_11_OUTCOMES = [
    { id: 'elevated-validation', label: 'Validation elevated to at least Standard' },
    { id: 'parent-or-external-responsibility', label: 'Validation satisfied by parent or external responsibility' },
    { id: 'basic-evidence-justified', label: 'Basic validation evidence accepted with justification' },
    { id: 'outside-assessed-boundary', label: 'Validation is outside the assessed boundary' }
];

const GENERAL_OUTCOME_IDS = new Set(GENERAL_WARNING_OUTCOMES.map(outcome => outcome.id));
const RULE_11_OUTCOME_IDS = new Set(RULE_11_OUTCOMES.map(outcome => outcome.id));
const ACTIVE_WARNING_RULE_IDS = new Set(
    ACTIVE_CONSISTENCY_RULES.filter(rule => rule.type === 'WN').map(rule => String(rule.id))
);

function isWarningViolation(violation) {
    const ruleId = String(violation?.ruleId ?? '');
    return ACTIVE_WARNING_RULE_IDS.has(ruleId)
        && violation?.type !== 'HC'
        && violation?.severity !== 'error';
}

export function getTriggeredWarningViolations(violations = []) {
    if (!Array.isArray(violations)) return [];
    const byRule = new Map();
    for (const violation of violations) {
        if (isWarningViolation(violation)) byRule.set(String(violation.ruleId), violation);
    }
    return [...byRule.values()];
}

export function isRule11Triggered(violations = []) {
    return getTriggeredWarningViolations(violations).some(violation => String(violation.ruleId) === '11');
}

function assessRequiredFields(record, validOutcomes) {
    const missingFields = [];
    if (!validOutcomes.has(record?.outcome)) missingFields.push('outcome');
    if (!String(record?.rationale || '').trim()) missingFields.push('rationale');
    if (!String(record?.ownerApprover || '').trim()) missingFields.push('ownerApprover');
    if (!String(record?.evidenceRef || '').trim()) missingFields.push('evidenceRef');
    if (!isValidIsoCalendarDate(record?.reviewDate)) missingFields.push('reviewDate');
    return missingFields;
}

export function assessRule11Disposition(violations = [], ruleDispositions = {}, levels = {}) {
    const required = isRule11Triggered(violations);
    const record = ruleDispositions?.['11'] || ruleDispositions?.[11] || null;
    if (!required) return { ruleId: '11', required: false, complete: true, missingFields: [], record };

    const missingFields = assessRequiredFields(record, RULE_11_OUTCOME_IDS);
    if (record?.outcome === 'elevated-validation' && !['standard', 'comprehensive'].includes(levels?.[27] || levels?.['27'])) {
        missingFields.splice(1, 0, 'validationLevel');
    }

    return { ruleId: '11', required: true, complete: missingFields.length === 0, missingFields, record };
}

export function assessWarningDispositions(violations = [], ruleDispositions = {}, levels = {}) {
    const triggered = getTriggeredWarningViolations(violations);
    const assessments = triggered.map(violation => {
        const ruleId = String(violation.ruleId);
        if (ruleId === '11') return { ...assessRule11Disposition(violations, ruleDispositions, levels), violation };
        const record = ruleDispositions?.[ruleId] || null;
        const missingFields = assessRequiredFields(record, GENERAL_OUTCOME_IDS);
        // A still-present violation proves that the recommended relationship is
        // not yet satisfied. Preserve the outcome for audit/import, but never
        // let a statement alone masquerade as a level change.
        if (record?.outcome === 'satisfy') missingFields.splice(1, 0, 'relationshipLevel');
        return {
            ruleId,
            required: true,
            complete: missingFields.length === 0,
            missingFields,
            record,
            violation
        };
    });
    const incomplete = assessments.filter(assessment => !assessment.complete);
    return {
        required: assessments.length > 0,
        complete: incomplete.length === 0,
        requiredRuleIds: assessments.map(assessment => assessment.ruleId),
        incompleteRuleIds: incomplete.map(assessment => assessment.ruleId),
        assessments
    };
}

function normalizeRecord(ruleId, record) {
    const normalized = {
        ruleId: /^\d+$/.test(ruleId) ? Number(ruleId) : ruleId,
        outcome: typeof record.outcome === 'string' ? record.outcome : '',
        rationale: typeof record.rationale === 'string' ? record.rationale : '',
        ownerApprover: typeof record.ownerApprover === 'string' ? record.ownerApprover : '',
        evidenceRef: typeof record.evidenceRef === 'string' ? record.evidenceRef : '',
        reviewDate: typeof record.reviewDate === 'string' ? record.reviewDate : ''
    };
    if (ruleId === '11') normalized.propagationId = 'P12';
    return normalized;
}

export function normalizeRuleDispositions(value = {}) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const normalized = {};
    for (const [key, record] of Object.entries(value)) {
        const ruleId = String(key);
        if (!ACTIVE_WARNING_RULE_IDS.has(ruleId) || !record || typeof record !== 'object' || Array.isArray(record)) continue;
        normalized[ruleId] = normalizeRecord(ruleId, record);
    }
    return normalized;
}

export function validateRuleDispositions(value) {
    const errors = [];
    if (value === undefined) return errors;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return ['ruleDispositions must be an object'];
    for (const [key, record] of Object.entries(value)) {
        const ruleId = String(key);
        if (!ACTIVE_WARNING_RULE_IDS.has(ruleId)) {
            errors.push(`Unsupported rule disposition: ${key}`);
            continue;
        }
        if (!record || typeof record !== 'object' || Array.isArray(record)) {
            errors.push(`ruleDispositions[${key}] must be an object`);
            continue;
        }
        if (record.ruleId !== undefined && String(record.ruleId) !== ruleId) errors.push(`ruleDispositions[${key}] has invalid ruleId`);
        if (ruleId === '11' && record.propagationId !== undefined && record.propagationId !== 'P12') {
            errors.push('ruleDispositions[11] has invalid propagationId');
        }
        const validOutcomes = ruleId === '11' ? RULE_11_OUTCOME_IDS : GENERAL_OUTCOME_IDS;
        if (record.outcome && !validOutcomes.has(record.outcome)) errors.push(`ruleDispositions[${key}] has invalid outcome`);
        for (const field of ['rationale', 'ownerApprover', 'evidenceRef', 'reviewDate']) {
            if (record[field] !== undefined && typeof record[field] !== 'string') errors.push(`ruleDispositions[${key}].${field} must be a string`);
        }
        if (typeof record.reviewDate === 'string' && record.reviewDate && !isValidIsoCalendarDate(record.reviewDate)) {
            errors.push(`ruleDispositions[${key}].reviewDate must be a real ISO calendar date`);
        }
    }
    return errors;
}
