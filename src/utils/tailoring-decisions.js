import { METRIC_PROCESS_MAP } from '../data/se-tailoring-data.js';
/** Browser-local decisions. Recommendations remain immutable reference snapshots. */
import { FRAMEWORK_SEMANTIC_VERSION } from '../data/metrics.js';
import { propagateSafetyOverrides } from './inheritance-engine.js';
import { checkConsistency, applyOverrides } from './assessment-engine.js';

export const DECISION_LEVELS = ['basic', 'standard', 'comprehensive'];
const clone = value => JSON.parse(JSON.stringify(value));
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;

export function recommendationKey(value) {
  const source = JSON.stringify(stable(value));
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) hash = Math.imul(hash ^ source.charCodeAt(i), 16777619);
  return `local-${(hash >>> 0).toString(16)}`;
}

export function captureRecommendation(node, result, context = {}, timestamp = new Date().toISOString()) {
  const reference = {
    frameworkVersion: FRAMEWORK_SEMANTIC_VERSION,
    levels: clone(result.normativeLevels || result.levels || {}),
    activeFloors: clone(result.activeFloors || []),
    effectiveScores: clone(context.effectiveScores || node.scores || {}),
    scores: clone(node.scores || {}),
    metricAssessments: clone(node.metricAssessments || {}),
    assuranceObligations: clone(node.assuranceObligations || []),
    matrixMap: clone(context.matrixMap || METRIC_PROCESS_MAP)
  };
  const id = recommendationKey(reference);
  if (node.recommendationBaseline?.id === id) return node.recommendationBaseline;
  const baseline = { ...reference, id, recordedAt: timestamp, source: 'calculated-recommendation' };
  node.recommendationBaseline = baseline;
  node.recommendationHistory = [...(node.recommendationHistory || []), baseline];
  return baseline;
}

export function getRecommendation(node, state = {}) {
  if (node.recommendationBaseline?.levels && typeof node.recommendationBaseline.levels === 'object' && !Array.isArray(node.recommendationBaseline.levels)) return node.recommendationBaseline;
  const root = node.id === state.assessmentTree?.rootId;
  const normative = node.assessmentResult?.normativeLevels;
  const rootNormative = root ? state.normativeLevels : null;
  const levels = Object.keys(normative || {}).length ? normative
    : Object.keys(rootNormative || {}).length ? rootNormative
      : node.assessmentResult?.levels || node.levels || {};
  return {
    id: recommendationKey({ levels, scores: node.scores, frameworkVersion: FRAMEWORK_SEMANTIC_VERSION }),
    levels: clone(levels), source: Object.keys(normative || rootNormative || {}).length ? 'saved-recommendation' : 'legacy-reference',
    recordedAt: null
  };
}

export function decisionNeedsReview(record, baseline) {
  return !!record && (!record.recommendationId || record.recommendationId !== baseline.id);
}

export function getDecisionEffectiveScores(node, state) {
  const effectiveScores = { ...(node.scores || {}) };
  const parent = state.assessmentTree?.nodes?.[node.parentId];
  if (parent) {
    const hierarchy = propagateSafetyOverrides(parent.scores || {}, effectiveScores,
      node.safetyAllocationDecision ?? (node.hasIndependentSafetyAnalysis === true ? true : null),
      node.securityHierarchyDisposition ?? (node.hasIndependentSecurityAnalysis === true ? true : null),
      node.assuranceHierarchyDisposition ?? (node.hasScopedAssuranceDecision === true ? true : null));
    for (const metricId of hierarchy.blockedMetrics) effectiveScores[metricId] = parent.scores[metricId];
  }
  return effectiveScores;
}

/** Retain recommendation warning provenance while checking hard constraints on current choices.
 * A local level change must not erase the warning disposition that explains it.
 */
export function reconcileDecisionViolations(result, levels, scores, context = {}) {
  const current = checkConsistency(levels, scores, context);
  const key = item => `${item.type}:${item.ruleId}:${item.affectedProcess || ''}`;
  const currentKeys = new Set(current.map(key));
  const addressed = (result?.violations || []).filter(item => item?.type !== 'HC' && !currentKeys.has(key(item)))
    .map(item => ({ ...item, resolvedByLocalChoice: true }));
  return [...current, ...addressed];
}

/** Prepare one atomic batch. Invalid choices remain drafts, never applied. */
export function prepareDecisions(node, state, drafts, timestamp = new Date().toISOString()) {
  const baseline = getRecommendation(node, state);
  const records = clone(node.decisionRecords || {});
  const adjustments = clone(node.manualAdjustments || {});
  const levels = { ...baseline.levels };
  for (const [pid, adjustment] of Object.entries(adjustments)) levels[pid] = adjustment.level;
  const errors = [];
  if (state.semanticMigration?.status === 'review-required') errors.push('Review and recalculate the migrated assessment before saving new decisions. Existing history is retained.');
  if (node.recommendationBaseline && ['scores', 'metricAssessments', 'assuranceObligations'].some(field => JSON.stringify(stable(node.recommendationBaseline[field] || (field === 'assuranceObligations' ? [] : {}))) !== JSON.stringify(stable(node[field] || (field === 'assuranceObligations' ? [] : {}))))) errors.push('Inputs changed since this recommendation. Review and recalculate before saving decisions; existing history and drafts are retained.');
  const changes = [];
  for (const [pid, draft] of Object.entries(drafts || {})) {
    if (!Object.hasOwn(baseline.levels, pid) || !DECISION_LEVELS.includes(draft.level)) {
      errors.push(`Process ${pid}: choose a valid level.`); continue;
    }
    const rationale = String(draft.justification || '').trim();
    const changed = draft.level !== baseline.levels[pid];
    if (changed && !rationale) errors.push(`Process ${pid}: record why the choice differs from the recommendation.`);
    const prior = records[pid] || adjustments[pid] || {};
    const origin = prior.origin || (prior.source === 'rule-disposition' ? Object.fromEntries(['level', 'justification', 'source', 'ruleId', 'propagationId', 'ownerApprover', 'evidenceRef', 'reviewDate', 'recordedAt'].filter(key => prior[key] !== undefined).map(key => [key, prior[key]])) : null);
    const record = {
      processId: String(pid), recommendationId: baseline.id, recommendationLevel: baseline.levels[pid],
      level: draft.level, justification: rationale, owner: String(draft.owner ?? prior.owner ?? prior.ownerApprover ?? '').trim(),
      evidenceRef: String(draft.evidenceRef || '').trim(), reviewDate: String(draft.reviewDate || '').trim(),
      disposition: changed ? 'adjusted-locally' : 'recommendation-retained'
    };
    if (origin) {
      record.origin = clone(origin);
      const originUnchanged = record.level === origin.level
        && record.justification === String(origin.justification || '').trim()
        && record.owner === String(origin.ownerApprover || '').trim()
        && record.evidenceRef === String(origin.evidenceRef || '').trim()
        && record.reviewDate === String(origin.reviewDate || '').trim();
      if (originUnchanged) Object.assign(record, { source: origin.source, ruleId: origin.ruleId, propagationId: origin.propagationId, ownerApprover: origin.ownerApprover });
    }
    const previous = records[pid];
    const comparablePrevious = previous && Object.fromEntries(Object.keys(record).map(key => [key, previous[key]]));
    if (JSON.stringify(record) !== JSON.stringify(comparablePrevious)) {
      const entry = { ...record, recordedAt: timestamp, previousLevel: previous?.level || adjustments[pid]?.level || baseline.levels[pid] };
      records[pid] = entry;
      changes.push(entry);
    }
    levels[pid] = draft.level;
    if (changed) adjustments[pid] = { ...record, recordedAt: records[pid]?.recordedAt || timestamp };
    else delete adjustments[pid];
  }
  const context = { ...state.projectInfo, metricAssessments: node.metricAssessments || {}, assuranceObligations: node.assuranceObligations || [] };
  const effectiveScores = getDecisionEffectiveScores(node, state);
  const floors = [...applyOverrides(levels, effectiveScores, context).activeFloors,
    ...(Array.isArray(baseline.activeFloors) ? baseline.activeFloors : []), ...(Array.isArray(node.assessmentResult?.activeFloors) ? node.assessmentResult.activeFloors : [])].filter(floor => floor && typeof floor === 'object');
  for (const floor of floors) {
    if (DECISION_LEVELS.indexOf(levels[floor.processId]) < DECISION_LEVELS.indexOf(floor.minLevel)) {
      errors.push(`Process ${floor.processId}: ${floor.minLevel} minimum is protected (${floor.reason}).`);
    }
  }
  const violations = reconcileDecisionViolations(node.assessmentResult, levels, effectiveScores, context);
  for (const violation of violations.filter(item => item.type === 'HC')) errors.push(`Rule ${violation.ruleId}: ${violation.label}`);
  return { baseline, levels, levelsChanged: Object.entries(levels).some(([pid, level]) => level !== node.levels?.[pid]), records, adjustments, changes, violations, errors: [...new Set(errors)] };
}

/** Recheck old local choices whenever recommendation inputs are recalculated.
 * Unsupported/stale choices become review drafts; their reasons remain available.
 */
export function reconcileManualChoices(node, state, result, context = {}, adjustments = node.manualAdjustments || {}, persist = false) {
  const candidate = {
    ...clone(node), scores: clone(context.scores || node.scores || {}),
    metricAssessments: clone(context.metricAssessments || node.metricAssessments || {}),
    assuranceObligations: clone(context.assuranceObligations || node.assuranceObligations || []),
    assessmentResult: result, manualAdjustments: clone(adjustments)
  };
  const baseline = captureRecommendation(candidate, result, context);
  const evaluation = prepareDecisions(candidate, { ...state, semanticMigration: null }, adjustments);
  const staleIds = Object.keys(adjustments).filter(pid => candidate.decisionRecords?.[pid] && decisionNeedsReview(candidate.decisionRecords[pid], baseline));
  const reasons = [...evaluation.errors, ...(staleIds.length ? ['Recommendation inputs changed; reconfirm the saved local choices.'] : [])];
  const applied = reasons.length ? {} : clone(adjustments);
  if (persist) {
    node.recommendationBaseline = candidate.recommendationBaseline;
    node.recommendationHistory = candidate.recommendationHistory;
    if (reasons.length && Object.keys(adjustments).length) {
      const id = recommendationKey({ baselineId: baseline.id, adjustments, reasons });
      if (!(node.suspendedAdjustments || []).some(entry => entry.id === id)) {
        node.suspendedAdjustments = [...(node.suspendedAdjustments || []), { id, recommendationId: baseline.id, recordedAt: new Date().toISOString(), adjustments: clone(adjustments), reasons }];
      }
      node.decisionDrafts = { ...clone(adjustments), ...(node.decisionDrafts || {}) };
    }
    node.manualAdjustments = applied;
  }
  return { adjustments: applied, baseline, reasons, suspended: reasons.length > 0 && Object.keys(adjustments).length > 0 };
}
