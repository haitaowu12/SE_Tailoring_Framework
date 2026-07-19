import { expect, test } from '@playwright/test';
import { openSessionMenu } from './helpers.js';

const AUTOSAVE_KEY = 'se-tailoring-autosave';
const SECRET_PROJECT = 'CONFIDENTIAL-PROJECT-ALPHA';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});

test('shared-device restore prompt does not reveal a saved project identifier', async ({ page }) => {
  await page.evaluate(({ key, secret }) => {
    localStorage.setItem(key, JSON.stringify({
      projectInfo: { name: secret, team: 'CONFIDENTIAL-TEAM' },
      scores: { M1: 3 },
      assessmentDisposition: 'work-in-progress',
      savedAt: '2026-07-11T12:00:00.000Z'
    }));
  }, { key: AUTOSAVE_KEY, secret: SECRET_PROJECT });

  await page.reload();

  const restore = page.locator('#autosave-restore-overlay');
  await expect(restore).toBeVisible();
  await expect(restore).toHaveAttribute('role', 'dialog');
  await expect(restore).toContainText('Restore it only if this is your session.');
  await expect(restore).not.toContainText(SECRET_PROJECT);
  await expect(restore).not.toContainText('CONFIDENTIAL-TEAM');
  await expect(restore.getByRole('button', { name: 'Restore' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(restore.getByRole('button', { name: 'Start Fresh' })).toBeFocused();

  await restore.getByRole('button', { name: 'Start Fresh' }).click();
  await expect(restore).toHaveCount(0);
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), AUTOSAVE_KEY)).toBeNull();
});

test('end session confirmation erases the origin autosave and returns to a blank session', async ({ page }) => {
  await page.evaluate(key => {
    localStorage.setItem(key, JSON.stringify({
      projectInfo: { name: 'PILOT-DELETE-ME' },
      scores: { M1: 4 },
      assessmentDisposition: 'work-in-progress',
      savedAt: new Date().toISOString()
    }));
  }, AUTOSAVE_KEY);

  await openSessionMenu(page);
  await page.getByRole('button', { name: 'End Session' }).click();
  const dialog = page.getByRole('dialog', { name: 'End session and erase local assessment?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('starts a blank session');

  await dialog.getByRole('button', { name: 'End session—erase local assessment' }).click();
  await page.waitForLoadState('domcontentloaded');

  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), AUTOSAVE_KEY)).toBeNull();
  await expect(page.locator('#autosave-restore-overlay')).toHaveCount(0);
  await expect(page.getByText('Pilot research instrument.')).toBeVisible();
});

test('end-session critical path is keyboard operable and restores focus on Escape', async ({ page }) => {
  const endSession = page.getByRole('button', { name: 'End Session' });
  await openSessionMenu(page);
  await endSession.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'End session and erase local assessment?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Keep working' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Session actions' })).toBeFocused();
});

test('pilot notice and non-identifying assessment guidance remain visible', async ({ page }) => {
  await expect(page.getByText('Pilot research instrument.')).toBeVisible();
  await expect(page.getByText(/Use a non-identifying project code; do not enter sensitive information/)).toBeVisible();
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await expect(page.getByRole('complementary', { name: 'Formative pilot privacy notice' })).toBeHidden();

  await page.goto('./#assessment');
  await expect(page.getByLabel('Project code')).toHaveAttribute('placeholder', 'e.g., PILOT-07');
  await expect(page.getByLabel('Team code (optional)')).toHaveAttribute('placeholder', 'e.g., COHORT-B');
});
