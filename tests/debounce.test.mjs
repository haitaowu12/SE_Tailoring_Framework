import test from 'node:test';
import assert from 'node:assert/strict';
import { debounce } from '../src/utils/debounce.js';

test('debounce uses the latest arguments and receiver once after the idle window', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const receiver = { save: debounce(function (...args) { calls.push({ receiver: this, args }); }, 500) };
  receiver.save('old');
  t.mock.timers.tick(300);
  receiver.save('latest', 2);
  t.mock.timers.tick(499);
  assert.equal(calls.length, 0);
  t.mock.timers.tick(1);
  assert.deepEqual(calls, [{ receiver, args: ['latest', 2] }]);
});

test('cancel prevents a pending save and permits a fresh edit afterwards', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const save = debounce(value => calls.push(value), 500);
  save('recorded');
  save.cancel();
  save.cancel();
  t.mock.timers.tick(600);
  assert.deepEqual(calls, []);
  save('new draft');
  t.mock.timers.tick(500);
  assert.deepEqual(calls, ['new draft']);
});
