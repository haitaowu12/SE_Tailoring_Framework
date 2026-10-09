import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBaselineEligibility } from '../src/utils/assessment-integrity.js';
import { checkConsistency } from '../src/utils/assessment-engine.js';
import { createRightSizingApprovalSnapshot } from '../src/utils/right-sizing-governance.js';

function fixture() {
  const scores=Object.fromEntries(Array.from({length:16},(_,i)=>[`M${i+1}`,1]));
  const metricAssessments=Object.fromEntries(Object.entries(scores).map(([id,score])=>[id,{score,status:'assessed',definitionVersion:3,qualifiers:[]} ]));
  const levels=Object.fromEntries(Array.from({length:22},(_,i)=>[i+9,'basic']));
  return {scores,metricAssessments,levels};
}

test('software completeness fails closed on current hard violations even when warning dispositions are complete', () => {
  const state=fixture();state.levels[19]='comprehensive';
  state.violations=checkConsistency(state.levels,state.scores,{metricAssessments:state.metricAssessments});
  assert.ok(state.violations.some(item=>item.type==='HC'));
  const eligibility=evaluateBaselineEligibility(state);
  assert.equal(eligibility.softwareChecksPassed,false);
  assert.equal(eligibility.hardConstraints.complete,false);
  // Missing cached violations cannot hide the same contradiction in the level map.
  assert.equal(evaluateBaselineEligibility({...state,violations:[]}).softwareChecksPassed,false);
});

test('a claimed complete profile cannot stay below a mandatory floor', () => {
  const state=fixture();state.scores.M5=5;state.metricAssessments.M5.score=5;
  assert.equal(evaluateBaselineEligibility(state).hardConstraints.complete,false);
});

test('right-sizing snapshots bind the actual security and assurance hierarchy disposition fields', () => {
  const proposal={processId:25,from:'comprehensive',proposedTo:'standard',scopeElementIds:['child'],protectedMetricIds:['M8','M15']};
  const context={scores:{M8:5,M15:5},assessmentTree:{rootId:'root',activeId:'child',nodes:{root:{id:'root',parentId:null},child:{id:'child',parentId:'root',securityHierarchyDisposition:{status:'confirmed',rationale:'Scoped security'},assuranceHierarchyDisposition:{status:'confirmed',rationale:'Scoped assurance'}}}}};
  const original=createRightSizingApprovalSnapshot(proposal,context);
  context.assessmentTree.nodes.child.securityHierarchyDisposition.status='draft';
  assert.notEqual(createRightSizingApprovalSnapshot(proposal,context),original);
  context.assessmentTree.nodes.child.securityHierarchyDisposition.status='confirmed';
  context.assessmentTree.nodes.child.assuranceHierarchyDisposition.rationale='Changed assurance boundary';
  assert.notEqual(createRightSizingApprovalSnapshot(proposal,context),original);
});


test('reference thresholds include Secondary Standard drivers and use the canonical Comprehensive statement', async () => {
  const {METRIC_PROCESS_MAP, LEVEL_THRESHOLDS, COMPREHENSIVE_POLICY, DEPENDENCY_CHAINS}=await import('../src/data/metrics.js');
  for (const [processId, mappings] of Object.entries(METRIC_PROCESS_MAP)) {
    for (const metricId of Object.keys(mappings)) assert.ok(LEVEL_THRESHOLDS[processId].standard.includes(`${metricId}≥3`));
    assert.equal(LEVEL_THRESHOLDS[processId].comprehensive,COMPREHENSIVE_POLICY.statement);
  }
  assert.match(DEPENDENCY_CHAINS.find(chain=>chain.id==='vv_loop').description,/does not require equal tailoring levels/);
});

test('new hard-constraint gate accepts floor/closure-correct profiles across deterministic varied scores', async () => {
  const {runFullAssessment}=await import('../src/utils/assessment-engine.js');
  let random=173;
  for(let sample=0;sample<128;sample++) {
    const scores=Object.fromEntries(Array.from({length:16},(_,i)=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return [`M${i+1}`,1+random%5];}));
    const result=runFullAssessment(scores);
    assert.equal(evaluateBaselineEligibility({...result,scores}).hardConstraints.complete,true,`sample ${sample}`);
  }
});

test('sole critical consequence is attributed separately from multi-input corroboration without changing levels', async () => {
  const { calculateProcessDerivation, runFullAssessment } = await import('../src/utils/assessment-engine.js');
  const { buildExportConfig, validateConfig, normalizeImportedConfig } = await import('../src/utils/export-import.js');
  for (const [metric,processId] of [['M7',30],['M5',18]]) {
    const state=fixture(); state.scores[metric]=5; state.metricAssessments[metric].score=5;
    const detail=calculateProcessDerivation(processId,state.scores);
    assert.equal(detail.level,'comprehensive');
    assert.equal(detail.confidence,'direct-consequence');
    const result=runFullAssessment(state.scores,undefined,{metricAssessments:state.metricAssessments});
    assert.equal(result.levels[processId],'comprehensive');
    assert.equal(result.confidence[processId],'direct-consequence');
    const config=buildExportConfig({...state,...result},{mode:'identified'});
    assert.deepEqual(validateConfig(config).errors,[]);
    assert.equal(normalizeImportedConfig(config).confidence[processId],'direct-consequence');
  }
  const corroborated=fixture(); corroborated.scores.M1=5;corroborated.scores.M2=5;
  assert.equal(calculateProcessDerivation(23,corroborated.scores).confidence,'corroborated');
});
