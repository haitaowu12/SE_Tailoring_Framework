import { expect, test } from '@playwright/test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { openSessionMenu } from './helpers.js';
import { runFullAssessment } from '../../src/utils/assessment-engine.js';

function acceptedHandoff() {
  return {
    artifactId: 'ART:REQ-ARCH:default:right-sizing-e2e',
    relationshipId: 'requirements-to-architecture',
    providerElementId: 'default',
    providerProcessId: 19,
    consumerElementId: 'default',
    consumerProcessId: 20,
    requiredContent: 'Baselined requirements, interfaces, assumptions, and traceability.',
    acceptanceCriteria: 'Complete, consistent, feasible, traceable, and accepted for architecture use.',
    evidenceStatus: 'accepted',
    evidenceRefs: 'REQ-RS-E2E; ARCH-RS-E2E',
    gaps: '',
    equivalentEvidence: '',
    acceptanceAuthority: 'E2E acceptance authority',
    reviewDate: '2027-07-10'
  };
}

function makeScores(m5 = 1) {
  const scores = Object.fromEntries(Array.from({ length: 16 }, (_, index) => [`M${index + 1}`, 5]));
  Object.assign(scores, {
    M1: 1, M2: 1, M4: 1, M5: m5, M6: 1, M7: 1, M8: 1,
    M9: 1, M10: 1, M11: 1, M12: 1, M16: 5
  });
  return scores;
}

function currentConfig(scores, name) {
  const result = runFullAssessment(scores, undefined, { activeElementId: 'default' });
  const ruleDispositions = Object.fromEntries(result.violations
    .filter(violation => violation.type === 'WN')
    .map(violation => [String(violation.ruleId), {
      ruleId: violation.ruleId,
      ...(String(violation.ruleId) === '11' ? { propagationId: 'P12' } : {}),
      outcome: String(violation.ruleId) === '11' ? 'basic-evidence-justified' : 'accept-current',
      rationale: `E2E fixture disposition for Rule ${violation.ruleId}; no automatic level change.`,
      ownerApprover: 'E2E Chief Engineer',
      evidenceRef: `E2E-WN-${violation.ruleId}`,
      reviewDate: '2099-12-31'
    }]));
  return {
    _format: 'se-tailoring-config',
    _version: '2.0',
    semantics: {
      frameworkVersion: '4.1.1',
      metricDefinitionSet: 'se-tailoring-m1-m16-v3',
      qualifierSchemaVersion: '1.1'
    },
    projectInfo: { name },
    metricScores: scores,
    metricAssessments: Object.fromEntries(Object.entries(scores).map(([metricId, score]) => [metricId, {
      score,
      status: 'assessed',
      definitionVersion: 3,
      qualifiers: [],
      rationale: 'Right-sizing E2E fixture judgment',
      evidenceRefs: [`EVID-${metricId}`]
    }])),
    processLevels: result.levels,
    normativeLevels: result.normativeLevels,
    derivedLevels: result.derived,
    derivationDetails: result.derivationDetails,
    overrides: result.overrides,
    activeFloors: result.activeFloors,
    violations: result.violations,
    ruleDispositions,
    fixes: result.fixes,
    rightSizingProposals: result.rightSizingProposals,
    blockedRightSizingCandidates: result.blockedRightSizingCandidates,
    proposedRightSizedLevels: result.proposedRightSizedLevels,
    proposalBudgetStatus: result.proposalBudgetStatus,
    budgetStatus: result.budgetStatus,
    adoptionRisks: result.adoptionRisks,
    indices: result.indices,
    confidence: result.confidence,
    rightSizingApprovalRecords: [],
    artifactHandoffs: [acceptedHandoff()],
    assessmentComplete: true
  };
}

async function importFixture(page, config, filename) {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') pageErrors.push(message.text()); });
  const dir = await mkdtemp(join(tmpdir(), 'se-tailoring-right-sizing-'));
  const path = join(dir, filename);
  await writeFile(path, JSON.stringify(config));
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const chooser = page.waitForEvent('filechooser');
  await openSessionMenu(page);
  await page.locator('#btn-import').click();
  await (await chooser).setFiles(path);
  await expect(page.getByText('Configuration imported successfully!')).toBeVisible();
  await expect(page).toHaveURL(/#dashboard$/);
  await page.getByRole('button', { name: 'Report', exact: true }).click();
  await expect(page).toHaveURL(/#report$/);
  if (pageErrors.length) throw new Error(`Report page errors: ${pageErrors.join(' | ')}`);
  await expect(page.getByText('Pilot Tailoring Record')).toBeVisible();
}

test('incomplete decision fails closed, then a complete local record creates a separate report-visible scenario', async ({ page }) => {
  const config = currentConfig(makeScores(), 'Right-Sizing Approval E2E');
  const proposal = config.rightSizingProposals.find(item => item.processId === 17);
  expect(proposal).toBeTruthy();
  await importFixture(page, config, 'right-sizing-approval.json');

  const form = page.locator('.right-sizing-approval-form[data-process-id="17"]');
  await form.locator('xpath=..').locator('summary').click();
  await form.locator('[name="rationale"]').fill('Bounded mission analysis scope supports the reduced activity set.');
  await form.getByRole('button', { name: 'Record asserted decision and update local scenario' }).click();
  await expect(page.getByText('Asserted decision record saved but remains structurally incomplete or invalid.')).toBeVisible();
  await expect(page.getByText(/Business\/Mission Analysis.*local record invalid/)).toBeVisible();
  await expect(page.getByText(/structurally complete local reduction record/)).toHaveCount(0);

  const updatedForm = page.locator('.right-sizing-approval-form[data-process-id="17"]');
  await updatedForm.locator('xpath=..').locator('summary').click();
  await updatedForm.locator('[name="protectedOutputs"]').fill('Mission problem statement, alternatives evidence, traceability, and acceptance record remain protected.');
  await updatedForm.locator('[name="residualRisks"]').fill('A low-severity alternative may receive less analysis depth.');
  await updatedForm.locator('[name="riskAcceptanceOwner"]').fill('Mission analysis risk owner');
  await updatedForm.locator('[name="compensatingControls"]').fill('Independent alternatives review before architecture acceptance.');
  await updatedForm.locator('[name="rejectedAlternatives"]').fill('Retaining Comprehensive was considered but rejected for the bounded scope.');
  await updatedForm.locator('[name="evidenceRef"]').fill('RS-APPROVAL-E2E-17');
  await updatedForm.locator('[name="reviewDate"]').fill('2027-07-10');
  await updatedForm.locator('[name="accountableProcessOwner-identity"]').fill('Accountable owner');
  await updatedForm.locator('[name="accountableProcessOwner-basis"]').fill('Approved process responsibility assignment');
  await updatedForm.locator('[name="assessmentLead-identity"]').fill('Assessment lead');
  await updatedForm.locator('[name="assessmentLead-basis"]').fill('Delegated assessment governance authority');
  await updatedForm.getByRole('button', { name: 'Record asserted decision and update local scenario' }).click();

  await expect(page.getByText('Asserted decision record saved; the local scenario was rechecked. External approval remains unverified and the pilot profile is unchanged.')).toBeVisible();
  await expect(page.getByText(/Business\/Mission Analysis.*local record locally-complete-unverified/)).toBeVisible();
  await expect(page.getByText('1 structurally complete local reduction record(s)')).toBeVisible();
  const effectiveForm = page.locator('.right-sizing-approval-form[data-process-id="17"]');
  await effectiveForm.locator('xpath=..').locator('summary').click();
  await expect(effectiveForm.locator('[name="evidenceRef"]')).toHaveValue('RS-APPROVAL-E2E-17');
  const profileRow = page.locator('table.data-table tbody tr', { hasText: 'Business/Mission Analysis' }).first();
  await expect(profileRow.locator('td').nth(7)).toContainText('S');
  await expect(profileRow.locator('td').nth(8)).toContainText('B');
  await expect(profileRow.locator('td').nth(8)).toContainText('Unverified local scenario');
});

test('active safety floors are never exposed as approvable reduction forms', async ({ page }) => {
  const config = currentConfig(makeScores(5), 'Protected Floor E2E');
  const protectedProcesses = [12, 16, 19, 20, 25, 27];
  expect(config.activeFloors.length).toBeGreaterThan(0);
  expect(config.rightSizingProposals.some(item => protectedProcesses.includes(item.processId))).toBeFalsy();
  await importFixture(page, config, 'right-sizing-protected-floor.json');

  for (const processId of protectedProcesses) {
    await expect(page.locator(`.right-sizing-approval-form[data-process-id="${processId}"]`)).toHaveCount(0);
  }
  await expect(page.getByText('Active Mandatory Floors', { exact: true })).toBeVisible();
  await expect(page.getByText(/structurally complete local reduction record/)).toHaveCount(0);
});

test('right-sizing proposals use a neutral non-blocking action-queue status', async ({ page }) => {
  const config = currentConfig(makeScores(), 'Right-Sizing Action Queue E2E');
  expect(config.rightSizingProposals.length).toBeGreaterThan(0);
  await importFixture(page, config, 'right-sizing-action-queue.json');

  await page.getByRole('button', { name: 'Assess', exact: true }).click();
  await page.getByRole('button', { name: 'Go to Results step' }).click();
  const queueItem = page.locator('.action-queue-item', { hasText: 'Right-sizing proposals' });
  await expect(queueItem).toContainText('Decision available — non-blocking');
  await expect(queueItem.locator('.action-queue-status')).toHaveClass(/neutral/);
  await expect(page.getByRole('button', { name: 'Check Software Completeness' })).toBeVisible();

  await page.getByRole('button', { name: 'Resolve issues', exact: true }).click();
  await expect(page.locator('.action-queue-item', { hasText: 'Right-sizing proposals' })).toHaveCount(0);
});
