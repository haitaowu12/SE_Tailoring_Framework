import test from 'node:test';
import assert from 'node:assert/strict';
import { runFullAssessment } from '../src/utils/assessment-engine.js';
import { explainRecommendation } from '../src/utils/recommendation-explanation.js';
const scores = value => Object.fromEntries(Array.from({length:16},(_,i)=>[`M${i+1}`,value]));
test('explanation uses distinct recorded support rather than allowing a Primary to support itself', () => {
 const s={...scores(1),M1:5,M4:3}; const r=runFullAssessment(s);
 assert.equal(r.derivationDetails[9].confidence,'corroborated');
 const text=explainRecommendation(9,r); assert.match(text,/M1 \(Primary\) = 5/);assert.match(text,/M4 \(Primary\) = 3/);
 const thin=runFullAssessment({...scores(1),M1:5});
 assert.equal(thin.derived[9],'standard');assert.match(explainRecommendation(9,thin),/lacks the required distinct support/);
});
test('critical-consequence exception and actual floor provenance remain visible', () => {
 const r=runFullAssessment({...scores(1),M5:5});
 assert.match(explainRecommendation(12,r),/M5/);
 for(const floor of r.activeFloors) assert.ok(explainRecommendation(floor.processId,r).includes(floor.reason));
});
test('unconfirmed inputs are explained as preview rather than assessed evidence', () => {
 const r=runFullAssessment(scores(3),undefined,{metricAssessments:{}});
 assert.match(explainRecommendation(9,{...r,preview:true}),/^Preview\./);
});
