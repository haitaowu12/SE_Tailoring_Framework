/** Independent expected-policy fixtures: full floor/rule boundary audit.
 * Passing tests establish implementation conformance, not professional validity.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVE_CONSISTENCY_RULES, OVERRIDE_CONDITIONS, CONDITIONAL_METRIC_PROCESS_DRIVERS, METRIC_PROCESS_MAP } from '../src/data/metrics.js';
import { applyOverrides, checkConsistency, applyMandatoryClosure, runFullAssessment, calculateProcessDerivation, computeCSI, deriveCSIResponseRequirement } from '../src/utils/assessment-engine.js';
import { assessCorrelatedEvidence } from '../src/utils/correlated-evidence.js';
import { renderMetricRatingTable } from '../src/utils/report-visuals.js';
import { METRICS } from '../src/data/metrics.js';
const ids = Array.from({length:22}, (_,i)=>i+9);
const tech = ids.filter(id=>id>=17);
const ranks = ['basic','standard','comprehensive'];
const levels = rank=>Object.fromEntries(ids.map(id=>[id,rank]));
const scores = value=>Object.fromEntries(Array.from({length:16},(_,i)=>[`M${i+1}`,value]));
const obligation = scope=>({bindingStatus:'confirmed',type:'regulatory-mandate',authority:'Test authority',sourceRef:'TEST-OBLIGATION',processScope:scope});
// These expected groups are deliberately independent of the production registry.
const floorGroups = [
 ['M5','=',5,[19,20,25,27,12,16],'comprehensive'], ['M5','=',4,[12,16,19,20,25,27],'standard'],
 ['M6','>=',4,[12,20,25,27,28],'standard'], ['M8','>=',4,[12,13,14,20,25],'standard'],
 ['M15','>=',4,[13,14,16,25],'standard'], ['M4','>=',4,[24,13],'standard'],
 ['M3','>=',4,[11,22,25],'standard'], ['M7','=',5,[21,28,29,30,13,14],'standard']
];
const expectedFloors = floorGroups.flatMap(([metric,op,value,processes,min])=>processes.map(process=>({metric,op,value,process,min})));
assert.equal(expectedFloors.length,37);
for (const f of expectedFloors) test(`floor ${f.metric}${f.op}${f.value} P${f.process}: all scores and starting levels`,()=>{
 const registry = OVERRIDE_CONDITIONS.filter(r=>r.trigger.metric===f.metric && r.trigger.op===f.op && r.trigger.value===f.value && r.processes.includes(f.process));
 assert.equal(registry.length,1); assert.equal(registry[0].minLevel,f.min);
 for(let value=1;value<=5;value++) for(const start of ranks){
  const context={assuranceObligations:[obligation([f.process])]};
  const result=applyOverrides(levels(start),{...scores(1),[f.metric]:value},context);
  const active=result.activeFloors.find(r=>r.overrideId===registry[0].id || r.id===registry[0].id);
  const triggered=f.op==='='?value===f.value:value>=f.value;
  assert.equal(Boolean(active),triggered,`${registry[0].id}: score ${value}, ${start}`);
  if(triggered) assert.ok(ranks.indexOf(result.levels[f.process])>=Math.max(ranks.indexOf(start),ranks.indexOf(f.min)));
  for(const id of ids) assert.ok(ranks.indexOf(result.levels[id])>=ranks.indexOf(start));
 }
 if(f.metric==='M15') for(const bad of [null,{...obligation([f.process]),bindingStatus:'unconfirmed'},{...obligation([f.process]),authority:''},{...obligation([f.process]),sourceRef:''},{...obligation([f.process]),type:'preference'},obligation([99])]){
  const result=applyOverrides(levels('basic'),{...scores(1),M15:5},{assuranceObligations:bad?[bad]:[]});
  assert.equal(result.activeFloors.some(r=>r.overrideId===registry[0].id || r.id===registry[0].id),false);
 }
});
// id, trigger process(es), trigger minimum, target, target minimum, default severity
const expectedRules = [
 [1,[18],2,19,1,'HC'],[2,[19],2,25,1,'HC'],[3,[19],2,27,1,'HC'],[4,[19],2,13,1,'HC'],
 [6,[20],2,21,1,'HC'],[7,[20],2,24,1,'WN'],['8b',tech,2,9,2,'WN'],[9,[25,27],2,19,1,'HC'],
 [10,[24],2,25,1,'HC'],[11,[25],2,27,1,'WN'],[12,tech,1,9,1,'HC'],[14,[12],2,11,1,'WN'],
 [15,[28],2,29,1,'WN'],[16,tech,2,15,1,'WN'],[17,tech,2,16,1,'WN'],[18,[23],2,24,1,'HC'],[19,[26],2,28,1,'WN']
];
assert.deepEqual(ACTIVE_CONSISTENCY_RULES.map(r=>r.id),expectedRules.map(r=>r[0]));
for(const [id,sources,threshold,target,min,type] of expectedRules) test(`rule ${id}: every trigger process and level boundary`,()=>{
 for(const source of sources) for(let trigger=0;trigger<3;trigger++) for(let required=0;required<3;required++){
  const profile={...levels('basic'),[source]:ranks[trigger],[target]:ranks[required]};
  const violation=checkConsistency(profile,scores(1)).find(r=>r.ruleId===id);
  assert.equal(Boolean(violation),trigger>=threshold && required<min,`rule ${id}, P${source}, ${trigger}/${required}`);
  if(violation) assert.equal(violation.type,type);
 }
});
for(const id of [16,17]) test(`rule ${id}: criticality and scoped assurance escalation`,()=>{
 const target=id===16?15:16; const profile={...levels('basic'),17:'comprehensive'};
 for(const metric of ['M5','M6','M8','M15']) for(let value=1;value<=5;value++){
  const s={...scores(1),[metric]:value};
  for(const scope of [[],[target],[99]]){
   const context={assuranceObligations:[obligation(scope)]};
   const actual=checkConsistency(profile,s,context).find(r=>r.ruleId===id);
   assert.equal(actual.type,value>=4 && (metric!=='M15'||scope.includes(target))?'HC':'WN');
  }
 }
});
function oracleClosure(input,s){
 const out={...input};let changed=true;
 while(changed){changed=false;for(const [id,sources,threshold,target,min,base] of expectedRules){
  const hard=base==='HC'||([16,17].includes(id)&&['M5','M6','M8'].some(m=>s[m]>=4));
  if(hard&&sources.some(p=>ranks.indexOf(out[p])>=threshold)&&ranks.indexOf(out[target])<min){out[target]=ranks[min];changed=true;}
 }}return out;
}
test('closure matches independent oracle, is idempotent and never lowers a level over 2000 deterministic profiles',()=>{
 let seed=9102026; const next=max=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%max;};
 for(let i=0;i<2000;i++){
  const p=Object.fromEntries(ids.map(id=>[id,ranks[next(3)]]));const s=Object.fromEntries(Object.keys(scores(1)).map(m=>[m,next(5)+1]));
  const actual=applyMandatoryClosure(p,s);assert.deepEqual(actual.levels,oracleClosure(p,s));
  assert.deepEqual(applyMandatoryClosure(actual.levels,s).levels,actual.levels);
  assert.ok(actual.fixes.length<=44); assert.equal(actual.violations.some(v=>v.type==='HC'),false);
 }
});
test('all seven conditional mappings require a confirmed in-scope obligation',()=>{
 assert.deepEqual(CONDITIONAL_METRIC_PROCESS_DRIVERS.map(d=>[d.processId,d.role]),[[12,'S'],[13,'P'],[14,'P'],[16,'P'],[25,'P'],[27,'S'],[30,'S']]);
 for(const {processId} of CONDITIONAL_METRIC_PROCESS_DRIVERS){
  const s={...scores(1),M15:4};
  assert.equal(calculateProcessDerivation(processId,s,METRIC_PROCESS_MAP,{}).level,'basic');
  assert.equal(calculateProcessDerivation(processId,s,METRIC_PROCESS_MAP,{assuranceObligations:[obligation([processId])]}).level,'standard');
  assert.equal(calculateProcessDerivation(processId,s,METRIC_PROCESS_MAP,{assuranceObligations:[obligation([99])]}).level,'basic');
 }
});
test('all 25 schedule/budget combinations change feasibility response, never process levels',()=>{
 const base=runFullAssessment(scores(2)).levels;
 for(let schedule=1;schedule<=5;schedule++)for(let budget=1;budget<=5;budget++){
  const s={...scores(2),M9:schedule,M10:budget};const c=Math.max(schedule,budget);
  assert.equal(computeCSI(s),c);assert.equal(deriveCSIResponseRequirement(s).requirement,c<=3?'none':c===4?'feasibility-review':'sponsor-escalation');
  assert.deepEqual(runFullAssessment(s).levels,base);
 }
});
test('a shared M6/M8 event can satisfy Risk Management corroboration without an M5 exception',()=>{
 const s={...scores(1),M6:5,M8:5};
 const metricAssessments=Object.fromEntries(['M6','M8'].map(m=>[m,{score:5,status:'assessed',evidenceContext:{episodeId:'ONE-EVENT',consequencePathway:'Same unsupported explanation'}}]));
 const warning=assessCorrelatedEvidence(metricAssessments);
 assert.equal(warning.warningCount,1);assert.equal(warning.independentCorroborationSupported,null);
 assert.equal(runFullAssessment(s, METRIC_PROCESS_MAP,{metricAssessments}).levels[12],'comprehensive');
 assert.equal(runFullAssessment({...s,M8:1}).levels[12],'standard');
 assert.equal(assessCorrelatedEvidence({}).independentCorroborationSupported,null);
});
test('rating summary hides midpoint previews and stale mismatched confirmations',()=>{
 const html=renderMetricRatingTable({M1:3,M2:4,M3:4},{M1:{status:'unknown',score:3},M2:{status:'assessed',score:3},M3:{status:'assessed',score:4}},METRICS.slice(0,3));
 assert.match(html,/<td>—<\/td><td>Unknown/);assert.match(html,/<td>—<\/td><td>Unreviewed/);assert.match(html,/<td>4<\/td><td>Confirmed/);
 assert.doesNotMatch(html,/<svg|<polygon/);
});

test('hierarchy closure refreshes every level layer after restoring parent responsibility', async () => {
  const { createChildAssessment, runChildAssessment } = await import('../src/utils/inheritance-engine.js');
  const parent = {...scores(1),M5:4};
  const child = createChildAssessment('root','test-child','full',parent);
  const result = runChildAssessment(child,parent,{19:'comprehensive',20:'comprehensive'});
  assert.equal(result.levels[13],'standard');
  assert.equal(result.levels[15],'standard');
  assert.deepEqual(result.normativeLevels,result.levels);
  assert.deepEqual(result.previewNormativeLevels,result.levels);
  assert.deepEqual(result.previewLevels,result.levels);
  assert.deepEqual(result.locallyAdjustedLevels,{});
});

test('upstream suggestions preserve the unfavorable direction of culture and manual judgments', async () => {
  const { suggestUpstream } = await import('../src/utils/inheritance-engine.js');
  const children=[{scores:{...scores(1),M16:1}},{scores:{...scores(5),M16:5}}];
  const result=suggestUpstream(children,{scores:{},manualMetrics:[]});
  assert.equal(result.suggested.M1,5);assert.equal(result.suggested.M16,1);
  const manual=suggestUpstream(children,{scores:{M16:3},manualMetrics:['M16']});
  assert.equal(manual.suggested.M16,undefined);assert.equal(manual.conflicts.find(c=>c.metric==='M16').parentValue,3);
});
