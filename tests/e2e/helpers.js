export async function openSessionMenu(page) {
  const trigger = page.getByRole('button', { name: 'Session actions' });
  if (await trigger.getAttribute('aria-expanded') !== 'true') {
    await trigger.click();
  }
}

export async function clickSessionAction(page, name) {
  await openSessionMenu(page);
  await page.getByRole('menuitem', { name, exact: true }).click();
}
