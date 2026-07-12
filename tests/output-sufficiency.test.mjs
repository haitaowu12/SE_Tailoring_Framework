import test from 'node:test';
import assert from 'node:assert/strict';

import { METRICS, METRIC_PROCESS_MAP } from '../src/data/metrics.js';
import { RELATIONSHIP_STUDIES, createRequirementsArchitectureHandoff } from '../src/data/artifact-relationships.js';
import { assessArtifactHandoff, assessOutputSufficiency, validateArtifactHandoffs } from '../src/utils/output-sufficiency.js';

const futureDate = () => {
    const date = new Date();
    date.setUTCFullYear(date.getUTCFullYear() + 1);
    return date.toISOString().slice(0, 10);
};

function completeRecord(status = 'accepted') {
    return {
        ...createRequirementsArchitectureHandoff('default'),
        requiredContent: 'Baselined system requirements, constraints, interfaces, assumptions, and traceability.',
        acceptanceCriteria: 'Complete, consistent, feasible, traceable, and approved for architecture use.',
        evidenceStatus: status,
        evidenceRefs: 'REQ-BL-004; RVW-ARCH-002',
        gaps: status === 'governed-review' ? 'Two supplier interface values remain provisional.' : '',
        equivalentEvidence: status === 'governed-review' ? 'Bounded interface assumptions plus integration hold point.' : '',
        acceptanceAuthority: 'Chief Engineer',
        reviewDate: futureDate()
    };
}

test('incomplete Requirements-to-Architecture handoff blocks baseline without changing levels', () => {
    const result = assessOutputSufficiency([createRequirementsArchitectureHandoff('default')], ['default']);
    assert.equal(result.complete, false);
    assert.equal(result.baselineBlocked, true);
    assert.equal(result.processLevelEffect, 'none');
    assert.ok(result.results[0].missingFields.includes('requiredContent'));
});

test('accepted handoff satisfies the artifact acceptance gate', () => {
    const result = assessArtifactHandoff(completeRecord('accepted'));
    assert.equal(result.complete, true);
    assert.equal(result.disposition, 'accepted');
    assert.equal(result.processLevelEffect, 'none');
});

test('complete, time-bounded governed review satisfies the gate while retaining gaps', () => {
    const result = assessArtifactHandoff(completeRecord('governed-review'));
    assert.equal(result.complete, true);
    assert.equal(result.disposition, 'governed-review');
});

test('governed review without equivalent evidence remains blocked', () => {
    const record = completeRecord('governed-review');
    record.equivalentEvidence = '';
    const result = assessArtifactHandoff(record);
    assert.equal(result.baselineBlocked, true);
    assert.ok(result.missingFields.includes('equivalent evidence / compensating controls'));
});

test('expired acceptance or review date blocks baseline', () => {
    const record = completeRecord('accepted');
    record.reviewDate = '2020-01-01';
    assert.equal(assessArtifactHandoff(record).baselineBlocked, true);
});

test('omitted artifact handoffs fail closed as an explicit compatibility migration', () => {
    const result = assessOutputSufficiency(undefined, ['default']);
    assert.equal(result.complete, false);
    assert.equal(result.baselineBlocked, true);
    assert.equal(result.compatibilityOmission, true);
    assert.equal(result.requiredCount, 1);
    assert.ok(result.results[0].missingFields.includes('requiredContent'));
});

test('impossible calendar dates cannot satisfy or validate a handoff', () => {
    for (const reviewDate of ['2027-02-30', '2026-99-99']) {
        const record = { ...completeRecord('accepted'), reviewDate };
        const assessed = assessArtifactHandoff(record);
        assert.equal(assessed.complete, false, reviewDate);
        assert.ok(assessed.missingFields.includes('current review date'));
        assert.ok(validateArtifactHandoffs([record]).some(error => error.includes('real ISO calendar date')));
    }
});

test('relationship studies remain artifact/evidence relationships, never hard floors', () => {
    assert.deepEqual(RELATIONSHIP_STUDIES.map(item => item.classification), ['artifact-prerequisite', 'evidence-handoff']);
    assert.ok(RELATIONSHIP_STUDIES.every(item => !item.normativeEffect.toLowerCase().includes('elevate')));
});

test('handoff schema rejects endpoint drift and malformed typed IDs', () => {
    const invalid = { ...completeRecord(), artifactId: 'REQ-1', consumerProcessId: 21 };
    const errors = validateArtifactHandoffs([invalid]);
    assert.ok(errors.some(error => error.includes('invalid typed artifactId')));
    assert.ok(errors.some(error => error.includes('process endpoints')));
});

test('pilot preserves the 16-metric and 102-cell assessment contracts', () => {
    assert.equal(METRICS.length, 16);
    const populatedCells = Object.values(METRIC_PROCESS_MAP)
        .flatMap(metricMap => Object.values(metricMap))
        .filter(Boolean).length;
    assert.equal(populatedCells, 102);
});
