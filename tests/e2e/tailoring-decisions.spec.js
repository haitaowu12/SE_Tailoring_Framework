import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { runFullAssessment } from '../../src/utils/assessment-engine.js';
import { buildExportConfig } from '../../src/utils/export-import.js';
import { captureRecommendation } from '../../src/utils/tailoring-decisions.js';
import { openSessionMenu } from './helpers.js';

function decisionFixture() {
  const scores = Object.fromEntries(Array.from({ length:16 }, (_,i) => [`M${i+1}`,3]));
  const metricAssessments = Object.fromEntries(Object.entries(scores).map(([id,score]) => [id,{score,status:'assessed',definitionVersion:3,qualifiers:[],rationale:'Synthetic rating evidence',evidenceRefs:[]}]));
  const result = runFullAssessment(scores,undefined,{metricAssessments});
  const node = {id:'default',name:'Demo system',parentId:null,childIds:[],assessmentType:'full',status:'draft',scores,metricAssessments,levels:result.levels,assessmentResult:result,manualAdjustments:{}};
  captureRecommendation(node,result);
  return buildExportConfig({...result,projectInfo:{name:'DECISION-TEST'},scores,metricAssessments,assessmentTree:{rootId:'default',activeId:'default',nodes:{default:node}}},{mode:'identified'});
}

async function start(page) {
  await page.goto('./');
  await openSessionMenu(page);
  const chooser = page.waitForEvent('filechooser');
  await page.locator('#btn-import').click();
  await (await chooser).setFiles({name:'decision-fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(decisionFixture()))});
  await expect(page.getByText('Configuration imported successfully!')).toBeVisible();
  await page.locator('.nav-link[data-route="adjust"]').click();
  await expect(page.getByRole('heading',{name:'Tailoring decisions',exact:true})).toBeVisible();
  await expect(page.locator('#main-content')).not.toHaveAttribute('inert','');
}

async function activeData(page) {
  return page.evaluate(() => {const library=JSON.parse(localStorage.getItem('se-tailoring-workspace-v1'));return library.assessments.find(item=>item.id===library.activeId).data;});
}

test('decision rationale survives another level change, repeat save, guidance back-navigation and immediate reload', async ({page}) => {
  await start(page);
  await expect(page.locator('[data-recommendation="9"]')).toHaveText('Standard');
  await page.locator('#decision-level-9').selectOption('comprehensive');
  await page.locator('#decision-reason-9').fill('Additional planning coordination for delivery interfaces');
  await page.locator('#decision-level-10').selectOption('comprehensive');
  await expect(page.locator('#decision-reason-9')).toHaveValue('Additional planning coordination for delivery interfaces');
  await page.locator('#decision-reason-10').fill('Independent progress review');
  await page.locator('#btn-save').click();
  await expect(page.locator('#decision-save-status')).toContainText('22/22 decisions recorded');
  await expect(page.locator('[data-recommendation="9"]')).toHaveText('Standard');
  const first = await activeData(page);
  expect(first.assessmentTree.nodes.default.decisionHistory).toHaveLength(22);
  await page.locator('#btn-save').click();
  expect((await activeData(page)).assessmentTree.nodes.default.decisionHistory).toHaveLength(22);
  await page.locator('#decision-reason-9').fill('Updated rationale draft before navigation');
  await page.locator('[data-decision-process="9"] a').click();
  await expect(page).toHaveURL(/#processes/);
  await page.goBack();
  await expect(page.locator('#decision-reason-9')).toHaveValue('Updated rationale draft before navigation');
  await page.reload();
  await page.getByRole('button',{name:'Restore',exact:true}).click();
  await page.locator('.nav-link[data-route="adjust"]').click();
  await expect(page.locator('#decision-reason-9')).toHaveValue('Updated rationale draft before navigation');
  await expect(page.locator('[data-recommendation="9"]')).toHaveText('Standard');
});

test('full private backup retains decision history and drafts and minimum-data sharing omits them', async ({page}) => {
  await start(page);
  await page.locator('#decision-level-9').selectOption('comprehensive');
  await page.locator('#decision-reason-9').fill('Private rationale for a synthetic decision');
  await page.locator('#btn-save').click();
  await page.locator('#decision-reason-10').fill('Draft evidence context');
  page.once('dialog',dialog=>dialog.accept());
  const downloaded=page.waitForEvent('download');
  await page.locator('#btn-decision-backup').click();
  const config=JSON.parse(await readFile(await (await downloaded).path(),'utf8'));
  expect(config._privacy.mode).toBe('identified');
  expect(config.assessmentTree.nodes.default.decisionHistory[0].justification).toBe('Private rationale for a synthetic decision');
  expect(config.assessmentTree.nodes.default.decisionDrafts[10].justification).toBe('Draft evidence context');
  await openSessionMenu(page);
  const reduced=page.waitForEvent('download');
  await page.locator('#btn-export').click();
  const text=await readFile(await (await reduced).path(),'utf8');
  expect(text).not.toContain('Private rationale');
  expect(text).not.toContain('Draft evidence context');
  expect(text).not.toContain('decisionHistory');
});

test('reverting to recommendation adds history without replacing the original recommendation', async ({page}) => {
  await start(page);
  await page.locator('#decision-level-9').selectOption('comprehensive');
  await page.locator('#decision-reason-9').fill('Initial local adjustment');
  await page.locator('#btn-save').click();
  await page.locator('#btn-reset').click();
  await expect(page.locator('#decision-level-9')).toHaveValue('standard');
  await page.locator('#btn-save').click();
  const node=(await activeData(page)).assessmentTree.nodes.default;
  expect(node.decisionHistory).toHaveLength(23);
  expect(node.decisionHistory[22].previousLevel).toBe('comprehensive');
  expect(node.decisionHistory[22].level).toBe('standard');
  expect(node.manualAdjustments[9]).toBeUndefined();
  expect(node.recommendationBaseline.levels[9]).toBe('standard');
});
