import { expect, test } from '@playwright/test';

async function openHelp(page, topic = '') {
  await page.goto(`./#help${topic ? `?topic=${topic}` : ''}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Choose the systems engineering work your project needs', exact: true })).toBeVisible();
}

async function expectOpenAndFocused(disclosure) {
  await expect(disclosure).toHaveJSProperty('open', true);
  await expect(disclosure.locator('summary').first()).toBeFocused();
}

test('Help keeps quick start visible and advanced guidance in keyboard-operable disclosures', async ({ page }) => {
  await openHelp(page);
  await expect(page.getByText('Prototype use only.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Start with one system or project' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start or continue assessment' })).toBeVisible();
  await expect(page.locator('#help-example')).toHaveJSProperty('open', false);
  await expect(page.locator('#help-adapt')).toHaveJSProperty('open', false);
  await expect(page.locator('#help-terms details[open]')).toHaveCount(0);

  const example = page.locator('#help-example');
  await example.locator('summary').focus();
  await page.keyboard.press('Space');
  await expectOpenAndFocused(example);
  await expect(example.getByText(/observed outcome separately from your opinion/)).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(example).toHaveJSProperty('open', false);

  const approval = page.locator('#help-terms details').filter({ hasText: 'Does a complete assessment mean the project is approved?' });
  await approval.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expectOpenAndFocused(approval);
  await expect(approval.getByText(/does not check whether all project evidence is present/)).toBeVisible();
});

test('Help topic links open and focus their target through Back, Forward, and repeated clicks', async ({ page }) => {
  await openHelp(page);
  const topics = page.getByRole('navigation', { name: 'Help topics' });
  await topics.getByRole('link', { name: 'Worked example', exact: true }).click();
  await expect(page).toHaveURL(/#help\?topic=example$/);
  await expectOpenAndFocused(page.locator('#help-example'));

  await topics.getByRole('link', { name: 'Adapt the framework', exact: true }).click();
  await expectOpenAndFocused(page.locator('#help-adapt'));
  await page.goBack();
  await expect(page).toHaveURL(/#help\?topic=example$/);
  await expectOpenAndFocused(page.locator('#help-example'));
  await page.goForward();
  await expect(page).toHaveURL(/#help\?topic=adapt$/);
  const adaptation = page.locator('#help-adapt');
  await expectOpenAndFocused(adaptation);
  await page.keyboard.press('Space');
  await expect(adaptation).toHaveJSProperty('open', false);
  await topics.getByRole('link', { name: 'Adapt the framework', exact: true }).click();
  await expectOpenAndFocused(adaptation);
});

test('all existing Help deep links reach a visible focused destination at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const topic of ['start', 'example', 'adapt', 'terms']) {
    await openHelp(page, topic);
    const target = page.locator(`#help-${topic}`);
    const focusTarget = target.locator('summary, h2').first();
    await expect(focusTarget).toBeFocused();
    await expect(focusTarget).toBeInViewport();
    if (['example', 'adapt'].includes(topic)) await expect(target).toHaveJSProperty('open', true);
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width + 1);
  }
});

test('an unknown Help topic keeps the quick start usable and does not open advanced guidance', async ({ page }) => {
  await openHelp(page, 'not-a-topic');
  await expect(page.locator('.help-guide details[open]')).toHaveCount(0);
  await page.getByRole('link', { name: 'Start or continue assessment' }).click();
  await expect(page).toHaveURL(/#assessment$/);
  await expect(page.getByRole('heading', { name: 'Set up the assessment', exact: true })).toBeVisible();
});
