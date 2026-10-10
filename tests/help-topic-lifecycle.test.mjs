import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHelp } from '../src/views/help.js';

function withHelpDom(t, { readyState = 'interactive', hash = '#help?topic=example' } = {}) {
  const previous = Object.fromEntries(['document', 'window', 'location', 'requestAnimationFrame'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const frames = [];
  const calls = [];
  let current = true;
  const focusTarget = { focus: options => calls.push(['focus', options]) };
  const target = {
    open: false,
    matches: selector => selector === 'details',
    querySelector: () => focusTarget,
    scrollIntoView: options => calls.push(['scroll', options])
  };
  const guide = { querySelector: () => target };
  const container = {
    innerHTML: '',
    querySelector: () => guide,
    querySelectorAll: () => [],
    contains: element => current && element === guide
  };
  Object.assign(globalThis, {
    document: { readyState }, window: new EventTarget(), location: { hash },
    requestAnimationFrame: callback => frames.push(callback)
  });
  t.after(() => {
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { container, target, calls, frames, replaceView: () => { current = false; }, flushFrame: () => { frames.splice(0).forEach(callback => callback()); } };
}

test('initial Help topic opens immediately but waits for pageshow before focusing and scrolling', t => {
  const dom = withHelpDom(t);
  renderHelp(dom.container);
  assert.equal(dom.target.open, true);
  assert.equal(dom.frames.length, 0, 'a DOMContentLoaded frame must not race restored scroll');
  window.dispatchEvent(new Event('pageshow'));
  assert.equal(dom.frames.length, 1);
  dom.flushFrame();
  assert.deepEqual(dom.calls, [
    ['focus', { preventScroll: true }],
    ['scroll', { behavior: 'instant', block: 'start' }]
  ]);
  window.dispatchEvent(new Event('pageshow'));
  assert.equal(dom.frames.length, 0, 'initial reveal listener is one-shot');
});

test('already-loaded Help navigation reveals in the frame after router scrolling', t => {
  const dom = withHelpDom(t, { readyState: 'complete' });
  renderHelp(dom.container);
  assert.equal(dom.frames.length, 1);
  dom.calls.push(['router-scroll']);
  dom.flushFrame();
  assert.deepEqual(dom.calls.map(call => call[0]), ['router-scroll', 'focus', 'scroll']);
});

test('a pending newer route cancels the old Help reveal before its DOM is replaced', t => {
  const dom = withHelpDom(t, { readyState: 'complete' });
  renderHelp(dom.container);
  location.hash = '#help?topic=adapt';
  dom.flushFrame();
  assert.deepEqual(dom.calls, []);
});

test('an unloaded Help view cannot steal focus after late pageshow', t => {
  const dom = withHelpDom(t);
  renderHelp(dom.container);
  dom.replaceView();
  window.dispatchEvent(new Event('pageshow'));
  dom.flushFrame();
  assert.deepEqual(dom.calls, []);
});
