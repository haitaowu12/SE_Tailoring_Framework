import {
    ARTIFACT_ID_PATTERN,
    HANDOFF_EVIDENCE_STATUSES,
    REQUIREMENTS_ARCHITECTURE_PILOT,
    createRequirementsArchitectureHandoff
} from '../data/artifact-relationships.js';
import { isValidIsoCalendarDate } from './date-validation.js';

const VALID_STATUSES = new Set(HANDOFF_EVIDENCE_STATUSES.map(status => status.id));
const REQUIRED_COMMON_FIELDS = ['requiredContent', 'acceptanceCriteria', 'evidenceRefs', 'acceptanceAuthority', 'reviewDate'];

const text = value => String(value || '').trim();

export function normalizeArtifactHandoffs(records, rootElementId = 'default') {
    if (!Array.isArray(records) || records.length === 0) {
        return [createRequirementsArchitectureHandoff(rootElementId)];
    }
    return records
        .filter(record => record && typeof record === 'object')
        .map(record => ({
            ...createRequirementsArchitectureHandoff(text(record.providerElementId) || rootElementId),
            ...record,
            relationshipId: REQUIREMENTS_ARCHITECTURE_PILOT.id,
            providerProcessId: REQUIREMENTS_ARCHITECTURE_PILOT.providerProcessId,
            consumerProcessId: REQUIREMENTS_ARCHITECTURE_PILOT.consumerProcessId
        }));
}

export function ensureArtifactHandoffsForElements(records, elementIds = ['default']) {
    const normalized = normalizeArtifactHandoffs(records, elementIds[0] || 'default');
    const existing = new Set(normalized.map(record => `${record.providerElementId}:${record.consumerElementId}`));
    const additions = [...new Set(elementIds.filter(Boolean))]
        .filter(elementId => !existing.has(`${elementId}:${elementId}`))
        .map(elementId => createRequirementsArchitectureHandoff(elementId));
    return [...normalized, ...additions];
}

export function getBaselineElementIds(assessmentTree, { includeRoot = true } = {}) {
    if (!assessmentTree?.nodes || typeof assessmentTree.nodes !== 'object') {
        return includeRoot ? [assessmentTree?.rootId || 'default'] : [];
    }
    const ids = [];
    if (includeRoot && assessmentTree.rootId && assessmentTree.nodes[assessmentTree.rootId]) ids.push(assessmentTree.rootId);
    for (const [id, node] of Object.entries(assessmentTree.nodes)) {
        if (id === assessmentTree.rootId) continue;
        const representedComplete = node?.assessmentDisposition === 'complete-baseline'
            || node?.status === 'approved'
            || node?.status === 'baselined';
        if (representedComplete) ids.push(id);
    }
    return [...new Set(ids)];
}

export function assessArtifactHandoff(record, now = new Date()) {
    const missingFields = [];
    if (!ARTIFACT_ID_PATTERN.test(text(record?.artifactId))) missingFields.push('typed artifact ID');
    if (!text(record?.providerElementId)) missingFields.push('provider element');
    if (!text(record?.consumerElementId)) missingFields.push('consumer element');
    if (Number(record?.providerProcessId) !== 19) missingFields.push('provider process');
    if (Number(record?.consumerProcessId) !== 20) missingFields.push('consumer process');
    if (!VALID_STATUSES.has(record?.evidenceStatus)) missingFields.push('evidence status');
    for (const field of REQUIRED_COMMON_FIELDS) {
        if (!text(record?.[field])) missingFields.push(field);
    }

    const reviewDate = text(record?.reviewDate);
    const parsedReviewDate = isValidIsoCalendarDate(reviewDate)
        ? new Date(`${reviewDate}T23:59:59.999Z`)
        : null;
    const reviewCurrent = parsedReviewDate !== null && parsedReviewDate >= now;
    if (reviewDate && !reviewCurrent) missingFields.push('current review date');

    const accepted = record?.evidenceStatus === 'accepted' && missingFields.length === 0;
    const governedReview = !!(record?.evidenceStatus === 'governed-review'
        && missingFields.length === 0
        && text(record?.gaps)
        && text(record?.equivalentEvidence));
    if (record?.evidenceStatus === 'governed-review') {
        if (!text(record?.gaps)) missingFields.push('documented gaps');
        if (!text(record?.equivalentEvidence)) missingFields.push('equivalent evidence / compensating controls');
    }

    return {
        artifactId: text(record?.artifactId),
        complete: accepted || governedReview,
        disposition: accepted ? 'accepted' : governedReview ? 'governed-review' : 'blocked',
        baselineBlocked: !(accepted || governedReview),
        missingFields: [...new Set(missingFields)],
        processLevelEffect: 'none'
    };
}

export function assessOutputSufficiency(records, requiredElementIds = ['default'], now = new Date()) {
    // Omitted legacy fields normalize to an explicit incomplete pilot record.
    // They remain readable, but can never be interpreted as accepted evidence.
    const compatibilityOmission = records === undefined;
    const normalized = normalizeArtifactHandoffs(records, requiredElementIds[0] || 'default');
    const required = [...new Set(requiredElementIds.filter(Boolean))];
    const results = required.map(elementId => {
        const record = normalized.find(candidate => candidate.relationshipId === REQUIREMENTS_ARCHITECTURE_PILOT.id
            && candidate.providerElementId === elementId
            && candidate.consumerElementId === elementId);
        return record
            ? { elementId, ...assessArtifactHandoff(record, now) }
            : { elementId, artifactId: '', complete: false, disposition: 'blocked', baselineBlocked: true, missingFields: ['handoff record'], processLevelEffect: 'none' };
    });
    return {
        complete: results.every(result => result.complete),
        baselineBlocked: results.some(result => result.baselineBlocked),
        requiredCount: results.length,
        acceptedCount: results.filter(result => result.disposition === 'accepted').length,
        governedReviewCount: results.filter(result => result.disposition === 'governed-review').length,
        results,
        relationshipClassification: REQUIREMENTS_ARCHITECTURE_PILOT.classification,
        processLevelEffect: 'none',
        compatibilityOmission
    };
}

export function validateArtifactHandoffs(records) {
    if (records === undefined) return [];
    if (!Array.isArray(records)) return ['artifactHandoffs must be an array'];
    const errors = [];
    const ids = new Set();
    records.forEach((record, index) => {
        if (!record || typeof record !== 'object' || Array.isArray(record)) {
            errors.push(`artifactHandoffs[${index}] must be an object`);
            return;
        }
        if (!ARTIFACT_ID_PATTERN.test(text(record.artifactId))) errors.push(`artifactHandoffs[${index}] has invalid typed artifactId`);
        if (ids.has(record.artifactId)) errors.push(`artifactHandoffs[${index}] duplicates artifactId`);
        ids.add(record.artifactId);
        if (record.relationshipId !== REQUIREMENTS_ARCHITECTURE_PILOT.id) errors.push(`artifactHandoffs[${index}] has unsupported relationshipId`);
        if (Number(record.providerProcessId) !== 19 || Number(record.consumerProcessId) !== 20) errors.push(`artifactHandoffs[${index}] must retain Requirements-to-Architecture process endpoints`);
        if (!VALID_STATUSES.has(record.evidenceStatus)) errors.push(`artifactHandoffs[${index}] has invalid evidenceStatus`);
        for (const field of ['providerElementId', 'consumerElementId', 'requiredContent', 'acceptanceCriteria', 'evidenceRefs', 'gaps', 'equivalentEvidence', 'acceptanceAuthority', 'reviewDate']) {
            if (record[field] !== undefined && typeof record[field] !== 'string') errors.push(`artifactHandoffs[${index}].${field} must be a string`);
        }
        if (typeof record.reviewDate === 'string' && record.reviewDate && !isValidIsoCalendarDate(record.reviewDate)) {
            errors.push(`artifactHandoffs[${index}].reviewDate must be a real ISO calendar date`);
        }
    });
    return errors;
}
