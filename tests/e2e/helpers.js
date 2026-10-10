export async function openSessionMenu(page) {
  const trigger = page.getByRole('button', { name: 'Session actions' });
  if (await trigger.getAttribute('aria-expanded') !== 'true') {
    await trigger.click();
  }
}

export async function clickSessionAction(page, name) {
  await openSessionMenu(page);
  await page.getByRole('button', { name, exact: true }).click();
}

// Capture the actual top-of-page layout, rather than a scrolled keyboard-focus state.
export async function preparePageScreenshot(page) {
  await page.locator('#toast-container .toast').waitFor({ state: 'hidden' });
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().filter(animation => Number.isFinite(animation.effect?.getComputedTiming().iterations)).map(animation => animation.finished.catch(() => {})));
    document.activeElement?.blur();
    window.scrollTo({ top: 0, behavior: 'instant' });
    await new Promise(requestAnimationFrame);
  });
}
