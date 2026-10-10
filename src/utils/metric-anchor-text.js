import { ASSESSOR_GUIDANCE } from '../data/generated-assessor-guidance.js';

/** The same ordinal description used by the assessment's five radio choices. */
export function getMetricAnchorText(metricOrId, score) {
    if (!['number', 'string'].includes(typeof score)) return '';
    const rating = Number(score);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return '';
    const metricId = typeof metricOrId === 'string' ? metricOrId : metricOrId?.id;
    return ASSESSOR_GUIDANCE[metricId]?.anchors?.[rating]
        || (typeof metricOrId === 'object' && metricOrId?.anchors?.[rating])
        || '';
}
