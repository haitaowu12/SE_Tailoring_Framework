import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildRouteHash,
  getCurrentRouteContext,
  navigateTo,
  processDetailsHref
} from '../src/router.js';
import { getContextScore, resolveProcessExplorerRoute } from '../src/views/process-explorer.js';

test('route hashes preserve the path and strictly encode ordered parameters', () => {
  assert.equal(
    buildRouteHash('processes', { process: 20, level: 'standard', source: 'assessment' }),
    '#processes?process=20&level=standard&source=assessment'
  );
  assert.equal(
    buildRouteHash('#processes', { source: 'report & review', omitted: null }),
    '#processes?source=report+%26+review'
  );
  assert.equal(
    processDetailsHref(25, 'comprehensive', 'report'),
    '#processes?process=25&level=comprehensive&source=report'
  );
});

test('route context matches the path separately from decoded query parameters', () => {
  const context = getCurrentRouteContext('#processes?process=20&level=standard&source=assessment');
  assert.equal(context.path, 'processes');
  assert.equal(context.params.get('process'), '20');
  assert.equal(context.params.get('level'), 'standard');
  assert.equal(context.params.get('source'), 'assessment');
  assert.equal(getCurrentRouteContext('').path, 'dashboard');
  assert.equal(getCurrentRouteContext('#vee-model').path, 'vee-model');
});

test('replace navigation rerenders even at the same hash while ordinary same-route navigation is a no-op', () => {
  const originalWindow = globalThis.window;
  const originalEvent = globalThis.Event;
  let currentHash = '#processes?process=20&level=standard';
  const assignedHashes = [];
  const dispatchedEvents = [];
  const replacedUrls = [];
  const location = {
    href: `https://example.test/app/${currentHash}`,
    get hash() { return currentHash; },
    set hash(value) {
      assignedHashes.push(value);
      currentHash = value;
      this.href = `https://example.test/app/${value}`;
    }
  };
  globalThis.Event = class TestEvent {
    constructor(type) { this.type = type; }
  };
  globalThis.window = {
    location,
    history: {
      state: { preserved: true },
      replaceState(_state, _title, value) {
        replacedUrls.push(value);
        currentHash = value;
        location.href = `https://example.test/app/${value}`;
      }
    },
    dispatchEvent(event) { dispatchedEvents.push(event.type); }
  };

  try {
    navigateTo('processes', { process: 20, level: 'standard' });
    assert.deepEqual(assignedHashes, []);
    assert.deepEqual(dispatchedEvents, []);

    navigateTo('processes', { process: 20, level: 'standard' }, { replace: true });
    assert.deepEqual(replacedUrls, ['#processes?process=20&level=standard']);
    assert.deepEqual(dispatchedEvents, ['hashchange']);

    navigateTo('processes', { process: 21, level: 'basic' });
    assert.deepEqual(assignedHashes, ['#processes?process=21&level=basic']);
  } finally {
    globalThis.window = originalWindow;
    globalThis.Event = originalEvent;
  }
});

test('process detail routing rejects malformed, duplicate, and unsupported parameters without selecting a process', () => {
  const context = getCurrentRouteContext('#processes?process=020&process=20&level=expert&source=unknown&extra=value');
  const selection = resolveProcessExplorerRoute(context, { levels: {}, scores: {}, assessmentTree: null });
  assert.equal(selection.processId, null);
  assert.equal(selection.assignedLevel, null);
  assert.equal(selection.viewLevel, null);
  assert.equal(selection.source, null);
  assert.ok(selection.issues.some(issue => issue.includes('process parameter must appear only once')));
  assert.ok(selection.issues.some(issue => issue.includes('must be basic, standard, or comprehensive')));
  assert.ok(selection.issues.some(issue => issue.includes('source is not recognized')));
  assert.ok(selection.issues.some(issue => issue.includes('Unsupported route parameter')));
});

test('process detail routing uses one active-element context and applies its manual adjustment', () => {
  const state = {
    levels: { 20: 'basic' },
    scores: { M5: 1 },
    manualAdjustments: {},
    assessmentTree: {
      rootId: 'root',
      activeId: 'child',
      nodes: {
        root: { id: 'root', name: 'Programme', levels: { 20: 'basic' }, scores: { M5: 1 } },
        child: {
          id: 'child',
          name: 'Flight Computer',
          levels: { 20: 'standard' },
          scores: { M5: 5, M8: 4 },
          metricAssessments: { M5: { status: 'assessed', score: 5 } },
          assuranceObligations: [{ type: 'regulatory' }],
          manualAdjustments: { 20: { level: 'comprehensive', justification: 'Approved adjustment' } }
        }
      }
    }
  };
  const context = getCurrentRouteContext('#processes?process=20&source=elements');
  const selection = resolveProcessExplorerRoute(context, state);
  assert.equal(selection.processId, 20);
  assert.equal(selection.assignedLevel, 'comprehensive');
  assert.equal(selection.viewLevel, 'comprehensive');
  assert.equal(selection.source, 'elements');
  assert.equal(selection.viewContext.elementName, 'Flight Computer');
  assert.equal(selection.viewContext.scores.M5, 5);
  assert.equal(selection.viewContext.levels[20], 'standard');
});

test('an unassessed process has no false assignment and uses Basic only as browse content', () => {
  const context = getCurrentRouteContext('#processes?process=20');
  const selection = resolveProcessExplorerRoute(context, { levels: {}, scores: {}, assessmentTree: null });
  assert.equal(selection.assignedLevel, null);
  assert.equal(selection.viewLevel, 'basic');

  const comparison = resolveProcessExplorerRoute(
    getCurrentRouteContext('#processes?process=20&level=comprehensive&source=direct'),
    { levels: { 20: 'standard' }, scores: {}, assessmentTree: null }
  );
  assert.equal(comparison.assignedLevel, 'standard');
  assert.equal(comparison.viewLevel, 'comprehensive');
});

test('context-sensitive content requires a confirmed metric assessment and coherent score', () => {
  assert.equal(getContextScore({ scores: { M5: 3 }, metricAssessments: {} }, 'M5'), null);
  assert.equal(getContextScore({
    scores: { M5: 4 },
    metricAssessments: { M5: { status: 'assessed', score: 4 } }
  }, 'M5'), 4);
  assert.equal(getContextScore({
    scores: { M6: 5 },
    metricAssessments: { M6: { status: 'inherited-confirmed', score: 5 } }
  }, 'M6'), 5);
  assert.equal(getContextScore({
    scores: { M8: 3 },
    metricAssessments: { M8: { status: 'assessed', score: 4 } }
  }, 'M8'), null);
});

test('root context can use current global assurance obligations while child scope remains isolated', () => {
  const obligation = { type: 'regulatory', processScope: [20] };
  const rootSelection = resolveProcessExplorerRoute(
    getCurrentRouteContext('#processes?process=20'),
    {
      levels: {}, scores: {}, assuranceObligations: [obligation],
      assessmentTree: {
        rootId: 'root', activeId: 'root',
        nodes: { root: { id: 'root', name: 'Programme', levels: {}, scores: {}, assuranceObligations: [] } }
      }
    }
  );
  assert.deepEqual(rootSelection.viewContext.assuranceObligations, [obligation]);

  const childSelection = resolveProcessExplorerRoute(
    getCurrentRouteContext('#processes?process=20'),
    {
      levels: {}, scores: {}, assuranceObligations: [obligation],
      assessmentTree: {
        rootId: 'root', activeId: 'child',
        nodes: {
          root: { id: 'root', name: 'Programme', levels: {}, scores: {}, assuranceObligations: [] },
          child: { id: 'child', name: 'Subsystem', levels: {}, scores: {}, assuranceObligations: [] }
        }
      }
    }
  );
  assert.deepEqual(childSelection.viewContext.assuranceObligations, []);
});
