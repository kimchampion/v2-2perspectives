import test from 'node:test';
import assert from 'node:assert/strict';
import { keyboardViewport, watchPhoneViewport } from '../src/phone-viewport.js';

const normal = { editing: true, stableHeight: 700, height: 400, offsetTop: 80, scale: 1 };

test('keyboard leaves a frame inside the visible area, including Safari panning', () => {
  assert.deepEqual(keyboardViewport(normal), { height: 400, top: 80 });
  assert.deepEqual(keyboardViewport({ ...normal, offsetTop: -10 }), { height: 400, top: 0 });
});

test('browser toolbar changes do not move the normal footer', () => {
  for (const height of [699.5, 700, 750, 800]) assert.equal(keyboardViewport({ ...normal, height }), null);
  assert.equal(keyboardViewport({ ...normal, editing: false }), null);
});

test('keyboard dismissal restores the stable frame and pinch zoom is not counteracted', () => {
  assert.equal(keyboardViewport({ ...normal, height: 700 }), null);
  for (const scale of [0.8, 1.25, 2]) assert.equal(keyboardViewport({ ...normal, scale }), null);
});

test('invalid viewport data never collapses or repositions the app', () => {
  for (const key of ['stableHeight', 'height', 'offsetTop', 'scale']) {
    for (const value of [NaN, Infinity, undefined]) assert.equal(keyboardViewport({ ...normal, [key]: value }), null);
  }
  for (const height of [0, -20]) assert.equal(keyboardViewport({ ...normal, height }), null);
});

function viewportFixture() {
  const browser = new EventTarget();
  browser.visualViewport = Object.assign(new EventTarget(), { height: 700, offsetTop: 0, scale: 1 });
  const document = Object.assign(new EventTarget(), { activeElement: null });
  const styles = new Map();
  const shell = { ownerDocument: document, parentElement: { getBoundingClientRect: () => ({ height: 700 }) }, dataset: {}, style: {
    setProperty: (key, value) => styles.set(key, value), removeProperty: key => styles.delete(key),
  }, getBoundingClientRect: () => ({ height: 700 }) };
  const frames = new Map();
  let nextFrame = 0;
  browser.requestAnimationFrame = callback => { frames.set(++nextFrame, callback); return nextFrame; };
  browser.cancelAnimationFrame = id => frames.delete(id);
  const flush = () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()); };
  const field = { scrolls: 0, closest: selector => selector === '.page-content' ? {} : null,
    matches: () => true, scrollIntoView() { this.scrolls++; } };
  return { browser, viewport: browser.visualViewport, document, shell, styles, frames, flush, field };
}

test('page editing follows keyboard resize and pan, retaining the frame until the keyboard closes', () => {
  const f = viewportFixture();
  const stop = watchPhoneViewport(f.shell, f.browser);
  f.flush();
  assert.equal(f.styles.size, 0);
  f.document.activeElement = f.field;
  f.document.dispatchEvent(new Event('focusin'));
  f.viewport.height = 360;
  f.viewport.dispatchEvent(new Event('resize'));
  assert.equal(f.frames.size, 1, 'focus and resize are coalesced');
  f.flush();
  assert.equal(f.styles.get('--usable-app-height'), '360px');
  assert.equal(f.shell.dataset.viewportConstrained, 'true');
  assert.equal(f.field.scrolls, 1);
  f.viewport.offsetTop = 120;
  f.viewport.dispatchEvent(new Event('scroll'));
  f.flush();
  assert.equal(f.styles.get('--usable-app-top'), '120px');
  assert.equal(f.field.scrolls, 1, 'panning does not cause a focus-scroll loop');
  f.document.activeElement = null;
  f.document.dispatchEvent(new Event('focusout'));
  f.flush();
  assert.equal(f.styles.get('--usable-app-height'), '360px', 'tapping a footer must not move it before the click completes');
  f.viewport.height = 700;
  f.viewport.offsetTop = 0;
  f.viewport.dispatchEvent(new Event('resize'));
  f.flush();
  assert.equal(f.styles.size, 0);
  assert.equal(f.shell.dataset.viewportConstrained, undefined);
  stop();
});

test('panning a constrained frame never expands it to measure the stable viewport', () => {
  const f = viewportFixture();
  f.document.activeElement = f.field;
  f.viewport.height = 360;
  const stop = watchPhoneViewport(f.shell, f.browser);
  f.flush();
  const remove = f.shell.style.removeProperty;
  f.shell.style.removeProperty = key => {
    assert.notEqual(key, '--usable-app-height', 'temporary expansion can clamp the focused field scroll position');
    return remove(key);
  };
  f.viewport.offsetTop = 120;
  f.viewport.dispatchEvent(new Event('scroll'));
  f.flush();
  assert.equal(f.styles.get('--usable-app-height'), '360px');
  f.shell.style.removeProperty = remove;
  stop();
});

test('modal fields and non-text controls keep their existing viewport behavior', () => {
  const f = viewportFixture();
  f.viewport.height = 360;
  f.document.activeElement = { ...f.field, closest: () => ({}) };
  const stop = watchPhoneViewport(f.shell, f.browser);
  f.flush();
  assert.equal(f.styles.size, 0);
  f.document.activeElement = { ...f.field, matches: () => false };
  f.document.dispatchEvent(new Event('focusin'));
  f.flush();
  assert.equal(f.styles.size, 0);
  stop();
});

test('cleanup cancels pending work, removes listeners and restores CSS sizing', () => {
  const f = viewportFixture();
  f.document.activeElement = f.field;
  f.viewport.height = 360;
  const stop = watchPhoneViewport(f.shell, f.browser);
  f.flush();
  assert.equal(f.styles.size, 2);
  f.viewport.dispatchEvent(new Event('resize'));
  stop();
  assert.equal(f.frames.size, 0);
  assert.equal(f.styles.size, 0);
  for (const [target, event] of [[f.browser, 'resize'], [f.viewport, 'resize'], [f.viewport, 'scroll'], [f.document, 'focusin'], [f.document, 'focusout']]) target.dispatchEvent(new Event(event));
  assert.equal(f.frames.size, 0);
  assert.doesNotThrow(() => watchPhoneViewport(f.shell, {})());
});
