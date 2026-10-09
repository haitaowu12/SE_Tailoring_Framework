/** Hydrate legacy top-level view fields from one element without cross-element fallbacks.
 * The tree remains canonical; this does not copy, clear, or modify node decisions.
 */
const clone = value => JSON.parse(JSON.stringify(value));
const owns = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
const INPUT_DEFAULTS = {
    scores: {}, metricAssessments: {}, assuranceObligations: [], ruleDispositions: {},
    csiResponse: {}, correlatedEvidenceWarnings: [], rightSizingApprovalRecords: []
};
const RESULT_DEFAULTS = {
    levels: {}, derived: {}, derivationDetails: {}, overrides: [], activeFloors: [],
    violations: [], fixes: [], rightSizingProposals: [], blockedRightSizingCandidates: [],
    proposedRightSizedLevels: {}, proposalClosureFixes: [], proposalBudgetStatus: null,
    rightSizingApprovalEvaluations: [], locallyAdjustedLevels: {}, localScenarioClosureFixes: [],
    localScenarioBudgetStatus: null, locallyCompleteRightSizingRecordCount: 0,
    normativeLevels: {}, rightSizingActions: [], budgetStatus: null, adoptionRisks: [],
    tradeoffs: [], saTier: null, indices: {}, confidence: {}, derivationStatus: {}
};

export function buildElementContext(node = {}, fallback = {}) {
    const context = {};
    const result = node.assessmentResult || {};
    for (const [key, empty] of Object.entries(INPUT_DEFAULTS)) {
        context[key] = clone(owns(node, key) ? (node[key] ?? empty) : (fallback[key] ?? empty));
    }
    for (const [key, empty] of Object.entries(RESULT_DEFAULTS)) {
        context[key] = clone(result[key] ?? fallback[key] ?? empty);
    }
    if (owns(node, 'levels')) context.levels = clone(node.levels || {});
    if (!owns(result, 'normativeLevels') && !owns(fallback, 'normativeLevels')) {
        context.normativeLevels = clone(node.recommendationBaseline?.levels || context.levels);
    }
    context.confidence = clone(result.confidence || result.derivationStatus || fallback.confidence || fallback.derivationStatus || {});
    context.derivationStatus = clone(result.derivationStatus || result.confidence || fallback.derivationStatus || fallback.confidence || {});
    context.approvedRightSizedLevels = {};
    context.effectiveRightSizingApprovalCount = 0;
    return context;
}
