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
    score, status: 'assessed', definitionVersion: 3, qualifiers: [], rationale: 'E2E fixture confirmation', evidenceRefs: []
  }])
);

function acceptedRequirementsArchitectureHandoff(elementId = 'default') {
  return {
    artifactId: `ART:REQ-ARCH:${elementId}:e2e-accepted-input`,
    relationshipId: 'requirements-to-architecture',
    providerElementId: elementId,
    providerProcessId: 19,
    consumerElementId: elementId,
    consumerProcessId: 20,
    requiredContent: 'Baselined system requirements, constraints, interfaces, assumptions, and traceability.',
    acceptanceCriteria: 'Complete, consistent, feasible, traceable, and approved for architecture use.',
    evidenceStatus: 'accepted',
    evidenceRefs: 'REQ-BL-E2E; ARCH-ACCEPT-E2E',
    gaps: '',
    equivalentEvidence: '',
    acceptanceAuthority: 'E2E Chief Engineer',
    reviewDate: '2027-07-10'
  };
}

async function importFixture(page, config, filename) {
  const dir = await mkdtemp(join(tmpdir(), 'se-tailoring-import-'));
  const configPath = join(dir, filename);
  await writeFile(configPath, JSON.stringify(config));

  await page.goto('./');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('#btn-import').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(configPath);

  await expect(page.getByText('Configuration imported successfully!')).toBeVisible();
}

async function openReportFromNavigation(page) {
  await page.getByRole('button', { name: 'Output ▾' }).click();
  await page.getByRole('menuitem', { name: 'Report' }).click();
}

async function dispositionOtherTriggeredWarnings(page) {
  const sections = page.locator('.warning-disposition');
  const count = await sections.count();
  for (let index = 0; index < count; index += 1) {
    const section = sections.nth(index);
    await section.locator('.warning-outcome').selectOption('accept-current');
    await section.locator('.warning-owner').fill('Programme Chief Engineer');
    await section.locator('.warning-evidence').fill(`WARN-E2E-${index + 1}`);
    await section.locator('.warning-date').fill('2027-07-10');
    await section.locator('.warning-rationale').fill('Current levels accepted with documented controls for this isolated Rule 11 browser scenario.');
    await expect(section.locator('.warning-disposition-summary')).toHaveText('complete');
  }
}

test('legacy import is preserved but blocked pending M6/M8/M15 reassessment', async ({ page }) => {
  await importFixture(page, {
    _format: 'se-tailoring-config',
    projectInfo: { name: 'Legacy Import Smoke', team: 'Stakeholder Review' },
    metricScores,
    processLevels,
    manualAdjustments: {
      9: { level: 'comprehensive', justification: 'Stakeholder-directed planning rigor' }
    },
    assessmentComplete: true
  }, 'legacy-config.json');

  await expect(page.getByText('Semantic migration required')).toBeVisible();
  await expect(page.getByText(/M6 Mission\/Operational, M8 Security Consequence, and M15 External Assurance must be reassessed/)).toBeVisible();

  await openReportFromNavigation(page);
  await expect(page).toHaveURL(/#report$/);
  await expect(page.getByText('Assessment Work in Progress')).toBeVisible();
});

test('schema 2.0 import remains reportable and canonical matrix is read-only', async ({ page }) => {
  await importFixture(page, {
    _format: 'se-tailoring-config',
    _version: '2.0',
    semantics: {
      frameworkVersion: '4.1.0',
      metricDefinitionSet: 'se-tailoring-m1-m16-v3',
      qualifierSchemaVersion: '1.1'
    },
    projectInfo: { name: 'Current Semantic Import Smoke', team: 'Stakeholder Review' },
    metricScores,
    metricAssessments,
    processLevels,
    manualAdjustments: {
      9: { level: 'comprehensive', justification: 'Stakeholder-directed planning rigor' }
    },
    artifactHandoffs: [acceptedRequirementsArchitectureHandoff()],
    assessmentComplete: true
  }, 'schema-2-config.json');

  await openReportFromNavigation(page);
  await expect(page).toHaveURL(/#report$/);
  await expect(page.getByText('Tailoring Report')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Current Semantic Import Smoke' })).toBeVisible();
  await expect(page.getByText('Ready for review')).toBeVisible();

  await page.goto('./#matrix');
  await expect(page).toHaveURL(/#matrix$/);
  await expect(page.getByText(/Read-only canonical 102-cell process–metric map/)).toBeVisible();
  const canonicalCell = page.locator('.matrix-cell[data-pid="9"][data-mid="M1"]');
  await expect(canonicalCell).not.toHaveAttribute('role', 'button');
  await expect(page.locator('.clickable-cell')).toHaveCount(0);
  const canonicalValue = await canonicalCell.textContent();
  await canonicalCell.click();
  await expect(canonicalCell).toHaveText(canonicalValue || '');
  await expect(page.getByRole('link', { name: 'View Comprehensive details for Project Planning' }))
    .toHaveAttribute('href', '#processes?process=9&level=comprehensive&source=matrix');

  await page.goto('./#report');
  await expect(page.locator('tr', { hasText: 'Project Planning' })).toContainText('C');
  await expect(page.getByText('Ready for review')).toBeVisible();
});

test('assessment UI exposes all M15 scopes and labels implicit scores as work in progress', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('./#assessment');

  await page.getByRole('button', { name: 'Go to Stakeholder Context step' }).click();
  await expect(page.locator('.assurance-scope')).toHaveCount(8);
  await expect(page.getByText(/Risk Management.*driver-only/)).toBeVisible();
  await expect(page.getByText(/Configuration Management.*floor-capable/)).toBeVisible();
  await expect(page.getByText(/Disposal.*driver-only/)).toBeVisible();

  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await expect(page.getByText(/Work-in-progress preview — not a baseline/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Save Work in Progress \(0\/16\)/ })).toBeVisible();
});

test('Rule 11 warning remains visible and can be dispositioned before baselining', async ({ page }) => {
  const rule11Scores = Object.fromEntries(Array.from({ length: 16 }, (_, index) => [`M${index + 1}`, 1]));
  rule11Scores.M1 = 3;
  rule11Scores.M2 = 5;
  rule11Scores.M4 = 5;
  const rule11Assessments = Object.fromEntries(Object.entries(rule11Scores).map(([metricId, score]) => [metricId, {
    score, status: 'assessed', definitionVersion: 3, qualifiers: [], rationale: 'Rule 11 E2E fixture', evidenceRefs: []
  }]));
  const rule11Levels = { ...Object.fromEntries(Array.from({ length: 22 }, (_, index) => [String(index + 9), 'basic'])), 25: 'comprehensive', 27: 'basic' };

  await importFixture(page, {
    _format: 'se-tailoring-config',
    _version: '2.0',
    semantics: {
      frameworkVersion: '4.1.0',
      metricDefinitionSet: 'se-tailoring-m1-m16-v3',
      qualifierSchemaVersion: '1.1'
    },
    projectInfo: { name: 'Rule 11 Disposition Smoke' },
    metricScores: rule11Scores,
    metricAssessments: rule11Assessments,
    processLevels: rule11Levels,
    artifactHandoffs: [acceptedRequirementsArchitectureHandoff()],
    violations: [{ ruleId: 11, type: 'WN', affectedProcess: 27, currentLevel: 'basic', requiredLevel: 'standard', label: 'Verification ≥ Comprehensive → Validation ≥ Standard' }],
    assessmentComplete: true
  }, 'rule11-config.json');

  await page.goto('./#assessment');
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await expect(page.getByText(/Rule 11 \/ P12 disposition required/)).toBeVisible();
  await expect(page.getByText(/Rule 11 \[WN\]/)).toBeVisible();

  await page.locator('#rule11-outcome').selectOption('basic-evidence-justified');
  await page.locator('#rule11-owner').fill('Programme Chief Engineer');
  await page.locator('#rule11-evidence').fill('VAL-NOTE-11');
  await page.locator('#rule11-date').fill('2026-07-10');
  await page.locator('#rule11-rationale').fill('Basic operational evidence accepted with parent-level validation and interface acceptance controls.');
  await expect(page.getByText('Disposition complete.')).toBeVisible();
  await dispositionOtherTriggeredWarnings(page);
  await page.getByRole('button', { name: 'Complete Baseline' }).click();
  await expect(page).toHaveURL(/#report$/);
  await expect(page.getByText(/Rule 11 Disposition — Complete/)).toBeVisible();
  await expect(page.getByText(/\[WN\] Rule 11/)).toBeVisible();
  await expect(page.getByText('VAL-NOTE-11')).toBeVisible();
});

test('Rule 11 elevated-validation creates a traceable manual P27 Standard adjustment', async ({ page }) => {
  const scores = Object.fromEntries(Array.from({ length: 16 }, (_, index) => [`M${index + 1}`, 1]));
  scores.M1 = 3;
  scores.M2 = 5;
  scores.M4 = 5;
  const assessments = Object.fromEntries(Object.entries(scores).map(([metricId, score]) => [metricId, {
    score, status: 'assessed', definitionVersion: 3, qualifiers: [], rationale: 'Rule 11 elevation fixture', evidenceRefs: []
  }]));

  await importFixture(page, {
    _format: 'se-tailoring-config',
    _version: '2.0',
    semantics: {
      frameworkVersion: '4.1.0',
      metricDefinitionSet: 'se-tailoring-m1-m16-v3',
      qualifierSchemaVersion: '1.1'
    },
    projectInfo: { name: 'Rule 11 Elevation Smoke' },
    metricScores: scores,
    metricAssessments: assessments,
    processLevels: Object.fromEntries(Array.from({ length: 22 }, (_, index) => [String(index + 9), 'basic'])),
    artifactHandoffs: [acceptedRequirementsArchitectureHandoff()],
    assessmentComplete: true
  }, 'rule11-elevation-config.json');

  await page.goto('./#assessment');
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await expect(page.getByText(/Rule 11 \/ P12 disposition required/)).toBeVisible();

  await page.locator('#rule11-outcome').selectOption('elevated-validation');
  await page.locator('#rule11-owner').fill('Programme Chief Engineer');
  await page.locator('#rule11-evidence').fill('VAL-ELEVATE-11');
  await page.locator('#rule11-date').fill('2026-07-10');
  await page.locator('#rule11-rationale').fill('Validation is elevated to Standard for stakeholder acceptance assurance.');
  await expect(page.getByText(/Ready: completing the baseline will create an explicit governed manual adjustment/)).toBeVisible();
  await dispositionOtherTriggeredWarnings(page);
  await page.getByRole('button', { name: /Apply P27 Adjustment & Complete Baseline/ }).click();

  await expect(page).toHaveURL(/#report$/);
  await expect(page.getByText(/Rule 11 Disposition — Complete/)).toBeVisible();
  await expect(page.getByText(/\[WN\] Rule 11/)).toBeVisible();
  await expect(page.getByRole('row', { name: /Final Validation level standard/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /Adjustment provenance rule-disposition · Rule 11 \/ P12/ })).toBeVisible();
});

for (const scenario of [
  { csi: 4, responseLabel: 'feasibility review', owner: 'Delivery Director' },
  { csi: 5, responseLabel: 'sponsor escalation', owner: 'Executive Sponsor' }
]) {
  test(`CSI ${scenario.csi} gates baseline until the ${scenario.responseLabel} is complete`, async ({ page }) => {
    const scores = { ...metricScores, M9: scenario.csi };
    const assessments = Object.fromEntries(Object.entries(scores).map(([metricId, score]) => [metricId, {
      score, status: 'assessed', definitionVersion: 3, qualifiers: [], rationale: 'CSI E2E fixture', evidenceRefs: []
    }]));
    await importFixture(page, {
      _format: 'se-tailoring-config', _version: '2.0',
      semantics: { frameworkVersion: '4.1.0', metricDefinitionSet: 'se-tailoring-m1-m16-v3', qualifierSchemaVersion: '1.1' },
      projectInfo: { name: `CSI ${scenario.csi} Smoke` },
      metricScores: scores, metricAssessments: assessments, processLevels,
      artifactHandoffs: [acceptedRequirementsArchitectureHandoff()],
      assessmentComplete: true
    }, `csi-${scenario.csi}.json`);

    await page.goto('./#assessment');
    await page.getByRole('button', { name: 'Go to Results step' }).click();
    await expect(page.getByRole('group', { name: new RegExp(`CSI ${scenario.csi} ${scenario.responseLabel} required`, 'i') })).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(`Save Work in Progress \\(CSI ${scenario.csi} response required\\)`) })).toBeVisible();
    await page.getByLabel('Add capacity').check();
    await page.getByLabel('CSI protected outputs and evidence').fill('Verification evidence and safety acceptance outputs');
    await page.getByLabel('CSI rationale and decision').fill('Add capacity and preserve the protected evidence set.');
    await page.getByLabel('CSI owner or approver').fill(scenario.owner);
    await page.getByLabel('CSI evidence reference').fill(`CSI-${scenario.csi}-DECISION`);
    await page.getByLabel('CSI review date').fill('2026-07-10');
    await expect(page.getByText('Constraint response complete.')).toBeVisible();
    await page.getByRole('button', { name: 'Complete Baseline' }).click();

    await expect(page).toHaveURL(/#report$/);
    await expect(page.getByText(new RegExp(`CSI ${scenario.csi} Constraint Response — Complete`))).toBeVisible();
    await expect(page.getByText(/does not change the process profile or approve right-sizing proposals/)).toBeVisible();
  });
}

test('Requirements-to-Architecture handoff blocks baseline until accepted evidence is saved', async ({ page }) => {
  await importFixture(page, {
    _format: 'se-tailoring-config',
    _version: '2.0',
    semantics: { frameworkVersion: '4.1.0', metricDefinitionSet: 'se-tailoring-m1-m16-v3', qualifierSchemaVersion: '1.1' },
    projectInfo: { name: 'Output Sufficiency Gate Smoke' },
    metricScores,
    metricAssessments,
    processLevels,
    artifactHandoffs: [{
      ...acceptedRequirementsArchitectureHandoff(),
      evidenceStatus: 'draft',
      requiredContent: '',
      acceptanceCriteria: '',
      evidenceRefs: '',
      acceptanceAuthority: '',
      reviewDate: ''
    }],
    assessmentComplete: true
  }, 'output-sufficiency-gate.json');

  await page.goto('./#handoffs');
  await expect(page.getByText(/Baseline blocked:/)).toBeVisible();
  await page.getByLabel('Evidence status *').selectOption('accepted');
  await page.getByLabel('Required content *').fill('Baselined system requirements, interfaces, constraints, assumptions, and traceability.');
  await page.getByLabel('Acceptance criteria *').fill('Complete, consistent, feasible, traceable, and approved for architecture use.');
  await page.getByLabel('Evidence references *').fill('REQ-BL-E2E; ARCH-ACCEPT-E2E');
  await page.getByLabel('Acceptance authority *').fill('E2E Chief Engineer');
  await page.getByLabel('Review date *').fill('2027-07-10');
  await page.getByRole('button', { name: 'Save handoff' }).click();
  await expect(page.getByText(/Baseline gate satisfied:/)).toBeVisible();

  await page.goto('./#assessment');
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  await page.getByRole('button', { name: 'Complete Baseline' }).click();
  await expect(page).toHaveURL(/#report$/);
  await expect(page.getByText('Tailoring Report')).toBeVisible();
  await expect(page.getByText(/Requirements-to-Architecture Output Sufficiency/).first()).toBeVisible();
});

test('metric UI distinguishes explicit Unknown, unanswered preview, and imported unsupported N/A', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto('./#assessment');
  await page.getByRole('button', { name: 'Go to System Complexity step' }).click();
  const m1State = page.getByLabel('Assessment state for M1: Architectural Complexity');
  await expect(m1State).toHaveValue('');
  await expect(m1State.locator('option', { hasText: 'Imported N/A' })).toHaveCount(0);
  await m1State.selectOption('unknown');
  await expect(m1State).toHaveValue('unknown');

  const scores = { ...metricScores };
  const assessments = { ...metricAssessments, M7: { score: null, status: 'not-applicable', definitionVersion: 3, qualifiers: [], rationale: 'Legacy N/A', evidenceRefs: [] } };
  await importFixture(page, {
    _format: 'se-tailoring-config', _version: '2.0',
    semantics: { frameworkVersion: '4.1.0', metricDefinitionSet: 'se-tailoring-m1-m16-v3', qualifierSchemaVersion: '1.1' },
    projectInfo: { name: 'Imported N-A Smoke' }, metricScores: scores, metricAssessments: assessments,
    processLevels, assessmentComplete: true
  }, 'imported-na.json');
  await page.goto('./#assessment');
  await page.getByRole('button', { name: 'Go to Safety & Criticality step' }).click();
  await expect(page.getByText(/Imported N\/A cannot complete a current baseline/)).toBeVisible();
  const m7State = page.getByLabel('Assessment state for M7: Environmental Impact');
  await expect(m7State).toHaveValue('not-applicable');
  await expect(m7State.locator('option[value="not-applicable"]')).toHaveAttribute('disabled', '');
});

test('child hierarchy records a structured parent-retained safety allocation decision', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto('./#elements');
  await page.getByPlaceholder('Element name...').fill('Safety-neutral display subsystem');
  await page.getByRole('button', { name: /Add to/ }).click();
  await page.getByRole('button', { name: 'Navigate →' }).click();

  await expect(page.getByRole('group', { name: /Child safety-allocation decision incomplete/ })).toBeVisible();
  await page.getByPlaceholder('Decision authority').fill('Programme Safety Authority');
  await page.getByPlaceholder('Allocation evidence reference').fill('SAFE-ALLOC-12');
  await page.getByPlaceholder('Interface assumptions reference').fill('ICD-SAFE-4');
  await page.getByPlaceholder('Rationale for retaining responsibility at the parent').fill('The parent owns the hazard controls and the child receives no allocated safety function.');
  await page.getByLabel('Safety allocation review date').fill('2026-07-10');
  await page.getByRole('button', { name: 'Save safety-allocation decision' }).click();
  await expect(page.getByText('Confirmed and evidence-backed.')).toBeVisible();
});
