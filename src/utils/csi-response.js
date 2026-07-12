import { deriveCSIResponseRequirement } from './assessment-engine.js';

export const CSI_RESPONSE_ACTIONS = [
    { id: 'add-capacity', label: 'Add capacity' },
    { id: 'extend-schedule', label: 'Extend schedule' },
    { id: 'reduce-scope', label: 'Reduce scope' },
    { id: 'phase-delivery', label: 'Phase delivery' },
    { id: 'change-sequencing', label: 'Change sequencing' },
    { id: 'accept-exposure', label: 'Accept exposure' }
];

const ACTION_IDS = new Set(CSI_RESPONSE_ACTIONS.map(action => action.id));
const REQUIRED_TEXT_FIELDS = ['protectedOutputs', 'rationaleDecision', 'ownerApprover', 'evidenceRef'];

function isIsoDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function normalizeCsiResponse(response) {
    if (!response || typeof response !== 'object' || Array.isArray(response)) return {};
    return {
        responseType: response.responseType === 'sponsor-escalation' ? 'sponsor-escalation' : response.responseType === 'feasibility-review' ? 'feasibility-review' : '',
        selectedActions: Array.isArray(response.selectedActions) ? [...new Set(response.selectedActions.filter(action => ACTION_IDS.has(action)))] : [],
        protectedOutputs: typeof response.protectedOutputs === 'string' ? response.protectedOutputs : '',
        rationaleDecision: typeof response.rationaleDecision === 'string' ? response.rationaleDecision : '',
        ownerApprover: typeof response.ownerApprover === 'string' ? response.ownerApprover : '',
        evidenceRef: typeof response.evidenceRef === 'string' ? response.evidenceRef : '',
        reviewDate: typeof response.reviewDate === 'string' ? response.reviewDate : ''
    };
}

/**
 * High schedule/budget pressure requires a governed feasibility response.
 * This record is deliberately orthogonal to process levels and right-sizing proposals.
 */
export function assessCsiResponse(scores = {}, response = {}) {
    const requirement = deriveCSIResponseRequirement(scores);
    const { csi, required } = requirement;
    const expectedResponseType = required ? requirement.requirement : null;
    if (!required) return { required: false, complete: true, csi, expectedResponseType, missingFields: [], response: normalizeCsiResponse(response) };

    const normalized = normalizeCsiResponse(response);
    const missingFields = [];
    if (normalized.responseType !== expectedResponseType) missingFields.push('responseType');
    if (normalized.selectedActions.length === 0) missingFields.push('selectedActions');
    for (const field of REQUIRED_TEXT_FIELDS) {
        if (!normalized[field].trim()) missingFields.push(field);
    }
    if (!isIsoDate(normalized.reviewDate)) missingFields.push('reviewDate');

    return {
        required: true,
        complete: missingFields.length === 0,
        csi,
        expectedResponseType,
        missingFields,
        response: normalized
    };
}

export function validateCsiResponse(response) {
    if (response === undefined || response === null) return [];
    if (typeof response !== 'object' || Array.isArray(response)) return ['csiResponse must be an object'];
    const errors = [];
    if (response.responseType !== undefined && !['feasibility-review', 'sponsor-escalation'].includes(response.responseType)) errors.push('csiResponse has invalid responseType');
    if (response.selectedActions !== undefined && (!Array.isArray(response.selectedActions) || response.selectedActions.some(action => !ACTION_IDS.has(action)))) errors.push('csiResponse has invalid selectedActions');
    for (const field of REQUIRED_TEXT_FIELDS) {
        if (response[field] !== undefined && (typeof response[field] !== 'string' || response[field].length > 4000)) errors.push(`csiResponse has invalid ${field}`);
    }
    if (response.reviewDate !== undefined && !isIsoDate(response.reviewDate)) errors.push('csiResponse has invalid reviewDate');
    return errors;
}
