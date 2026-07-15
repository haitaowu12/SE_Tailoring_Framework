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
    { centerAngle: 315, metricAngles: [288, 306, 324, 342], label: { x: 70, y: 58, anchor: 'start' } },
    { centerAngle: 45, metricAngles: [18, 36, 54, 72], label: { x: 430, y: 58, anchor: 'end' } },
    { centerAngle: 135, metricAngles: [108, 126, 144, 162], label: { x: 430, y: 458, anchor: 'end' } },
    { centerAngle: 225, metricAngles: [198, 216, 234, 252], label: { x: 70, y: 458, anchor: 'start' } }
];

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
        const highDrivers = values.filter(metric => metric.score >= 4);
        const lowDrivers = values.filter(metric => metric.score <= 2);
        const range = values.length
            ? `${Math.min(...values.map(metric => metric.score))}-${Math.max(...values.map(metric => metric.score))}`
            : '—';

        return {
            ...dimension,
            metrics: values,
            highDrivers,
            lowDrivers,
            range
        };
    });
}

export function renderDimensionPatternCards(scores = {}, metrics = [], dimensions = []) {
    const profiles = buildDimensionProfiles(scores, metrics, dimensions);
    return profiles.map(profile => {
        const highText = profile.highDrivers.length
            ? profile.highDrivers.map(metric => metric.id).join(', ')
            : 'None';
        const lowText = profile.lowDrivers.length
            ? profile.lowDrivers.map(metric => metric.id).join(', ')
            : 'None';

        return `
          <div class="dimension-pattern-card" style="--dimension-color:${profile.color}">
            <div class="dimension-pattern-heading">
              <span class="dimension-color-mark"></span>
              <span>${escapeHtml(profile.name)}</span>
            </div>
            <div class="dimension-pattern-range">${profile.range}</div>
            <div class="dimension-pattern-meta">Score range</div>
            <div class="dimension-pattern-drivers">
              <span>High: ${escapeHtml(highText)}</span>
              <span>Low: ${escapeHtml(lowText)}</span>
            </div>
          </div>
        `;
    }).join('');
}

export function renderMetricSpiderwebSvg(scores = {}, metrics = [], dimensions = [], options = {}) {
    const radius = 150;
    const profiles = buildDimensionProfiles(scores, metrics, dimensions);
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

    const chartDimensionName = profile => ({
        complexity: 'System complexity',
        safety: 'Safety & criticality',
        constraints: 'Project constraints',
        stakeholder: 'Stakeholder context'
    }[profile.id] || profile.name);

    const quadrantLabels = profiles.map((profile, index) => {
        const quadrant = DIMENSION_QUADRANTS[index % DIMENSION_QUADRANTS.length];
        return `<text class="spiderweb-dimension-label" x="${quadrant.label.x}" y="${quadrant.label.y}" text-anchor="${quadrant.label.anchor}">${escapeHtml(chartDimensionName(profile))}</text>`;
    }).join('');

    const axes = allPositions.map(position => {
        return `<line class="spiderweb-axis" x1="250" y1="250" x2="${position.axisEnd.x.toFixed(1)}" y2="${position.axisEnd.y.toFixed(1)}"></line>`;
    }).join('');

    const points = allPositions.map(position => {
        const anchor = position.label.x < 210 ? 'end' : position.label.x > 290 ? 'start' : 'middle';
        const score = clampScore(scores[position.metric.id]);
        return `
          <g class="spiderweb-metric" style="--metric-color:${position.metric.color || '#8b5cf6'}">
            <circle class="spiderweb-point" cx="${position.point.x.toFixed(1)}" cy="${position.point.y.toFixed(1)}" r="5">
              <title>${escapeHtml(position.metric.id)} ${escapeHtml(position.metric.name)}: ${score}</title>
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

    const title = options.title || 'Metric spiderweb overview';
    const description = options.description || 'Sixteen metric scores grouped into four framework dimensions.';

    return `
      <figure class="spiderweb-figure" aria-labelledby="spiderweb-title" aria-describedby="spiderweb-desc">
        <div class="spiderweb-copy">
          <h4 id="spiderweb-title">${escapeHtml(title)}</h4>
          <p id="spiderweb-desc">${escapeHtml(description)}</p>
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
        <figcaption>Higher scores indicate more tailoring pressure. Metric IDs map to the detail table.</figcaption>
      </figure>
    `;
}
