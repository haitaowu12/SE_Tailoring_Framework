import { expect, test } from '@playwright/test';

async function startBlank(page) {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: /Right-size the work/i })).toBeVisible();
}

function describeWideElements() {
  return page => page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const offenders = [];
    const all = Array.from(document.body.querySelectorAll('*'));
    const getSelector = (element) => {
      if (!element || element === document.documentElement) return 'html';
      if (element.id) return `#${element.id}`;
      if (!element.parentElement) return element.tagName.toLowerCase();
      const siblings = Array.from(element.parentElement.children).filter(child => child.tagName === element.tagName);
      const index = siblings.indexOf(element) + 1;
      return `${getSelector(element.parentElement)} > ${element.tagName.toLowerCase()}:nth-of-type(${index})`;
    };

    for (const element of all) {
      const rect = element.getBoundingClientRect();
      if (!Number.isFinite(rect.width) || !Number.isFinite(rect.height) || rect.width <= 0 || rect.height <= 0) continue;
      if (rect.width > viewportWidth + 1) {
        const computed = getComputedStyle(element);
        if (computed.display === 'none' || computed.visibility === 'hidden') continue;
        offenders.push({
          selector: getSelector(element),
          width: Math.round(rect.width),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          viewport: viewportWidth
        });
      }
    }

    offenders.sort((a, b) => b.width - a.width);
    return {
      viewportWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
      topOffenders: offenders.slice(0, 20)
    };
  });
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
    const overflowReport = await describeWideElements()(page);
    console.log(JSON.stringify(overflowReport, null, 2));
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
