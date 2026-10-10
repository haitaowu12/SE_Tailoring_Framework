import test from 'node:test';
import assert from 'node:assert/strict';
import { getRightSizingDraft, saveRightSizingDraft } from '../src/utils/right-sizing-drafts.js';
import { buildExportConfig, normalizeImportedConfig, validateConfig } from '../src/utils/export-import.js';

const proposal = {processId:17, elementId:'default', from:'standard', proposedTo:'basic',scopeElementIds:['default'],affectedMetricIds:['M1']};
function fixture() {
  const scores=Object.fromEntries(Array.from({length:16},(_,i)=>[`M${i+1}`,3]));
  const node={id:'default',name:'Synthetic root',parentId:null,childIds:['child'],assessmentType:'full',scores,levels:{17:'standard'},metricAssessments:{}};
  const child={...structuredClone(node),id:'child',name:'Synthetic child',parentId:'default',childIds:[]};
  return {scores,levels:{17:'standard'},projectInfo:{name:'Draft fixture'},assessmentTree:{rootId:'default',activeId:'default',nodes:{default:node,child}}};
}

test('right-sizing drafts are immutable per-element form data, never asserted decisions',()=>{
  const state=fixture();
  const before=structuredClone(state);
  const tree=saveRightSizingDraft(state,proposal,{rationale:'PRIVATE-DRAFT',decision:'approved',evidenceRef:'SAFE-REF','accountableProcessOwner-identity':'ROLE'});
  assert.deepEqual(state,before);
  assert.equal(tree.nodes.child,state.assessmentTree.nodes.child);
  state.assessmentTree=tree;
  assert.deepEqual(getRightSizingDraft(state,proposal),{fields:{rationale:'PRIVATE-DRAFT',evidenceRef:'SAFE-REF','accountableProcessOwner-identity':'ROLE'},stale:false});
  assert.equal(state.rightSizingApprovalRecords,undefined);
  assert.equal(tree.nodes.default.rightSizingApprovalRecords,undefined);
  state.assessmentTree={...tree,activeId:'child'};
  assert.equal(getRightSizingDraft(state,proposal),null);
  const childProposal={...proposal,elementId:'child',scopeElementIds:['child']};
  state.assessmentTree=saveRightSizingDraft(state,childProposal,{rationale:'CHILD-DRAFT'});
  assert.equal(getRightSizingDraft(state,childProposal).fields.rationale,'CHILD-DRAFT');
  state.assessmentTree={...state.assessmentTree,activeId:'default'};
  assert.equal(getRightSizingDraft(state,proposal).fields.rationale,'PRIVATE-DRAFT');
});

test('changed proposal context keeps a draft for explicit review without changing its original snapshot',()=>{
  const state=fixture();state.assessmentTree=saveRightSizingDraft(state,proposal,{rationale:'Prior thought'});
  state.scores={...state.scores,M1:5};
  assert.equal(getRightSizingDraft(state,proposal).stale,true);
  state.assessmentTree=saveRightSizingDraft(state,proposal,{rationale:'Updated thought'});
  assert.equal(getRightSizingDraft(state,proposal).stale,true);
  assert.equal(state.levels[17],'standard');
});

test('private backup and reimport preserve drafts; minimum-data export strips every element draft',()=>{
  const state=fixture();state.assessmentTree=saveRightSizingDraft(state,proposal,{rationale:'PRIVATE-DRAFT',evidenceRef:'PRIVATE-REF'});
  const full=buildExportConfig(state,{mode:'identified'});
  assert.deepEqual(validateConfig(full),{valid:true,errors:[]});
  const restored=normalizeImportedConfig(full);
  assert.equal(restored.assessmentTree.nodes.default.rightSizingDrafts[17].fields.rationale,'PRIVATE-DRAFT');
  assert.equal(restored.assessmentTree.nodes.default.rightSizingDrafts[17].fields.evidenceRef,'PRIVATE-REF');
  const reduced=JSON.stringify(buildExportConfig(state,{mode:'minimum-data'}));
  assert.doesNotMatch(reduced,/PRIVATE-DRAFT|PRIVATE-REF|rightSizingDrafts/);
});
