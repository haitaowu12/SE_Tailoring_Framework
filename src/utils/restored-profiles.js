import { CORE_PROCESSES } from '../data/processes.js';
import { assessMetricCompleteness, evaluateBaselineEligibility, hasCompleteProcessProfile } from './assessment-integrity.js';
import { computeRigorBudgetStatus, runFullAssessment } from './assessment-engine.js';
import { buildElementContext } from './element-context.js';
import { resolveProtectedAncestry } from './inheritance-engine.js';
import { reconcileDecisionViolations, reconcileManualChoices } from './tailoring-decisions.js';

/** Rebuild saved profiles from their inputs. Keep recorded choices and flag unexplained differences for review. */
export function refreshRestoredProfiles(state) {
    const tree = state.assessmentTree;
    if (!tree || state.semanticMigration?.status === 'review-required' || state.assessmentDisposition === 'demo') return state;
    let refreshed = false;
    for (const [id, node] of Object.entries(tree.nodes || {})) {
        if (!hasCompleteProcessProfile(node.levels) || !assessMetricCompleteness(node.scores, node.metricAssessments).complete
            || node.assessmentDisposition === 'demo') continue;
        const ancestry = resolveProtectedAncestry(tree, id, { scores: node.scores });
        if (!ancestry.valid || ancestry.blockedMetrics.length) continue;
        const savedLevels = node.levels;
        const context = {
            ...state.projectInfo,
            metricAssessments: node.metricAssessments,
            assuranceObligations: node.assuranceObligations || [],
            rightSizingApprovalRecords: node.rightSizingApprovalRecords || [],
            assessmentTree: tree,
            activeElementId: id,
            matrixMap: state.matrixMap,
            effectiveScores: ancestry.effectiveScores
        };
        const result = runFullAssessment(ancestry.effectiveScores, state.matrixMap, context);
        const { adjustments, suspended } = reconcileManualChoices(node, state, result, context, node.manualAdjustments || {}, true);
        const levels = { ...result.levels };
        for (const [processId, choice] of Object.entries(adjustments)) levels[processId] = choice.level;
        const differences = CORE_PROCESSES.filter(({ id: processId }) => savedLevels[processId] !== levels[processId])
            .map(({ id: processId }) => ({ processId, saved: savedLevels[processId], recalculated: levels[processId] }));
        if (differences.length || suspended) {
            node.restoredProfileDifferences = differences;
            node.status = 'draft';
            node.assessmentDisposition = 'work-in-progress';
        }
        node.levels = levels;
        node.assessmentResult = {
            ...result,
            levels,
            violations: reconcileDecisionViolations(result, levels, ancestry.effectiveScores, context),
            rightSizingActions: node.assessmentResult?.rightSizingActions || [],
            budgetStatus: computeRigorBudgetStatus(levels, ancestry.effectiveScores)
        };
        for (const [processId, choice] of Object.entries(adjustments)) {
            if (result.locallyCompleteRightSizingRecordCount) node.assessmentResult.locallyAdjustedLevels[processId] = choice.level;
        }
        refreshed ||= id === (tree.activeId || tree.rootId);
    }

    if (refreshed) {
        Object.assign(state, buildElementContext(tree.nodes[tree.activeId || tree.rootId]));
        state.manualAdjustments = { ...(tree.nodes[tree.rootId]?.manualAdjustments || {}) };
    }
    if (state.assessmentComplete && !evaluateBaselineEligibility(state).softwareChecksPassed) {
        state.assessmentComplete = false;
        state.assessmentDisposition = 'work-in-progress';
    }
    return state;
}
