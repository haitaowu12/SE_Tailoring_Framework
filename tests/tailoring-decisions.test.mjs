import test from 'node:test';
import assert from 'node:assert/strict';
import { captureRecommendation, getRecommendation, prepareDecisions, decisionNeedsReview } from '../src/utils/tailoring-decisions.js';
import { runFullAssessment } from '../src/utils/assessment-engine.js';
import { buildExportConfig, normalizeImportedConfig, validateConfig } from '../src/utils/export-import.js';

function fixture() {
  const scores = Object.fromEntries(Array.from({length:16}, (_,i) => [`M${i+1}`,3]));
  const metricAssessments = Object.fromEntries(Object.entries(scores).map(([id,score]) => [id,{score,status:'assessed',definitionVersion:3,qualifiers:[],rationale:'Assessed fixture',evidenceRefs:[]}]));
  const result = runFullAssessment(scores, undefined, {metricAssessments});
  const node = {id:'default',name:'Decision project',parentId:null,childIds:[],assessmentType:'full',status:'draft',scores,metricAssessments,assessmentResult:result,levels:result.levels,manualAdjustments:{}};
  const state = {projectInfo:{name:'Decision project'},scores,metricAssessments,assessmentTree:{rootId:'default',activeId:'default',nodes:{default:node}},normativeLevels:result.normativeLevels,levels:result.levels,derived:result.derived};
  captureRecommendation(node,result,{},'2026-10-09T21:00:00Z');
  return {node,state,result};
}

test('saving an adjustment preserves floor/closure recommendation and repeated saves are idempotent', () => {
  const {node,state} = fixture();
  const baseline = structuredClone(node.recommendationBaseline);
  const draft = {9:{level:'comprehensive',justification:'Additional planning interfaces',owner:'Delivery lead',evidenceRef:'PLAN-1',reviewDate:'2026-11-01'}};
  const first = prepareDecisions(node,state,draft,'2026-10-09T21:01:00Z');
  assert.deepEqual(first.errors,[]);
  assert.equal(first.levels[9],'comprehensive');
  assert.deepEqual(node.recommendationBaseline,baseline);
  node.decisionRecords=first.records; node.manualAdjustments=first.adjustments;
  const repeat=prepareDecisions(node,state,draft,'2026-10-09T21:02:00Z');
  assert.equal(repeat.changes.length,0);
  assert.equal(repeat.records[9].recordedAt,'2026-10-09T21:01:00Z');
  const reset=prepareDecisions(node,state,{9:{level:baseline.levels[9],justification:'Revert after review'}});
  assert.equal(reset.adjustments[9],undefined);
  assert.equal(reset.changes[0].previousLevel,'comprehensive');
});

test('a changed recommendation retains prior snapshots and flags existing decisions for review', () => {
  const {node,state,result}=fixture();
  const old=prepareDecisions(node,state,{9:{level:'comprehensive',justification:'Original reason'}}).records[9];
  assert.equal(decisionNeedsReview(old,getRecommendation(node,state)),false);
  captureRecommendation(node,result);
  assert.equal(node.recommendationHistory.length,1,'unchanged recomputation is not another baseline');
  node.scores.M1=4;
  captureRecommendation(node,runFullAssessment(node.scores,undefined,{metricAssessments:node.metricAssessments}));
  assert.equal(node.recommendationHistory.length,2);
  assert.equal(decisionNeedsReview(old,getRecommendation(node,state)),true);
  assert.equal(old.justification,'Original reason');
});

test('rationale is required for deviations and active minimum floors cannot be bypassed', () => {
  const {node,state}=fixture();
  assert.match(prepareDecisions(node,state,{9:{level:'comprehensive',justification:''}}).errors.join(' '),/record why/);
  node.scores.M5=5;
  const result=runFullAssessment(node.scores,undefined,{metricAssessments:node.metricAssessments});
  captureRecommendation(node,result);
  const floor=result.activeFloors[0];
  assert.ok(floor);
  const proposal=prepareDecisions(node,state,{[floor.processId]:{level:'basic',justification:'A reason does not remove the safety floor'}});
  assert.match(proposal.errors.join(' '),/minimum is protected/);
});

test('private backup round-trips decisions, drafts and recommendation history while reduced sharing omits them', () => {
  const {node,state}=fixture();
  const result=prepareDecisions(node,state,{9:{level:'comprehensive',justification:'Private detailed rationale',owner:'Project owner',evidenceRef:'private://evidence'}});
  node.decisionRecords=result.records; node.decisionHistory=result.changes; node.manualAdjustments=result.adjustments;
  node.decisionDrafts={10:{level:'standard',justification:'Unfinished private thought'}};
  state.manualAdjustments=result.adjustments;
  const full=buildExportConfig(state,{mode:'identified'});
  const validation=validateConfig(full);
  assert.deepEqual(validation.errors,[]);
  const restored=normalizeImportedConfig(full);
  assert.deepEqual(restored.assessmentTree.nodes.default.decisionHistory,node.decisionHistory);
  assert.deepEqual(restored.assessmentTree.nodes.default.decisionDrafts,node.decisionDrafts);
  assert.deepEqual(restored.assessmentTree.nodes.default.recommendationHistory,node.recommendationHistory);
  const minimum=JSON.stringify(buildExportConfig(state,{mode:'minimum-data'}));
  for(const text of ['Private detailed rationale','Project owner','private://evidence','Unfinished private thought','decisionHistory','recommendationHistory']) assert.equal(minimum.includes(text),false,text);
});

test('invalid decision field shapes are rejected during import', () => {
  const {state}=fixture();
  const full=buildExportConfig(state,{mode:'identified'});
  full.assessmentTree.nodes.default.decisionHistory={bad:true};
  assert.match(validateConfig(full).errors.join(' '),/decisionHistory must be an array/);
});

test('actual blank app state and unfinished CSI drafts round-trip through private backup', async () => {
  const { createBlankAssessment } = await import('../src/state.js');
  const blank=createBlankAssessment();
  assert.deepEqual(validateConfig(buildExportConfig(blank,{mode:'identified'})).errors,[]);
  blank.csiResponse={responseType:'feasibility-review',rationaleDecision:'Unfinished response',reviewDate:''};
  const backup=buildExportConfig(blank,{mode:'identified'});
  assert.deepEqual(validateConfig(backup).errors,[]);
  const restored=normalizeImportedConfig(backup);
  assert.equal(restored.csiResponse.rationaleDecision,'Unfinished response');
  assert.equal(restored.assessmentComplete,false);
});

test('child decisions honor inherited safety floors and saved floor provenance', () => {
  const {node:root,state}=fixture();
  root.scores.M5=5;
  const child=structuredClone(root); child.id='child';child.parentId='default';child.scores.M5=1;
  const result=runFullAssessment({...child.scores,M5:5},undefined,{metricAssessments:child.metricAssessments});
  child.assessmentResult=result;child.levels=result.levels;
  captureRecommendation(child,result, {effectiveScores:{...child.scores,M5:5}});
  state.assessmentTree.nodes.child=child;
  for(const processId of [12,16,19,20,25,27]) {
    const proposal=prepareDecisions(child,state,{[processId]:{level:'basic',justification:'Cannot bypass inherited safety'}});
    assert.match(proposal.errors.join(' '),/minimum is protected/,String(processId));
  }
});

test('malformed history entries are rejected instead of reaching the ledger renderer', () => {
  const {state}=fixture();
  const config=buildExportConfig(state,{mode:'identified'});
  config.assessmentTree.nodes.default.decisionHistory=[null];
  assert.match(validateConfig(config).errors.join(' '),/decisionHistory\[0\] must be an object/);
});

test('recalculation quarantines outdated reductions instead of applying them below new safety floors', async () => {
  const {reconcileManualChoices}=await import('../src/utils/tailoring-decisions.js');
  const {node,state}=fixture();
  const choice=prepareDecisions(node,state,{20:{level:'basic',justification:'Previous bounded context'}});
  assert.deepEqual(choice.errors,[]);
  node.decisionRecords=choice.records;node.manualAdjustments=choice.adjustments;node.decisionHistory=choice.changes;
  node.scores.M5=5;node.metricAssessments.M5.score=5;
  const result=runFullAssessment(node.scores,undefined,{metricAssessments:node.metricAssessments});
  const review=reconcileManualChoices(node,state,result,{},node.manualAdjustments,true);
  assert.equal(review.suspended,true);
  assert.deepEqual(review.adjustments,{});
  assert.equal(node.recommendationBaseline.levels[20],'comprehensive');
  assert.equal(node.decisionDrafts[20].justification,'Previous bounded context');
  assert.equal(node.decisionHistory[0].justification,'Previous bounded context');
  assert.equal(node.suspendedAdjustments.length,1);
  assert.equal(node.decisionRecords[20].level,'basic','historical choice remains reviewable, not applied');
});

test('unchanged report recalculation preserves local decisions and their recommendation identity', async () => {
  const {reconcileManualChoices}=await import('../src/utils/tailoring-decisions.js');
  const {node,state,result}=fixture();
  const saved=prepareDecisions(node,state,{9:{level:'comprehensive',justification:'More planning coordination'}});
  node.decisionRecords=saved.records;node.manualAdjustments=saved.adjustments;
  const baselineId=node.recommendationBaseline.id;
  const review=reconcileManualChoices(node,state,result,{},node.manualAdjustments,true);
  assert.equal(review.suspended,false);
  assert.equal(review.adjustments[9].level,'comprehensive');
  assert.equal(node.recommendationBaseline.id,baselineId);
});

test('private backup preflight rejects unsupported history size without truncating the record', async () => {
  const {serializeExportConfig,PRIVATE_BACKUP_LIMITS}=await import('../src/utils/export-import.js');
  const {node,state}=fixture();
  const entry=prepareDecisions(node,state,{9:{level:'comprehensive',justification:'Keep this decision'}}).changes[0];
  node.decisionHistory=Array.from({length:PRIVATE_BACKUP_LIMITS.maxCollectionLength+1},()=>({...entry}));
  const before=JSON.stringify(state);
  assert.throws(()=>serializeExportConfig(state,{mode:'identified'}),/Export cannot be restored/);
  assert.equal(JSON.stringify(state),before);
});

test('private recovery envelope preserves a history larger than sharing-file collection limits', async () => {
  const {serializeExportConfig,IMPORT_LIMITS}=await import('../src/utils/export-import.js');
  const {node,state}=fixture();
  const entry=prepareDecisions(node,state,{9:{level:'comprehensive',justification:'Keep every prior reason'}}).changes[0];
  node.decisionHistory=Array.from({length:IMPORT_LIMITS.maxCollectionLength+1},(_,i)=>({...entry,recordedAt:`historical-${i}`}));
  const {config,text}=serializeExportConfig(state,{mode:'identified'});
  assert.equal(JSON.parse(text).assessmentTree.nodes.default.decisionHistory.length,1001);
  assert.deepEqual(validateConfig(config).errors,[]);
  assert.equal(normalizeImportedConfig(config).assessmentTree.nodes.default.decisionHistory.length,1001);
});

test('malformed recommendation snapshots are rejected at the import boundary', () => {
  for (const snapshot of [{},{levels:{9:'basic'},activeFloors:{}},{levels:{9:'basic'},activeFloors:[null]}]) {
    const {state}=fixture();
    const config=buildExportConfig(state,{mode:'identified'});
    config.assessmentTree.nodes.default.recommendationBaseline=snapshot;
    assert.equal(validateConfig(config).valid,false);
  }
});

test('private backup preserves long CSI and incomplete asserted reduction drafts without granting approval', async () => {
  const {createBlankAssessment}=await import('../src/state.js');
  const {serializeExportConfig}=await import('../src/utils/export-import.js');
  const {validateRightSizingApprovalRecords}=await import('../src/utils/right-sizing-governance.js');
  const state=createBlankAssessment();
  state.csiResponse={responseType:'feasibility-review',rationaleDecision:'x'.repeat(4001),reviewDate:''};
  state.rightSizingApprovalRecords=[{decision:'approved',processId:17,from:'comprehensive',to:'standard',rationale:'Draft only',approvals:{assessmentLead:{identity:'',authorityBasis:''}}}];
  state.assessmentTree.nodes.default.rightSizingApprovalRecords=structuredClone(state.rightSizingApprovalRecords);
  state.assessmentTree.nodes.default.csiResponse=structuredClone(state.csiResponse);
  const {config}=serializeExportConfig(state,{mode:'identified'});
  const restored=normalizeImportedConfig(config);
  assert.equal(restored.csiResponse.rationaleDecision.length,4001);
  assert.equal(restored.rightSizingApprovalRecords[0].rationale,'Draft only');
  assert.ok(validateRightSizingApprovalRecords(restored.rightSizingApprovalRecords).length>0,'authority checks remain strict');
  assert.equal(restored.effectiveRightSizingApprovalCount,0);
  assert.equal(restored.assessmentComplete,false);
});
