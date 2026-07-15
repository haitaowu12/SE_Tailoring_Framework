/**
 * Assessment UI semantic-version and recommendation-navigation guardrails.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { METRIC_DEFINITION_VERSION } from '../src/data/metrics.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assessmentSource = readFileSync(join(__dirname, '..', 'src', 'views', 'assessment.js'), 'utf8');

test('current UI judgments use the v3 metric definition version constant', () => {
  assert.equal(METRIC_DEFINITION_VERSION, 3);
  assert.doesNotMatch(
    assessmentSource,
    /definitionVersion:\s*2/,
    'Current assessment UI must not label new judgments with a legacy definition version'
  );
  assert.ok(
    (assessmentSource.match(/definitionVersion:\s*METRIC_DEFINITION_VERSION/g) || []).length >= 1,
    'The shared metric-assessment factory should use the current version constant'
  );
});

test('assessment UI keeps the default path lightweight and records optional notes', () => {
  assert.match(assessmentSource, /function initializeMetricAssessments/);
  assert.match(assessmentSource, /status: updates\.status \|\| existing\.status \|\| 'assessed'/);
  assert.match(assessmentSource, /class="metric-unknown"/);
  assert.match(assessmentSource, /class="input mt-sm metric-justification-input"/);
  assert.doesNotMatch(assessmentSource, /metric-assessment-status/);
  assert.doesNotMatch(assessmentSource, /Ordinal Scale Warning/);
});

test('assessment UI keeps recommendation logic out of each metric card', () => {
  assert.doesNotMatch(assessmentSource, /function metricDecisionPath/);
  assert.doesNotMatch(assessmentSource, /class="metric-impact"/);
  assert.match(assessmentSource, /class="metric-justification/);
});

test('score changes resolve the active node within setMetricScore', () => {
  const functionBody = assessmentSource.match(/function setMetricScore[\s\S]*?\n}\n\nfunction startWizard/)?.[0] || '';
  assert.match(functionBody, /const activeNode = getActiveNode\(\);/);
  assert.match(functionBody, /if \(activeNode\)/);
});

test('assessment recommendations link to their exact process and computed level', () => {
  assert.match(assessmentSource, /processDetailsHref\(p\.id, level, 'assessment'\)/);
  assert.match(
    assessmentSource,
    /aria-label="View \$\{escapeHtml\(p\.name\)\} \$\{escapeHtml\(FRAMEWORK_META\.levelLabels\[level\] \|\| level\)\} details"/
  );
  assert.match(assessmentSource, />View guidance →<\/a>/);
});

test('opening recommendation details persists work in progress without silently baselining', () => {
  assert.match(assessmentSource, /\.process-detail-link/);
  assert.match(assessmentSource, /finalizeAssessment\(link\.getAttribute\('href'\)\)/);
  assert.match(assessmentSource, /function finalizeAssessment\(destinationHash = null\)/);
  assert.match(assessmentSource, /const applyRule11Elevation = !navigationOnly &&/);
  assert.match(assessmentSource, /assessmentComplete: !navigationOnly && canBaseline/);
  assert.match(assessmentSource, /assessmentDisposition: !navigationOnly && canBaseline \? 'complete-baseline' : 'work-in-progress'/);
  assert.match(assessmentSource, /const destination = getCurrentRouteContext\(destinationHash\)/);
  assert.match(assessmentSource, /navigateTo\(destination\.path, destination\.params\)/);
});
