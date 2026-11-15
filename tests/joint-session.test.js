import test from 'node:test';
import assert from 'node:assert/strict';
import * as session from '../src/session.js';
import { createAvatar } from '../src/avatar.js';

const person = (name, extra = {}) => ({ name, avatar: createAvatar({ expression: 'calm' }), connected: true, submitted: false, ...extra });
const packet = (extra = {}) => ({ code: 'AB12CD', participantIndex: 0, round: 1, revision: 1, phase: 'lobby', scenarioId: null, reflectionPath: null, participants: [person('River'), person('Sky')], ...extra });
const response = (text = '') => ({ mode: 'write', text, drawing: '', color: '#68547F', submitted: true });
const sync = (state, value) => session.sessionReducer(state, { type: 'SYNC_JOINT', session: value });

test('joint snapshots validate participant identity, roles and phase before entering React state', () => {
  assert.equal(typeof session.readJointSnapshot, 'function');
  assert.equal(session.readJointSnapshot(packet()).participants[0].name, 'River');
  for (const invalid of [packet({ code: 123456 }), packet({ participantIndex: 2 }), packet({ phase: 'unknown' }), packet({ scenarioId: 'unknown' }), packet({ participants: [person('River'), person('river')] }), packet({ participants: [person('River', { avatar: { hair: 'bad' } }), person('Sky')] })]) assert.equal(session.readJointSnapshot(invalid), null);
});

test('pre-reveal snapshots cannot introduce a response payload or authentication tokens', () => {
  assert.equal(typeof session.readJointSnapshot, 'function');
  for (const extra of [{ responses: [response('private'), response()] }, { hostToken: 'secret' }, { resumeToken: 'secret' }]) assert.equal(session.readJointSnapshot(packet(extra)), null);
});

test('connection updates preserve the own unsubmitted draft and expression while clearing any partner draft', () => {
  let state = sync(session.createSessionState('AB12CD', 'server'), packet({ phase: 'responding', scenarioId: 'ride' }));
  state = session.sessionReducer(state, { type: 'UPDATE_RESPONSE', participant: 0, values: { mode: 'write', text: 'Keep my private draft' } });
  state = session.sessionReducer(state, { type: 'SET_EXPRESSION', participant: 0, expression: 'happy' });
  state = sync(state, packet({ phase: 'responding', scenarioId: 'ride', revision: 2, participants: [person('River'), person('Sky', { connected: false })] }));
  assert.equal(state.responses[0].text, 'Keep my private draft');
  assert.equal(state.participants[0].avatar.expression, 'happy');
  assert.equal(state.responses[1].text, '');
  assert.equal(session.canReveal(state), false);
});

test('a first explicit submission locks only its author and still mounts no comparison', () => {
  const state = sync(session.createSessionState('AB12CD', 'server'), packet({ phase: 'responding', scenarioId: 'ride', participants: [person('River', { submitted: true }), person('Sky')] }));
  assert.equal(state.responses[0].submitted, true);
  assert.equal(state.responses[1].submitted, false);
  assert.equal(session.canReveal(state), false);
  assert.deepEqual(session.visibleResponses(state, 'compare'), []);
});

test('joint reveal accepts explicit empty submissions and pairs each server response with its author', () => {
  const value = packet({ phase: 'revealed', scenarioId: 'ride', participants: [person('River', { submitted: true }), person('Sky', { submitted: true })], responses: [response('River response'), response()] });
  const state = sync(session.createSessionState('AB12CD', 'server'), value);
  assert.equal(session.canReveal(state), true);
  assert.equal(state.responses[0].text, 'River response');
  assert.equal(state.responses[1].text, '');
  assert.equal(state.responses[1].submitted, true);
});

test('new rounds clear old responses and stale snapshots cannot restore them', () => {
  const revealed = packet({ phase: 'revealed', scenarioId: 'ride', participants: [person('River', { submitted: true }), person('Sky', { submitted: true })], responses: [response('old private content'), response()] });
  let state = sync(session.createSessionState('AB12CD', 'server'), revealed);
  state = sync(state, packet({ round: 2, revision: 3 }));
  assert.equal(state.status, 'setup');
  assert.equal(state.responses[0].text, '');
  assert.equal(sync(state, revealed), state);
  assert.equal(sync(state, packet({ round: 1, revision: 100 })), state);
});

test('ending the joint session clears participant identities and responses', () => {
  let state = sync(session.createSessionState('AB12CD', 'server'), packet({ phase: 'responding', scenarioId: 'ride' }));
  state = sync(state, packet({ phase: 'ended', revision: 3, participants: [null, null] }));
  assert.equal(state.status, 'ended');
  assert.ok(state.participants.every(p => p.name === '' && p.avatar === null));
  assert.ok(state.responses.every(r => !r.text && !r.drawing && !r.submitted));
});
