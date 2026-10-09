import test from 'node:test';
import assert from 'node:assert/strict';
import { runFullAssessment } from '../src/utils/assessment-engine.js';
import { resolveProtectedAncestry } from '../src/utils/inheritance-engine.js';
import { captureRecommendation, prepareDecisions, reconcileManualChoices, getDecisionEffectiveScores } from '../src/utils/tailoring-decisions.js';
import { assessHierarchyCompleteness, evaluateBaselineEligibility } from '../src/utils/assessment-integrity.js';
import { buildExportConfig, normalizeImportedConfig, validateConfig } from '../src/utils/export-import.js';

function fixture(metric) {
  const make=(id,parentId)=>{
    const scores=Object.fromEntries(Array.from({length:16},(_,i)=>[`M${i+1}`,1]));
    if(id==='root') scores[metric]=5;
    const metricAssessments=Object.fromEntries(Object.entries(scores).map(([m,score])=>[m,{score,status:'assessed',definitionVersion:3,qualifiers:[]}]));
    const result=runFullAssessment(scores,undefined,{metricAssessments});
    const ruleDispositions=Object.fromEntries(result.violations.filter(v=>v.type==='WN').map(v=>[v.ruleId,{outcome:String(v.ruleId)==='11'?'basic-evidence-justified':'accept-current',rationale:'Synthetic controls',ownerApprover:'Synthetic role',evidenceRef:'TEST',reviewDate:'2026-10-09'}]));
    return {id,name:id,parentId,childIds:[],scores,metricAssessments,assuranceObligations:[],assessmentType:'full',assessmentResult:result,levels:result.levels,manualAdjustments:{},ruleDispositions,status:'under_review'};
  };
  const root=make('root',null), child=make('child','root'), grand=make('grand','child');
  root.childIds=['child'];child.childIds=['grand'];
  const tree={rootId:'root',activeId:'grand',nodes:{root,child,grand}};
  const state={projectInfo:{name:'Synthetic ancestry'},...grand.assessmentResult,scores:grand.scores,metricAssessments:grand.metricAssessments,ruleDispositions:grand.ruleDispositions,assessmentTree:tree,assessmentComplete:true};
  return {root,child,grand,tree,state};
}

for(const metric of ['M5','M8','M15']) test(`${metric} unresolved ancestry blocks active and inactive completion and cannot be restored as complete`,()=>{
  const {tree,state}=fixture(metric);
  for(const activeId of ['root','child','grand']) {
    tree.activeId=activeId;const node=tree.nodes[activeId];
    const active={...state,...node.assessmentResult,scores:node.scores,metricAssessments:node.metricAssessments,ruleDispositions:node.ruleDispositions};
    assert.equal(assessHierarchyCompleteness(tree).complete,false);
    assert.equal(evaluateBaselineEligibility(active).softwareChecksPassed,false);
    assert.equal(evaluateBaselineEligibility(JSON.parse(JSON.stringify(active))).softwareChecksPassed,false,'refresh/restore cannot grant completeness');
    const config=buildExportConfig(active,{mode:'identified'});config.assessmentComplete=true;
    assert.deepEqual(validateConfig(config).errors,[]);
    assert.equal(normalizeImportedConfig(config).assessmentComplete,false,'claimed imported completion cannot bypass current ancestry');
  }
});

for(const [metric,floor] of [['M5','comprehensive'],['M8','standard']]) test(`${metric} grandchild choices respect current ancestry and preserve suspended reasons after recalc/recovery`,()=>{
  const {grand,tree,state}=fixture(metric);
  captureRecommendation(grand,grand.assessmentResult,{effectiveScores:grand.scores});
  const old={level:'basic',justification:'Earlier raw-score-only choice',recommendationId:grand.recommendationBaseline.id,processId:'25'};
  grand.manualAdjustments={25:old};grand.decisionRecords={25:{...old,recommendationLevel:'basic'}};
  assert.equal(getDecisionEffectiveScores(grand,state)[metric],5);
  assert.ok(prepareDecisions(grand,state,{25:old}).errors.length);
  const effectiveScores=resolveProtectedAncestry(tree,'grand').effectiveScores;
  const result=runFullAssessment(effectiveScores,undefined,{metricAssessments:grand.metricAssessments});
  assert.equal(result.levels[25],floor);
  const reconciled=reconcileManualChoices(grand,state,result,{effectiveScores},grand.manualAdjustments,true);
  assert.equal(reconciled.adjustments[25],undefined);
  assert.equal(grand.decisionDrafts[25].justification,old.justification);
  const config=buildExportConfig(state,{mode:'identified'});
  assert.deepEqual(validateConfig(config).errors,[]);
  assert.equal(normalizeImportedConfig(config).assessmentTree.nodes.grand.decisionDrafts[25].justification,old.justification);
});

test('missing, cyclic and over-depth ancestry cannot pass active or inactive software checks',()=>{
  for(const mutate of [tree=>{tree.nodes.child.parentId='missing';},tree=>{tree.nodes.child.parentId='grand';},tree=>{tree.rootId='missing';},tree=>{let parent='grand';for(let i=0;i<21;i++){const id=`deep-${i}`;tree.nodes[id]={...structuredClone(tree.nodes.grand),id,parentId:parent};parent=id;}tree.activeId=parent;}]) {
    const {tree,state}=fixture('M5');mutate(tree);
    assert.equal(evaluateBaselineEligibility(state).softwareChecksPassed,false);
    assert.equal(assessHierarchyCompleteness(tree).complete,false);
  }
});


test('a valid confirmed security boundary can legitimately stop ancestry protection and pass software checks',()=>{
  const {child,state}=fixture('M8');
  child.securityHierarchyDisposition={status:'confirmed',outcome:'lower-consequence-justified',rationale:'Responsibility and consequence boundary reviewed',ownerApprover:'Synthetic authority',reviewDate:'2026-10-09'};
  assert.equal(getDecisionEffectiveScores(state.assessmentTree.nodes.grand,state).M8,1);
  assert.equal(assessHierarchyCompleteness(state.assessmentTree).complete,true);
  assert.equal(evaluateBaselineEligibility(state).softwareChecksPassed,true);
});
