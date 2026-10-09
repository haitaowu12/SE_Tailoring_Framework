import { expect, test } from '@playwright/test';
import { runFullAssessment } from '../../src/utils/assessment-engine.js';
import { buildExportConfig } from '../../src/utils/export-import.js';
import { openSessionMenu } from './helpers.js';

function fixture() {
  const make=(id,parentId)=>{
    const scores=Object.fromEntries(Array.from({length:16},(_,i)=>[`M${i+1}`,1]));
    if(id==='root')scores.M8=5;
    const metricAssessments=Object.fromEntries(Object.entries(scores).map(([metric,score])=>[metric,{score,status:'assessed',definitionVersion:3,qualifiers:[]} ]));
    const result=runFullAssessment(scores,undefined,{metricAssessments});
    return {id,name:id,parentId,childIds:[],scores,metricAssessments,assuranceObligations:[],assessmentType:'full',assessmentResult:result,levels:result.levels,manualAdjustments:{},status:'under_review'};
  };
  const root=make('root',null),child=make('child','root'),grand=make('grand','child');
  root.childIds=['child'];child.childIds=['grand'];
  const state={...grand.assessmentResult,projectInfo:{name:'ANCESTRY-PROBE'},scores:grand.scores,metricAssessments:grand.metricAssessments,assessmentTree:{rootId:'root',activeId:'grand',nodes:{root,child,grand}},assessmentComplete:true};
  const config=buildExportConfig(state,{mode:'identified'});
  config.assessmentComplete=true; // A legacy claim must not bypass current hierarchy checks.
  return config;
}

test('unresolved grandparent protection survives import, review, Decisions and reload',async({page})=>{
  await page.goto('./');
  await openSessionMenu(page);
  const chooser=page.waitForEvent('filechooser');
  await page.locator('#btn-import').click();
  await (await chooser).setFiles({name:'ancestry.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture()))});
  await expect(page.getByText('Configuration imported successfully!')).toBeVisible();
  await page.getByRole('button',{name:'Report',exact:true}).click();
  await expect(page.getByText('Assessment Work in Progress')).toBeVisible();
  await page.goto('./#review');
  await expect(page.getByText('Protected ancestry needs review',{exact:true})).toBeVisible();
  await page.locator('#btn-record-tailoring-decisions').click();
  await expect(page.locator('#decision-element')).toHaveValue('grand');
  await expect(page.locator('[data-recommendation="25"]')).toHaveText('Standard');
  await page.locator('#decision-level-25').selectOption('basic');
  await page.locator('#decision-reason-25').fill('This attempted reduction must remain a draft.');
  await page.locator('#btn-save').click();
  await expect(page.locator('#decision-errors')).toContainText('minimum is protected');
  await page.reload();
  await page.getByRole('button',{name:'Restore',exact:true}).click();
  await page.locator('.nav-link[data-route="adjust"]').click();
  await expect(page.locator('[data-recommendation="25"]')).toHaveText('Standard');
  await expect(page.locator('#decision-reason-25')).toHaveValue('This attempted reduction must remain a draft.');
  const current=await page.evaluate(()=>{const w=JSON.parse(localStorage.getItem('se-tailoring-workspace-v1'));return w.assessments.find(x=>x.id===w.activeId).data;});
  expect(current.assessmentComplete).toBe(false);
  expect(current.assessmentTree.nodes.grand.scores.M8).toBe(1);
  expect(current.assessmentTree.nodes.grand.manualAdjustments[25]).toBeUndefined();
});
