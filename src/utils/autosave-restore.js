import {
  FRAMEWORK_SEMANTIC_VERSION,
  METRIC_DEFINITION_SET_ID,
  QUALIFIER_SCHEMA_VERSION
} from '../data/metrics.js';

export function isCurrentAutosaveSemantics(saved = {}) {
  return saved?.semantics?.frameworkVersion === FRAMEWORK_SEMANTIC_VERSION
    && saved?.semantics?.metricDefinitionSet === METRIC_DEFINITION_SET_ID;
}

export function buildAutosaveImportConfig(saved = {}) {
  return {
    _format: 'se-tailoring-config',
    _version: '2.0',
    semantics: {
      frameworkVersion: saved?.semantics?.frameworkVersion || '',
      metricDefinitionSet: saved?.semantics?.metricDefinitionSet || '',
      qualifierSchemaVersion: saved?.semantics?.qualifierSchemaVersion || QUALIFIER_SCHEMA_VERSION
    },
    projectInfo: saved.projectInfo || {},
    metricScores: saved.scores || {},
    metricAssessments: saved.metricAssessments || {},
    assuranceObligations: saved.assuranceObligations || [],
    processLevels: saved.levels || {},
    derivedLevels: saved.derived || {},
    derivationDetails: saved.derivationDetails || {},
    overrides: saved.overrides || [],
    violations: saved.violations || [],
    fixes: saved.fixes || [],
    activeFloors: saved.activeFloors || [],
    ruleDispositions: saved.ruleDispositions || {},
    csiResponse: saved.csiResponse || {},
    rightSizingProposals: saved.rightSizingProposals || [],
    blockedRightSizingCandidates: saved.blockedRightSizingCandidates || [],
    proposedRightSizedLevels: saved.proposedRightSizedLevels || {},
    proposalClosureFixes: saved.proposalClosureFixes || [],
    proposalBudgetStatus: saved.proposalBudgetStatus || null,
    rightSizingApprovalRecords: saved.rightSizingApprovalRecords || [],
    rightSizingApprovalEvaluations: saved.rightSizingApprovalEvaluations || [],
    locallyAdjustedLevels: saved.locallyAdjustedLevels || saved.approvedRightSizedLevels || {},
    locallyCompleteRightSizingRecordCount: saved.locallyCompleteRightSizingRecordCount || saved.effectiveRightSizingApprovalCount || 0,
    localScenarioClosureFixes: saved.localScenarioClosureFixes || [],
    localScenarioBudgetStatus: saved.localScenarioBudgetStatus || null,
    approvedRightSizedLevels: {},
    normativeLevels: saved.normativeLevels || saved.levels || {},
    effectiveRightSizingApprovalCount: 0,
    rightSizingActions: saved.rightSizingActions || [],
    budgetStatus: saved.budgetStatus || null,
    adoptionRisks: saved.adoptionRisks || [],
    manualAdjustments: saved.manualAdjustments || {},
    tradeoffs: saved.tradeoffs || [],
    notes: saved.notes || '',
    semanticMigration: saved.semanticMigration || null,
    saResponses: saved.saResponses || {},
    saTier: saved.saTier || null,
    indices: saved.indices || {},
    derivationStatus: saved.derivationStatus || saved.confidence || {},
    confidence: saved.confidence || saved.derivationStatus || {},
    assessmentComplete: saved.assessmentComplete === true,
    assessmentDisposition: saved.assessmentDisposition || 'work-in-progress',
    assessmentTree: saved.assessmentTree || null
  };
}

export function autosaveRestoreNotice(currentSemantics, normalized = {}) {
  if (currentSemantics) {
    return { message: 'Assessment restored from auto-save.', type: 'success' };
  }

  const migration = normalized.semanticMigration || {};
  if (migration.reason === 'completion-contract-coherence') {
    return {
      message: '4.1.0 assessment restored for preview. Reconfirm all 16 anchors before software completeness can pass.',
      type: 'warning'
    };
  }

  const metricIds = Array.isArray(migration.reassessmentMetrics)
    ? migration.reassessmentMetrics.filter(Boolean)
    : [];
  return {
    message: metricIds.length
      ? `Legacy assessment restored for preview. Reassess ${metricIds.join(', ')} before software completeness can pass.`
      : 'Legacy assessment restored for preview. Review the migration notice before continuing.',
    type: 'warning'
  };
}
