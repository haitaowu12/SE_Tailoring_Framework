import { expect, test } from '@playwright/test';
import { openSessionMenu, clickSessionAction } from './helpers.js';

const KEY = 'se-tailoring-workspace-v1';
const semantics = { frameworkVersion: '4.2.0', metricDefinitionSet: 'se-tailoring-m1-m16-v3', qualifierSchemaVersion: '1.1' };

async function createAssessment(page, name) {
  await page.getByLabel('New assessment name / code').fill(name);
  await page.getByRole('button', { name: 'Create assessment', exact: true }).click();
  await expect(page.locator('#assessment-context')).toContainText(`Current assessment: ${name}`);
  await expect(page.getByLabel('Current assessment name / code')).toHaveValue(name);
}
async function openAssessment(page) {
  await page.getByRole('button', { name: 'Assessment', exact: true }).click();
  await page.getByRole('button', { name: 'Go to Project Info step' }).click();
}
async function expandMetric(page, metricId) {
  const metric = page.locator(`.metric-item[data-metric-id="${metricId}"]`);
  if (!(await metric.evaluate(element => element.open))) await metric.locator('summary.metric-header').click();
}
async function openWorkspace(page) {
  await page.getByRole('button', { name: /Open assessment library/ }).click();
  await expect(page.getByRole('heading', { name: 'Your assessments' })).toBeVisible();
}
async function readLibrary(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
}

test('create, switch, duplicate, and immediate reload preserve independent assessments', async ({ page }) => {
  await page.goto('./');
  const libraryHeading = page.getByRole('heading', { name: 'Your assessments' });
  await expect(libraryHeading).toBeInViewport();
  await createAssessment(page, 'PILOT-ALPHA');
  await openAssessment(page);
  await page.getByLabel('Team code (optional)').fill('TEAM-A');
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();
  await page.getByRole('radio', { name: /M1 score 4:/ }).check();
  await openWorkspace(page);
  await createAssessment(page, 'PILOT-BETA');
  await openAssessment(page);
  await expect(page.getByLabel('Project code')).toHaveValue('PILOT-BETA');
  await expect(page.getByLabel('Team code (optional)')).toHaveValue('');
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();
  await expect(page.locator('.metric-item[data-metric-id="M1"] input:checked')).toHaveCount(0);
  await page.getByRole('radio', { name: /M1 score 2:/ }).check();
  // No debounce sleep: immediate reload must retain the final change.
  await page.reload();
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(page.getByLabel('Current assessment name / code')).toHaveValue('PILOT-BETA');
  await page.getByRole('button', { name: 'Open assessment PILOT-ALPHA', exact: true }).click();
  await expect(page.getByLabel('Current assessment name / code')).toHaveValue('PILOT-ALPHA');
  await openAssessment(page);
  await expect(page.getByLabel('Team code (optional)')).toHaveValue('TEAM-A');
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();
  await expandMetric(page, 'M1');
  await expect(page.getByRole('radio', { name: /M1 score 4:/ })).toBeChecked();
  await openWorkspace(page);
  await page.getByRole('button', { name: 'Duplicate current', exact: true }).click();
  await expect(page.getByLabel('Current assessment name / code')).toHaveValue('PILOT-ALPHA (copy)');
  await page.getByLabel('Current assessment name / code').fill('PILOT-ALPHA · option C');
  await page.getByRole('button', { name: 'Rename assessment', exact: true }).click();
  await expect(page.getByLabel('Current assessment name / code')).toHaveValue('PILOT-ALPHA · option C');
  await openAssessment(page);
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();
  await expandMetric(page, 'M1');
  await page.getByRole('radio', { name: /M1 score 1:/ }).check();
  const library = await readLibrary(page);
  expect(library.assessments.find(entry => entry.name === 'PILOT-ALPHA').data.scores.M1).toBe(4);
  expect(library.assessments.find(entry => entry.name === 'PILOT-BETA').data.scores.M1).toBe(2);
  expect(library.assessments.find(entry => entry.name === 'PILOT-ALPHA · option C').data.scores.M1).toBe(1);
});

test('imports create a new assessment and preserve the current assessment and its tree', async ({ page }) => {
  await page.goto('./');
  await createAssessment(page, 'BEFORE-IMPORT');
  await openAssessment(page);
  await page.getByLabel('Team code (optional)').fill('KEEP-TEAM');
  const before = await readLibrary(page);
  const original = before.assessments.find(entry => entry.id === before.activeId);
  const chooserPromise = page.waitForEvent('filechooser');
  await clickSessionAction(page, 'Import');
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: 'imported-option.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({
    _format: 'se-tailoring-config', _version: '2.0', semantics,
    projectInfo: { name: 'IMPORTED-OPTION' }, metricScores: { M1: 2 }, processLevels: {}
  })) });
  await expect(page.getByText('Configuration imported successfully! Added as a separate assessment.')).toBeVisible();
  const after = await readLibrary(page);
  expect(after.assessments).toHaveLength(before.assessments.length + 1);
  expect(after.assessments.find(entry => entry.id === original.id).data).toEqual(original.data);
  expect(after.assessments.find(entry => entry.id === after.activeId).data.projectInfo.team).toBeUndefined();
  await page.getByRole('button', { name: 'Open assessment BEFORE-IMPORT', exact: true }).click();
  await expect(page.getByLabel('Current assessment name / code')).toHaveValue('BEFORE-IMPORT');
  await openAssessment(page);
  await expect(page.getByLabel('Team code (optional)')).toHaveValue('KEEP-TEAM');
});

test('storage failures block changing assessments and retain the unsaved draft', async ({ page }) => {
  await page.goto('./');
  await createAssessment(page, 'KEEP-CURRENT');
  const before = await readLibrary(page);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    window.restoreWorkspaceStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function(name, value) {
      if (name === key) throw new DOMException('Quota exceeded', 'QuotaExceededError');
      return original.call(this, name, value);
    };
  }, KEY);
  await openAssessment(page);
  await page.getByLabel('Team code (optional)').fill('UNSAVED-TEAM');
  await expect(page.locator('#runtime-status')).toContainText('Local save failed');
  await openWorkspace(page);
  await page.getByLabel('New assessment name / code').fill('MUST-NOT-REPLACE');
  await page.getByRole('button', { name: 'Create assessment', exact: true }).click();
  await expect(page.locator('#assessment-context')).toContainText('KEEP-CURRENT');
  expect((await readLibrary(page)).activeId).toBe(before.activeId);
  await openAssessment(page);
  await expect(page.getByLabel('Team code (optional)')).toHaveValue('UNSAVED-TEAM');
  await page.evaluate(() => window.restoreWorkspaceStorage());
  await page.getByLabel('Team code (optional)').fill('RECOVERED-TEAM');
  await expect(page.locator('#runtime-status')).not.toHaveClass(/active/);
  const after = await readLibrary(page);
  expect(after.assessments.find(entry => entry.id === after.activeId).data.projectInfo.team).toBe('RECOVERED-TEAM');
});

test('private backup requires a privacy choice and downloads the complete current assessment only', async ({ page }) => {
  await page.goto('./');
  await createAssessment(page, 'PRIVATE-CURRENT');
  await openAssessment(page);
  await page.getByLabel('Team code (optional)').fill('PRIVATE-TEAM');
  await clickSessionAction(page, 'Private backup');
  const dialog = page.getByRole('dialog', { name: 'Download a private assessment backup?' });
  await expect(dialog).toContainText('evidence references, decisions');
  await expect(dialog).toContainText('Other assessments in the library are not included.');
  await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Download private backup', exact: true }).click();
  const download = await downloadPromise;
  let text = '';
  for await (const chunk of await download.createReadStream()) text += chunk.toString();
  const backup = JSON.parse(text);
  expect(backup._privacy.mode).toBe('identified');
  expect(backup.projectInfo.name).toBe('PRIVATE-CURRENT');
  expect(backup.projectInfo.team).toBe('PRIVATE-TEAM');
  expect(backup.assessments).toBeUndefined();
});

test('library and Decisions remain accessible on mobile with no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await createAssessment(page, 'MOBILE-CODE-ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Go to section').selectOption('adjust');
  await expect(page).toHaveURL(/#adjust$/);
  await openWorkspace(page);
  await expect(page.getByLabel('Current assessment name / code')).toHaveValue('MOBILE-CODE-ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  await openSessionMenu(page);
  await expect(page.getByRole('button', { name: 'Private backup', exact: true })).toBeVisible();
});
