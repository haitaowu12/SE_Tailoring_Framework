import { expect, test } from '@playwright/test';
import { clickSessionAction, openSessionMenu } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

test('diagnostics disclose exact release identity and remain local-only', async ({ page }) => {
  const externalRequests = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.hostname !== '127.0.0.1') externalRequests.push(request.url());
  });

  const diagnosticsButton = page.getByRole('menuitem', { name: 'Diagnostics' });
  await openSessionMenu(page);
  await diagnosticsButton.focus();
  await diagnosticsButton.click();

  const dialog = page.getByRole('dialog', { name: 'Release and local diagnostics' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('3.6.1');
  await expect(dialog).toContainText('4.1.1');
  await expect(dialog).toContainText('se-tailoring-m1-m16-v3');
  await expect(dialog).toContainText(/(?:local-unattested|[0-9a-f]{40})/);
  await expect(dialog).toContainText('static-self-service-prototype');
  await expect(dialog).toContainText('The app sends no telemetry.');
  const closeButton = dialog.getByRole('button', { name: 'Close' });
  const downloadButton = dialog.getByRole('button', { name: 'Download local diagnostics' });
  await expect(closeButton).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(downloadButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Session actions' })).toBeFocused();
  expect(externalRequests).toEqual([]);
});

test('minimum-data export carries release and build producer identity', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  await clickSessionAction(page, 'Minimum-data Export');
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let text = '';
  for await (const chunk of stream) text += chunk.toString();
  const config = JSON.parse(text);

  expect(config._producer).toMatchObject({
    application: 'se-tailoring-app',
    appRelease: '3.6.1',
    frameworkVersion: '4.1.1',
    metricDefinitionSet: 'se-tailoring-m1-m16-v3',
    exchangeSchemaVersion: '2.0',
    operatingProfile: 'static-self-service-prototype',
    telemetry: 'none'
  });
  expect(config._producer.buildId).toMatch(/^(local-unattested|[0-9a-f]{40})$/);
});

test('mobile session menu keeps operational controls available without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const sessionMenu = page.getByRole('button', { name: 'Session actions' });
  await sessionMenu.click();
  await expect(sessionMenu).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('menuitem', { name: 'Diagnostics' }).click();
  await expect(page.getByRole('dialog', { name: 'Release and local diagnostics' })).toBeVisible();
  await page.keyboard.press('Escape');

  await sessionMenu.click();
  await expect(page.getByRole('menuitem', { name: 'End Session' })).toBeVisible();
});
