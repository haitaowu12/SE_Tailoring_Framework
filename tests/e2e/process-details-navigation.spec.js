import { expect, test } from '@playwright/test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const metricScores = Object.fromEntries(
  Array.from({ length: 16 }, (_, index) => [`M${index + 1}`, 3])
);

const processLevels = Object.fromEntries(
  Array.from({ length: 22 }, (_, index) => [String(index + 9), 'standard'])
);

const metricAssessments = Object.fromEntries(
  Object.entries(metricScores).map(([metricId, score]) => [metricId, {
    score,
    status: 'assessed',
    definitionVersion: 3,
    qualifiers: [],
    rationale: 'Process-detail navigation fixture',
    evidenceRefs: []
  }])
);

function acceptedRequirementsArchitectureHandoff() {
  return {
    artifactId: 'ART:REQ-ARCH:default:process-detail-e2e',
    relationshipId: 'requirements-to-architecture',
    providerElementId: 'default',
    providerProcessId: 19,
    consumerElementId: 'default',
    consumerProcessId: 20,
    requiredContent: 'Baselined system requirements, constraints, interfaces, assumptions, and traceability.',
    acceptanceCriteria: 'Complete, consistent, feasible, traceable, and approved for architecture use.',
    evidenceStatus: 'accepted',
    evidenceRefs: 'REQ-BL-NAV-E2E; ARCH-ACCEPT-NAV-E2E',
    gaps: '',
    equivalentEvidence: '',
    acceptanceAuthority: 'Navigation E2E Chief Engineer',
    reviewDate: '2027-07-10'
  };
}

async function resetApp(page) {
  await page.goto('./');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
}

async function importFixture(page, config) {
  const dir = await mkdtemp(join(tmpdir(), 'se-tailoring-process-detail-'));
  const configPath = join(dir, 'process-detail-config.json');
  await writeFile(configPath, JSON.stringify(config));
  await resetApp(page);

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('#btn-import').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(configPath);
  await expect(page.getByText('Configuration imported successfully!')).toBeVisible();
}

function currentSemanticFixture() {
  return {
    _format: 'se-tailoring-config',
    _version: '2.0',
    semantics: {
      frameworkVersion: '4.1.0',
      metricDefinitionSet: 'se-tailoring-m1-m16-v3',
      qualifierSchemaVersion: '1.1'
    },
    projectInfo: { name: 'Navigation Fixture' },
    metricScores,
    metricAssessments,
    processLevels,
    manualAdjustments: {
      20: { level: 'comprehensive', justification: 'Approved architecture adjustment for navigation test' }
    },
    artifactHandoffs: [acceptedRequirementsArchitectureHandoff()],
    assessmentComplete: true
  };
}

test('report recommendation opens, reloads, and returns from the exact level details', async ({ page }) => {
  await importFixture(page, currentSemanticFixture());
  await page.goto('./#report');
  await page.getByRole('button', { name: 'Expand all' }).click();

  const profile = page.locator('.card', {
    has: page.getByRole('heading', { name: 'Full Process Tailoring Profile' })
  });
  await profile.getByRole('link', { name: 'View Comprehensive details for Architecture Definition' }).click();

  await expect(page).toHaveURL(/#processes\?process=20&level=comprehensive&source=report$/);
  await expect(page.locator('#process-detail-heading')).toHaveText('Architecture Definition');
  await expect(page.locator('#process-detail-heading')).toBeFocused();
  await expect(page.getByText('Recommended: Comprehensive')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Definition at Comprehensive' })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/#report$/);
  await expect(page.getByRole('heading', { name: /Tailoring Report/ })).toBeVisible();

  await page.goto('./#processes?process=20&level=comprehensive&source=report');
  await page.reload();
  await expect(page).toHaveURL(/#processes\?process=20&level=comprehensive&source=report$/);
  await expect(page.getByRole('heading', { name: 'Definition at Comprehensive' })).toBeVisible();
});

test('assessment recommendation saves work in progress before opening details', async ({ page }) => {
  await resetApp(page);
  await page.goto('./#assessment');
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();

  await page.getByRole('slider', { name: 'Score M1: Architectural Complexity' }).fill('4');
  await expect(page.locator('#score-M1')).toHaveText('4');
  await expect(page.getByText('Unable to render this section')).toHaveCount(0);

  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await page.locator('.results-breakdown > summary').click();
  await page.getByRole('link', { name: 'View Architecture Definition Standard details' }).click();

  await expect(page).toHaveURL(/#processes\?process=20&level=standard&source=assessment$/);
  await expect(page.getByRole('heading', { name: 'Definition at Standard' })).toBeVisible();
  await expect(page.getByText('Work in progress saved before opening process details.')).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/#assessment$/);
  await expect(page.getByRole('button', { name: /Complete Baseline/ })).toBeVisible();
});

test('malformed and unassessed direct links fail closed without a false assignment', async ({ page }) => {
  await resetApp(page);
  await page.goto('./#processes?process=999&level=expert&source=bad&extra=value');
  await expect(page.getByText('Some process-detail link information was ignored.')).toBeVisible();
  await expect(page.locator('#process-detail-heading')).toHaveCount(0);

  await page.goto('./#processes?process=20');
  await expect(page.getByText('No assessment assignment')).toBeVisible();
  await expect(page.getByText('No recommendation is assigned. Basic is shown for browsing only.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Definition at Basic' })).toBeVisible();
  await expect(page.getByText('Security evidence overlay')).toHaveCount(0);
});

test('search retains focus and a targeted mobile detail is brought into view', async ({ page }) => {
  await resetApp(page);
  await page.goto('./#processes');
  const search = page.getByRole('searchbox', { name: 'Search processes' });
  await search.fill('architecture');
  await expect(search).toBeFocused();
  await expect(page.getByRole('link', { name: /Open Architecture Definition/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open Project Planning/ })).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./#processes?process=20&level=standard&source=report');
  const heading = page.locator('#process-detail-heading');
  await expect(heading).toBeFocused();
  await expect(heading).toBeInViewport();
  await expect(page.getByRole('heading', { name: 'Definition at Standard' })).toBeVisible();
});
