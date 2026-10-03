import { expect, test } from '@playwright/test';
import { openSessionMenu } from './helpers.js';

test('default-motion scrolling reserves space for the sticky navigation bar', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 720 });
    await page.goto('./');
    await expect(page.getByRole('button', { name: 'Session actions' })).toBeVisible();
    const geometry = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const navbar = document.getElementById('navbar');
      return {
        behavior: style.scrollBehavior,
        paddingTop: parseFloat(style.scrollPaddingTop),
        headerHeight: navbar.getBoundingClientRect().height
      };
    });
    expect(geometry.behavior).toBe('auto');
    expect(geometry.headerHeight).toBeGreaterThan(0);
    expect(geometry.paddingTop).toBeGreaterThan(geometry.headerHeight);
  }
});

test('visible informational toast preserves announcements without intercepting pointer input', async ({ page }) => {
  await page.goto('./');
  await openSessionMenu(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Minimum-data Export', exact: true }).click();
  await download;
  const toast = page.locator('#toast-container .toast.success');
  await expect(toast).toBeVisible();
  await expect(toast).toHaveAttribute('role', 'status');
  await expect(toast).toHaveAttribute('aria-live', 'polite');
  await expect(toast).toContainText('It is not a completed-baseline record.');
  await expect(toast).toHaveCSS('pointer-events', 'none');
  const hit = await toast.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const target = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return { present: Boolean(target), isToast: Boolean(target?.closest('#toast-container')) };
  });
  expect(hit).toEqual({ present: true, isToast: false });
});
