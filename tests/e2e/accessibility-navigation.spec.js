import { expect, test } from '@playwright/test';
import { preparePageScreenshot } from './helpers.js';

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


test('Session actions stay readable and inside the viewport at mobile and laptop widths', async ({ page }, testInfo) => {
  await startBlank(page);
  await page.goto('./#report');
  const trigger = page.getByRole('button', { name: 'Session actions' });
  for (const width of [320, 390, 768, 1100, 1180, 1280, 1440]) {
    await page.setViewportSize({ width, height: 752 });
    await preparePageScreenshot(page);
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    for (const name of ['Import', 'Private backup', 'Minimum-data Export', 'Diagnostics', 'End Session']) {
      await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
    }
    const geometry = await page.locator('.session-menu .nav-dropdown-menu').evaluate(menu => {
      // Resolve OKLCH through the browser's sRGB canvas, rather than assume a
      // computed-style serialization. Paint the actual menu and button layers.
      const context = document.createElement('canvas').getContext('2d');
      const luminance = rgb => [...rgb].slice(0, 3).map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
      const background = getComputedStyle(menu).backgroundColor;
      const buttons = [...menu.querySelectorAll('button')].map(button => {
        const box = button.getBoundingClientRect();
        const style = getComputedStyle(button);
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = background;
        context.fillRect(0, 0, 1, 1);
        context.fillStyle = style.backgroundColor;
        context.fillRect(0, 0, 1, 1);
        const bg = luminance(context.getImageData(0, 0, 1, 1).data);
        context.fillStyle = style.color;
        context.fillRect(0, 0, 1, 1);
        const fg = luminance(context.getImageData(0, 0, 1, 1).data);
        const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        return { name: button.textContent, left: box.left, right: box.right, height: box.height,
          hit: hit === button || button.contains(hit), contrast: (Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05),
          textFits: button.scrollWidth <= button.clientWidth };
      });
      return { buttons, clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth };
    });
    expect(geometry.scrollWidth, `open menu overflows at ${width}px`).toBeLessThanOrEqual(geometry.clientWidth + 1);
    for (const button of geometry.buttons) {
      const label = `${button.name} at ${width}px`;
      expect(button.left, label).toBeGreaterThanOrEqual(0);
      expect(button.right, label).toBeLessThanOrEqual(geometry.clientWidth);
      expect(button.height, label).toBeGreaterThanOrEqual(40);
      expect(button.hit, label).toBe(true);
      expect(button.textFits, label).toBe(true);
      expect(button.contrast, label).toBeGreaterThanOrEqual(4.5);
    }
    if ([390, 1180].includes(width)) {
      await page.screenshot({ path: testInfo.outputPath(`session-menu-${width}.png`), animations: 'disabled' });
    }
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  }
});

test('Session keyboard access reaches private backup and restores focus after cancellation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 752 });
  await startBlank(page);
  const trigger = page.getByRole('button', { name: 'Session actions' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Import', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  const backup = page.getByRole('button', { name: 'Private backup', exact: true });
  await expect(backup).toBeFocused();
  await expect(backup).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Download a private assessment backup?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Other assessments in the library are not included.');
  await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});
