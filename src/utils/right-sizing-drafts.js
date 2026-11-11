import { FRAMEWORK_META } from '../data/se-tailoring-data.js';
import { createRightSizingApprovalSnapshot, RIGHT_SIZING_APPROVAL_ROLES } from './right-sizing-governance.js';

import { getDecisionEffectiveScores } from './tailoring-decisions.js';

const FIELDS = new Set([
  'rationale', 'protectedOutputs', 'residualRisks', 'riskAcceptanceOwner',
  'compensatingControls', 'rejectedAlternatives', 'evidenceRef', 'reviewDate',
  ...Object.keys(RIGHT_SIZING_APPROVAL_ROLES).flatMap(role => [`${role}-identity`, `${role}-basis`])
]);
const activeNode = state => state.assessmentTree?.nodes?.[state.assessmentTree.activeId || state.assessmentTree.rootId];
const safeFields = fields => Object.fromEntries(Object.entries(fields || {}).filter(([key,value]) => FIELDS.has(key) && typeof value === 'string'));

export function rightSizingDraftSnapshot(state, proposal) {
  const node = activeNode(state);
  return createRightSizingApprovalSnapshot(proposal, {
    assessmentTree: state.assessmentTree, scores: node ? getDecisionEffectiveScores(node, state) : state.scores,
    assuranceObligations: state.assuranceObligations, activeFloors: state.activeFloors,
    normativeLevels: state.normativeLevels || state.levels,
    frameworkVersion: FRAMEWORK_META.version, metricDefinitionSet: FRAMEWORK_META.metricDefinitionSet
  });
}

export function getRightSizingDraft(state, proposal) {
  const draft = activeNode(state)?.rightSizingDrafts?.[proposal.processId];
  if (!draft || typeof draft !== 'object') return null;
  return { fields: safeFields(draft.fields), stale: draft.proposalSnapshot !== rightSizingDraftSnapshot(state, proposal) };
}

/** Drafts live only on their element. They are never approval records or engine inputs. */
export function saveRightSizingDraft(state, proposal, fields) {
  const node = activeNode(state);
  if (!node) return state.assessmentTree;
  const previous = node.rightSizingDrafts?.[proposal.processId];
  return { ...state.assessmentTree, nodes: { ...state.assessmentTree.nodes, [node.id]: {
    ...node, rightSizingDrafts: { ...(node.rightSizingDrafts || {}), [proposal.processId]: {
      fields: safeFields({ ...previous?.fields, ...fields }), proposalSnapshot: previous?.proposalSnapshot || rightSizingDraftSnapshot(state, proposal)
    } }
  } } };
}
