/**
 * Lightweight governance for lower child M8/M15 judgments.
 *
 * These records capture an accountable decision. They do not prescribe,
 * inspect, or validate the adequacy of domain-specific security or assurance
 * evidence.
 */

export const HIERARCHY_DISPOSITION_OUTCOMES = Object.freeze({
    M8: Object.freeze([
        Object.freeze({ id: 'lower-consequence-justified', label: 'Lower child consequence justified' }),
        Object.freeze({ id: 'responsibility-retained-elsewhere', label: 'Security responsibility retained elsewhere' }),
        Object.freeze({ id: 'shared-responsibility', label: 'Shared security responsibility' }),
        Object.freeze({ id: 'not-applicable-to-child', label: 'Parent security concern not applicable to child' })
    ]),
    M15: Object.freeze([
        Object.freeze({ id: 'lower-demand-justified', label: 'Lower child assurance demand justified' }),
        Object.freeze({ id: 'responsibility-retained-elsewhere', label: 'Assurance responsibility retained elsewhere' }),
        Object.freeze({ id: 'shared-responsibility', label: 'Shared assurance responsibility' }),
        Object.freeze({ id: 'not-applicable-to-child', label: 'Parent obligation not applicable to child' })
    ])
});

export const HIERARCHY_DISPOSITION_CONSIDERATIONS = Object.freeze({
    M8: Object.freeze([
        'Child security boundary and interfaces',
        'Shared assets, services, and dependencies',
        'Whether parent security consequences can still reach the child',
        'Confidentiality, integrity, availability, privacy, and cyber-physical consequences'
    ]),
    M15: Object.freeze([
        'Which parent obligations were reviewed and their child scope',
        'Applicability or exclusion rationale for relevant obligations',
        'Responsibility retained elsewhere or shared across boundaries',
        'Relevant regulatory, contractual, certification, or independent-assurance authority'
    ])
});

const REQUIRED_FIELDS = Object.freeze(['outcome', 'rationale', 'ownerApprover', 'reviewDate']);

export function isValidHierarchyReviewDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

/**
 * Assess a disposition for lowering a child M8 or M15 score.
 * Legacy booleans are deliberately retained as visible migration input but
 * never authorize a lower score.
 */
export function assessHierarchyDisposition(metricId, dispositionOrLegacy = null) {
    const outcomes = HIERARCHY_DISPOSITION_OUTCOMES[metricId];
    if (!outcomes) throw new Error(`Unsupported hierarchy disposition metric: ${metricId}`);

    if (typeof dispositionOrLegacy === 'boolean') {
        return {
            valid: false,
            status: dispositionOrLegacy ? 'legacy-unconfirmed' : 'missing',
            legacyMigrationInput: dispositionOrLegacy,
            missingFields: dispositionOrLegacy ? ['structuredDisposition'] : [`${metricId.toLowerCase()}HierarchyDisposition`]
        };
    }

    if (!dispositionOrLegacy || typeof dispositionOrLegacy !== 'object' || Array.isArray(dispositionOrLegacy)) {
        return {
            valid: false,
            status: 'missing',
            legacyMigrationInput: false,
            missingFields: [`${metricId.toLowerCase()}HierarchyDisposition`]
        };
    }

    const missingFields = [];
    if (dispositionOrLegacy.status !== 'confirmed') missingFields.push('status');
    const allowedOutcomes = new Set(outcomes.map(item => item.id));
    if (!allowedOutcomes.has(dispositionOrLegacy.outcome)) missingFields.push('outcome');
    for (const field of REQUIRED_FIELDS.filter(field => field !== 'outcome')) {
        if (!String(dispositionOrLegacy[field] || '').trim()) missingFields.push(field);
    }
    if (String(dispositionOrLegacy.reviewDate || '').trim() && !isValidHierarchyReviewDate(dispositionOrLegacy.reviewDate)) {
        if (!missingFields.includes('reviewDate')) missingFields.push('reviewDate');
    }

    return {
        valid: missingFields.length === 0,
        status: missingFields.length === 0 ? 'confirmed' : 'incomplete',
        legacyMigrationInput: false,
        missingFields
    };
}

/** Schema-level validation. Incomplete drafts are valid data but fail closed. */
export function validateHierarchyDisposition(metricId, disposition, fieldName) {
    if (disposition === undefined || disposition === null) return [];
    if (typeof disposition !== 'object' || Array.isArray(disposition)) return [`${fieldName} must be an object`];

    const errors = [];
    if (disposition.status !== undefined && !['draft', 'confirmed'].includes(disposition.status)) {
        errors.push(`${fieldName} has invalid status`);
    }
    if (String(disposition.outcome || '').trim()) {
        const allowed = HIERARCHY_DISPOSITION_OUTCOMES[metricId].some(item => item.id === disposition.outcome);
        if (!allowed) errors.push(`${fieldName} has invalid outcome`);
    }
    for (const field of ['rationale', 'ownerApprover', 'decisionBasisRef', 'evidenceRef', 'reviewDate']) {
        if (disposition[field] !== undefined && typeof disposition[field] !== 'string') {
            errors.push(`${fieldName}.${field} must be a string`);
        }
    }
    if (String(disposition.reviewDate || '').trim() && !isValidHierarchyReviewDate(disposition.reviewDate)) {
        errors.push(`${fieldName} has invalid reviewDate`);
    }
    return errors;
}
