import test from 'node:test';
import assert from 'node:assert/strict';

import { DIMENSIONS, METRICS } from '../src/data/se-tailoring-data.js';
import {
    buildDimensionProfiles,
    renderDimensionPatternCards,
    renderMetricSpiderwebSvg
} from '../src/utils/report-visuals.js';

test('buildDimensionProfiles groups all 16 metrics into 4 dimensions', () => {
    const scores = Object.fromEntries(METRICS.map((metric, index) => [metric.id, (index % 5) + 1]));
    const profiles = buildDimensionProfiles(scores, METRICS, DIMENSIONS);

    assert.equal(profiles.length, 4);
    assert.equal(profiles.flatMap(profile => profile.metrics).length, 16);
    assert.deepEqual(profiles.map(profile => profile.metrics.length), [4, 4, 4, 4]);
});

test('buildDimensionProfiles defaults missing metric scores to standard pressure', () => {
    const profiles = buildDimensionProfiles({}, METRICS, DIMENSIONS);
    const allScores = profiles.flatMap(profile => profile.metrics.map(metric => metric.score));

    assert.equal(allScores.length, 16);
    assert.ok(allScores.every(score => score === 3));
});

test('renderMetricSpiderwebSvg includes metric ids, dimension labels, and scale context', () => {
    const svg = renderMetricSpiderwebSvg({}, METRICS, DIMENSIONS);

    assert.match(svg, /spiderweb-chart/);
    assert.match(svg, /M1/);
    assert.match(svg, /M16/);
    assert.match(svg, /System complexity/);
    assert.match(svg, /Stakeholder context/);
    assert.doesNotMatch(svg, /Scores remain ordinal and project-local/);
});

test('renderMetricSpiderwebSvg places dimension labels inside their quadrants', () => {
    const svg = renderMetricSpiderwebSvg({}, METRICS, DIMENSIONS);
    const labels = [...svg.matchAll(/x="([\d.]+)" y="([\d.]+)" text-anchor="[^"]+">([^<]+)<\/text>/g)]
        .map(([, x, y, label]) => ({ x: Number(x), y: Number(y), label: label.replaceAll('&amp;', '&') }))
        .filter(({ label }) => ['System complexity', 'Safety & criticality', 'Project constraints', 'Stakeholder context'].includes(label));

    assert.deepEqual(labels, [
        { x: 70, y: 58, label: 'System complexity' },
        { x: 430, y: 58, label: 'Safety & criticality' },
        { x: 430, y: 458, label: 'Project constraints' },
        { x: 70, y: 458, label: 'Stakeholder context' }
    ]);
});

test('renderDimensionPatternCards summarizes high and low drivers', () => {
    const cards = renderDimensionPatternCards({ M1: 5, M2: 1, M3: 3, M4: 4 }, METRICS, DIMENSIONS);

    assert.match(cards, /High: M1, M4/);
    assert.match(cards, /Low: M2/);
    assert.match(cards, /Score range/);
});
