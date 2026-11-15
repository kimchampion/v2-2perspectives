import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { io as connect } from 'socket.io-client';
import { avatarOptions } from '../src/avatar.js';
import { readJointSnapshot } from '../src/joint-session.js';

const require = createRequire(import.meta.url);
const { createSessionServer } = require('../server/index.js');
const avatar = { hair: 'shaved', hairColor: 'ink', clothing: 'tee', accessory: 'none', facialHair: 'none', pose: 'bust', expression: 'none' };
const person = (name) => ({ name, avatar: { ...avatar } });
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRDsAAAAASUVORK5CYII=';
const response = (text = '', drawing = '', mode = 'write') => ({ mode, text, drawing, color: '#A1B2C3' });
const token = (character) => character.repeat(64);

async function fixture(t, options = {}) {
  assert.equal(typeof createSessionServer, 'function', 'the server exports a factory without listening on import');
  const instance = createSessionServer(options);
  const sockets = [];
  t.after(async () => {
    sockets.forEach((socket) => socket.disconnect());
    await instance.close();
  });
  instance.server.listen(0, '127.0.0.1');
  await once(instance.server, 'listening');
  const url = `http://127.0.0.1:${instance.server.address().port}`;
  return {
    ...instance,
    url,
    async create() {
      const result = await fetch(`${url}/api/sessions`, { method: 'POST' });
      return { status: result.status, body: await result.json() };
    },
    async socket() {
      const socket = connect(url, { transports: ['websocket'], reconnection: false, forceNew: true });
      sockets.push(socket);
      await once(socket, 'connect');
      return socket;
    },
  };
}

const command = (socket, event, payload) => socket.timeout(2000).emitWithAck(event, payload);
function waitForState(socket, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('session-state', onState);
      reject(new Error('Timed out waiting for the expected session state'));
    }, 2000);
    function onState(state) {
      if (!predicate(state)) return;
      clearTimeout(timer);
      socket.off('session-state', onState);
      resolve(state);
    }
    socket.on('session-state', onState);
  });
}
const join = (socket, room, name, credentials = {}) => command(socket, 'join-session', { code: room.code, participant: person(name), ...credentials });
const success = (result) => {
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.notEqual(readJointSnapshot(result.session), null, 'every successful server snapshot is accepted by the frontend');
  return result;
};
const failure = (result, code) => { assert.deepEqual(Object.keys(result).sort(), ['error', 'ok']); assert.equal(result.ok, false); assert.equal(result.error.code, code); assert.equal(typeof result.error.message, 'string'); };
const privateFree = (value, markers = []) => {
  const serialized = JSON.stringify(value);
  assert.doesNotMatch(serialized, /"(?:responses|response|drawing|text|resumeToken|hostToken|socketId)"/);
  markers.forEach((marker) => assert.equal(serialized.includes(marker), false, marker));
};

async function pair(t, options) {
  const app = await fixture(t, options);
  const { body: room } = await app.create();
  const host = await app.socket();
  const guest = await app.socket();
  const hostJoin = success(await join(host, room, 'Host', { hostToken: room.hostToken, resumeToken: token('a') }));
  const guestJoin = success(await join(guest, room, 'Guest', { resumeToken: token('b') }));
  return { ...app, room, host, guest, hostJoin, guestJoin };
}

test('server avatar catalog matches every option accepted by the frontend', () => {
  const catalog = require('../server/avatar-catalog.json');
  const expected = Object.fromEntries(Object.entries(avatarOptions).map(([field, options]) => [field, options.map((option) => option.id)]));
  assert.deepEqual(catalog, expected);
});

test('creates unique bounded session codes and reserves host role even when the guest arrives first', async (t) => {
  const app = await fixture(t);
  const first = await app.create();
  const second = await app.create();
  assert.equal(first.status, 200);
  assert.deepEqual(Object.keys(first.body).sort(), ['code', 'hostToken']);
  assert.match(first.body.code, /^[A-Z0-9]{6}$/);
  assert.match(first.body.hostToken, /^[a-f0-9]{64}$/);
  assert.notEqual(first.body.code, second.body.code);
  const guest = await app.socket();
  const guestJoined = success(await join(guest, first.body, ' Guest '));
  assert.equal(guestJoined.session.participantIndex, 1);
  assert.equal(guestJoined.session.participants[0], null);
  assert.equal(guestJoined.session.participants[1].name, 'Guest');
  assert.match(guestJoined.resumeToken, /^[a-f0-9]{64}$/);
  const host = await app.socket();
  const packets = [];
  guest.on('session-state', (state) => packets.push(state));
  const hostConnected = waitForState(guest, (state) => state.participants[0]?.connected === true);
  const joined = success(await join(host, first.body, 'Host', { hostToken: first.body.hostToken }));
  assert.equal(joined.session.participantIndex, 0);
  assert.equal(joined.session.phase, 'lobby');
  assert.equal(joined.session.round, 1);
  assert.equal(joined.session.scenarioId, null);
  assert.equal(joined.session.reflectionPath, null);
  assert.equal(joined.session.participants[0].connected, true);
  assert.equal(joined.session.participants[0].submitted, false);
  assert.deepEqual(joined.session.participants[0].avatar, avatar);
  await hostConnected;
  assert.equal(packets.at(-1).participantIndex, 1);
  privateFree(joined.session, [first.body.hostToken, joined.resumeToken, guestJoined.resumeToken]);
  packets.forEach((state) => privateFree(state));
});

test('validates identities and rejects unknown, full, and unauthorized room claims without leaking credentials', async (t) => {
  const app = await fixture(t);
  const { body: room } = await app.create();
  const socket = await app.socket();
  for (const participant of [null, {}, person(' '), person('x'.repeat(31)), { ...person('X'), avatar: { ...avatar, hair: '../unsafe' } }, { ...person('X'), avatar: { ...avatar, expression: token('x') } }, ...Object.keys(avatar).map((field) => ({ ...person('X'), avatar: { ...avatar, [field]: 'not-in-catalog' } }))]) {
    const result = await command(socket, 'join-session', { code: room.code, participant });
    failure(result, 'INVALID_PARTICIPANT');
    privateFree(result);
  }
  failure(await command(socket, 'join-session', null), 'SESSION_NOT_FOUND');
  failure(await socket.timeout(2000).emitWithAck('join-session'), 'SESSION_NOT_FOUND');
  failure(await join(socket, { code: 'ZZZZZZ' }, 'X'), 'SESSION_NOT_FOUND');
  failure(await join(socket, room, 'X', { hostToken: token('c') }), 'INVALID_TOKEN');
  failure(await join(socket, room, 'X', { resumeToken: 'bad' }), 'INVALID_TOKEN');
  const host = await app.socket();
  success(await join(host, room, 'Host', { hostToken: room.hostToken, resumeToken: token('a') }));
  failure(await join(socket, room, 'Host'), 'INVALID_PARTICIPANT');
  success(await join(socket, room, 'Guest', { resumeToken: token('b') }));
  const third = await app.socket();
  failure(await join(third, room, 'Third'), 'SESSION_FULL');
  failure(await join(third, room, 'Intruder', { hostToken: room.hostToken }), 'INVALID_TOKEN');
  failure(await join(third, room, 'Intruder', { hostToken: room.hostToken, resumeToken: token('b') }), 'INVALID_TOKEN');
  failure(await command(third, 'select-scenario', { scenarioId: 'ride', round: 1 }), 'INVALID_TOKEN');
});

test('only the host can start an allowed scenario when both participants are online', async (t) => {
  const app = await fixture(t);
  const { body: room } = await app.create();
  const host = await app.socket();
  success(await join(host, room, 'Host', { hostToken: room.hostToken }));
  failure(await command(host, 'select-scenario', { scenarioId: 'ride', round: 1 }), 'PARTICIPANTS_OFFLINE');
  const guest = await app.socket();
  success(await join(guest, room, 'Guest'));
  failure(await command(guest, 'select-scenario', { scenarioId: 'ride', round: 1 }), 'HOST_ONLY');
  failure(await command(host, 'select-scenario', { scenarioId: 'private-value', round: 1 }), 'INVALID_SCENARIO');
  failure(await command(host, 'select-scenario', { scenarioId: 'ride', round: 0 }), 'STALE_ROUND');
  const started = success(await command(host, 'select-scenario', { scenarioId: 'ride', round: 1 }));
  assert.equal(started.session.phase, 'responding');
  assert.equal(started.session.scenarioId, 'ride');
  privateFree(started.session);
});

test('explicit empty submissions reveal together and duplicate submissions cannot overwrite responses or avatar appearance', async (t) => {
  const { host, guest } = await pair(t);
  success(await command(host, 'select-scenario', { scenarioId: 'playlist', round: 1 }));
  const hostPackets = [];
  const guestPackets = [];
  host.on('session-state', (state) => hostPackets.push(state));
  guest.on('session-state', (state) => guestPackets.push(state));
  const first = success(await command(host, 'submit-perspective', { response: response(), expression: 'calm', round: 1 }));
  privateFree(first);
  assert.equal(first.session.participants[0].submitted, true);
  assert.deepEqual(first.session.participants[0].avatar, avatar);
  const duplicate = success(await command(host, 'submit-perspective', { response: response('private-overwrite'), expression: 'angry', round: 1 }));
  assert.equal(duplicate.session.revision, first.session.revision);
  privateFree(duplicate, ['private-overwrite']);
  const hostRevealed = waitForState(host, (state) => state.phase === 'revealed');
  const guestRevealed = waitForState(guest, (state) => state.phase === 'revealed');
  const revealed = success(await command(guest, 'submit-perspective', { response: response(), expression: 'happy', round: 1 }));
  assert.equal(revealed.session.phase, 'revealed');
  assert.deepEqual(revealed.session.responses, [{ ...response(), submitted: true }, { ...response(), submitted: true }]);
  assert.equal(revealed.session.participants[0].avatar.expression, 'calm');
  const lateDuplicate = success(await command(host, 'submit-perspective', { response: response('late-overwrite'), expression: 'angry', round: 1 }));
  assert.equal(lateDuplicate.session.responses[0].text, '');
  await Promise.all([hostRevealed, guestRevealed]);
  for (const state of [...hostPackets, ...guestPackets].filter((state) => state.phase !== 'revealed')) privateFree(state);
  assert.equal(hostPackets.at(-1).phase, 'revealed');
  assert.equal(guestPackets.at(-1).phase, 'revealed');
});

test('text-only and drawing-only submissions remain private until both explicit submissions, including malformed join paths', async (t) => {
  const { host, guest, room, socket } = await pair(t);
  success(await command(host, 'select-scenario', { scenarioId: 'project', round: 1 }));
  const packets = [];
  guest.onAny((event, value) => packets.push({ event, value }));
  const hostSubmitted = waitForState(guest, (state) => state.phase === 'responding' && state.participants[0]?.submitted === true);
  const submitted = success(await command(host, 'submit-perspective', { response: response('PRIVATE-TEXT'), expression: 'calm', round: 1 }));
  privateFree(submitted, ['PRIVATE-TEXT', png, room.hostToken]);
  const stranger = await socket();
  const denied = await command(stranger, 'join-session', { code: room.code, participant: person('Spy'), response: 'PRIVATE-TEXT' });
  failure(denied, 'SESSION_FULL');
  privateFree(denied, ['PRIVATE-TEXT', png, room.hostToken]);
  await hostSubmitted;
  packets.forEach(({ value }) => privateFree(value, ['PRIVATE-TEXT', png]));
  const revealed = success(await command(guest, 'submit-perspective', { response: response('', png, 'draw'), expression: 'none', round: 1 }));
  assert.deepEqual(revealed.session.responses, [{ ...response('PRIVATE-TEXT'), submitted: true }, { ...response('', png, 'draw'), submitted: true }]);
  assert.doesNotMatch(JSON.stringify(revealed), /"(?:hostToken|resumeToken|socketId)"/);
});

test('rejects malformed response data and wrong-phase actions before mutation', async (t) => {
  const { host, guest } = await pair(t);
  failure(await command(host, 'submit-perspective', { response: response(), expression: 'calm', round: 1 }), 'INVALID_PHASE');
  failure(await command(host, 'choose-repair-step', { repairChoice: 'repair', round: 1 }), 'INVALID_PHASE');
  failure(await command(host, 'restart-scenario', { round: 1 }), 'INVALID_PHASE');
  success(await command(host, 'select-scenario', { scenarioId: 'cafe', round: 1 }));
  for (const invalid of [null, { ...response(), mode: 'audio' }, { ...response(), text: 42 }, { ...response(), text: 'x'.repeat(1201) }, { ...response(), drawing: 'data:image/svg+xml;base64,PHN2Zz4=' }, { ...response(), drawing: 'data:image/png;base64,YmFk' }, { ...response(), drawing: png + 'x'.repeat(2_000_000) }, { ...response(), color: 'red' }]) {
    failure(await command(host, 'submit-perspective', { response: invalid, expression: 'calm', round: 1 }), 'INVALID_RESPONSE');
  }
  failure(await command(host, 'submit-perspective', { response: response(), expression: '../bad', round: 1 }), 'INVALID_PARTICIPANT');
  failure(await command(host, 'submit-perspective', { response: response(), expression: 'angry', round: 1 }), 'INVALID_PARTICIPANT');
  const first = success(await command(host, 'submit-perspective', { response: response('valid'), expression: 'calm', round: 1 }));
  assert.equal(first.session.participants[1].submitted, false);
  const second = success(await command(guest, 'submit-perspective', { response: response(), expression: 'none', round: 1 }));
  assert.equal(second.session.phase, 'revealed');
});

test('resumes a claimed slot idempotently after an acknowledgement is lost, retaining submitted content and ownership', async (t) => {
  const { host, guest, room, socket } = await pair(t);
  const retry = success(await join(host, room, 'Changed identity', { hostToken: room.hostToken, resumeToken: token('a') }));
  assert.equal(retry.session.participants[0].name, 'Host');
  success(await command(host, 'select-scenario', { scenarioId: 'studio', round: 1 }));
  const submitted = success(await command(host, 'submit-perspective', { response: response('saved response'), expression: 'calm', round: 1 }));
  const offline = waitForState(guest, (state) => state.revision > submitted.session.revision && state.participants[0]?.connected === false);
  host.disconnect();
  const offlineState = await offline;
  assert.equal(offlineState.participants[0].connected, false);
  assert.equal(offlineState.participants[0].submitted, true);
  privateFree(offlineState, ['saved response']);
  const reconnected = await socket();
  const resumed = success(await join(reconnected, room, 'New identity', { resumeToken: token('a') }));
  assert.equal(resumed.session.participantIndex, 0);
  assert.equal(resumed.session.participants[0].name, 'Host');
  assert.equal(resumed.session.participants[0].submitted, true);
  const replacement = await socket();
  success(await join(replacement, room, 'Another identity', { resumeToken: token('a') }));
  failure(await command(reconnected, 'end-session', { round: 1 }), 'INVALID_TOKEN');
  const revealed = success(await command(guest, 'submit-perspective', { response: response('other response'), expression: 'none', round: 1 }));
  assert.equal(revealed.session.responses[0].text, 'saved response');
});

test('shares reflection, clears both responses on restart, rejects stale events, and clears then deletes ended rooms', async (t) => {
  const { host, guest, room, socket } = await pair(t);
  success(await command(host, 'select-scenario', { scenarioId: 'ride', round: 1 }));
  success(await command(host, 'submit-perspective', { response: response('first'), expression: 'calm', round: 1 }));
  success(await command(guest, 'submit-perspective', { response: response('', png, 'draw'), expression: 'happy', round: 1 }));
  failure(await command(host, 'choose-repair-step', { repairChoice: 'unknown', round: 1 }), 'INVALID_REFLECTION');
  for (const repairChoice of ['repair', 'pause', 'agree', 'set-aside', 'later']) {
    const shared = waitForState(host, (state) => state.reflectionPath === repairChoice);
    const chosen = success(await command(guest, 'choose-repair-step', { repairChoice, round: 1 }));
    assert.equal(chosen.session.reflectionPath, repairChoice);
    assert.equal((await shared).reflectionPath, repairChoice);
  }
  const restarted = success(await command(guest, 'restart-scenario', { round: 1 }));
  assert.equal(restarted.session.phase, 'lobby');
  assert.equal(restarted.session.round, 2);
  assert.equal(restarted.session.scenarioId, null);
  assert.equal(restarted.session.reflectionPath, null);
  assert.deepEqual(restarted.session.participants.map((participant) => participant.submitted), [false, false]);
  privateFree(restarted, ['first', png]);
  for (const event of ['submit-perspective', 'select-scenario', 'choose-repair-step', 'restart-scenario', 'end-session']) failure(await command(host, event, { response: response('late'), scenarioId: 'ride', repairChoice: 'repair', round: 1 }), 'STALE_ROUND');
  const endedPacket = waitForState(guest, (state) => state.phase === 'ended' && state.round === 2);
  const ended = success(await command(host, 'end-session', { round: 2 }));
  assert.equal(ended.session.phase, 'ended');
  assert.deepEqual(ended.session.participants, [null, null]);
  assert.equal(ended.session.scenarioId, null);
  assert.equal(ended.session.reflectionPath, null);
  privateFree(ended, ['Host', 'Guest', 'first', png]);
  assert.deepEqual((await endedPacket).participants, [null, null]);
  const later = await socket();
  failure(await join(later, room, 'Later', { resumeToken: token('a') }), 'SESSION_NOT_FOUND');
});

test('bounds memory use, handles random code collisions, and expires idle rooms with disposal', async (t) => {
  let now = 100;
  const generated = ['ABCDEF', 'ABCDEF', '123456', '654321'];
  const app = await fixture(t, { maxSessions: 2, sessionIdleMs: 1000, now: () => now, codeGenerator: () => generated.shift() || '654321' });
  const { body: first } = await app.create();
  const { body: second } = await app.create();
  assert.equal(first.code, 'ABCDEF');
  assert.equal(second.code, '123456');
  const full = await app.create();
  assert.equal(full.status, 503);
  failure(full.body, 'SERVER_CAPACITY');
  now = 1101;
  const afterExpiry = await app.create();
  assert.equal(afterExpiry.status, 200);
  const socket = await app.socket();
  failure(await join(socket, first, 'Expired'), 'SESSION_NOT_FOUND');
});
