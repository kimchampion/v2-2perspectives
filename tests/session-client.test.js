import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

// Isolate Socket.IO from the network; HTTP fixtures are not live server checks.
const output = resolve('test-results/session-client-unit.mjs');
await mkdir(resolve('test-results'), { recursive: true });
const bundle = await build({
  entryPoints: [resolve('src/lib/sessionClient.js')], bundle: true, write: false,
  platform: 'node', format: 'esm', define: { 'import.meta.env': '{"VITE_SESSION_SERVER":"http://session-server.test"}' },
  plugins: [{ name: 'isolate-socket', setup(build) {
    build.onResolve({ filter: /^socket\.io-client$/ }, () => ({ path: 'socket', namespace: 'fixture' }));
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const io = (_url, options) => ({ options, connected: false, connections: 0, connect() { this.connections++; this.connected=true; }, emit(_event,_payload,ack) { ack?.({ok:true,session:{}}); } });' }));
  } }],
});
await writeFile(output, bundle.outputFiles[0].text);
const { createSession, SESSION_REQUEST_TIMEOUT, sessionSocket, joinSession, requestSession } = await import(pathToFileURL(output));
test.before(() => mock.method(globalThis, 'fetch', () => Promise.reject(new Error('Unexpected non-fixture request'))));
test.after(() => mock.restoreAll());

test('session creation uses only the configured POST endpoint and returns a validated server code', async () => {
  const calls = [];
  const session = await createSession({ fetchImpl: async (...args) => { calls.push(args); return { ok: true, json: async () => ({ code: ' a01bc2 ' }) }; } });
  assert.deepEqual(session, { code: 'A01BC2' });
  assert.equal(calls.length, 1);
  const [url, options] = calls[0];
  assert.equal(url, 'http://session-server.test/api/sessions');
  assert.equal(options.method, 'POST');
  assert.deepEqual(options.headers, { 'Content-Type': 'application/json' });
  assert.equal(options.body, undefined);
  assert.equal(options.credentials, 'omit');
  assert.ok(options.signal instanceof AbortSignal);
});

test('creation rejects HTTP errors and never retries a POST', async () => {
  let calls = 0;
  await assert.rejects(createSession({ fetchImpl: async () => { calls++; return { ok: false }; } }), /Unable to create session/);
  assert.equal(calls, 1);
});

test('creation rejects malformed JSON and unusable server codes', async () => {
  await assert.rejects(createSession({ fetchImpl: async () => ({ ok: true, json: async () => { throw new SyntaxError('Bad JSON'); } }) }));
  for (const data of [null, [], {}, { code: 'ABC' }, { code: '<code>' }, { code: 123456 }]) {
    await assert.rejects(createSession({ fetchImpl: async () => ({ ok: true, json: async () => data }) }), /valid session code/);
  }
});

test('a pending session request is aborted after its time limit', async () => {
  let aborted = false;
  await assert.rejects(createSession({ timeoutMs: 10, fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => { aborted = true; reject(signal.reason); }, { once: true });
  }) }));
  assert.equal(aborted, true);
});

test('closing the caller cancels a pending creation request', async () => {
  const controller = new AbortController();
  const pending = createSession({ signal: controller.signal, fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }) });
  controller.abort();
  await assert.rejects(pending);
});

test('an already canceled request never contacts the server', async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  await assert.rejects(createSession({ signal: controller.signal, fetchImpl: async () => { calls++; } }));
  assert.equal(calls, 0);
});

test('the session-server wait defaults to five seconds', () => {
  assert.equal(SESSION_REQUEST_TIMEOUT, 5000);
});

test('the deadline rejects a stalled fetch even when it ignores abort', async () => {
  await assert.rejects(createSession({ timeoutMs: 10, fetchImpl: () => new Promise(resolve => {
    setTimeout(() => resolve({ ok: true, json: async () => ({ code: 'ABC123' }) }), 50);
  }) }), { name: 'TimeoutError' });
});

test('the deadline also bounds stalled JSON parsing', async () => {
  await assert.rejects(createSession({ timeoutMs: 10, fetchImpl: async () => ({ ok: true, json: () => new Promise(resolve => {
    setTimeout(() => resolve({ code: 'ABC123' }), 50);
  }) }) }), { name: 'TimeoutError' });
});

test('caller cancellation rejects promptly even when fetch ignores abort', async () => {
  const controller = new AbortController();
  const pending = createSession({ signal: controller.signal, fetchImpl: () => new Promise(resolve => {
    setTimeout(() => resolve({ ok: true, json: async () => ({ code: 'ABC123' }) }), 50);
  }) });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});

test('a network failure is reported without automatically retrying session creation', async () => {
  let calls = 0;
  await assert.rejects(createSession({ fetchImpl: async () => { calls++; throw new TypeError('Network unavailable'); } }), /Network unavailable/);
  assert.equal(calls, 1);
});

test('local use opens no Socket.IO connection; an explicit join connects once', () => {
  assert.equal(sessionSocket.options.autoConnect, false);
  assert.equal(sessionSocket.connections, 0);
  joinSession(' abc123 ', { name: 'River' });
  assert.equal(sessionSocket.connections, 1);
});

test('session creation preserves a validated creator token without inventing one for legacy servers', async () => {
  const hostToken = 'a'.repeat(64);
  assert.deepEqual(await createSession({ fetchImpl: async () => ({ ok: true, json: async () => ({ code: 'ABC123', hostToken }) }) }), { code: 'ABC123', hostToken });
  await assert.rejects(createSession({ fetchImpl: async () => ({ ok: true, json: async () => ({ code: 'ABC123', hostToken: 'invalid' }) }) }));
});

test('joint commands await server acknowledgement and report server rejection', async () => {
  assert.equal(typeof requestSession, 'function');
  const sent = [];
  const socket = { connected: true, emit: (event, payload, ack) => { sent.push({ event, payload }); ack({ ok: true, session: { phase: 'lobby' } }); } };
  assert.deepEqual(await requestSession('select-scenario', { scenarioId: 'ride', round: 1 }, { socket }), { ok: true, session: { phase: 'lobby' } });
  assert.equal(sent[0].event, 'select-scenario');
  await assert.rejects(requestSession('join-session', {}, { socket: { connected: true, emit: (_e, _p, ack) => ack({ ok: false, error: { code: 'SESSION_FULL', message: 'This session already has two people.' } }) } }), { code: 'SESSION_FULL' });
});

test('joint acknowledgement timeout and cancellation ignore late replies', async () => {
  assert.equal(typeof requestSession, 'function');
  let late;
  const socket = { connected: true, emit: (_e, _p, ack) => { late = ack; } };
  await assert.rejects(requestSession('join-session', {}, { socket, timeoutMs: 5 }), { name: 'TimeoutError' });
  late({ ok: true, session: {} });
  const controller = new AbortController();
  const pending = requestSession('join-session', {}, { socket, signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  late({ ok: true, session: {} });
});

test('commands do not queue stale writes while disconnected', async () => {
  assert.equal(typeof requestSession, 'function');
  let emitted = false;
  await assert.rejects(requestSession('submit-perspective', {}, { socket: { connected: false, emit() { emitted = true; } } }));
  assert.equal(emitted, false);
});
