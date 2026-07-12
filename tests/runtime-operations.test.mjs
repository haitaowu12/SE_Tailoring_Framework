import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildExportConfig, validateConfig } from '../src/utils/export-import.js';
import {
  APP_RUNTIME_META,
  buildRouteRecoveryMarkup,
  clearRuntimeIssues,
  getLocalDiagnostics,
  recordRuntimeIssue
} from '../src/utils/runtime-operations.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, '..');

test('release identity is explicit, version-aligned, and honest for an unattested local build', () => {
  assert.deepEqual(APP_RUNTIME_META, {
    application: 'se-tailoring-app',
    appRelease: '3.6.0',
    frameworkVersion: '4.1.0',
    metricDefinitionSet: 'se-tailoring-m1-m16-v3',
    exchangeSchemaVersion: '2.0',
    buildId: 'local-unattested',
    operatingProfile: 'static-self-service-prototype',
    telemetry: 'none'
  });
});

test('new exports include producer identity without making it a schema compatibility requirement', () => {
  const config = buildExportConfig({
    scores: {}, metricAssessments: {}, levels: {}, derived: {}, assessmentTree: null,
    projectInfo: {}, artifactHandoffs: []
  });
  assert.deepEqual(config._producer, APP_RUNTIME_META);
  assert.equal(validateConfig(config).valid, true);

  const legacyCompatible = { ...config };
  delete legacyCompatible._producer;
  assert.equal(validateConfig(legacyCompatible).valid, true);

  assert.ok(validateConfig({ ...config, _producer: 'untrusted' }).errors.includes('_producer must be an object'));
});

test('local diagnostics retain bounded sanitized operational issues and no assessment content', () => {
  clearRuntimeIssues();
  for (let index = 0; index < 8; index += 1) {
    recordRuntimeIssue(new Error(`Failure ${index}\nwith detail`), `operation-${index}`);
  }
  const diagnostics = getLocalDiagnostics();
  assert.equal(diagnostics.issues.length, 5);
  assert.equal(diagnostics.issues[0].operation, 'operation-7');
  assert.equal(diagnostics.issues[0].kind, 'Error');
  assert.equal('message' in diagnostics.issues[0], false);
  assert.doesNotMatch(JSON.stringify({ runtime: diagnostics.runtime, issues: diagnostics.issues }), /metricScores|projectInfo|evidenceRefs|approval/i);
  assert.equal(new Set(diagnostics.issues.map(issue => issue.id)).size, diagnostics.issues.length);
  assert.equal(diagnostics.release.telemetry, 'none');
});

test('route recovery markup escapes runtime identifiers and offers bounded recovery actions', () => {
  const markup = buildRouteRecoveryMarkup('<img src=x>', 'issue-<unsafe>');
  assert.doesNotMatch(markup, /<img src=x>/);
  assert.match(markup, /&lt;img src=x&gt;/);
  assert.match(markup, /Retry view/);
  assert.match(markup, /Return to dashboard/);
  assert.match(markup, /Open diagnostics/);
});

test('operating model and runbooks preserve prototype, conditional-pilot, and unsupported-service boundaries', () => {
  const operatingModel = readFileSync(join(appRoot, 'OPERATING-MODEL.md'), 'utf8');
  const deployment = readFileSync(join(appRoot, 'docs', 'DEPLOYMENT-ROLLBACK-RUNBOOK.md'), 'utf8');
  const incident = readFileSync(join(appRoot, 'docs', 'INCIDENT-AND-SUPPORT-RUNBOOK.md'), 'utf8');

  for (const profile of ['facilitated-local-pilot', 'static-self-service-prototype', 'future-governed-service']) {
    assert.match(operatingModel, new RegExp(profile));
  }
  assert.match(operatingModel, /D01-D10/);
  assert.match(operatingModel, /Not implemented or authorized/);
  assert.match(deployment, /last known-good app commit/);
  assert.match(deployment, /VITE_BUILD_ID/);
  assert.match(incident, /no uptime target/i);
  assert.match(incident, /no managed backup/i);
});

test('runtime diagnostics have no network transmission path and deploy workflow records immutable build identity', () => {
  const runtimeSource = readFileSync(join(appRoot, 'src', 'utils', 'runtime-operations.js'), 'utf8');
  const deployWorkflow = readFileSync(join(appRoot, '.github', 'workflows', 'deploy.yml'), 'utf8');
  assert.doesNotMatch(runtimeSource, /\bfetch\s*\(|sendBeacon|XMLHttpRequest|WebSocket/);
  assert.match(deployWorkflow, /workflow_dispatch:/);
  assert.match(deployWorkflow, /VITE_BUILD_ID=\$\(git rev-parse HEAD\)/);
  assert.match(deployWorkflow, /inputs\.ref/);
});
