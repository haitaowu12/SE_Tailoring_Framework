import { expect, test } from '@playwright/test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const metricScores = Object.fromEntries(
  Array.from({ length: 16 }, (_, index) => [`M${index + 1}`, 3])
);

const processLevels = Object.fromEntries(
  Array.from({ length: 22 }, (_, index) => [String(index + 9), 'standard'])
);

test('legacy import remains reviewable and matrix recompute preserves manual adjustment', async ({ page }) => {
  const dir = await mkdtemp(join(tmpdir(), 'se-tailoring-import-'));
  const configPath = join(dir, 'legacy-config.json');
  await writeFile(configPath, JSON.stringify({
    _format: 'se-tailoring-config',
    projectInfo: { name: 'Legacy Import Smoke', team: 'Stakeholder Review' },
    metricScores,
    processLevels,
    manualAdjustments: {
      9: { level: 'comprehensive', justification: 'Stakeholder-directed planning rigor' }
    },
    assessmentComplete: true
  }));

  await page.goto('./');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('#btn-import').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(configPath);

  await expect(page.getByText('Configuration imported successfully!')).toBeVisible();
  await page.getByRole('button', { name: 'Report' }).click();
  await expect(page).toHaveURL(/#report$/);
  await expect(page.getByText('Tailoring Report')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Legacy Import Smoke' })).toBeVisible();
  await expect(page.getByText('Ready for review')).toBeVisible();

  await page.goto('./#matrix');
  await expect(page).toHaveURL(/#matrix$/);
  await page.locator('.matrix-cell[data-pid="9"][data-mid="M1"]').click();

  await page.goto('./#report');
  await expect(page.locator('tr', { hasText: 'Project Planning' })).toContainText('C');
  await expect(page.getByText('Ready for review')).toBeVisible();
});
