import { expect, test } from '@playwright/test';

async function startBlank(page) {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: /Plan the systems engineering your project needs/i })).toBeVisible();
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


test('laptop-width navigation never covers Library and its hit target opens Workspace', async ({ page }) => {
  for (const width of [1100, 1101, 1172, 1200, 1279, 1280, 1399, 1439, 1440]) {
    await page.setViewportSize({ width, height: 752 });
    await startBlank(page);
    await page.goto('./#assessment');
    const library = page.getByRole('button', { name: 'Open assessment library', exact: true });
    const reference = page.getByRole('button', { name: /Framework reference/ });
    await expect(library).toBeVisible();
    // At the narrow breakpoint, either supported layout must keep the route
    // control usable; wider desktop sizes must retain Framework reference.
    if (width >= 1172) await expect(reference).toBeVisible();
    const desktopNavigation = await reference.isVisible();
    if (!desktopNavigation) await expect(page.getByRole('combobox', { name: 'Go to section' })).toBeVisible();
    const geometry = await page.evaluate(() => {
      const library = document.getElementById('btn-workspace-library');
      const reference = document.querySelector('.nav-links .nav-dropdown-trigger');
      const box = library.getBoundingClientRect();
      const ref = reference.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return { hitLibrary: library === hit || library.contains(hit), referenceRight: ref.right, libraryLeft: box.left };
    });
    if (desktopNavigation) expect(geometry.referenceRight, `reference overlaps Library at ${width}px`).toBeLessThanOrEqual(geometry.libraryLeft);
    expect(geometry.hitLibrary, `Library pointer intercepted at ${width}px`).toBe(true);
    await library.click();
    await expect(page.getByRole('heading', { name: /Plan the systems engineering your project needs/i })).toBeVisible();
    if (desktopNavigation) await expect(reference).toHaveAttribute('aria-expanded', 'false');
  }
});
