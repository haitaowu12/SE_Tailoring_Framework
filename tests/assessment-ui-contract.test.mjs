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

test('assessment UI keeps untouched preview values unreviewed and records optional notes', () => {
  assert.doesNotMatch(assessmentSource, /function initializeMetricAssessments/);
  assert.match(assessmentSource, /status: updates\.status \|\| existing\.status \|\| 'unreviewed'/);
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

test('score changes use the unified active-node draft commit', () => {
  const commitBody = assessmentSource.match(/function commitAssessmentDraft[\s\S]*?\n}\n\nfunction compareScore/)?.[0] || '';
  const functionBody = assessmentSource.match(/function setMetricScore[\s\S]*?\n}\n\nfunction startWizard/)?.[0] || '';
  assert.match(commitBody, /const activeNode = getActiveNode\(\);/);
  assert.match(commitBody, /activeNode\.scores = \{ \.\.\.scores \}/);
  assert.match(commitBody, /activeNode\.metricAssessments/);
  assert.match(commitBody, /activeNode\.ruleDispositions/);
  assert.match(commitBody, /activeNode\.csiResponse/);
  assert.match(commitBody, /activeNode\.assessmentDisposition = 'work-in-progress'/);
  assert.match(commitBody, /assessmentComplete: false/);
  assert.match(functionBody, /commitAssessmentDraft\(\{ manualMetricId: metricId \}\)/);
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

test('fresh results do not present a recommendation until preview is explicitly requested', () => {
  assert.match(assessmentSource, /completeness\.completeCount === 0 && !showNeutralPreview/);
  assert.match(assessmentSource, />No recommendation yet</);
  assert.match(assessmentSource, />Explore neutral what-if preview</);
  assert.match(assessmentSource, /Check Software Completeness/);
  assert.doesNotMatch(assessmentSource, /Pass Software Completeness Checks/);
});

test('metric answer positions use neutral score styling rather than process-rigor colors', () => {
  assert.match(assessmentSource, /display\.style\.color = 'var\(--text-primary\)'/);
  assert.doesNotMatch(assessmentSource, /display\.style\.color = value >= 4/);
  assert.doesNotMatch(assessmentSource, /const scoreColor = val >= 4/);
});

test('browser-local reduction records remain a separate unverified scenario', () => {
  assert.match(assessmentSource, /Local reduction scenario — external approval unverified/);
  assert.match(assessmentSource, /normative recommendation is unchanged/);
  assert.match(assessmentSource, /locallyCompleteRightSizingRecordCount/);
});


test('finalization recomputes the displayed level layer within its own scope', () => {
  assert.match(assessmentSource, /const currentDisplayLevels = applyManualAdjustmentsToLevels\(result\.levels, activeManualAdjustments\)/);
  assert.match(assessmentSource, /\{ \.\.\.currentDisplayLevels, 27: 'standard' \}/);
  assert.doesNotMatch(assessmentSource, /function finalizeAssessment[\s\S]*\{ \.\.\.displayLevels, 27: 'standard' \}/);
});


test('unresolved-only queue excludes neutral right-sizing decisions', () => {
  assert.match(assessmentSource, /assessmentViewMode === 'issues'[\s\S]*actionQueue\.filter\(item => !item\.passed \|\| item\.label === 'Pilot process profile'\)/);
  assert.doesNotMatch(assessmentSource, /actionQueue\.filter\(item => !item\.passed \|\| item\.label === 'Pilot process profile' \|\| item\.neutral\)/);
});
