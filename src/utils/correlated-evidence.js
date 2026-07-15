/** Warning-only governance for evidence shared by M5, M6, and M8. */
export const CORRELATED_EVIDENCE_METRICS = ['M5', 'M6', 'M8'];

const text = value => String(value || '').trim();
const normalized = value => text(value).toLocaleLowerCase().replace(/\s+/g, ' ');

function normalizedArtifacts(value) {
  const entries = Array.isArray(value) ? value : text(value).split(/[,\n]/);
  return [...new Set(entries.map(normalized).filter(Boolean))].sort();
}

function artifactRefs(value) {
  const entries = Array.isArray(value) ? value : text(value).split(/[,\n]/);
  const seen = new Set();
  return entries.map(text).filter(entry => {
    const key = normalized(entry);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeEvidenceContext(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    familyId: text(source.familyId),
    episodeId: text(source.episodeId),
    eventRef: text(source.eventRef),
    artifactRefs: artifactRefs(source.artifactRefs),
    assumptionsRef: text(source.assumptionsRef),
    assessorId: text(source.assessorId),
    consequencePathway: text(source.consequencePathway)
  };
}

function sharedContextKey(context) {
  if (context.episodeId) return `episode:${normalized(context.episodeId)}`;
  if (context.familyId) return `family:${normalized(context.familyId)}`;
  const artifactKey = normalizedArtifacts(context.artifactRefs).join('|');
  if (context.eventRef && artifactKey && context.assumptionsRef && context.assessorId) {
    return ['context', normalized(context.eventRef), artifactKey,
      normalized(context.assumptionsRef), normalized(context.assessorId)].join(':');
  }
  return '';
}

export function assessCorrelatedEvidence(metricAssessments = {}) {
  const groups = new Map();
  for (const metricId of CORRELATED_EVIDENCE_METRICS) {
    const assessment = metricAssessments?.[metricId];
    if (!assessment || !['assessed', 'inherited-confirmed'].includes(assessment.status)) continue;
    const context = normalizeEvidenceContext(assessment.evidenceContext);
    const key = sharedContextKey(context);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ metricId, context });
  }

  const warnings = [];
  for (const [key, records] of groups) {
    if (records.length < 2) continue;
    const pathways = records.map(record => normalized(
      metricAssessments?.[record.metricId]?.rationale || record.context.consequencePathway
    ));
    const distinctConsequenceAnalyses = pathways.every(Boolean) && new Set(pathways).size === records.length;
    if (distinctConsequenceAnalyses) continue;
    const metricIds = records.map(record => record.metricId);
    warnings.push({
      id: `correlated-evidence-${key}`,
      type: 'correlated-evidence',
      severity: 'warning',
      metricIds,
      evidenceKey: key,
      message: `${metricIds.join(', ')} reuse the same evidence context without distinct documented consequence analyses. Treat this as correlated evidence, not independent corroboration.`,
      effect: 'warning-only; scores, recommended levels, and closure are unchanged'
    });
  }
  return { warnings, warningCount: warnings.length, independentCorroborationSupported: warnings.length === 0 };
}
