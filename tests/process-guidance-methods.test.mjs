import test from 'node:test';
import assert from 'node:assert/strict';
import { PROCESS_DETAILS } from '../src/data/process-details.js';

const comprehensive = processId => ({
  activities: PROCESS_DETAILS[processId].activities.comprehensive,
  evidence: PROCESS_DETAILS[processId].deliverables.comprehensive
});

test('Comprehensive risk guidance requires a defensible model and inputs before distribution modeling or simulation', () => {
  const { activities, evidence } = comprehensive(12);
  assert(activities.some(item => /^\(\*\) Analyze risk uncertainty;/.test(item)
    && /distribution-based modeling or simulation only with a defensible model and inputs/.test(item)));
  assert(evidence.some(item => /Risk uncertainty analysis/.test(item)
    && /models or simulations where suitable/.test(item)));
});

test('Business or mission analysis retains its outcomes while qualifying PESTEL and ROI as suitable methods', () => {
  const { activities } = comprehensive(17);
  assert(activities.some(item => /^\(\*\) Analyze opportunities and external context;/.test(item)
    && /use PESTEL where suitable/.test(item)));
  assert(activities.some(item => /business or mission cases/.test(item)
    && /benefits, costs, and risks/.test(item) && /use ROI where suitable/.test(item)));
});

test('Requirements, architecture, and design modeling use suitable representations while retaining required formal methods', () => {
  const requirements = comprehensive(19);
  assert(requirements.activities.some(item => /^\(\*\) Model required behaviors/.test(item)
    && /representations suited to assurance and verification needs/.test(item)));
  assert(requirements.activities.some(item => /^\(\*\) Specify requirements unambiguously;/.test(item)
    && /formal models where suitable or required/.test(item)));
  assert(requirements.evidence.some(item => /requirements specification/.test(item)
    && /formal models where suitable or required/.test(item)));
  for (const [processId, subject, needs] of [
    [20, 'architectures', 'stakeholder concerns and assurance needs'],
    [21, 'designs', 'implementation and verification needs']
  ]) {
    const { activities, evidence } = comprehensive(processId);
    assert(activities.some(item => item.startsWith(`(*) Model ${subject} using notation suited to ${needs}`)));
    assert(evidence.some(item => /models using suitable notation/.test(item)
      && /formal notation where required/.test(item)));
  }
});

test('Transition and validation retain safety acceptance evidence and qualify regime-specific approval formats', () => {
  const transition = comprehensive(26);
  assert(transition.activities.some(item => /Obtain safety acceptance/.test(item)
    && /Safety Case approval required by the applicable regime \[Safety\]$/.test(item)));
  assert(transition.evidence.some(item => /Safety acceptance record/.test(item)
    && /approved Safety Case where required by the applicable regime \[Safety\]$/.test(item)));
  const validation = comprehensive(27);
  assert(validation.activities.includes('Obtain safety sign-off required by the applicable regime [Safety]'));
  assert(validation.evidence.some(item => /Safety acceptance evidence/.test(item)
    && /Safety Acceptance Certificate where required by the applicable regime\) \[Safety\]$/.test(item)));
});

test('Editorial qualifiers preserve Comprehensive core-outcome and evidence coverage', () => {
  for (const [processId, activityCount, coreCount, evidenceCount] of [
    [12, 7, 3, 6], [17, 5, 3, 4], [19, 8, 2, 9], [20, 8, 2, 10],
    [21, 8, 2, 9], [26, 10, 2, 10], [27, 11, 3, 11]
  ]) {
    const { activities, evidence } = comprehensive(processId);
    assert.equal(activities.length, activityCount, `P${processId} activity coverage`);
    assert.equal(activities.filter(item => item.startsWith('(*) ')).length, coreCount, `P${processId} core outcomes`);
    assert.equal(evidence.length, evidenceCount, `P${processId} evidence coverage`);
  }
});
