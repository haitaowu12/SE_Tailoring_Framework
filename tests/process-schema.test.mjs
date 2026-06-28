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
    }
  }
});
