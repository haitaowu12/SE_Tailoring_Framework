import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCsiResponse, CSI_RESPONSE_ACTIONS } from '../src/utils/csi-response.js';

test('normalizeCsiResponse returns empty object for falsy or invalid inputs', () => {
    assert.deepEqual(normalizeCsiResponse(null), {});
    assert.deepEqual(normalizeCsiResponse(undefined), {});
    assert.deepEqual(normalizeCsiResponse(false), {});
    assert.deepEqual(normalizeCsiResponse(0), {});
    assert.deepEqual(normalizeCsiResponse(''), {});
    assert.deepEqual(normalizeCsiResponse('string'), {});
    assert.deepEqual(normalizeCsiResponse(123), {});
    assert.deepEqual(normalizeCsiResponse([]), {});
    assert.deepEqual(normalizeCsiResponse([1, 2, 3]), {});
});

test('normalizeCsiResponse extracts known responseTypes', () => {
    const validEscalation = normalizeCsiResponse({ responseType: 'sponsor-escalation' });
    assert.equal(validEscalation.responseType, 'sponsor-escalation');

    const validFeasibility = normalizeCsiResponse({ responseType: 'feasibility-review' });
    assert.equal(validFeasibility.responseType, 'feasibility-review');

    const invalidType = normalizeCsiResponse({ responseType: 'other-type' });
    assert.equal(invalidType.responseType, '');

    const noType = normalizeCsiResponse({});
    assert.equal(noType.responseType, '');
});

test('normalizeCsiResponse filters and deduplicates selectedActions', () => {
    const validActions = CSI_RESPONSE_ACTIONS.map(a => a.id);
    const validResponse = normalizeCsiResponse({ selectedActions: validActions });
    assert.deepEqual(validResponse.selectedActions, validActions);

    const duplicateActions = normalizeCsiResponse({ selectedActions: ['add-capacity', 'add-capacity', 'extend-schedule'] });
    assert.deepEqual(duplicateActions.selectedActions, ['add-capacity', 'extend-schedule']);

    const mixedActions = normalizeCsiResponse({ selectedActions: ['add-capacity', 'invalid-action', 'extend-schedule'] });
    assert.deepEqual(mixedActions.selectedActions, ['add-capacity', 'extend-schedule']);

    const invalidOnly = normalizeCsiResponse({ selectedActions: ['invalid-action'] });
    assert.deepEqual(invalidOnly.selectedActions, []);

    const noActions = normalizeCsiResponse({});
    assert.deepEqual(noActions.selectedActions, []);

    const notAnArray = normalizeCsiResponse({ selectedActions: 'add-capacity' });
    assert.deepEqual(notAnArray.selectedActions, []);
});

test('normalizeCsiResponse extracts text fields properly and defaults to empty string', () => {
    const fullResponse = {
        protectedOutputs: 'Outputs A',
        rationaleDecision: 'Decision B',
        ownerApprover: 'Owner C',
        evidenceRef: 'Ref D',
        reviewDate: '2023-01-01'
    };
    const normalized = normalizeCsiResponse(fullResponse);
    assert.equal(normalized.protectedOutputs, 'Outputs A');
    assert.equal(normalized.rationaleDecision, 'Decision B');
    assert.equal(normalized.ownerApprover, 'Owner C');
    assert.equal(normalized.evidenceRef, 'Ref D');
    assert.equal(normalized.reviewDate, '2023-01-01');

    const emptyResponse = normalizeCsiResponse({});
    assert.equal(emptyResponse.protectedOutputs, '');
    assert.equal(emptyResponse.rationaleDecision, '');
    assert.equal(emptyResponse.ownerApprover, '');
    assert.equal(emptyResponse.evidenceRef, '');
    assert.equal(emptyResponse.reviewDate, '');

    const invalidTypes = normalizeCsiResponse({
        protectedOutputs: 123,
        rationaleDecision: null,
        ownerApprover: {},
        evidenceRef: [],
        reviewDate: false
    });
    assert.equal(invalidTypes.protectedOutputs, '');
    assert.equal(invalidTypes.rationaleDecision, '');
    assert.equal(invalidTypes.ownerApprover, '');
    assert.equal(invalidTypes.evidenceRef, '');
    assert.equal(invalidTypes.reviewDate, '');
});

test('normalizeCsiResponse parses a complete valid response correctly', () => {
    const input = {
        responseType: 'feasibility-review',
        selectedActions: ['extend-schedule', 'reduce-scope'],
        protectedOutputs: 'These outputs are protected.',
        rationaleDecision: 'Decided based on schedule pressure.',
        ownerApprover: 'John Doe',
        evidenceRef: 'JIRA-1234',
        reviewDate: '2023-10-15'
    };
    const expected = {
        responseType: 'feasibility-review',
        selectedActions: ['extend-schedule', 'reduce-scope'],
        protectedOutputs: 'These outputs are protected.',
        rationaleDecision: 'Decided based on schedule pressure.',
        ownerApprover: 'John Doe',
        evidenceRef: 'JIRA-1234',
        reviewDate: '2023-10-15'
    };

    assert.deepEqual(normalizeCsiResponse(input), expected);
});
