import { expect, test } from '@playwright/test';

const AUTOSAVE_KEY = 'se-tailoring-workspace-v1';

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
      const metric = page.locator(`.metric-item[data-metric-id="${metricId}"]`);
      if (!(await metric.evaluate(element => element.open))) {
        await metric.locator('summary.metric-header').click();
      }
      await metric.getByRole('radio', { name: new RegExp(`${metricId} score ${score}:`) }).check();
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

  await expect(page.getByLabel('0 of 16 metrics reviewed')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Work in Progress (0/16)' })).toBeVisible();
  await expect(page.getByRole('button', { name: /View Report/ })).toHaveCount(0);

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
  await metric.getByText(/How to choose a rating/).click();
  await expect(metric.getByText(/large inventory of independent, repeated elements/)).toBeVisible();

  await metric.getByRole('button', { name: 'Help me choose' }).click();
  await metric.getByRole('button', { name: 'Yes' }).click();
  for (let index = 0; index < 4; index += 1) {
    await metric.getByRole('button', { name: 'No' }).click();
  }
  await expect(metric.getByText('Recommended anchor 5')).toBeVisible();
  await expect(metric.getByText('Unreviewed — preview 3')).toBeVisible();
  await expect(metric.locator('input[type="radio"]:checked')).toHaveCount(0);

  await metric.getByRole('button', { name: 'Confirm anchor 5' }).click();
  await expect(metric.getByText('Assessed 1–5 score')).toBeVisible();
  await expect(metric.getByRole('radio', { name: /M1 score 5:/ })).toBeChecked();
  await expect(page.getByLabel('1 of 16 metrics reviewed')).toBeVisible();
  await expect(page.getByText('1/4 reviewed in this section')).toBeVisible();
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await expect(page.getByLabel('1 of 16 metrics reviewed')).toBeVisible();
});

test('confirmed anchor and project code survive route navigation and autosave restore', async ({ page }) => {
  await startFreshAssessment(page);

  await page.getByLabel('Project code').fill('PERSIST-04');
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();
  await page.getByRole('radio', { name: /M1 score 4:/ }).check();

  await page.getByRole('button', { name: 'Go to dashboard' }).click();
  await expect(page.getByText('1/16 reviewed')).toBeVisible();
  await page.getByRole('button', { name: 'Assessment', exact: true }).click();

  await page.getByRole('button', { name: 'Go to Project Info step' }).click();
  await expect(page.getByLabel('Project code')).toHaveValue('PERSIST-04');
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();
  const restoredM1 = page.locator('.metric-item[data-metric-id="M1"]');
  if (!(await restoredM1.evaluate(element => element.open))) {
    await restoredM1.locator('summary.metric-header').click();
  }
  await expect(restoredM1.getByRole('radio', { name: /M1 score 4:/ })).toBeChecked();
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await expect(page.getByLabel('1 of 16 metrics reviewed')).toBeVisible();

  await expect.poll(() => page.evaluate(key => {
    const workspace = JSON.parse(localStorage.getItem(key) || '{}');
    const saved = workspace.assessments?.find(entry => entry.id === workspace.activeId)?.data || {};
    const root = saved.assessmentTree?.nodes?.default;
    return `${saved.projectInfo?.name || ''}|${saved.scores?.M1 || ''}|${saved.metricAssessments?.M1?.status || ''}|${root?.scores?.M1 || ''}|${root?.manualMetrics?.includes('M1') ? 'manual' : ''}`;
  }, AUTOSAVE_KEY), { timeout: 8000 }).toBe('PERSIST-04|4|assessed|4|manual');

  await restoreAutosave(page);
  await page.getByRole('button', { name: 'Assessment', exact: true }).click();
  await page.getByRole('button', { name: 'Go to Project Info step' }).click();
  await expect(page.getByLabel('Project code')).toHaveValue('PERSIST-04');
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();
  const autosavedM1 = page.locator('.metric-item[data-metric-id="M1"]');
  if (!(await autosavedM1.evaluate(element => element.open))) {
    await autosavedM1.locator('summary.metric-header').click();
  }
  await expect(autosavedM1.getByRole('radio', { name: /M1 score 4:/ })).toBeChecked();
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await expect(page.getByLabel('1 of 16 metrics reviewed')).toBeVisible();
});

test('partial CSI response survives autosave restore without passing completeness', async ({ page }) => {
  await startFreshAssessment(page);

  await confirmAllMetrics(page, { M9: 4 });
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await page.getByLabel('CSI rationale and decision').fill('Draft feasibility rationale');
  await expect(page.locator('#csi-response-status')).toContainText('Incomplete:');
  await expect(page.getByRole('button', { name: 'Save Work in Progress (CSI 4 response required)' })).toBeVisible();

  await expect.poll(() => page.evaluate(key => {
    const workspace = JSON.parse(localStorage.getItem(key) || '{}');
    const saved = workspace.assessments?.find(entry => entry.id === workspace.activeId)?.data || {};
    const reviewedCount = Object.values(saved.metricAssessments || {}).filter(assessment => assessment.status === 'assessed').length;
    return `${saved.csiResponse?.rationaleDecision || ''}|${saved.assessmentTree?.nodes?.default?.csiResponse?.rationaleDecision || ''}|${reviewedCount}`;
  }, AUTOSAVE_KEY), { timeout: 8000 }).toBe('Draft feasibility rationale|Draft feasibility rationale|16');

  await restoreAutosave(page);
  await page.getByRole('button', { name: 'Assessment', exact: true }).click();
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await expect(page.getByLabel('CSI rationale and decision')).toHaveValue('Draft feasibility rationale');
  await expect(page.locator('#csi-response-status')).toContainText('Incomplete:');
  await expect(page.getByRole('button', { name: /View Report/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save Work in Progress (CSI 4 response required)' })).toBeVisible();
});

test('editing confirmed ratings recomputes a still-complete assessment automatically', async ({ page }) => {
  await startFreshAssessment(page);
  await confirmAllMetrics(page);
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await page.getByRole('button', { name: 'View Report' }).click();
  await expect(page.getByText('Pilot Tailoring Record')).toBeVisible();

  await page.getByRole('button', { name: 'Assessment', exact: true }).click();
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();
  await page.getByRole('radio', { name: /M1 score 4:/ }).check();
  await page.getByRole('button', { name: 'Go to dashboard' }).click();
  await expect(page.getByRole('button', { name: 'View report →', exact: true })).toBeVisible();
  await expect(page.getByText('16/16 reviewed')).toBeVisible();

  await page.getByRole('button', { name: 'Report', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pilot Tailoring Record', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download pilot HTML record', exact: true })).toBeVisible();
});

test('confirmed ratings make a report available automatically without a final check action', async ({ page }) => {
  await startFreshAssessment(page);
  await confirmAllMetrics(page, Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`M${i + 1}`, 1])));
  await page.getByRole('button', { name: 'Report', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pilot Tailoring Record', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Assessment', exact: true }).click();
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();
  await page.getByRole('checkbox', { name: 'Mark M1 Architectural Complexity as cannot assess yet' }).check();
  await page.getByRole('button', { name: 'Report', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Assessment Work in Progress' })).toBeVisible();
});

test('warning counts refresh in place and automatic completion is revoked when a record is reopened', async ({ page }) => {
  await startFreshAssessment(page);
  const scores = Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`M${i + 1}`, 1]));
  await confirmAllMetrics(page, { ...scores, M2: 5, M4: 3 });
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await page.getByRole('button', { name: 'Open checks · 4', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Open checks', exact: true })).toBeVisible();
  for (const [index, ruleId] of ['11', '8b', '16', '17'].entries()) {
    await page.getByLabel(`Rule ${ruleId} disposition outcome`, { exact: true }).selectOption(ruleId === '11' ? 'basic-evidence-justified' : 'accept-current');
    await page.getByLabel(`Rule ${ruleId} asserted owner or approver role`, { exact: true }).fill('Tutorial reviewer');
    await page.getByLabel(`Rule ${ruleId} evidence reference`, { exact: true }).fill('Synthetic SE-DEMO');
    await page.getByLabel(`Rule ${ruleId} review date`, { exact: true }).fill('2026-10-10');
    await page.getByLabel(ruleId === '11' ? 'Rule 11 disposition rationale' : `Rule ${ruleId} rationale and controls`, { exact: true }).fill('Tutorial decision only. Retain current levels with synthetic controls.');
    await expect(page.locator('.decision-workspace .status-count')).toHaveText(`${3 - index} open`);
    await expect(page.getByRole('button', { name: index === 3 ? 'Open checks' : `Open checks · ${3 - index}`, exact: true })).toBeVisible();
  }
  await expect(page.getByText('Software checks passed. Your report is available. External approval is not verified.', { exact: true })).toBeVisible();
  await page.getByText('Rule 17', { exact: true }).click();
  await page.getByLabel('Rule 17 evidence reference', { exact: true }).fill('');
  await expect(page.locator('.decision-workspace .status-count')).toHaveText('1 open');
  await expect(page.getByRole('button', { name: 'Open checks · 1', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Report', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Assessment Work in Progress' })).toBeVisible();
});

async function restoreWithDisposition(page, changes) {
  await expect.poll(async () => page.evaluate(key => {
    const workspace = JSON.parse(localStorage.getItem(key) || '{}');
    const saved = workspace.assessments?.find(entry => entry.id === workspace.activeId)?.data;
    return saved?.assessmentComplete;
  }, AUTOSAVE_KEY)).toBe(true);
  await page.evaluate(({ key, changes }) => {
    const workspace = JSON.parse(localStorage.getItem(key));
    const saved = workspace.assessments.find(entry => entry.id === workspace.activeId).data;
    Object.assign(saved, changes, { assessmentComplete: false });
    if (changes.assessmentDisposition) {
      saved.assessmentTree.nodes[saved.assessmentTree.activeId].assessmentDisposition = changes.assessmentDisposition;
    }
    localStorage.setItem(key, JSON.stringify(workspace));
  }, { key: AUTOSAVE_KEY, changes });
  await restoreAutosave(page);
  await page.goto('./#issues');
}

test('demo records offer a save action rather than an unavailable report', async ({ page }) => {
  await startFreshAssessment(page);
  await confirmAllMetrics(page, Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`M${i + 1}`, 1])));
  await restoreWithDisposition(page, { assessmentDisposition: 'demo' });
  await expect(page.getByRole('button', { name: 'Save Demonstration', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Report', exact: true })).toHaveCount(0);
  await page.goto('./#report');
  await expect(page.getByRole('heading', { name: 'Assessment Work in Progress' })).toBeVisible();
});

test('satisfied imported migration needs explicit review before a completed report', async ({ page }) => {
  await startFreshAssessment(page);
  await confirmAllMetrics(page, Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`M${i + 1}`, 1])));
  await restoreWithDisposition(page, { semanticMigration: { status: 'review-required', reassessmentMetrics: ['M3'] } });
  await expect(page.getByRole('button', { name: 'Review imported framework changes', exact: true })).toBeVisible();
  await page.goto('./#report');
  await expect(page.getByRole('heading', { name: 'Assessment Work in Progress' })).toBeVisible();
  await page.goto('./#issues');
  await page.getByRole('button', { name: 'Review imported framework changes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pilot Tailoring Report' })).toBeVisible();
  await expect.poll(async () => page.evaluate(key => {
    const workspace = JSON.parse(localStorage.getItem(key));
    return workspace.assessments.find(entry => entry.id === workspace.activeId).data.semanticMigration;
  }, AUTOSAVE_KEY)).toBe(null);
});
