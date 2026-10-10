import { expect, test } from '@playwright/test';
import { clickSessionAction, preparePageScreenshot } from './helpers.js';
import { getMetricAnchorText } from '../../src/utils/metric-anchor-text.js';

const semantics = { frameworkVersion: '4.2.0', metricDefinitionSet: 'se-tailoring-m1-m16-v3', qualifierSchemaVersion: '1.1' };
async function importComplete(page, overrides = {}) {
  const metricScores = { ...Object.fromEntries(Array.from({length:16}, (_, i) => [`M${i + 1}`, 3])), ...overrides };
  const metricAssessments = Object.fromEntries(Object.entries(metricScores).map(([id,score]) => [id, {score, status:'assessed', definitionVersion:3, qualifiers:[], rationale:'Synthetic usability check', evidenceRefs:[]}]));
  await page.goto('./');
  const chooser = page.waitForEvent('filechooser');
  await clickSessionAction(page, 'Import');
  await (await chooser).setFiles({name:'synthetic-usability.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify({
    _format:'se-tailoring-config', _version:'2.0', semantics,
    projectInfo:{name:'SYNTHETIC-USABILITY', boundary:'Booking service and its interfaces', purpose:'Plan integration evidence'},
    metricScores, metricAssessments,
    processLevels:Object.fromEntries(Array.from({length:22},(_,i)=>[i+9,'standard'])), assessmentComplete:true
  }))});
  await expect(page.getByText('Configuration imported successfully!')).toBeVisible();
  await page.goto('./#report');
  await expect(page.getByRole('heading', {name:'Pilot Tailoring Record',exact:true})).toBeVisible();
}
const section = (page, name) => page.locator('details.report-section').filter({has:page.locator('.report-section-title', {hasText:name})});

// Saved screenshots are synthetic, never the user's browser-local assessments.
test('workspace puts a keyboard-operable start action before library management', async ({page}, testInfo) => {
  await page.setViewportSize({width:1280,height:720});
  await page.goto('./');
  const start = page.locator('#btn-current-work');
  await expect(start).toBeInViewport();
  await expect(page.getByRole('heading',{name:'Your assessments',exact:true})).toBeInViewport();
  await expect(page.locator('#toast-container .toast')).toHaveCount(0);
  await preparePageScreenshot(page);
  await page.screenshot({path:testInfo.outputPath('workspace-desktop.png'),fullPage:false,animations:'disabled'});
  await start.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading',{name:'Set up the assessment',exact:true})).toBeFocused();
});

test('incomplete report resumes the first unanswered area and review exits keep route and title aligned', async ({page}) => {
  await page.goto('./#report');
  await page.getByRole('button',{name:'Continue Assessment',exact:true}).click();
  await expect(page).toHaveURL(/#assessment\?resume=1$/);
  await expect(page.getByRole('heading',{name:'System Complexity',exact:true})).toBeFocused();
  for (let i=1;i<=4;i++) {
    const metric=page.locator(`.metric-item[data-metric-id="M${i}"]`);
    if (!(await metric.evaluate(el=>el.open))) await metric.locator('summary.metric-header').click();
    await metric.getByRole('radio',{name:new RegExp(`M${i} score 3:`)}).check();
  }
  await page.goto('./#report');
  await page.getByRole('button',{name:'Continue Assessment',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Safety & Criticality',exact:true})).toBeVisible();
  await page.goto('./#review');
  await page.getByRole('button',{name:'Go to System Complexity step',exact:true}).click();
  await expect(page).toHaveURL(/#assessment\?step=complexity$/);
  await expect(page.getByRole('heading',{name:'System Complexity',exact:true})).toBeFocused();
  await expect(page.getByText('Tailoring recommendations',{exact:true})).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/#review$/);
  await page.goForward();
  await expect(page.getByRole('heading',{name:'System Complexity',exact:true})).toBeVisible();
  await page.reload();
  await page.getByRole('button',{name:'Restore',exact:true}).click();
  await page.goto('./#report');
  await page.getByRole('button',{name:'Continue Assessment',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Safety & Criticality',exact:true})).toBeVisible();
});

test('report leads with a compact process plan while preserving all details and print content', async ({page},testInfo) => {
  await page.setViewportSize({width:1280,height:720});
  await importComplete(page);
  await expect(page.getByText('Software completeness checks passed. External approval not verified.')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Process plan',exact:true})).toBeInViewport();
  await expect(page.locator('.report-process-plan tbody tr').first()).toBeInViewport();
  await expect(page.locator('.report-process-plan tbody tr:visible')).toHaveCount(5);
  expect(await page.locator('details.report-section').evaluateAll(nodes=>nodes.every(node=>!node.open))).toBe(true);
  await expect(page.locator('#toast-container .toast')).toHaveCount(0);
  await preparePageScreenshot(page);
  await page.screenshot({path:testInfo.outputPath('report-desktop.png'),fullPage:true,animations:'disabled'});
  const toggle=page.locator('#btn-toggle-process-plan');
  await toggle.focus(); await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('.report-process-plan tbody tr:visible')).toHaveCount(22);
  await toggle.click();
  await section(page,'Project context').locator(':scope > summary').click();
  await expect(page.getByRole('cell',{name:'Booking service and its interfaces',exact:true})).toBeVisible();
  await expect(page.getByRole('cell',{name:'Plan integration evidence',exact:true})).toBeVisible();
  const before=await page.locator('#main-content details').evaluateAll(nodes=>nodes.map(node=>node.open));
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
  expect(await page.locator('#main-content details').evaluateAll(nodes=>nodes.every(node=>node.open))).toBe(true);
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  expect(await page.locator('#main-content details').evaluateAll(nodes=>nodes.map(node=>node.open))).toEqual(before);
  await page.getByRole('button',{name:'Collapse all',exact:true}).click();
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('.report-process-plan tbody tr:visible')).toHaveCount(5);
  const workAids = page.locator('.report-process-plan tbody tr:visible .report-plan-action a');
  await expect(workAids).toHaveCount(5);
  for (const link of await workAids.all()) {
    await expect(link).toBeVisible();
    const bounds = await link.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  }
  expect(await page.locator('.report-process-plan tbody tr:visible').evaluateAll(rows => rows.every(row => row.scrollWidth <= row.clientWidth))).toBe(true);
  await toggle.click();
  await expect(page.locator('.report-process-plan tbody tr:visible')).toHaveCount(22);
  await toggle.click();
  await expect(page.locator('.report-process-plan tbody tr:visible')).toHaveCount(5);
  await expect(page.locator('#toast-container .toast')).toHaveCount(0);
  await preparePageScreenshot(page);
  await page.screenshot({path:testInfo.outputPath('report-mobile.png'),fullPage:true,animations:'disabled'});
  await page.locator('.report-process-plan a').first().click();
  await expect(page.locator('#process-detail-heading')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading',{name:'Process plan',exact:true})).toBeVisible();
});

test('reported 2 and 4 anchors match the assessment descriptions on screen and in HTML', async ({page}) => {
  await importComplete(page,{M1:2,M2:4});
  await section(page,'Metric Scores Detail').locator(':scope > summary').click();
  for(const [metricId,score] of [['M1',2],['M2',4]]) {
    await expect(section(page,'Metric Scores Detail').getByRole('row').filter({has:page.locator('strong',{hasText:new RegExp(`^${metricId}$`)})})).toContainText(getMetricAnchorText(metricId,score));
  }
  const downloaded=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download pilot HTML record',exact:true}).click();
  let html='';for await(const chunk of await (await downloaded).createReadStream()) html+=chunk.toString();
  expect(html).toContain(getMetricAnchorText('M1',2));
  expect(html).toContain(getMetricAnchorText('M2',4));
  expect(html).toContain('Booking service and its interfaces');
  expect(html).toContain('Plan integration evidence');
});

test('capture candidate guidance and reference surfaces from synthetic context', async ({page},testInfo) => {
  await page.setViewportSize({width:1280,height:720});
  await importComplete(page);
  for (const [name,route,heading] of [
    ['guidance','#processes?process=9&level=standard&source=report','Process work aids'],
    ['help','#help','Choose the systems engineering work your project needs'],
    ['deliverables','#deliverables','Reference Deliverables'],
    ['dependencies','#interdependency','Process Interdependencies'],
    ['elements','#elements','System Element Breakdown']
  ]) {
    await page.goto(`./${route}`);
    await expect(page.getByRole('heading',{name:heading,exact:true})).toBeVisible();
    await expect(page.locator('#main-content')).not.toHaveAttribute('inert','');
    await expect(page.locator('#toast-container .toast')).toHaveCount(0);
    await preparePageScreenshot(page);
    await page.screenshot({path:testInfo.outputPath(`${name}-desktop.png`),fullPage:true,animations:'disabled'});
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto('./#processes?process=9&level=standard&source=report');
  await expect(page.locator('#process-detail-heading')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('#toast-container .toast')).toHaveCount(0);
  await preparePageScreenshot(page);
  await page.screenshot({path:testInfo.outputPath('guidance-mobile.png'),fullPage:true,animations:'disabled'});
});


test('downloaded HTML leads with all 22 processes and retains one complete printable rating record', async ({ page }, testInfo) => {
  await importComplete(page, { M1: 2, M2: 4 });
  const fullProfile = section(page, 'Full Process Tailoring Profile');
  await fullProfile.locator(':scope > summary').click();
  // This supported import omits provenance: never invent Basic or Supported.
  await expect(fullProfile.locator('tbody tr').first().locator('td').nth(3)).toHaveText('Not recorded');
  await expect(fullProfile.locator('tbody tr').first().locator('td').nth(9)).toHaveText('Not recorded');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download pilot HTML record', exact: true }).click();
  let html = '';
  for await (const chunk of await (await downloaded).createReadStream()) html += chunk.toString();
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.setContent(html);
  await expect(page.locator('h2').first()).toHaveText('Process Tailoring Levels');
  await expect(page.locator('.process-profile tbody tr')).toHaveCount(22);
  await expect(page.locator('.process-profile tbody tr').first().locator('[data-label="Derived"]')).toHaveText('Not recorded');
  await expect(page.locator('.process-profile tbody tr').first().locator('[data-label="Evidence status"]')).toHaveText('Not recorded');
  await expect(page.locator('.metric-scores tbody tr')).toHaveCount(16);
  await expect(page.locator('.ordinal-anchor')).toHaveCount(0);
  await expect(page.locator('.process-profile tbody tr').first()).toBeInViewport();
  await expect(page.getByText('Software completeness checks passed. External approval not verified.')).toBeVisible();
  await expect(page.getByText('Booking service and its interfaces', { exact: false })).toBeVisible();
  await expect(page.locator('.metric-scores tbody tr').first()).toContainText(getMetricAnchorText('M1', 2));
  await page.screenshot({ path: testInfo.outputPath('exported-record-desktop.png'), animations: 'disabled' });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const row of await page.locator('.process-profile tbody tr').all()) {
      const bounds = await row.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    }
    if (width === 390) {
      await page.screenshot({ path: testInfo.outputPath('exported-record-mobile.png'), animations: 'disabled' });
      await page.locator('.process-profile tbody tr').first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath('exported-record-mobile-process.png'), animations: 'disabled' });
      await page.evaluate(() => scrollTo(0, 0));
    }
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.process-profile tbody tr:visible')).toHaveCount(22);
  await expect(page.locator('.metric-scores tbody tr:visible')).toHaveCount(16);
  await expect(page.getByRole('heading', { name: 'Context and software checks' })).toBeVisible();
  await expect(page.locator('.gate')).not.toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('exported-record-print.png'), animations: 'disabled' });
});
