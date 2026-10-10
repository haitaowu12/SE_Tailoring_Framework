import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProcessGovernanceContext, renderProcessExplorer } from '../src/views/process-explorer.js';
import { buildMatrixPresentation } from '../src/views/matrix-view.js';
import { CORE_PROCESSES, CONDITIONAL_METRIC_PROCESS_DRIVERS, METRIC_PROCESS_MAP } from '../src/data/se-tailoring-data.js';
import { escapeHtml } from '../src/utils/safe-text.js';
import { getState } from '../src/state.js';
import { getCurrentRouteContext } from '../src/router.js';

const obligation = processScope => ({
  id: 'OBL-SYNTHETIC', type: 'regulatory-mandate', bindingStatus: 'confirmed',
  authority: 'Synthetic authority', sourceRef: 'Synthetic source', processScope
});
function fixture({ scores: suppliedScores = {}, assuranceObligations = [] } = {}) {
  const scores = { ...Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`M${i + 1}`, 1])), ...suppliedScores };
  const metricAssessments = Object.fromEntries(Object.entries(scores).map(([id, score]) => [id, { score, status: 'assessed' }]));
  const levels = Object.fromEntries(CORE_PROCESSES.map(process => [process.id, 'basic']));
  const root = { id: 'root', name: 'Root assessment', parentId: null, scores, metricAssessments, levels, assuranceObligations, manualAdjustments: {} };
  return { scores, metricAssessments, levels, assuranceObligations,
    assessmentTree: { rootId: 'root', activeId: 'root', nodes: { root } } };
}
function rendered(state, processId, level = 'basic') {
  const savedState = { ...getState() };
  const savedDocument = globalThis.document;
  const container = { innerHTML: '', querySelector: () => ({ addEventListener() {} }), querySelectorAll: () => [] };
  try {
    Object.keys(getState()).forEach(key => delete getState()[key]);
    Object.assign(getState(), state);
    globalThis.document = { getElementById: () => ({}) };
    renderProcessExplorer(container, getCurrentRouteContext(`#processes?process=${processId}&level=${level}`));
    return container.innerHTML;
  } finally {
    Object.keys(getState()).forEach(key => delete getState()[key]);
    Object.assign(getState(), savedState);
    if (savedDocument === undefined) delete globalThis.document;
    else globalThis.document = savedDocument;
  }
}
const relatedRule = (state, processId, ruleId) => buildProcessGovernanceContext(processId, state).rules.find(rule => rule.id === ruleId);

test('Guidance shares all seven scoped M15 relationships and statuses with Matrix without changing registry or decisions', () => {
  const state = fixture({ scores: { M15: 3 }, assuranceObligations: [obligation([13, 27])] });
  const before = JSON.stringify({ state, METRIC_PROCESS_MAP });
  const matrix = buildMatrixPresentation(state);
  for (const driver of CONDITIONAL_METRIC_PROCESS_DRIVERS) {
    const guidance = buildProcessGovernanceContext(driver.processId, state);
    assert.equal(guidance.map.M15, matrix.map[driver.processId].M15);
    assert.deepEqual(guidance.conditionalDrivers, matrix.conditionalDrivers.filter(item => item.processId === driver.processId));
  }
  assert.equal(buildProcessGovernanceContext(13, state).map.M15, 'P*');
  assert.equal(buildProcessGovernanceContext(27, state).map.M15, 'S*');
  assert.equal(buildProcessGovernanceContext(12, state).map.M15, 'C');
  assert.equal(JSON.stringify({ state, METRIC_PROCESS_MAP }), before);
  const html = rendered(state, 13);
  assert.match(html, /P\* M15:/);
  assert.match(html, /M15 conditional primary driver: active/);
  assert.match(html, /Binding assurance overlay/);
});

test('Guidance requires confirmed, source-backed obligations scoped to this process', () => {
  for (const assuranceObligations of [[], [obligation([14])],
    [{ ...obligation([13]), bindingStatus: 'proposed' }],
    [{ ...obligation([13]), authority: '' }],
    [{ ...obligation([13]), sourceRef: '' }],
    [{ ...obligation([13]), type: 'political-visibility' }]]) {
    const state = fixture({ assuranceObligations });
    assert.equal(buildProcessGovernanceContext(13, state).map.M15, 'C');
    const html = rendered(state, 13);
    assert.match(html, /M15 conditional primary driver: inactive/);
    assert.doesNotMatch(html, /Binding assurance overlay/);
  }
});

test('canonical empty root scope and child scope do not borrow stale global obligations', () => {
  const state = fixture();
  state.assuranceObligations = [obligation([13])];
  assert.equal(buildProcessGovernanceContext(13, state).map.M15, 'C');
  assert.doesNotMatch(rendered(state, 13), /Binding assurance overlay/);
  const root = state.assessmentTree.nodes.root;
  root.assuranceObligations = [obligation([13])];
  state.assessmentTree.activeId = 'child';
  state.assessmentTree.nodes.child = { ...root, id: 'child', name: 'Child', parentId: 'root', assuranceObligations: [obligation([14])] };
  assert.equal(buildProcessGovernanceContext(13, state).map.M15, 'C');
  assert.equal(buildProcessGovernanceContext(14, state).map.M15, 'P*');
  assert.doesNotMatch(rendered(state, 13), /Binding assurance overlay/);
});

test('migration or missing active/scoped context is unavailable rather than a false active relationship', () => {
  const migration = fixture({ assuranceObligations: [obligation([13])] });
  migration.semanticMigration = { status: 'review-required' };
  const missingNode = fixture({ assuranceObligations: [obligation([13])] });
  missingNode.assessmentTree.activeId = 'missing';
  for (const state of [migration, missingNode]) {
    const guidance = buildProcessGovernanceContext(13, state);
    assert.equal(guidance.map.M15, 'P?');
    assert.equal(guidance.contextAvailable, false);
    assert(guidance.rules.every(rule => rule.effectiveType === null && rule.status === 'Context unavailable'));
    assert.doesNotMatch(rendered(state, 13), /Binding assurance overlay/);
  }
  const missingScope = fixture();
  const root = missingScope.assessmentTree.nodes.root;
  missingScope.assessmentTree.activeId = 'child';
  missingScope.assessmentTree.nodes.child = { ...root, id: 'child', parentId: 'root' };
  delete missingScope.assessmentTree.nodes.child.assuranceObligations;
  const unavailable = buildProcessGovernanceContext(13, missingScope);
  assert.equal(unavailable.map.M15, 'P?');
  assert.equal(unavailable.contextAvailable, false);
  assert(unavailable.rules.every(rule => rule.effectiveType === null));
});

test('unconfirmed M15 exposes conditional applicability only as a preview', () => {
  const state = fixture({ assuranceObligations: [obligation([13])] });
  state.assessmentTree.nodes.root.metricAssessments = {};
  assert.match(rendered(state, 13), /M15 is not a confirmed rating; resulting levels remain a preview/);
});

test('Rules 16 and 17 show effective hard constraints in critical context, with current-profile conflict status', () => {
  for (const metric of ['M5', 'M6', 'M8']) {
    const state = fixture({ scores: { [metric]: 4 } });
    state.assessmentTree.nodes.root.levels[25] = 'comprehensive';
    for (const [processId, ruleId] of [[15, 16], [16, 17]]) {
      const rule = relatedRule(state, processId, ruleId);
      assert.equal(rule.type, 'WN');
      assert.equal(rule.effectiveType, 'HC');
      assert.equal(rule.status, 'Review required');
      assert.match(rendered(state, processId), new RegExp(`Rule ${ruleId} \\[HC in this context\\]`));
    }
  }
  const low = fixture();
  low.assessmentTree.nodes.root.levels[25] = 'comprehensive';
  assert.equal(relatedRule(low, 15, 16).effectiveType, 'WN');
  assert.equal(relatedRule(low, 16, 17).effectiveType, 'WN');
  const notTriggered = fixture({ scores: { M5: 4 } });
  assert.equal(relatedRule(notTriggered, 15, 16).effectiveType, 'HC');
  assert.equal(relatedRule(notTriggered, 15, 16).status, 'No current conflict');
});

test('M15 severity uses the required process scope and does not invent a Measurement mapping', () => {
  for (const [scopedProcess, elevatedRule, warningRule] of [[15, 16, 17], [16, 17, 16]]) {
    const state = fixture({ scores: { M15: 4 }, assuranceObligations: [obligation([scopedProcess])] });
    const rules = buildProcessGovernanceContext(25, state).rules;
    assert.equal(rules.find(rule => rule.id === elevatedRule).effectiveType, 'HC');
    assert.equal(rules.find(rule => rule.id === warningRule).effectiveType, 'WN');
    assert.equal(buildProcessGovernanceContext(15, state).map.M15, undefined);
  }
});

test('Guidance rule severity respects protected ancestry rather than a blocked lower child rating', () => {
  const state = fixture({ scores: { M5: 4 } });
  const root = state.assessmentTree.nodes.root;
  state.assessmentTree.activeId = 'child';
  state.assessmentTree.nodes.child = { ...root, id: 'child', parentId: 'root', scores: { ...root.scores, M5: 1 }, assuranceObligations: [], levels: { ...root.levels, 25: 'comprehensive' } };
  assert.equal(buildProcessGovernanceContext(15, state).scores.M5, 4);
  assert.equal(relatedRule(state, 15, 16).effectiveType, 'HC');
  assert.equal(relatedRule(state, 16, 17).effectiveType, 'HC');
});

test('technical processes include array and generic technical rules; management processes do not inherit unrelated rules', () => {
  const state = fixture();
  const ids = buildProcessGovernanceContext(25, state).rules.map(rule => rule.id);
  for (const id of [9, '8b', 12, 16, 17]) assert(ids.includes(id), `P25 must include Rule ${id}`);
  const html = rendered(state, 25);
  for (const id of [9, '8b', 12, 16, 17]) assert.match(html, new RegExp(`Rule ${id} \\[`));
  const cmIds = buildProcessGovernanceContext(13, state).rules.map(rule => rule.id);
  for (const id of [9, '8b', 12, 16, 17]) assert(!cmIds.includes(id), `P13 should not include unrelated Rule ${id}`);
});

test('rule conflict status uses applied local choices, not browsed content or the recommendation snapshot', () => {
  const state = fixture({ scores: { M5: 4 } });
  const root = state.assessmentTree.nodes.root;
  root.manualAdjustments[25] = { level: 'comprehensive' };
  root.recommendationBaseline = { levels: { ...root.levels, 25: 'standard' } };
  assert.equal(relatedRule(state, 15, 16).status, 'Review required');
  const html = rendered(state, 25, 'basic');
  assert.match(html, /What Basic means here/);
  assert.match(html, /Recorded recommendation: Standard\. Current applied level: Comprehensive/);
  assert.match(html, /Local choice: Comprehensive/);
  assert.match(html, /Rule 16 \[HC in this context\][\s\S]*?Review required/);
  assert.equal(root.levels[25], 'basic');
  assert.equal(root.recommendationBaseline.levels[25], 'standard');
});

test('minimum-level definitions retain their trigger and authored prompts cannot masquerade as policy', () => {
  const state = fixture();
  const guidance = buildProcessGovernanceContext(13, state);
  const html = rendered(state, 13);
  assert.match(html, /Possible minimum-level rules/);
  assert.match(html, /Each minimum applies only when its stated condition is met/);
  for (const floor of guidance.floors) assert(html.includes(`Condition: ${escapeHtml(floor.condition)}`));
  assert.doesNotMatch(html, /Applicable floor definitions|<h4>When to Elevate<\/h4>/);
  assert.match(html, /Questions for professional review/);
  assert.match(html, /These authored prompts do not override the assessment rules or save a level change/);
});

test('Planning examples name outcomes and optional formats, without asserting an automatic Comprehensive threshold', () => {
  const state = fixture();
  const html = rendered(state, 9, 'standard');
  assert.match(html, /Activity examples to adapt \(7\)/);
  assert.match(html, /Record and evidence examples \(6\)/);
  assert.match(html, /Core outcome:/);
  assert.doesNotMatch(html, /Essential:|Create Project Management Plan|Develop Work Breakdown Structure|Develop Integrated Master Schedule/);
  assert.match(html, /Maintain a coordinated plan covering scope, responsibilities, schedule, resources, risks, and review points/);
  assert.match(html, /a PMP or equivalent/);
  assert.match(html, /a WBS or equivalent/);
  assert.match(html, /calculated level still follows the shared driver threshold and applicable rules/);
});

test('unconfirmed safety context stays visible with explicit conditional applicability guidance', () => {
  const state = fixture();
  state.assessmentTree.nodes.root.metricAssessments = {};
  state.metricAssessments = {};
  const html = rendered(state, 9, 'standard');
  assert.match(html, /Schedule SA milestones and reviews \[Safety\]/);
  assert.match(html, /Conditional example: M5 context unconfirmed; assess applicability and obligations before planning this work/);
  assert.doesNotMatch(html, /text-decoration: line-through/);
  assert.match(html, /<details class="practitioner-work-aid">\s*<summary>Plan this work with your team<\/summary>/);
});
