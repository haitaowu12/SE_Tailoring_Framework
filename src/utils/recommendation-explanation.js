import { FRAMEWORK_META } from '../data/se-tailoring-data.js';

/** Explain the engine's recorded derivation, never recompute a different policy. */
export function explainRecommendation(processId, result = {}) {
  const detail = result?.derivationDetails?.[processId] || {};
  const drivers = detail.allMetricScores || [];
  const label = level => FRAMEWORK_META.levelLabels[level] || level;
  const input = item => `${item.metric} (${item.role === 'P' ? 'Primary' : 'Secondary'}) = ${item.value}`;
  let reason;
  if (detail.confidence === 'corroborated') {
    const lead = drivers.find(item => item.role === 'P' && item.value === 5);
    const support = drivers.find(item => item.role === 'P' && item.value >= 3 && item.metric !== lead?.metric)
      || drivers.find(item => item.role === 'S' && item.value === 5);
    reason = lead && support ? `Comprehensive: ${input(lead)}, supported by ${input(support)}.` : 'Comprehensive: the distinct-input support rule is met.';
  } else if (detail.confidence === 'direct-consequence') {
    const critical = drivers.find(item => ['M5', 'M7'].includes(item.metric) && item.value === 5);
    reason = `Comprehensive: ${critical ? input(critical) : 'a mapped critical-consequence score of 5'} activates the M5/M7 exception.`;
  } else if (detail.confidence === 'available-with-justification') {
    reason = `Standard: the mapped score-5 trigger lacks the required distinct support for Comprehensive. A higher local choice needs a rationale.`;
  } else {
    const triggers = drivers.filter(item => (detail.triggerMetrics || []).includes(item.metric));
    reason = `${label(detail.level || 'basic')}: ${triggers.length ? triggers.slice(0,2).map(input).join('; ') + (triggers.length > 2 ? ` (+${triggers.length - 2} other mapped triggers)` : '') : 'no mapped trigger recorded'}${detail.triggerScore ? ` falls in the ${detail.triggerScore <= 2 ? '1–2 Basic' : detail.triggerScore <= 4 ? '3–4 Standard' : '5 Comprehensive'} band` : ''}.`;
  }
  const floors = (result.activeFloors || result.overrides || []).filter(item => Number(item.processId) === Number(processId));
  const fixes = (result.fixes || []).filter(item => Number(item.processId) === Number(processId));
  return [`${result.preview === true || result.authoritative === false ? 'Preview. ' : ''}Framework ${FRAMEWORK_META.version}. ${reason}`,
    ...floors.map(item => `Protected minimum: ${label(item.minLevel || item.to)} — ${item.reason || item.label || 'active floor'}.`),
    ...fixes.map(item => `Dependency rule ${item.ruleId || ''}: ${item.reason || item.label || 'mandatory level elevation'}.`)
  ].join(' ');
}
