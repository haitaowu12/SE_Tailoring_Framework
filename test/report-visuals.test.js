import test from 'node:test';
import assert from 'node:assert/strict';

import { DIMENSIONS, METRICS } from '../src/data/se-tailoring-data.js';
import { renderOrdinalMetricProfile } from '../src/utils/report-visuals.js';

test('renderOrdinalMetricProfile shows 16 metric rows, five anchors, and explicit judgment states', () => {
    const assessments = {
        M1: { status: 'assessed', score: 4 },
        M2: { status: 'unknown', score: null },
        M3: { status: 'inherited-confirmed', score: 2 }
    };
    const profile = renderOrdinalMetricProfile({ M1: 4, M2: 3, M3: 2 }, assessments, METRICS, DIMENSIONS);

    assert.equal((profile.match(/class="ordinal-metric-row"/g) || []).length, 16);
    assert.equal((profile.match(/class="ordinal-dimension-group"/g) || []).length, 4);
    assert.match(profile, /M1 Architectural Complexity/);
    assert.match(profile, /Confirmed/);
    assert.match(profile, /Unknown/);
    assert.match(profile, /Inherited/);
    assert.match(profile, /Unreviewed/);
    for (const score of [1, 2, 3, 4, 5]) assert.match(profile, new RegExp(`data-score="${score}"`));
    assert.match(profile, /Many heterogeneous or tightly coupled elements/);
    assert.doesNotMatch(profile, /spiderweb|polygon|average|composite score/i);
});
