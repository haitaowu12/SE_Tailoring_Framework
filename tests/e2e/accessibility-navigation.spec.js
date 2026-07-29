import { expect, test } from '@playwright/test';

async function startBlank(page) {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: /Right-size the work/i })).toBeVisible();
}

test('skip navigation and route changes move keyboard focus to meaningful content', async ({ page, browserName }) => {
  await startBlank(page);

  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  if (browserName === 'webkit') {
    // WebKit's macOS test runtime does not enable system-wide Tab-to-link navigation.
    await skipLink.focus();
  } else {
    await page.keyboard.press('Tab');
  }
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  await page.getByRole('button', { name: 'Assessment', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Set up the assessment', exact: true })).toBeFocused();
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
  await expect(page.getByRole('heading', { name: 'Set up the assessment', exact: true })).toBeVisible();
  await assertNoPageOverflow();
});

test('Framework reference menu is visible and keyboard-operable on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await startBlank(page);

  const trigger = page.getByRole('button', { name: /Framework reference/ });
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const firstReference = page.getByRole('button', { name: 'Vee Model', exact: true });
  await expect(firstReference).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(firstReference).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
});
