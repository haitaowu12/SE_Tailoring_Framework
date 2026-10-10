import test from 'node:test';
import assert from 'node:assert/strict';
import { getState, subscribe } from '../src/state.js';
import { CORE_PROCESSES } from '../src/data/se-tailoring-data.js';
import { renderInterdependency } from '../src/views/interdependency.js';
import { renderSystemElements } from '../src/views/system-elements.js';
import { renderDeliverables } from '../src/views/deliverables.js';

function control(value = '') {
  return {
    value, handlers: {}, classList: { toggle() {} },
    addEventListener(event, handler) { this.handlers[event] = handler; }
  };
}

function useFixture(t) {
  const originalState = structuredClone(getState());
  const originalDocument = globalThis.document;
  globalThis.document = { createElement: () => ({}) };
  const levels = Object.fromEntries(CORE_PROCESSES.map(process => [process.id, 'basic']));
  const root = {
    id: 'root', name: 'Synthetic root', parentId: null, childIds: ['child'],
    assessmentType: 'full', status: 'under_review', scores: { M1: 2 }, levels,
    manualMetrics: ['M1'], inheritedMetrics: {}, assessmentResult: null,
    decisionDrafts: { 9: { justification: 'Keep the root decision draft' } }
  };
  const child = {
    ...structuredClone(root), id: 'child', name: 'Child <name>', parentId: 'root', childIds: [],
    scores: { M1: 1 }, manualMetrics: [], inheritedMetrics: { M7: true },
    decisionDrafts: { 9: { justification: 'Keep the separate child decision draft' } }
  };
  Object.assign(getState(), { levels, scores: root.scores, assessmentTree: { rootId: 'root', activeId: 'root', nodes: { root, child } } });
  let notifications = 0;
  const unsubscribe = subscribe(() => { notifications += 1; });
  t.after(() => {
    unsubscribe();
    Object.assign(getState(), originalState);
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  });
  return { before: structuredClone(getState()), notifications: () => notifications };
}

function emptyContainer() {
  return { innerHTML: '', appendChild() {}, querySelector: () => null, querySelectorAll: () => [] };
}

test('direct preview controls are visibly named and repeated previews never change assessment data', t => {
  const fixture = useFixture(t);
  const controls = { '#sim-process': control('19'), '#sim-level': control('comprehensive'), '#sim-run': control(), '#sim-results': { innerHTML: '' } };
  const content = { innerHTML: '', querySelector: selector => controls[selector] };
  const tabs = ['rules', 'propagation', 'chains', 'simulate'].map(tab => ({ ...control(), dataset: { tab } }));
  const container = { ...emptyContainer(), querySelector: () => content, querySelectorAll: () => tabs };
  renderInterdependency(container);
  tabs[3].handlers.click();
  assert.match(content.innerHTML, /<label[^>]+for="sim-process">Process<\/label>/);
  assert.match(content.innerHTML, /<label[^>]+for="sim-level">Proposed level<\/label>/);
  assert.match(content.innerHTML, /directly affected processes only/);
  assert.match(content.innerHTML, /full assessment also follows further required dependencies/);
  assert.match(content.innerHTML, /preview does not change your assessment/);
  controls['#sim-run'].handlers.click();
  assert.match(controls['#sim-results'].innerHTML, /Direct dependency/);
  const firstResult = controls['#sim-results'].innerHTML;
  controls['#sim-run'].handlers.click();
  assert.equal(controls['#sim-results'].innerHTML, firstResult);
  controls['#sim-process'].value = '9';
  controls['#sim-level'].value = 'basic';
  controls['#sim-run'].handlers.click();
  assert.match(controls['#sim-results'].innerHTML, /No directly affected processes/);
  assert.match(controls['#sim-results'].innerHTML, /whole profile and all required dependencies/);
  assert.deepEqual(getState(), fixture.before);
  assert.equal(fixture.notifications(), 0);
});

test('elements name their add controls and explain manual scores without implying a locked assessment', t => {
  const fixture = useFixture(t);
  const container = emptyContainer();
  renderSystemElements(container);
  assert.match(container.innerHTML, /<label[^>]+for="new-element-name">Element name\/code<\/label>/);
  assert.match(container.innerHTML, /<label[^>]+for="new-element-type">Assessment type<\/label>/);
  assert.match(container.innerHTML, /Manual scores are not automatically replaced by propagation\. You can still edit them in the assessment\./);
  assert.match(container.innerHTML, /aria-describedby="manual-metric-help"[^>]*>Manual<\/span>/);
  assert.doesNotMatch(container.innerHTML, /🔒|Manually set \(protected\)/);
  assert.match(container.innerHTML, /se-status-badge under_review">Under review<\/span>/);
  assert.match(container.innerHTML, /role="img" aria-label="Status: Under review"/);
  assert.doesNotMatch(container.innerHTML, />under_review<|title="under_review"/);
  assert.match(container.innerHTML, /Child &lt;name&gt;/);
  assert.deepEqual(getState(), fixture.before);
  assert.equal(fixture.notifications(), 0);
});

test('element status display retains its safe fallback for unrecognized imported values', t => {
  useFixture(t);
  getState().assessmentTree.nodes.root.status = '<invalid>';
  const container = emptyContainer();
  renderSystemElements(container);
  assert.match(container.innerHTML, /se-status-badge draft">Draft<\/span>/);
  assert.match(container.innerHTML, /aria-label="Status: Draft"/);
  assert.doesNotMatch(container.innerHTML, /<invalid>/);
});

test('deliverables start collapsed and named filter and bulk disclosure controls stay read-only', t => {
  const fixture = useFixture(t);
  const controls = {
    '#level-filter': control('all'),
    '#deliverables-expand-all': control(),
    '#deliverables-collapse-all': control()
  };
  const groups = CORE_PROCESSES.map(() => ({ open: false }));
  const container = { ...emptyContainer(), querySelector: selector => controls[selector], querySelectorAll: () => groups };
  renderDeliverables(container);
  assert.match(container.innerHTML, /<label[^>]+for="level-filter">Filter:<\/label>/);
  assert.equal((container.innerHTML.match(/<details\b/g) || []).length, CORE_PROCESSES.length);
  assert.doesNotMatch(container.innerHTML, /<details\b[^>]*\bopen\b/);
  assert.match(container.innerHTML, /not completion evidence and are not stored as assessment state/);
  controls['#deliverables-expand-all'].handlers.click();
  assert.ok(groups.every(group => group.open));
  controls['#deliverables-expand-all'].handlers.click();
  assert.ok(groups.every(group => group.open));
  controls['#deliverables-collapse-all'].handlers.click();
  assert.ok(groups.every(group => !group.open));
  controls['#level-filter'].handlers.change({ target: { value: 'comprehensive' } });
  assert.doesNotMatch(container.innerHTML, /<details\b[^>]*\bopen\b/);
  assert.deepEqual(getState(), fixture.before);
  assert.equal(fixture.notifications(), 0);
  controls['#level-filter'].handlers.change({ target: { value: 'all' } });
});
