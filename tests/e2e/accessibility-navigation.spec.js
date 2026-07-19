import { expect, test } from '@playwright/test';

async function startBlank(page) {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: /Right-size the work/i })).toBeVisible();
}

test('skip navigation and route changes move keyboard focus to meaningful content', async ({ page }) => {
  await startBlank(page);

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  await page.getByRole('button', { name: 'Assess', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Assessment', exact: true })).toBeFocused();
});

test('dashboard and assessment reflow without page-level horizontal scrolling at 320 CSS pixels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await startBlank(page);

  const assertNoPageOverflow = async () => {
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  };

  await assertNoPageOverflow();
  await page.locator('#mobile-route-select').selectOption('assessment');
  await expect(page.getByRole('heading', { name: 'Assessment', exact: true })).toBeVisible();
  await assertNoPageOverflow();
});
