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

function polarToCartesian(cx, cy, radius, angleDegrees) {
    const angleRadians = (angleDegrees - 90) * Math.PI / 180;
    return {
        x: cx + radius * Math.cos(angleRadians),
        y: cy + radius * Math.sin(angleRadians)
    };
}

const DIMENSION_QUADRANTS = [
    { centerAngle: 315, metricAngles: [288, 306, 324, 342], label: { x: 125, y: 38, anchor: 'middle', position: 'top' } },
    { centerAngle: 45, metricAngles: [18, 36, 54, 72], label: { x: 375, y: 38, anchor: 'middle', position: 'top' } },
    { centerAngle: 135, metricAngles: [108, 126, 144, 162], label: { x: 375, y: 466, anchor: 'middle', position: 'bottom' } },
    { centerAngle: 225, metricAngles: [198, 216, 234, 252], label: { x: 125, y: 466, anchor: 'middle', position: 'bottom' } }
];

function wrapLabelWords(value, maxLength = 25) {
    const words = String(value || '').split(/\s+/).filter(Boolean);
    const lines = [];
    for (const word of words) {
        const current = lines.at(-1);
        if (!current || `${current} ${word}`.length > maxLength) lines.push(word);
        else lines[lines.length - 1] = `${current} ${word}`;
    }
    return lines.slice(0, 2);
}

function metricPosition(metric, metricIndex, dimensionIndex, score, radius) {
    const quadrant = DIMENSION_QUADRANTS[dimensionIndex % DIMENSION_QUADRANTS.length];
    const angle = quadrant.metricAngles[metricIndex] ?? quadrant.centerAngle;
    const normalizedRadius = radius * (clampScore(score) / 5);
    return {
        angle,
        point: polarToCartesian(250, 250, normalizedRadius, angle),
        axisEnd: polarToCartesian(250, 250, radius, angle),
        label: polarToCartesian(250, 250, radius + 24, angle),
        metric
    };
}

export function buildDimensionProfiles(scores = {}, metrics = [], dimensions = []) {
    return dimensions.map(dimension => {
        const dimensionMetrics = metrics.filter(metric => metric.dimension === dimension.id);
        const values = dimensionMetrics.map(metric => ({
            ...metric,
            color: dimension.color,
            score: clampScore(scores[metric.id])
        }));
        return {
            ...dimension,
            metrics: values
        };
    });
}

export function renderMetricSpiderwebSvg(scores = {}, metrics = [], dimensions = [], options = {}) {
    const radius = 150;
    const profiles = buildDimensionProfiles(scores, metrics, dimensions);
    const metricAssessments = options.metricAssessments || {};
    const confirmedStatuses = new Set(['assessed', 'inherited-confirmed']);
    const allPositions = [];

    profiles.forEach((profile, dimensionIndex) => {
        profile.metrics.forEach((metric, metricIndex) => {
            allPositions.push(metricPosition(metric, metricIndex, dimensionIndex, metric.score, radius));
        });
    });

    const polygonPoints = allPositions.map(position => `${position.point.x.toFixed(1)},${position.point.y.toFixed(1)}`).join(' ');
    const rings = [1, 2, 3, 4, 5].map(score => {
        const points = [];
        profiles.forEach((profile, dimensionIndex) => {
            profile.metrics.forEach((metric, metricIndex) => {
                const position = metricPosition(metric, metricIndex, dimensionIndex, score, radius);
                points.push(`${position.point.x.toFixed(1)},${position.point.y.toFixed(1)}`);
            });
        });
        const className = score === 3 ? 'spiderweb-ring spiderweb-ring-mid' : 'spiderweb-ring';
        return `<polygon class="${className}" points="${points.join(' ')}"></polygon>`;
    }).join('');

    const quadrantLabels = profiles.map((profile, index) => {
        const quadrant = DIMENSION_QUADRANTS[index % DIMENSION_QUADRANTS.length];
        const lines = wrapLabelWords(profile.name);
        const firstY = lines.length > 1 && quadrant.label.position === 'bottom'
            ? quadrant.label.y - 8
            : quadrant.label.y;
        return `<text class="spiderweb-dimension-label" x="${quadrant.label.x}" y="${firstY}" text-anchor="${quadrant.label.anchor}">${lines.map((line, lineIndex) =>
            `<tspan x="${quadrant.label.x}" dy="${lineIndex === 0 ? 0 : 15}">${escapeHtml(line)}</tspan>`
        ).join('')}</text>`;
    }).join('');

    const axes = allPositions.map(position =>
        `<line class="spiderweb-axis" x1="250" y1="250" x2="${position.axisEnd.x.toFixed(1)}" y2="${position.axisEnd.y.toFixed(1)}"></line>`
    ).join('');

    const points = allPositions.map(position => {
        const anchor = position.label.x < 210 ? 'end' : position.label.x > 290 ? 'start' : 'middle';
        const score = clampScore(scores[position.metric.id]);
        const assessment = metricAssessments[position.metric.id] || {};
        const confirmed = confirmedStatuses.has(assessment.status);
        const stateLabel = confirmed ? 'confirmed' : assessment.status === 'unknown' ? 'unknown preview' : 'unreviewed preview';
        return `
          <g class="spiderweb-metric ${confirmed ? 'confirmed' : 'preview'}" style="--metric-color:${position.metric.color || '#8b5cf6'}">
            <circle class="spiderweb-point" cx="${position.point.x.toFixed(1)}" cy="${position.point.y.toFixed(1)}" r="5">
              <title>${escapeHtml(position.metric.id)} ${escapeHtml(position.metric.name)}: ${score}, ${stateLabel}</title>
            </circle>
            <text class="spiderweb-metric-label" x="${position.label.x.toFixed(1)}" y="${position.label.y.toFixed(1)}" text-anchor="${anchor}">
              ${escapeHtml(position.metric.id)}
            </text>
          </g>
        `;
    }).join('');

    const scaleLabels = [1, 3, 5].map(score => {
        const y = 250 - (radius * score / 5);
        return `<text class="spiderweb-scale-label" x="258" y="${y.toFixed(1)}">${score}</text>`;
    }).join('');

    const title = options.title || 'Assessment shape';
    const description = options.description || 'Sixteen metric scores grouped into four assessment areas.';
    const idPrefix = String(options.idPrefix || 'metric-profile').replace(/[^a-zA-Z0-9_-]/g, '-');
    const titleId = `${idPrefix}-title`;
    const descriptionId = `${idPrefix}-description`;
    const confirmedCount = Object.values(metricAssessments).filter(assessment => confirmedStatuses.has(assessment?.status)).length;

    return `
      <figure class="spiderweb-figure" aria-labelledby="${titleId}" aria-describedby="${descriptionId}">
        <div class="spiderweb-copy">
          <h4 id="${titleId}">${escapeHtml(title)}</h4>
          <p id="${descriptionId}">${escapeHtml(description)}</p>
          <div class="spiderweb-legend" aria-label="Chart legend">
            <span><i class="confirmed"></i> Confirmed</span>
            <span><i class="preview"></i> Preview</span>
          </div>
        </div>
        <svg class="spiderweb-chart" viewBox="0 0 500 500" role="img" aria-label="${escapeHtml(description)}">
          <rect class="spiderweb-quadrant q1" x="250" y="0" width="250" height="250"></rect>
          <rect class="spiderweb-quadrant q2" x="250" y="250" width="250" height="250"></rect>
          <rect class="spiderweb-quadrant q3" x="0" y="250" width="250" height="250"></rect>
          <rect class="spiderweb-quadrant q4" x="0" y="0" width="250" height="250"></rect>
          <line class="spiderweb-quadrant-line" x1="250" y1="34" x2="250" y2="466"></line>
          <line class="spiderweb-quadrant-line" x1="34" y1="250" x2="466" y2="250"></line>
          ${rings}
          ${axes}
          <polygon class="spiderweb-profile" points="${polygonPoints}"></polygon>
          ${points}
          ${scaleLabels}
          ${quadrantLabels}
        </svg>
        <figcaption>${confirmedCount}/${metrics.length} scores confirmed. Use this chart to locate pressure areas; do not treat its shape or area as a combined score.</figcaption>
        <details class="spiderweb-data">
          <summary>View the metric score list</summary>
          <div class="spiderweb-data-table-wrap">
            <table class="spiderweb-data-table">
              <caption class="sr-only">Metric scores and assessment states</caption>
              <thead><tr><th scope="col">Metric</th><th scope="col">Score</th><th scope="col">State</th></tr></thead>
              <tbody>
                ${metrics.map(metric => {
                  const assessment = metricAssessments[metric.id] || {};
                  const score = clampScore(scores[metric.id]);
                  const state = confirmedStatuses.has(assessment.status)
                    ? 'Confirmed'
                    : assessment.status === 'unknown' ? 'Cannot assess yet' : 'Preview';
                  return `<tr><th scope="row">${escapeHtml(metric.id)} ${escapeHtml(metric.name)}</th><td>${score}</td><td>${state}</td></tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </details>
      </figure>
    `;
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
