import { FRAMEWORK_SEMANTIC_VERSION, METRIC_DEFINITION_SET_ID } from '../data/metrics.js';

const LEVELS = ['basic', 'standard', 'comprehensive'];
const PROTECTED_METRICS = new Set(['M5', 'M8', 'M15']);

export const RIGHT_SIZING_APPROVAL_ROLES = Object.freeze({
    accountableProcessOwner: 'Accountable process owner',
    assessmentLead: 'Assessment lead',
    technicalAuthority: 'Technical authority',
    independentAssuranceAuthority: 'Independent assurance / acceptance authority',
    governingBoundaryAuthority: 'Governing-boundary authority'
});

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (!isPlainObject(value)) return value;
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
}

function stableStringify(value) {
    return JSON.stringify(stableValue(value));
}

function isRealIsoDate(value) {
    if (!String(value || '').match(/^\d{4}-\d{2}-\d{2}$/)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function fnv1a(value) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < value.length; i += 1) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}

function normalizeElementIds(ids, fallback = 'default') {
    const values = Array.isArray(ids) && ids.length ? ids : [fallback];
    return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))].sort();
}

function ancestorChain(tree, elementId) {
    const chain = [];
    const visited = new Set();
    let current = tree?.nodes?.[elementId];
    while (current && !visited.has(current.id)) {
        chain.push(current.id);
        visited.add(current.id);
        current = current.parentId ? tree.nodes?.[current.parentId] : null;
    }
    return chain;
}

export function findNearestCommonGoverningBoundary(tree, elementIds = []) {
    const ids = normalizeElementIds(elementIds, tree?.rootId || 'default');
    if (!tree?.nodes || ids.some(id => !tree.nodes[id])) return null;
    const firstChain = ancestorChain(tree, ids[0]);
    const otherAncestors = ids.slice(1).map(id => new Set(ancestorChain(tree, id)));
    return firstChain.find(id => otherAncestors.every(set => set.has(id))) || null;
}

export function getRightSizingApprovalRequirements(proposal = {}, tree = null) {
    const fromIndex = LEVELS.indexOf(proposal.from);
    const toIndex = LEVELS.indexOf(proposal.proposedTo || proposal.to);
    const reductionSteps = fromIndex >= 0 && toIndex >= 0 ? fromIndex - toIndex : 0;
    const scopeElementIds = normalizeElementIds(proposal.scopeElementIds, proposal.elementId || tree?.activeId || tree?.rootId || 'default');
    const protectedMetricIds = [...new Set((proposal.protectedMetricIds || []).filter(metric => PROTECTED_METRICS.has(metric)))].sort();
    const crossElement = scopeElementIds.length > 1;
    const roles = ['accountableProcessOwner', 'assessmentLead'];
    if (reductionSteps >= 2) roles.push('technicalAuthority');
    if (protectedMetricIds.length > 0 || proposal.protectedOutputImpact === true) roles.push('independentAssuranceAuthority');
    if (crossElement) roles.push('governingBoundaryAuthority');
    return {
        reductionSteps,
        scopeElementIds,
        protectedMetricIds,
        crossElement,
        governingBoundaryElementId: crossElement ? findNearestCommonGoverningBoundary(tree, scopeElementIds) : scopeElementIds[0],
        requiredRoles: roles
    };
}

export function createRightSizingApprovalSnapshot(proposal = {}, context = {}) {
    const requirements = getRightSizingApprovalRequirements(proposal, context.assessmentTree);
    const processId = Number(proposal.processId);
    const snapshot = {
        frameworkVersion: context.frameworkVersion || FRAMEWORK_SEMANTIC_VERSION,
        metricDefinitionSet: context.metricDefinitionSet || METRIC_DEFINITION_SET_ID,
        elementIds: requirements.scopeElementIds,
        processId,
        from: proposal.from,
        proposedTo: proposal.proposedTo || proposal.to,
        protectedMetricIds: requirements.protectedMetricIds,
        affectedMetricScores: Object.fromEntries((proposal.affectedMetricIds || requirements.protectedMetricIds).map(metric => [metric, context.scores?.[metric] ?? null])),
        protectedMetricScores: Object.fromEntries(requirements.protectedMetricIds.map(metric => [metric, context.scores?.[metric] ?? null])),
        assuranceObligations: (context.assuranceObligations || [])
            .filter(obligation => Array.isArray(obligation.processScope) && obligation.processScope.map(Number).includes(processId))
            .map(obligation => ({ id: obligation.id || null, type: obligation.type || null, bindingStatus: obligation.bindingStatus || null, authority: obligation.authority || null, sourceRef: obligation.sourceRef || null }))
            .sort((a, b) => stableStringify(a).localeCompare(stableStringify(b))),
        allocationDecisions: requirements.scopeElementIds.map(elementId => ({
            elementId,
            safety: context.assessmentTree?.nodes?.[elementId]?.safetyAllocationDecision || null,
            security: context.assessmentTree?.nodes?.[elementId]?.securityAllocationDecision || null,
            assurance: context.assessmentTree?.nodes?.[elementId]?.assuranceApplicabilityDecision || null
        })),
        activeFloors: (context.activeFloors || [])
            .filter(floor => Number(floor.processId) === processId)
            .map(floor => ({ overrideId: floor.overrideId || null, minLevel: floor.minLevel || floor.requiredLevel || floor.to || null }))
            .sort((a, b) => stableStringify(a).localeCompare(stableStringify(b))),
        normativeLevel: context.normativeLevels?.[processId] || proposal.from,
        governingBoundaryElementId: requirements.governingBoundaryElementId
    };
    return `rs-${fnv1a(stableStringify(snapshot))}`;
}

function hasRoleEvidence(record, role) {
    const entry = record?.approvals?.[role];
    return isPlainObject(entry) && String(entry.identity || '').trim() && String(entry.authorityBasis || '').trim();
}

export function assessRightSizingApproval(record = {}, proposal = {}, context = {}) {
    const requirements = getRightSizingApprovalRequirements(proposal, context.assessmentTree);
    const reasons = [];
    const target = proposal.proposedTo || proposal.to;
    const expectedSnapshot = createRightSizingApprovalSnapshot(proposal, context);
    const today = String(context.asOfDate || new Date().toISOString().slice(0, 10));

    if (record.decision !== 'approved') reasons.push('decision-not-approved');
    if (Number(record.processId) !== Number(proposal.processId)) reasons.push('process-mismatch');
    if (record.from !== proposal.from || record.to !== target) reasons.push('level-mismatch');
    if (record.snapshot !== expectedSnapshot) reasons.push('assessment-or-scope-changed');
    if (!isRealIsoDate(record.reviewDate)) reasons.push('review-date-required');
    else if (record.reviewDate < today) reasons.push('approval-expired');

    for (const field of ['rationale', 'protectedOutputs', 'residualRisks', 'riskAcceptanceOwner', 'compensatingControls', 'rejectedAlternatives', 'evidenceRef']) {
        if (!String(record[field] || '').trim()) reasons.push(`${field}-required`);
    }
    for (const role of requirements.requiredRoles) {
        if (!hasRoleEvidence(record, role)) reasons.push(`${role}-approval-required`);
    }
    if (requirements.crossElement && record.governingBoundaryElementId !== requirements.governingBoundaryElementId) {
        reasons.push('nearest-common-governing-boundary-required');
    }

    const activeFloor = (context.activeFloors || [])
        .filter(floor => Number(floor.processId) === Number(proposal.processId))
        .map(floor => floor.minLevel || floor.requiredLevel || floor.to)
        .filter(level => LEVELS.includes(level))
        .sort((a, b) => LEVELS.indexOf(b) - LEVELS.indexOf(a))[0];
    if (activeFloor && LEVELS.indexOf(target) < LEVELS.indexOf(activeFloor)) reasons.push('mandatory-floor-protected');
    if (proposal.status === 'blocked-by-mandatory-closure' || proposal.nonOverridableConstraint === true) reasons.push('mandatory-closure-protected');
    if (proposal.allocationRuleProtected === true) reasons.push('safety-security-allocation-protected');
    if (proposal.bindingAssuranceFloorProtected === true) reasons.push('binding-assurance-floor-protected');

    const locallyComplete = reasons.length === 0;
    return {
        // `valid` is retained for import/report compatibility. In the static
        // prototype it means structurally complete and policy-consistent, not
        // authenticated or externally approved.
        valid: locallyComplete,
        locallyComplete,
        externallyVerified: false,
        status: locallyComplete
            ? 'locally-complete-unverified'
            : reasons.includes('approval-expired')
                ? 'expired'
                : reasons.includes('assessment-or-scope-changed')
                    ? 'invalidated'
                    : 'invalid',
        reasons: [...new Set(reasons)],
        expectedSnapshot,
        requirements
    };
}

export function evaluateRightSizingApprovals(proposals = [], records = [], context = {}) {
    const evaluations = proposals.map(proposal => {
        const candidates = records.filter(record => Number(record.processId) === Number(proposal.processId));
        const assessed = candidates.map(record => ({ record, assessment: assessRightSizingApproval(record, proposal, context) }));
        const locallyComplete = assessed.find(item => item.assessment.locallyComplete) || null;
        return { proposal, records: assessed, locallyComplete, effective: null };
    });

    const levels = { ...(context.normativeLevels || {}) };
    const scenarioLevels = { ...levels };
    for (const evaluation of evaluations) {
        if (evaluation.locallyComplete) {
            scenarioLevels[evaluation.proposal.processId] = evaluation.proposal.proposedTo || evaluation.proposal.to;
        }
    }

    return {
        levels,
        scenarioLevels,
        evaluations,
        locallyCompleteCount: evaluations.filter(item => item.locallyComplete).length,
        // Authentication and external approval are not implemented in this
        // browser-local research artifact, so no record becomes effective.
        effectiveCount: 0
    };
}

export function validateRightSizingApprovalRecords(records) {
    if (records === undefined) return [];
    if (!Array.isArray(records)) return ['rightSizingApprovalRecords must be an array'];
    const errors = [];
    records.forEach((record, index) => {
        if (!isPlainObject(record)) {
            errors.push(`rightSizingApprovalRecords[${index}] must be an object`);
            return;
        }
        if (!['approved', 'rejected'].includes(record.decision)) errors.push(`rightSizingApprovalRecords[${index}] has invalid decision`);
        if (!Number.isInteger(Number(record.processId)) || Number(record.processId) < 9 || Number(record.processId) > 30) errors.push(`rightSizingApprovalRecords[${index}] needs a valid processId`);
        if (!LEVELS.includes(record.from) || !LEVELS.includes(record.to)) errors.push(`rightSizingApprovalRecords[${index}] has invalid levels`);
        if (!isPlainObject(record.approvals)) errors.push(`rightSizingApprovalRecords[${index}] approvals must be an object`);
        else for (const [role, approval] of Object.entries(record.approvals)) {
            if (!Object.hasOwn(RIGHT_SIZING_APPROVAL_ROLES, role) || !isPlainObject(approval) || !String(approval.identity || '').trim() || !String(approval.authorityBasis || '').trim()) {
                errors.push(`rightSizingApprovalRecords[${index}] has invalid ${role} authority evidence`);
            }
        }
        if (record.scopeElementIds !== undefined && !Array.isArray(record.scopeElementIds)) errors.push(`rightSizingApprovalRecords[${index}] scopeElementIds must be an array`);
        if (record.decision === 'approved') {
            for (const field of ['snapshot', 'rationale', 'protectedOutputs', 'residualRisks', 'riskAcceptanceOwner', 'compensatingControls', 'rejectedAlternatives', 'evidenceRef', 'reviewDate']) {
                if (!String(record[field] || '').trim()) errors.push(`rightSizingApprovalRecords[${index}] approved record requires ${field}`);
            }
            if (record.reviewDate && !isRealIsoDate(record.reviewDate)) errors.push(`rightSizingApprovalRecords[${index}] has invalid reviewDate`);
        }
    });
    return errors;
}
