import test from 'node:test';
import assert from 'node:assert/strict';

const exit = await import('../src/app-exit.js').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
  throw error;
});

test('local exit clears participant data before requesting tab closure', async () => {
  assert.equal(typeof exit.exitApp, 'function');
  const calls = [];
  const done = await exit.exitApp({ clearLocal: result => calls.push(['clear', result]), close: () => calls.push(['close']) });
  assert.equal(done, true);
  assert.deepEqual(calls, [['clear', { sharedEndConfirmed: true }], ['close']]);
});

test('shared exit forwards cancellation and waits for end confirmation before cleanup', async () => {
  assert.equal(typeof exit.exitApp, 'function');
  const controller = new AbortController();
  const calls = [];
  let confirm;
  const pending = exit.exitApp({ signal: controller.signal, endSharedSession: signal => {
    assert.equal(signal, controller.signal);
    calls.push('end');
    return new Promise(resolve => { confirm = resolve; });
  }, clearLocal: () => calls.push('clear'), close: () => calls.push('close') });
  assert.deepEqual(calls, ['end']);
  confirm();
  assert.equal(await pending, true);
  assert.deepEqual(calls, ['end', 'clear', 'close']);
});

test('a failed shared end still allows local exit without claiming partner cleanup', async () => {
  assert.equal(typeof exit.exitApp, 'function');
  const calls = [];
  await exit.exitApp({ endSharedSession: async () => { throw new Error('Offline'); }, clearLocal: result => calls.push(result), close: () => calls.push('close') });
  assert.deepEqual(calls, [{ sharedEndConfirmed: false }, 'close']);
});

test('tab-closing restrictions do not prevent exit cleanup or throw into the UI', async () => {
  assert.equal(typeof exit.exitApp, 'function');
  let cleared = false;
  assert.equal(await exit.exitApp({ clearLocal: () => { cleared = true; }, close: () => { throw new Error('Closing blocked'); } }), true);
  assert.equal(cleared, true);
});

test('an already canceled exit performs no shared command, cleanup, or close', async () => {
  assert.equal(typeof exit.exitApp, 'function');
  const controller = new AbortController();
  controller.abort();
  const calls = [];
  const done = await exit.exitApp({ signal: controller.signal, endSharedSession: () => calls.push('end'), clearLocal: () => calls.push('clear'), close: () => calls.push('close') });
  assert.equal(done, false);
  assert.deepEqual(calls, []);
});

test('a canceled pending exit ignores late confirmation and cannot clear a new activity', async () => {
  assert.equal(typeof exit.exitApp, 'function');
  const controller = new AbortController();
  let confirm;
  const calls = [];
  const pending = exit.exitApp({ signal: controller.signal, endSharedSession: () => new Promise(resolve => { confirm = resolve; }), clearLocal: () => calls.push('clear'), close: () => calls.push('close') });
  controller.abort();
  confirm();
  assert.equal(await pending, false);
  assert.deepEqual(calls, []);
});

test('a stale shared action cannot clear or close a newer session round', async () => {
  const calls = [];
  const done = await exit.exitApp({ endSharedSession: async () => { throw new DOMException('Stale round', 'AbortError'); }, clearLocal: () => calls.push('clear'), close: () => calls.push('close') });
  assert.equal(done, false);
  assert.deepEqual(calls, []);
});
