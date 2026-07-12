/**
 * Process catalog schema and ISO traceability guardrails.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CORE_PROCESSES,
  EXTENDED_PROCESSES,
  PROCESS_GROUPS,
  PROCESSES
} from '../src/data/se-tailoring-data.js';
import { PROCESS_CONTEXT_OVERLAYS, PROCESS_DETAILS } from '../src/data/process-details.js';

test('process catalog preserves 30-process ISO 15288 reference shape and 22-process executable core', () => {
  assert.equal(PROCESSES.length, 30);
  assert.equal(CORE_PROCESSES.length, 22);
  assert.equal(EXTENDED_PROCESSES.length, 8);

  const ids = PROCESSES.map(process => process.id);
  assert.deepEqual(ids, Array.from({ length: 30 }, (_, index) => index + 1));

  const groupCounts = Object.fromEntries(
    Object.values(PROCESS_GROUPS).map(group => [
      group.id,
      PROCESSES.filter(process => process.group === group.id).length
    ])
  );
  assert.deepEqual(groupCounts, {
    tech_mgmt: 8,
    technical: 14,
    agreement: 2,
    org_enabling: 6
  });
});

test('every process declares ISO trace metadata without implying compliance certification', () => {
  for (const process of PROCESSES) {
    assert.equal(process.iso.standard, 'ISO/IEC/IEEE 15288:2023');
    assert.equal(process.iso.processNumber, process.id);
    assert.equal(process.iso.processName, process.name);
    assert.ok(process.iso.processGroup.length > 0, `${process.name} must declare process group`);
    assert.ok(process.iso.traceBasis.includes('ISO/IEC/IEEE 15288:2023'), `${process.name} must declare trace basis`);
    assert.ok(process.iso.conformanceNote.includes('not a standalone ISO compliance'), `${process.name} must disclaim compliance certification`);
    assert.equal(process.iso.scope, process.extended ? 'reference' : 'executable-core');
  }
});

test('core process definitions are complete for all tailoring levels', () => {
  const levels = ['basic', 'standard', 'comprehensive'];

  for (const process of CORE_PROCESSES) {
    assert.ok(process.purpose?.length > 20, `${process.name} must have a meaningful purpose`);
    assert.ok(process.whenToElevate?.length > 20, `${process.name} must have tailoring guidance`);
    for (const level of levels) {
      assert.ok(process.definition?.[level]?.length > 15, `${process.name} missing ${level} definition`);
      assert.ok(PROCESS_DETAILS[process.id]?.activities?.[level]?.length > 0, `${process.name} missing ${level} activities`);
      assert.ok(PROCESS_DETAILS[process.id]?.deliverables?.[level]?.length > 0, `${process.name} missing ${level} deliverables`);
    }
  }
});


test('security and assurance overlays are populated and limited to existing mapped roles', () => {
  const securityProcesses = new Set([12, 13, 14, 20, 25]);
  const assuranceProcesses = new Set([12, 13, 14, 16, 25, 27, 30]);

  for (const [processIdText, overlays] of Object.entries(PROCESS_CONTEXT_OVERLAYS)) {
    const processId = Number(processIdText);
    assert.ok(PROCESS_DETAILS[processId], `overlay process ${processId} must have process details`);

    if (overlays.security) {
      assert.ok(securityProcesses.has(processId), `security overlay ${processId} must already have an executable M8 role`);
      assert.ok(overlays.security.activities.length > 0);
      assert.ok(overlays.security.evidence.length > 0);
    }
    if (overlays.assurance) {
      assert.ok(assuranceProcesses.has(processId), `assurance overlay ${processId} must already have a conditional M15 role`);
      assert.ok(overlays.assurance.activities.length > 0);
      assert.ok(overlays.assurance.evidence.length > 0);
    }
  }
});
