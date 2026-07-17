import { expect, test } from '@playwright/test';

test('untouched preview values remain 0 of 16 reviewed and cannot produce a pilot report', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('./#assessment');

  await page.getByRole('button', { name: 'Go to Results step' }).click();

  await expect(page.getByText('0/16 reviewed')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Work in Progress (0/16)' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Pass Software Completeness Checks/ })).toHaveCount(0);

  await page.goto('./#report');
  await expect(page.getByRole('heading', { name: 'Assessment Work in Progress' })).toBeVisible();
  await expect(page.getByText(/0\/16 metric judgments are confirmed/)).toBeVisible();
  await expect(page.getByRole('button', { name: /HTML report/i })).toHaveCount(0);
});

test('five-anchor choices expose provisional guidance and wizard recommendations require confirmation', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('./#assessment');
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();

  const metric = page.locator('.metric-item[data-metric-id="M1"]');
  await expect(metric.getByRole('radio')).toHaveCount(5);
  await expect(metric.locator('input[type="radio"]:checked')).toHaveCount(0);
  await metric.getByText(/Provisional assessor guidance/).click();
  await expect(metric.getByText(/large inventory of independent, repeated elements/)).toBeVisible();

  await metric.getByRole('button', { name: 'Help me choose' }).click();
  await metric.getByRole('button', { name: 'Yes' }).click();
  for (let index = 0; index < 3; index += 1) {
    await metric.getByRole('button', { name: 'No' }).click();
  }
  await expect(metric.getByText('Recommended anchor 5')).toBeVisible();
  await expect(metric.getByText('Unreviewed — preview 3')).toBeVisible();
  await expect(metric.locator('input[type="radio"]:checked')).toHaveCount(0);

  await metric.getByRole('button', { name: 'Confirm anchor 5' }).click();
  await expect(metric.getByText('Assessed 1–5 score')).toBeVisible();
  await expect(metric.getByRole('radio', { name: /M1 score 5:/ })).toBeChecked();
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await expect(page.getByText('1/16 reviewed')).toBeVisible();
});
