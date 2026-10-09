import { expect, test } from '@playwright/test';
import { runFullAssessment } from '../../src/utils/assessment-engine.js';
import { buildExportConfig } from '../../src/utils/export-import.js';
import { openSessionMenu } from './helpers.js';

function fixture() {
  const makeNode = (id, score, parentId = null) => {
    const scores = Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`M${i + 1}`, score]));
    const metricAssessments = Object.fromEntries(Object.entries(scores).map(([metricId, value]) => [metricId, {
      score: value, status: 'assessed', definitionVersion: 3, qualifiers: [], rationale: 'Synthetic context', evidenceRefs: []
    }]));
    const result = runFullAssessment(scores, undefined, { metricAssessments });
    return { id, name: id, parentId, childIds: [], assessmentType: 'full', status: 'draft',
      scores, metricAssessments, levels: result.levels, assessmentResult: result, manualAdjustments: {} };
  };
  const root = makeNode('default', 3);
  const child = makeNode('CHILD-OPTION', 1, 'default');
  root.childIds = [child.id];
  return buildExportConfig({ ...root.assessmentResult, scores: root.scores, metricAssessments: root.metricAssessments,
    projectInfo: { name: 'ELEMENT-CONTEXT' }, assessmentComplete: false,
    assessmentTree: { rootId: 'default', activeId: 'default', nodes: { default: root, [child.id]: child } }
  }, { mode: 'identified' });
}

async function saved(page) {
  return page.evaluate(() => {
    const workspace = JSON.parse(localStorage.getItem('se-tailoring-workspace-v1'));
    return workspace.assessments.find(entry => entry.id === workspace.activeId).data;
  });
}

test('Decisions element selection follows Review inputs, guidance, and report navigation', async ({ page }) => {
  await page.goto('./');
  await openSessionMenu(page);
  const chooser = page.waitForEvent('filechooser');
  await page.locator('#btn-import').click();
  await (await chooser).setFiles({ name: 'hierarchy.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture())) });
  await expect(page.getByText('Configuration imported successfully!')).toBeVisible();
  await page.locator('.nav-link[data-route="adjust"]').click();
  await page.locator('#decision-element').selectOption('CHILD-OPTION');
  let current = await saved(page);
  expect(current.assessmentTree.activeId).toBe('CHILD-OPTION');
  expect(current.scores.M1).toBe(1);
  expect(current.levels[9]).toBe('basic');
  await page.locator('#btn-review-inputs').click();
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();
  await expect(page.getByRole('radio', { name: /M1 score 1:/ })).toBeChecked();
  await page.locator('.nav-link[data-route="adjust"]').click();
  await expect(page.locator('#decision-element')).toHaveValue('CHILD-OPTION');
  await page.locator('[data-decision-process="9"] a').click();
  expect((await saved(page)).assessmentTree.activeId).toBe('CHILD-OPTION');
  await page.goBack();
  await page.locator('#btn-view-report').click();
  await expect(page).toHaveURL(/#report$/);
  current = await saved(page);
  expect(current.assessmentTree.activeId).toBe('CHILD-OPTION');
  expect(current.scores.M1).toBe(1);
  expect(current.assessmentTree.nodes.default.scores.M1).toBe(3);
});
