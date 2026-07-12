import test from 'node:test';
import assert from 'node:assert/strict';

import { buildExportConfig, buildPilotSafeExportState } from '../src/utils/export-import.js';

function assessmentTree() {
  return {
    rootId: 'default',
    activeId: 'child-sensitive',
    nodes: {
      default: {
        id: 'default',
        name: 'Secret Transit Modernization',
        parentId: null,
        childIds: ['child-sensitive']
      },
      'child-sensitive': {
        id: 'child-sensitive',
        name: 'Named Control Centre',
        parentId: 'default',
        childIds: []
      }
    }
  };
}

test('pilot-safe export removes project, team, and element display names without mutating state', () => {
  const state = {
    projectInfo: {
      name: 'Secret Transit Modernization',
      team: 'Named Delivery Organization',
      date: '2026-07-11',
      phase: 'development',
      securityCritical: true
    },
    assessmentTree: assessmentTree(),
    scores: {},
    notes: 'Free text remains visible for deliberate participant review.'
  };

  const config = buildExportConfig(state);

  assert.equal(config._privacy.mode, 'pilot-safe');
  assert.equal(config._privacy.projectAndTeamIdentifiersIncluded, false);
  assert.equal(config.projectInfo.name, '');
  assert.equal(config.projectInfo.team, '');
  assert.equal(config.projectInfo.phase, 'development');
  assert.equal(config.projectInfo.securityCritical, true);
  assert.equal(config.assessmentTree.nodes.default.name, 'System / programme');
  assert.equal(config.assessmentTree.nodes['child-sensitive'].name, 'System element 1');
  assert.equal(config.notes, state.notes, 'free text is preserved and covered by the export warning');
  assert.equal(state.projectInfo.name, 'Secret Transit Modernization');
  assert.equal(state.assessmentTree.nodes.default.name, 'Secret Transit Modernization');
});

test('identified export is possible only through an explicit option', () => {
  const state = {
    projectInfo: { name: 'Authorized Project', team: 'Authorized Team' },
    assessmentTree: assessmentTree(),
    scores: {}
  };

  const config = buildExportConfig(state, { includeProjectIdentifiers: true });

  assert.equal(config._privacy.mode, 'identified');
  assert.equal(config._privacy.projectAndTeamIdentifiersIncluded, true);
  assert.equal(config.projectInfo.name, 'Authorized Project');
  assert.equal(config.projectInfo.team, 'Authorized Team');
  assert.equal(config.assessmentTree.nodes.default.name, 'Secret Transit Modernization');
});

test('pilot-safe report state removes identifiers from report and breakdown inputs', () => {
  const state = {
    projectInfo: { name: 'Private Project', team: 'Private Team' },
    assessmentTree: assessmentTree()
  };

  const safeState = buildPilotSafeExportState(state);

  assert.equal(safeState.projectInfo.name, '');
  assert.equal(safeState.projectInfo.team, '');
  assert.equal(safeState.assessmentTree.nodes.default.name, 'System / programme');
  assert.equal(safeState.assessmentTree.nodes['child-sensitive'].name, 'System element 1');
});
