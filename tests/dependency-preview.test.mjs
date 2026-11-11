import test from 'node:test';
import assert from 'node:assert/strict';
import { CORE_PROCESSES } from '../src/data/se-tailoring-data.js';
import { previewDirectConsequences } from '../src/utils/assessment-engine.js';
import { renderDependencyPreview } from '../src/utils/dependency-preview.js';

test('direct-effect explanation preserves engine rules, typed consequences and guidance destinations', () => {
 const levels=Object.fromEntries(CORE_PROCESSES.map(process=>[process.id,'basic']));
 const changes=previewDirectConsequences(19,'comprehensive',levels);
 const before=structuredClone({levels,changes});
 const html=renderDependencyPreview({processId:19,proposedLevel:'comprehensive',levels,changes});
 assert.ok(changes.length>0);
 for(const change of changes){
  assert.ok(html.includes(`Rule ${change.ruleId}`));
  assert.ok(html.includes(`process=${change.processId}&level=${change.to}&source=interdependency`));
  assert.ok(html.includes(`prop-type ${change.type}`));
 }
 assert.ok(html.includes('Your assessment is unchanged'));
 assert.deepEqual({levels,changes},before);
});

test('unassessed target never appears as a recorded Basic assessment', () => {
 const changes=previewDirectConsequences(19,'comprehensive',{});
 const html=renderDependencyPreview({processId:19,proposedLevel:'comprehensive',levels:{},changes});
 assert.ok(html.includes('Unassessed →'));
 assert.ok(html.includes('preview uses Basic where no current level is recorded'));
 assert.ok(!html.includes('is-current'));
});

test('zero direct effects offers the full assessment without claiming a globally consistent plan', () => {
 const html=renderDependencyPreview({processId:9,proposedLevel:'basic',changes:[],levels:{}});
 assert.ok(html.includes('No directly affected processes'));
 assert.ok(html.includes('whole profile and all required dependencies'));
 assert.ok(html.includes('href="#assessment"'));
});
