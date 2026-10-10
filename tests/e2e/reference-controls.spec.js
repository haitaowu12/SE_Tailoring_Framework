import { expect, test } from '@playwright/test';
import { runFullAssessment } from '../../src/utils/assessment-engine.js';
import { buildExportConfig } from '../../src/utils/export-import.js';
import { openSessionMenu } from './helpers.js';

function fixture() {
  const makeNode = (id, name, parentId = null) => {
    const scores = Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`M${i + 1}`, 1]));
    const metricAssessments = Object.fromEntries(Object.entries(scores).map(([metric, score]) => [metric, {
      score, status: 'assessed', definitionVersion: 3, qualifiers: [], rationale: 'Synthetic reference check', evidenceRefs: []
    }]));
    const assessmentResult = runFullAssessment(scores, undefined, { metricAssessments });
    return {
      id, name, parentId, childIds: [], scores, metricAssessments, assessmentResult, levels: assessmentResult.levels,
      assessmentType: 'full', status: 'under_review', manualMetrics: ['M1'], inheritedMetrics: {}, manualAdjustments: {},
      decisionDrafts: { 9: { level: 'basic', justification: `${id} draft remains separate` } }
    };
  };
  const root = makeNode('root', 'Synthetic system');
  const child = makeNode('child', 'Existing subsystem', 'root');
  root.childIds = ['child'];
  return buildExportConfig({
    ...root.assessmentResult, projectInfo: { name: 'REFERENCE-CONTROLS' }, scores: root.scores, metricAssessments: root.metricAssessments,
    assessmentComplete: false, assessmentTree: { rootId: 'root', activeId: 'root', nodes: { root, child } }
  }, { mode: 'identified' });
}

async function importFixture(page, route) {
  await page.goto('./');
  await openSessionMenu(page);
  const chooser = page.waitForEvent('filechooser');
  await page.locator('#btn-import').click();
  await (await chooser).setFiles({ name: 'reference-controls.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture())) });
  await expect(page.getByText('Configuration imported successfully!')).toBeVisible();
  await page.goto(`./#${route}`);
}

async function saved(page) {
  return page.evaluate(() => {
    const workspace = JSON.parse(localStorage.getItem('se-tailoring-workspace-v1'));
    return workspace.assessments.find(entry => entry.id === workspace.activeId).data;
  });
}

test('Direct Preview has named controls and repeated keyboard previews leave saved assessment unchanged', async ({ page }) => {
  await importFixture(page, 'interdependency');
  await page.getByRole('button', { name: 'Direct Preview', exact: true }).click();
  const before = await saved(page);
  const process = page.getByRole('combobox', { name: 'Process', exact: true });
  const level = page.getByRole('combobox', { name: 'Proposed level', exact: true });
  await expect(process).toBeVisible();
  await expect(level).toBeVisible();
  await expect(page.getByText(/directly affected processes only/)).toBeVisible();
  await process.selectOption('19');
  await level.selectOption('comprehensive');
  const simulate = page.getByRole('button', { name: 'Simulate', exact: true });
  await simulate.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#sim-results')).toContainText('Direct dependency');
  const firstResult = await page.locator('#sim-results').textContent();
  await page.keyboard.press('Enter');
  await expect(page.locator('#sim-results')).toHaveText(firstResult);
  await process.selectOption('9');
  await level.selectOption('basic');
  await simulate.click();
  await expect(page.locator('#sim-results')).toContainText('No directly affected processes');
  expect(await saved(page)).toEqual(before);
});

test('Elements exposes named add controls and human status while retaining independent hierarchy drafts', async ({ page }) => {
  await importFixture(page, 'elements');
  const before = await saved(page);
  await expect(page.locator('.se-detail-header .se-status-badge')).toHaveText('Draft');
  await expect(page.locator('.se-child-info .se-status-badge')).toHaveText('Under review');
  await expect(page.getByRole('img', { name: 'Status: Under review', exact: true })).toHaveCount(1);
  await expect(page.locator('.se-manual-icon')).toHaveText('Manual');
  await expect(page.getByText('Manual scores are not automatically replaced by propagation. You can still edit them in the assessment.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Element name/code', exact: true }).fill('New payload subsystem');
  await page.getByRole('combobox', { name: 'Assessment type', exact: true }).selectOption('inherited');
  const add = page.getByRole('button', { name: '+ Add to Synthetic system', exact: true });
  await add.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.se-child-name').filter({ hasText: 'New payload subsystem' })).toBeVisible();
  const afterAdd = await saved(page);
  const newNode = Object.values(afterAdd.assessmentTree.nodes).find(node => node.name === 'New payload subsystem');
  expect(newNode.assessmentType).toBe('inherited');
  expect(newNode.parentId).toBe('root');
  expect(afterAdd.assessmentTree.nodes.root.decisionDrafts).toEqual(before.assessmentTree.nodes.root.decisionDrafts);
  expect(afterAdd.assessmentTree.nodes.child).toEqual(before.assessmentTree.nodes.child);
  await page.locator('.se-child-card').filter({ has: page.getByText('Existing subsystem', { exact: true }) }).getByRole('button', { name: 'Navigate →', exact: true }).click();
  await expect(page.locator('.se-detail-header h3')).toHaveText('Existing subsystem');
  await expect(page.locator('.se-detail-header .se-status-badge')).toHaveText('Under review');
  expect((await saved(page)).assessmentTree.activeId).toBe('child');
  await page.reload();
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await page.goto('./#elements');
  await expect(page.locator('.se-detail-header h3')).toHaveText('Existing subsystem');
  const restored = await saved(page);
  expect(restored.assessmentTree.nodes.root.decisionDrafts).toEqual(before.assessmentTree.nodes.root.decisionDrafts);
  expect(restored.assessmentTree.nodes.child.decisionDrafts).toEqual(before.assessmentTree.nodes.child.decisionDrafts);
});

test('Deliverables starts compact with keyboard disclosures and a labeled read-only level filter', async ({ page }, testInfo) => {
  await importFixture(page, 'deliverables');
  const before = await saved(page);
  const groups = page.locator('details.deliverable-group');
  await expect(groups).toHaveCount(22);
  expect(await groups.evaluateAll(nodes => nodes.every(node => !node.open))).toBe(true);
  await expect(page.getByText(/These examples are not completion evidence/)).toBeVisible();
  const expand = page.getByRole('button', { name: 'Expand all', exact: true });
  await expand.focus();
  await page.keyboard.press('Enter');
  expect(await groups.evaluateAll(nodes => nodes.every(node => node.open))).toBe(true);
  await page.getByRole('button', { name: 'Collapse all', exact: true }).click();
  expect(await groups.evaluateAll(nodes => nodes.every(node => !node.open))).toBe(true);
  await groups.first().locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(groups.first()).toHaveJSProperty('open', true);
  await page.getByRole('combobox', { name: 'Filter:', exact: true }).selectOption('comprehensive');
  expect(await groups.evaluateAll(nodes => nodes.every(node => !node.open))).toBe(true);
  expect(await saved(page)).toEqual(before);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('#toast-container .toast')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('deliverables-collapsed-mobile.png'), fullPage: true, animations: 'disabled' });
});

test('Deliverables offers bulk disclosure only when the selected filter has reference items', async ({ page }) => {
  await page.goto('./#deliverables');
  await expect(page.getByRole('button', { name: 'Expand all', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Collapse all', exact: true })).toBeDisabled();
  await page.getByRole('combobox', { name: 'Filter:', exact: true }).selectOption('basic');
  await expect(page.getByRole('button', { name: 'Expand all', exact: true })).toBeEnabled();
  await expect(page.locator('details.deliverable-group')).toHaveCount(22);
});
