import { expect, test } from '@playwright/test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { METRIC_PROCESS_MAP } from '../../src/data/se-tailoring-data.js';
import { runFullAssessment } from '../../src/utils/assessment-engine.js';

const metricScores = Object.fromEntries(Array.from({ length: 16 }, (_, index) => [`M${index + 1}`, 3]));
metricScores.M5 = 4;
metricScores.M6 = 4;
metricScores.M8 = 4;

const sharedContext = {
  familyId: 'CYBER-PHYSICAL-HAZARDS',
  episodeId: 'EVENT-H17',
  eventRef: 'Hazard scenario H-17',
  artifactRefs: ['HAZLOG-17', 'FTA-17'],
  assumptionsRef: 'ASSUMPTIONS-9',
  assessorId: 'Joint assurance team',
  consequencePathway: 'Shared scenario analysis'
};

const metricAssessments = Object.fromEntries(Object.entries(metricScores).map(([metricId, score]) => [metricId, {
  score,
  status: 'assessed',
  definitionVersion: 3,
  qualifiers: [],
  rationale: 'Correlated-evidence E2E fixture',
  evidenceRefs: [],
  ...(metricId === 'M5' || metricId === 'M6' || metricId === 'M8'
    ? { evidenceContext: { ...sharedContext } }
    : {})
}]));

const assessmentResult = runFullAssessment(metricScores, METRIC_PROCESS_MAP, { metricAssessments });

const acceptedHandoff = {
  artifactId: 'ART:REQ-ARCH:default:architecture-input',
  relationshipId: 'requirements-to-architecture',
  providerElementId: 'default',
  providerProcessId: 19,
  consumerElementId: 'default',
  consumerProcessId: 20,
  requiredContent: 'Baselined requirements, interfaces, constraints, assumptions, and traceability.',
  acceptanceCriteria: 'Complete, consistent, feasible, traceable, and accepted for architecture use.',
  evidenceStatus: 'accepted',
  evidenceRefs: 'REQ-BL-17; ARCH-RVW-17',
  gaps: '',
  equivalentEvidence: '',
  acceptanceAuthority: 'Chief Engineer',
  reviewDate: '2099-12-31'
};

async function importCorrelatedFixture(page) {
  const dir = await mkdtemp(join(tmpdir(), 'se-tailoring-correlated-evidence-'));
  const configPath = join(dir, 'correlated-evidence.json');
  await writeFile(configPath, JSON.stringify({
    _format: 'se-tailoring-config',
    _version: '2.0',
    semantics: {
      frameworkVersion: '4.1.0',
      metricDefinitionSet: 'se-tailoring-m1-m16-v3',
      qualifierSchemaVersion: '1.1'
    },
    projectInfo: { name: 'Correlated Evidence Browser Proof', team: 'Joint Assurance' },
    metricScores,
    metricAssessments,
    processLevels: assessmentResult.levels,
    derivedLevels: assessmentResult.derived,
    derivationDetails: assessmentResult.derivationDetails,
    overrides: assessmentResult.overrides,
    activeFloors: assessmentResult.activeFloors,
    violations: assessmentResult.violations,
    fixes: assessmentResult.fixes,
    confidence: assessmentResult.confidence,
    artifactHandoffs: [acceptedHandoff],
    assessmentComplete: true
  }));

  await page.goto('./');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  const chooser = page.waitForEvent('filechooser');
  await page.locator('#btn-import').click();
  await (await chooser).setFiles(configPath);
  await expect(page.getByText('Configuration imported successfully!')).toBeVisible();
}

async function resultLevels(page) {
  return page.locator('.results-breakdown .result-card').evaluateAll(cards => cards.map(card => ({
    process: card.querySelector('.result-process')?.textContent.trim(),
    level: card.querySelector('.level-badge')?.textContent.trim()
  })));
}

test('correlated-evidence warning is visible and distinct consequence pathways resolve it without changing scores or levels', async ({ page }) => {
  await importCorrelatedFixture(page);
  await page.goto('./#report');

  await expect(page.getByRole('heading', { name: /Correlated Evidence Review \(1\)/ })).toBeVisible();
  await expect(page.getByText(/M5, M6, M8 reuse the same evidence context/)).toBeVisible();
  await expect(page.getByText(/does not change scores, recommended levels, or closure/)).toBeVisible();

  await page.goto('./#assessment');
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await expect(page.getByText(/Correlated evidence review \(1\)/)).toBeVisible();
  await expect(page.locator('.results-breakdown .result-card')).toHaveCount(22);
  const levelsBefore = await resultLevels(page);

  await page.getByRole('button', { name: 'Go to Safety & Criticality step' }).click();
  const scoresBefore = await Promise.all(['M5', 'M6', 'M8'].map(id => page.locator(`#score-${id}`).textContent()));
  for (const [metricId, note] of [
    ['M5', 'Personnel injury through unsafe actuation and failed protective response.'],
    ['M6', 'Loss of passenger service, operational recovery capacity, and mission continuity.'],
    ['M8', 'Unauthorized control-state manipulation across the security boundary.']
  ]) {
    const metricCard = page.locator('.metric-item').filter({ has: page.locator(`#slider-${metricId}`) });
    await metricCard.getByText('Justification note').click();
    await page.locator(`#metric-note-${metricId}`).fill(note);
  }
  const scoresAfter = await Promise.all(['M5', 'M6', 'M8'].map(id => page.locator(`#score-${id}`).textContent()));
  await page.getByRole('button', { name: 'Go to Results step' }).click();

  await expect(page.getByText(/Correlated evidence review/)).toHaveCount(0);
  await expect(page.locator('.results-breakdown .result-card')).toHaveCount(22);
  expect(scoresAfter).toEqual(scoresBefore);
  expect(await resultLevels(page)).toEqual(levelsBefore);
});
