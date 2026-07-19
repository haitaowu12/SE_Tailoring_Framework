import { ASSESSOR_GUIDANCE } from '../data/generated-assessor-guidance.js';

function clampScore(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 3;
    return Math.min(5, Math.max(1, numeric));
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function anchorLabel(metric, score) {
    const manualAnchor = ASSESSOR_GUIDANCE[metric.id]?.anchors?.[score];
    if (manualAnchor) return manualAnchor;
    const explicit = metric.anchors?.[score];
    if (explicit) return explicit;
    const question = metric.guidedQuestions?.find(item => Number(item.yesScore) === score);
    return question?.rationale || question?.text || `Anchor ${score}`;
}

function judgmentPresentation(assessment = {}) {
    if (assessment.status === 'assessed') return { label: 'Confirmed', className: 'confirmed' };
    if (assessment.status === 'inherited-confirmed') return { label: 'Inherited', className: 'inherited' };
    if (assessment.status === 'unknown') return { label: 'Unknown', className: 'unknown' };
    return { label: 'Unreviewed', className: 'unreviewed' };
}

export function renderOrdinalMetricProfile(scores = {}, metricAssessments = {}, metrics = [], dimensions = []) {
    const confirmedStatuses = new Set(['assessed', 'inherited-confirmed']);
    return `<div class="ordinal-profile" aria-label="Grouped ordinal metric profile">
      <p class="ordinal-profile-note">Each row is an independent ordinal judgment. Do not infer distance, area, or a combined result across rows.</p>
      ${dimensions.map(dimension => {
        const dimensionMetrics = metrics.filter(metric => metric.dimension === dimension.id);
        return `<section class="ordinal-dimension-group" style="--dimension-color:${escapeHtml(dimension.color)}" aria-labelledby="ordinal-${escapeHtml(dimension.id)}">
          <h4 id="ordinal-${escapeHtml(dimension.id)}">${escapeHtml(dimension.name)}</h4>
          ${dimensionMetrics.map(metric => {
            const assessment = metricAssessments?.[metric.id] || {};
            const presentation = judgmentPresentation(assessment);
            const activeScore = confirmedStatuses.has(assessment.status) && Number(assessment.score) === Number(scores?.[metric.id])
                ? clampScore(assessment.score)
                : null;
            const stateDescription = activeScore ? `${presentation.label} at anchor ${activeScore}` : presentation.label;
            return `<div class="ordinal-metric-row" role="group" aria-label="${escapeHtml(metric.id)} ${escapeHtml(metric.name)}: ${escapeHtml(stateDescription)}">
              <div class="ordinal-metric-heading">
                <span><strong>${escapeHtml(metric.id)}</strong> ${escapeHtml(metric.name)}</span>
                <span class="ordinal-state ${presentation.className}">${presentation.label}${activeScore ? ` · ${activeScore}` : ''}</span>
              </div>
              <ol class="ordinal-anchor-scale">
                ${[1, 2, 3, 4, 5].map(score => `<li data-score="${score}" class="ordinal-anchor${activeScore === score ? ' selected' : ''}" title="${escapeHtml(anchorLabel(metric, score))}">
                  <span class="ordinal-anchor-number">${score}</span>
                  <span class="ordinal-anchor-marker" aria-hidden="true"></span>
                  <span class="ordinal-anchor-label">${escapeHtml(anchorLabel(metric, score))}</span>
                </li>`).join('')}
              </ol>
            </div>`;
          }).join('')}
        </section>`;
      }).join('')}
    </div>`;
}
