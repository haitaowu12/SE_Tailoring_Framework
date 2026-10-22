import test from 'node:test';
import assert from 'node:assert/strict';
import { assessCsiResponse } from '../src/utils/csi-response.js';

const completeResponse = {
  responseType: 'feasibility-review',
  selectedActions: ['add-capacity'],
  protectedOutputs: 'Retain verification evidence.',
  rationaleDecision: 'Add capacity before proceeding.',
  ownerApprover: 'Delivery owner',
  evidenceRef: 'SYNTHETIC-REVIEW-4',
  reviewDate: '2028-02-29'
};
const allFields = ['responseType', 'selectedActions', 'protectedOutputs',
  'rationaleDecision', 'ownerApprover', 'evidenceRef', 'reviewDate'];

test('CSI 1–3 do not require a response; CSI 4 and 5 require all response fields', () => {
  for (const csi of [1, 2, 3]) {
    const result = assessCsiResponse({ M9: csi, M10: 1 });
    assert.equal(result.required, false);
    assert.equal(result.complete, true);
    assert.equal(result.expectedResponseType, null);
    assert.deepEqual(result.missingFields, []);
  }
  for (const [csi, expected] of [[4, 'feasibility-review'], [5, 'sponsor-escalation']]) {
    const result = assessCsiResponse({ M9: 1, M10: csi });
    assert.equal(result.csi, csi);
    assert.equal(result.required, true);
    assert.equal(result.complete, false);
    assert.equal(result.expectedResponseType, expected);
    assert.deepEqual(result.missingFields, allFields);
  }
});

test('null and non-object responses remain incomplete when a response is required', () => {
  for (const response of [null, [], 'invalid', 42, false]) {
    for (const csi of [4, 5]) {
      const result = assessCsiResponse({ M9: csi, M10: 1 }, response);
      assert.equal(result.complete, false);
      assert.deepEqual(result.missingFields, allFields);
    }
  }
});

test('each missing field independently blocks a governed response', () => {
  for (const field of allFields) {
    const response = structuredClone(completeResponse);
    response[field] = field === 'selectedActions' ? ['unknown-action'] : ' \t';
    const result = assessCsiResponse({ M9: 4, M10: 2 }, response);
    assert.equal(result.complete, false);
    assert.deepEqual(result.missingFields, [field]);
  }
});

test('CSI response dates require real calendar dates and the correct governance type', () => {
  for (const reviewDate of ['2027-02-29', '2028-02-30', '2028-13-01', '2028-2-29']) {
    const result = assessCsiResponse({ M9: 4 }, { ...completeResponse, reviewDate });
    assert.deepEqual(result.missingFields, ['reviewDate']);
  }
  assert.equal(assessCsiResponse({ M9: 4 }, completeResponse).complete, true);
  assert.deepEqual(assessCsiResponse({ M9: 5 }, completeResponse).missingFields, ['responseType']);
  assert.equal(assessCsiResponse({ M9: 5 }, {
    ...completeResponse, responseType: 'sponsor-escalation'
  }).complete, true);
});

test('action normalization preserves valid choices without mutating caller inputs', () => {
  const response = { ...completeResponse, selectedActions: ['add-capacity', 'invalid', 'add-capacity', 'reduce-scope'] };
  const scores = { M9: 4, M10: 2 };
  const before = structuredClone({ scores, response });
  const result = assessCsiResponse(scores, response);
  assert.equal(result.complete, true);
  assert.deepEqual(result.response.selectedActions, ['add-capacity', 'reduce-scope']);
  assert.deepEqual({ scores, response }, before);
});
