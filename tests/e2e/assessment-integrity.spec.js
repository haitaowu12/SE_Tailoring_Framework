import { expect, test } from '@playwright/test';

const AUTOSAVE_KEY = 'se-tailoring-autosave';

async function startFreshAssessment(page) {
  await page.goto('./');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('./#assessment');
}

async function restoreAutosave(page) {
  await page.reload();
  const restore = page.locator('#autosave-restore-overlay');
  await expect(restore).toBeVisible();
  await restore.getByRole('button', { name: 'Restore' }).click();
  await expect(page).toHaveURL(/#dashboard$/);
}

async function confirmAllMetrics(page, scoreOverrides = {}) {
  const steps = [
    ['System Complexity', ['M1', 'M2', 'M3', 'M4']],
    ['Safety & Criticality', ['M5', 'M6', 'M7', 'M8']],
    ['Project Constraints', ['M9', 'M10', 'M11', 'M12']],
    ['Stakeholder Context', ['M13', 'M14', 'M15', 'M16']]
  ];
  for (const [step, metricIds] of steps) {
    await page.getByRole('button', { name: `Go to ${step} step` }).click();
    for (const metricId of metricIds) {
      const score = scoreOverrides[metricId] || 3;
      await page.getByRole('radio', { name: new RegExp(`${metricId} score ${score}:`) }).check();
    }
  }
}

test('untouched preview values remain 0 of 16 reviewed and cannot produce a pilot report', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('./#assessment');

  await page.getByRole('button', { name: 'Go to Results step' }).click();

  await expect(page.getByText('0/16 reviewed')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Work in Progress (0/16)' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Pass Software Completeness Checks/ })).toHaveCount(0);

  await page.goto('./#report');
  await expect(page.getByRole('heading', { name: 'Assessment Work in Progress' })).toBeVisible();
  await expect(page.getByText(/0\/16 metric judgments are confirmed/)).toBeVisible();
  await expect(page.getByRole('button', { name: /HTML report/i })).toHaveCount(0);
});

test('five-anchor choices expose provisional guidance and wizard recommendations require confirmation', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('./#assessment');
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();

  const metric = page.locator('.metric-item[data-metric-id="M1"]');
  await expect(metric.getByRole('radio')).toHaveCount(5);
  await expect(metric.locator('input[type="radio"]:checked')).toHaveCount(0);
  await metric.getByText(/Provisional assessor guidance/).click();
  await expect(metric.getByText(/large inventory of independent, repeated elements/)).toBeVisible();

  await metric.getByRole('button', { name: 'Help me choose' }).click();
  await metric.getByRole('button', { name: 'Yes' }).click();
  for (let index = 0; index < 3; index += 1) {
    await metric.getByRole('button', { name: 'No' }).click();
  }
  await expect(metric.getByText('Recommended anchor 5')).toBeVisible();
  await expect(metric.getByText('Unreviewed — preview 3')).toBeVisible();
  await expect(metric.locator('input[type="radio"]:checked')).toHaveCount(0);

  await metric.getByRole('button', { name: 'Confirm anchor 5' }).click();
  await expect(metric.getByText('Assessed 1–5 score')).toBeVisible();
  await expect(metric.getByRole('radio', { name: /M1 score 5:/ })).toBeChecked();
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await expect(page.getByText('1/16 reviewed')).toBeVisible();
});

test('confirmed anchor and project code survive route navigation and autosave restore', async ({ page }) => {
  await startFreshAssessment(page);

  await page.getByLabel('Project code').fill('PERSIST-04');
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();
  await page.getByRole('radio', { name: /M1 score 4:/ }).check();

  await page.getByRole('button', { name: 'Go to dashboard' }).click();
  await expect(page.getByText('1/16 reviewed')).toBeVisible();
  await page.getByRole('button', { name: 'Assess', exact: true }).click();

  await page.getByRole('button', { name: 'Go to Project Info step' }).click();
  await expect(page.getByLabel('Project code')).toHaveValue('PERSIST-04');
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();
  await expect(page.getByRole('radio', { name: /M1 score 4:/ })).toBeChecked();
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await expect(page.getByText('1/16 reviewed')).toBeVisible();

  await expect.poll(() => page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    const root = saved.assessmentTree?.nodes?.default;
    return `${saved.projectInfo?.name || ''}|${saved.scores?.M1 || ''}|${saved.metricAssessments?.M1?.status || ''}|${root?.scores?.M1 || ''}|${root?.manualMetrics?.includes('M1') ? 'manual' : ''}`;
  }, AUTOSAVE_KEY), { timeout: 8000 }).toBe('PERSIST-04|4|assessed|4|manual');

  await restoreAutosave(page);
  await page.getByRole('button', { name: 'Assess', exact: true }).click();
  await page.getByRole('button', { name: 'Go to Project Info step' }).click();
  await expect(page.getByLabel('Project code')).toHaveValue('PERSIST-04');
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();
  await expect(page.getByRole('radio', { name: /M1 score 4:/ })).toBeChecked();
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await expect(page.getByText('1/16 reviewed')).toBeVisible();
});

test('partial CSI response survives autosave restore without passing completeness', async ({ page }) => {
  await startFreshAssessment(page);

  await confirmAllMetrics(page, { M9: 4 });
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await page.getByLabel('CSI rationale and decision').fill('Draft feasibility rationale');
  await expect(page.locator('#csi-response-status')).toContainText('Incomplete:');
  await expect(page.getByRole('button', { name: 'Save Work in Progress (CSI 4 response required)' })).toBeVisible();

  await expect.poll(() => page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    const reviewedCount = Object.values(saved.metricAssessments || {}).filter(assessment => assessment.status === 'assessed').length;
    return `${saved.csiResponse?.rationaleDecision || ''}|${saved.assessmentTree?.nodes?.default?.csiResponse?.rationaleDecision || ''}|${reviewedCount}`;
  }, AUTOSAVE_KEY), { timeout: 8000 }).toBe('Draft feasibility rationale|Draft feasibility rationale|16');

  await restoreAutosave(page);
  await page.getByRole('button', { name: 'Assess', exact: true }).click();
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await expect(page.getByLabel('CSI rationale and decision')).toHaveValue('Draft feasibility rationale');
  await expect(page.locator('#csi-response-status')).toContainText('Incomplete:');
  await expect(page.getByRole('button', { name: /Pass Software Completeness Checks/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save Work in Progress (CSI 4 response required)' })).toBeVisible();
});

test('editing a completed baseline immediately demotes it to work in progress', async ({ page }) => {
  await startFreshAssessment(page);
  await confirmAllMetrics(page);
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await page.getByRole('button', { name: 'Pass Software Completeness Checks' }).click();
  await expect(page.getByText('Pilot Tailoring Record')).toBeVisible();

  await page.getByRole('button', { name: 'Assess', exact: true }).click();
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();
  await page.getByRole('radio', { name: /M1 score 4:/ }).check();
  await page.getByRole('button', { name: 'Go to dashboard' }).click();
  await expect(page.getByText('Work in progress', { exact: true })).toBeVisible();
  await expect(page.getByText('16/16 reviewed')).toBeVisible();

  await page.getByRole('button', { name: 'Report', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Assessment Work in Progress' })).toBeVisible();
  await expect(page.getByRole('button', { name: /HTML report/i })).toHaveCount(0);
});
