import test from 'node:test';
import assert from 'node:assert/strict';
import * as session from '../src/session.js';
import * as data from '../src/data.js';

test('a new local session starts with two independent empty participants and drafts', () => {
  assert.equal(typeof session.createSessionState, 'function', 'Session creation must be implemented');
  const state = session.createSessionState();
  assert.deepEqual(state, {
    code: 'DEMO24',
    participants: [
      { name: '', avatar: null },
      { name: '', avatar: null },
    ],
    scenarioId: null,
    responses: [
      { mode: 'draw', text: '', drawing: '', color: '#68547F', submitted: false },
      { mode: 'draw', text: '', drawing: '', color: '#68547F', submitted: false },
    ],
    reflection: { path: null, text: '' },
    status: 'setup',
  });
  assert.notEqual(state.participants[0], state.participants[1]);
  assert.notEqual(state.responses[0], state.responses[1]);
  const another = session.createSessionState('ABCD24');
  assert.equal(another.code, 'ABCD24');
  assert.notEqual(state.participants[0], another.participants[0]);
  assert.notEqual(state.responses[0], another.responses[0]);
  assert.notEqual(state.reflection, another.reflection);
});

const expectedScenarios = [
  {
    id: "playlist",
    category: "FRIENDSHIP",
    title: "The shared playlist",
    icon: "music",
    description:
      "Two friends. One road trip. A playlist that suddenly sounds a little different.",
    story:
      "You and a friend made a playlist for a long-awaited road trip. The night before you leave, one of you changes most of the songs without checking in.",
    perspectives: [
      "You spent an evening putting the playlist together. When you open it, most of your songs are gone. You were excited to share the music you love, and now you wonder whether your taste matters to your friend.",
      "You added upbeat songs to make the drive more fun and removed a few slower ones to make room. You thought the playlist was a starting point, and you were excited to surprise your friend.",
    ],
  },
  {
    id: "project",
    category: "TEAMWORK",
    title: "The last-minute edit",
    icon: "layers",
    description:
      "A group project, a late-night change, and two different ideas of helping.",
    story:
      "Two classmates have finished a presentation together. The morning it is due, one discovers that the other has redesigned several slides overnight.",
    perspectives: [
      "You worked hard on the original slides and thought you had both agreed they were finished. Seeing your work changed without a conversation makes you feel left out of your own project.",
      "You noticed some slides were hard to read and stayed up late improving them. You wanted to take pressure off your teammate and thought they would appreciate the extra effort.",
    ],
  },
  {
    id: "cafe",
    category: "EVERYDAY MOMENTS",
    title: "A change of plans",
    icon: "coffee",
    description:
      "An afternoon catch-up takes an unexpected turn when someone else comes along.",
    story:
      "Two friends plan to meet at their favorite café. One of them arrives with a new friend, without mentioning it beforehand.",
    perspectives: [
      "You were looking forward to some one-on-one time and had something personal you wanted to share. You like meeting new people, but this was not the afternoon you pictured.",
      "Your new friend was having a quiet weekend, so you invited them along. You thought your friends would get along well and saw it as a chance to bring people together.",
    ],
  },
  {
    id: "studio",
    category: "SHARED SPACES",
    title: "Room to create",
    icon: "sparkles",
    description:
      "A shared creative space means sharing a little more than just the desk.",
    story:
      "Two people share a small art studio. One reorganizes the space over the weekend, moving the other person’s supplies into labeled drawers.",
    perspectives: [
      "You arrange materials where you can see them because that is how you find inspiration. The new organization looks tidy, but you cannot find your favorite tools and your space feels unfamiliar.",
      "The studio was getting cluttered, so you spent the weekend making it easier to use. You carefully labeled everything and thought you were making more room for both of you.",
    ],
  },
];


test('the four scenarios retain the original seed stories and perspectives', () => {
  assert.deepEqual(data.scenarios, expectedScenarios);
  assert.equal(data.scenarios?.length, 4);
});

test('preset colors retain the original named palette without legacy feature exports', () => {
  assert.deepEqual(data.presetColors, [
    { value: '#D9CEEB', label: 'Lavender', note: 'A little reflective' },
    { value: '#F1C6AD', label: 'Peach', note: 'Soft and open' },
    { value: '#C7D4B9', label: 'Sage', note: 'Grounded and steady' },
    { value: '#ECCF7E', label: 'Honey', note: 'Bright and curious' },
    { value: '#B5CEDF', label: 'Sky', note: 'Room to breathe' },
    { value: '#DFA6A5', label: 'Rose', note: 'A little stirred up' },
  ]);
  for (const key of ['songs', 'symbols', 'steps', 'blankResponses']) {
    assert.equal(data[key], undefined);
  }
});

const avatar = () => ({ hair: 'short', hairColor: 'ink', clothing: 'tee', accessory: 'none', facialHair: 'none', pose: 'bust', expression: 'calm' });
const participant = (name = 'Alex') => ({ name, avatar: avatar() });
const written = (text = 'I felt unheard.') => ({ mode: 'write', text, drawing: '', color: '#68547F' });
const drawn = () => ({ mode: 'draw', text: 'I needed a little more space.', drawing: 'data:image/png;base64,abc', color: '#68547F' });

test('participant validation requires a trimmed distinct nickname of at most 30 characters', () => {
  assert.equal(typeof session.validateParticipant, 'function');
  assert.equal(session.validateParticipant(participant(' Alex '), 'Blair'), '');
  assert.equal(session.validateParticipant(participant('a'.repeat(30))), '');
  for (const invalid of ['', ' \n ', 'a'.repeat(31)]) {
    assert.ok(session.validateParticipant(participant(invalid)));
  }
  assert.ok(session.validateParticipant(participant(' Alex '), ' aLeX '));
  assert.ok(session.validateParticipant(undefined));
  assert.ok(session.validateParticipant({ ...participant(), name: 42 }));
});

test('participant validation requires a complete selected avatar with known part values', () => {
  assert.equal(session.validateParticipant(participant()), '');
  for (const value of [undefined, null, '', {}, [], { ...avatar(), hair: 'unknown' }, { ...avatar(), expression: {} }]) {
    assert.ok(session.validateParticipant({ ...participant(), avatar: value }));
  }
});

test('written responses allow empty text and retain the text type and length checks', () => {
  assert.equal(typeof session.validateResponse, 'function');
  assert.equal(session.validateResponse(written()), '');
  assert.equal(session.validateResponse(written(` ${'a'.repeat(1200)} `)), '');
  for (const text of ['', ' \n\t ']) {
    assert.equal(session.validateResponse({ ...written(), text }), '');
  }
  for (const text of ['a'.repeat(1201), undefined, {}]) {
    assert.ok(session.validateResponse({ ...written(), text }));
  }
  assert.ok(session.validateResponse(undefined));
});

test('drawn responses allow either part to be empty and reject invalid field types and modes', () => {
  assert.equal(typeof session.validateResponse, 'function');
  assert.equal(session.validateResponse(drawn()), '');
  for (const drawing of ['', '  ']) {
    assert.equal(session.validateResponse({ ...drawn(), drawing }), '');
  }
  for (const drawing of [undefined, {}]) {
    assert.ok(session.validateResponse({ ...drawn(), drawing }));
  }
  assert.equal(session.validateResponse({ ...drawn(), text: ' ' }), '');
  assert.equal(session.validateResponse({ ...drawn(), drawing: '', text: '' }), '');
  for (const mode of [undefined, '', 'color', 'sketch', 'WRITE', {}]) {
    assert.ok(session.validateResponse({ ...drawn(), mode }));
  }
});

test('local demo codes are six readable alphanumeric characters from cryptographic entropy', (context) => {
  assert.equal(typeof session.newSessionCode, 'function');
  assert.match(session.newSessionCode(), /^[A-HJ-NP-Z2-9]{6}$/);
  const entropy = context.mock.method(globalThis.crypto, 'getRandomValues', (bytes) => {
    bytes.set([0, 1, 2, 3, 30, 31]);
    return bytes;
  });
  assert.equal(session.newSessionCode(), 'ABCD89');
  assert.equal(entropy.mock.callCount(), 1);
});

const dispatch = (state, type, payload = {}) => session.sessionReducer(state, { type, ...payload });
const readySession = () => {
  let state = session.createSessionState();
  state = dispatch(state, 'SET_PARTICIPANT', { participant: 0, values: participant('Alex') });
  state = dispatch(state, 'SET_PARTICIPANT', { participant: 1, values: participant('Blair') });
  return dispatch(state, 'SELECT_SCENARIO', { id: 'playlist' });
};
const respondingSession = () => dispatch(readySession(), 'START_RESPONSES');
const submittedSession = () => {
  let state = respondingSession();
  state = dispatch(state, 'UPDATE_RESPONSE', { participant: 0, values: drawn() });
  state = dispatch(state, 'SUBMIT_RESPONSE', { participant: 0 });
  state = dispatch(state, 'UPDATE_RESPONSE', { participant: 1, values: written('I was trying to help.') });
  return dispatch(state, 'SUBMIT_RESPONSE', { participant: 1 });
};
const deepFreeze = (value) => {
  Object.freeze(value);
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object' && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
};

test('setup updates only the selected participant and a recognized scenario', () => {
  assert.equal(typeof session.sessionReducer, 'function');
  const initial = deepFreeze(session.createSessionState());
  const values = deepFreeze({ ...participant(' Alex '), status: 'revealed', private: 'injected' });
  const updated = dispatch(initial, 'SET_PARTICIPANT', { participant: 0, values });
  assert.deepEqual(updated.participants[0], participant(' Alex '));
  assert.equal(updated.participants[1], initial.participants[1]);
  assert.equal(initial.participants[0].name, '');
  assert.equal(updated.status, 'setup');
  for (const id of ['unknown', 0, undefined, '__proto__']) {
    assert.equal(dispatch(updated, 'SELECT_SCENARIO', { id }), updated);
  }
  for (const { id } of data.scenarios) {
    assert.equal(dispatch(updated, 'SELECT_SCENARIO', { id }).scenarioId, id);
  }
});

test('avatar selections are cloned per participant and preserved when responses start', () => {
  const selected = { ...avatar(), hair: 'afro', expression: 'happy' };
  const state = dispatch(readySession(), 'SET_PARTICIPANT', { participant: 0, values: { avatar: selected } });
  assert.deepEqual(state.participants[0].avatar, selected);
  assert.notEqual(state.participants[0].avatar, selected);
  assert.notEqual(state.participants[0].avatar, state.participants[1].avatar);
  selected.hair = 'turban';
  assert.equal(state.participants[0].avatar.hair, 'afro');
  const started = dispatch(state, 'START_RESPONSES');
  assert.equal(started.status, 'responding');
  assert.equal(started.participants[0].avatar.hair, 'afro');
  assert.equal(session.canReveal(started), false);
});

test('resetting an avatar during setup preserves the nickname and the other participant', () => {
  const before = deepFreeze(readySession());
  const reset = dispatch(before, 'SET_PARTICIPANT', { participant: 0, values: { avatar: null } });
  assert.deepEqual(reset.participants[0], { name: 'Alex', avatar: null });
  assert.equal(reset.participants[1], before.participants[1]);
  assert.equal(reset.responses, before.responses);
  assert.ok(session.validateParticipant(reset.participants[0], reset.participants[1].name));
  assert.equal(dispatch(reset, 'START_RESPONSES'), reset);
  assert.notEqual(before.participants[0].avatar, null);
  for (const locked of [respondingSession(), submittedSession(), dispatch(before, 'END')]) {
    assert.equal(dispatch(locked, 'SET_PARTICIPANT', { participant: 0, values: { avatar: null } }), locked);
  }
});

test('expression changes are private, preserve appearance, and lock with submission', () => {
  const state = deepFreeze(respondingSession());
  const changed = dispatch(state, 'SET_EXPRESSION', { participant: 0, expression: 'cyclops' });
  assert.equal(changed.participants[0].avatar.expression, 'cyclops');
  assert.equal(changed.participants[0].avatar.hair, state.participants[0].avatar.hair);
  assert.equal(state.participants[0].avatar.expression, 'calm');
  assert.equal(changed.participants[1], state.participants[1]);
  assert.deepEqual(session.visibleResponses(changed, 'handoff'), []);
  assert.equal(dispatch(changed, 'SET_EXPRESSION', { participant: 0, expression: 'unknown' }), changed);
  const submitted = dispatch(changed, 'SUBMIT_RESPONSE', { participant: 0 });
  assert.equal(dispatch(submitted, 'SET_EXPRESSION', { participant: 0, expression: 'smile-lol' }), submitted);
  for (const closed of [readySession(), submittedSession(), dispatch(changed, 'END')]) {
    assert.equal(dispatch(closed, 'SET_EXPRESSION', { participant: 1, expression: 'happy' }), closed);
  }
});

test('response entry requires two valid distinct participants and a selected scenario', () => {
  assert.equal(typeof session.sessionReducer, 'function');
  const initial = session.createSessionState();
  assert.equal(dispatch(initial, 'START_RESPONSES'), initial);
  const ready = readySession();
  for (const invalid of [
    { ...ready, scenarioId: null },
    { ...ready, scenarioId: 'missing' },
    { ...ready, participants: [] },
    { ...ready, participants: [participant('Alex')] },
    { ...ready, participants: new Array(2) },
    { ...ready, participants: null },
    { ...ready, participants: [participant('Alex'), participant(' alex ')] },
    { ...ready, participants: [participant(''), participant('Blair')] },
    { ...ready, participants: [participant('Alex'), { ...participant('Blair'), avatar: null }] },
  ]) {
    assert.equal(dispatch(invalid, 'START_RESPONSES'), invalid);
  }
  assert.equal(dispatch(ready, 'START_RESPONSES').status, 'responding');
});

test('draft edits whitelist response fields without mutating drafts or accepting submission injection', () => {
  assert.equal(typeof session.sessionReducer, 'function');
  const initial = deepFreeze(respondingSession());
  const values = deepFreeze({ ...drawn(), submitted: true, private: 'injected' });
  const updated = dispatch(initial, 'UPDATE_RESPONSE', { participant: 0, values });
  assert.deepEqual(updated.responses[0], { ...drawn(), submitted: false });
  assert.equal(updated.responses[1], initial.responses[1]);
  assert.equal(initial.responses[0].drawing, '');
  const invalid = dispatch(updated, 'UPDATE_RESPONSE', {
    participant: 0, values: { mode: 'color', text: {}, drawing: {}, color: 'url(unsafe)' },
  });
  assert.equal(invalid, updated);
});

test('first submission freezes its draft and does not reveal either response', () => {
  assert.equal(typeof session.sessionReducer, 'function');
  assert.equal(typeof session.canReveal, 'function');
  let state = respondingSession();
  state = dispatch(state, 'UPDATE_RESPONSE', { participant: 0, values: { text: 'a'.repeat(1201) } });
  assert.equal(dispatch(state, 'SUBMIT_RESPONSE', { participant: 0 }), state);
  state = dispatch(state, 'UPDATE_RESPONSE', { participant: 0, values: drawn() });
  const before = deepFreeze(state);
  const submitted = dispatch(before, 'SUBMIT_RESPONSE', { participant: 0 });
  assert.equal(submitted.responses[0].submitted, true);
  assert.equal(before.responses[0].submitted, false);
  assert.equal(submitted.responses[1].submitted, false);
  assert.equal(submitted.status, 'responding');
  assert.equal(session.canReveal(submitted), false);
  assert.equal(dispatch(submitted, 'UPDATE_RESPONSE', { participant: 0, values: written('Changed') }), submitted);
  assert.equal(dispatch(submitted, 'SUBMIT_RESPONSE', { participant: 0 }), submitted);
});

test('empty submissions reveal only after both participants explicitly submit', () => {
  for (const first of [0, 1]) {
    const state = respondingSession();
    const submitted = dispatch(state, 'SUBMIT_RESPONSE', { participant: first });
    assert.equal(submitted.responses[first].submitted, true);
    assert.equal(submitted.responses[1 - first].submitted, false);
    assert.equal(submitted.status, 'responding');
    assert.equal(session.canReveal(submitted), false);
    assert.deepEqual(session.visibleResponses(submitted, 'compare'), []);
    assert.equal(dispatch(submitted, 'UPDATE_RESPONSE', { participant: first, values: written('Changed') }), submitted);
    const revealed = dispatch(submitted, 'SUBMIT_RESPONSE', { participant: 1 - first });
    assert.equal(session.canReveal(revealed), true);
    for (const response of revealed.responses) {
      assert.equal(response.text, '');
      assert.equal(response.drawing, '');
      assert.equal(response.submitted, true);
    }
  }
});

test('only the second valid submission opens joint reveal, regardless of submission order', () => {
  assert.equal(typeof session.sessionReducer, 'function');
  assert.equal(typeof session.canReveal, 'function');
  for (const first of [0, 1]) {
    let state = respondingSession();
    state = dispatch(state, 'UPDATE_RESPONSE', { participant: 0, values: drawn() });
    state = dispatch(state, 'UPDATE_RESPONSE', { participant: 1, values: written() });
    state = dispatch(state, 'SUBMIT_RESPONSE', { participant: first });
    assert.equal(state.status, 'responding');
    state = dispatch(state, 'SUBMIT_RESPONSE', { participant: 1 - first });
    assert.equal(state.status, 'revealed');
    assert.equal(session.canReveal(state), true);
    assert.equal(dispatch(state, 'SUBMIT_RESPONSE', { participant: first }), state);
  }
  for (const malformed of [undefined, {}, { responses: [] }, { responses: new Array(2) }, { responses: [{ submitted: true }] }, { responses: [{ submitted: true }, { submitted: 'true' }] }]) {
    assert.equal(session.canReveal({ status: 'revealed', ...malformed }), false);
  }
});

test('reveal availability requires revealed status even when both responses are submitted', () => {
  const complete = submittedSession();
  assert.equal(session.canReveal(complete), true);
  for (const status of ['setup', 'responding', 'ended', 'unknown', undefined, null]) {
    assert.equal(session.canReveal({ ...complete, status }), false, `Reject reveal in status ${status}`);
  }
});

test('phase guards reject setup edits, premature submissions, and arbitrary navigation', () => {
  assert.equal(typeof session.sessionReducer, 'function');
  const setup = readySession();
  for (const action of [
    { type: 'UPDATE_RESPONSE', participant: 0, values: drawn() },
    { type: 'SUBMIT_RESPONSE', participant: 0 },
    { type: 'SET_REFLECTION', path: 'repair', text: 'early' },
    { type: 'REVEAL' },
    { type: 'SET_STATUS', status: 'revealed' },
    { type: 'NAVIGATE', phase: 'compare' },
  ]) assert.equal(session.sessionReducer(setup, action), setup);
  for (const state of [respondingSession(), submittedSession()]) {
    assert.equal(dispatch(state, 'SET_PARTICIPANT', { participant: 0, values: participant('Changed') }), state);
    assert.equal(dispatch(state, 'SELECT_SCENARIO', { id: 'studio' }), state);
    assert.equal(dispatch(state, 'START_RESPONSES'), state);
  }
  const revealed = submittedSession();
  assert.equal(dispatch(revealed, 'UPDATE_RESPONSE', { participant: 0, values: written('Changed') }), revealed);
});

test('malformed actions and participant indexes are ignored without crashes', () => {
  assert.equal(typeof session.sessionReducer, 'function');
  for (const state of [session.createSessionState(), respondingSession()]) {
    for (const action of [undefined, null, 'RESET', [], {}, { type: 'unknown' }]) {
      assert.equal(session.sessionReducer(state, action), state);
    }
    for (const index of [undefined, null, -1, 2, 0.5, '0', NaN, {}, '__proto__']) {
      for (const type of ['SET_PARTICIPANT', 'UPDATE_RESPONSE', 'SUBMIT_RESPONSE']) {
        assert.equal(dispatch(state, type, { participant: index, values: { name: 'Injected', ...written() } }), state);
      }
    }
    for (const values of [undefined, null, 'value', [], 4]) {
      assert.equal(dispatch(state, 'SET_PARTICIPANT', { participant: 0, values }), state);
      assert.equal(dispatch(state, 'UPDATE_RESPONSE', { participant: 0, values }), state);
    }
  }
});

test('handoff and setup selectors mount no private content in any session status', () => {
  assert.equal(typeof session.visibleResponses, 'function');
  for (const state of [session.createSessionState(), respondingSession(), submittedSession()]) {
    for (const phase of ['setup', 'handoff', 'welcome', 'unknown', undefined, null]) {
      assert.deepEqual(session.visibleResponses(state, phase), []);
    }
  }
  assert.deepEqual(session.visibleResponses(undefined, 'response'), []);
});

test('response selectors expose only the active unsubmitted draft without a partner reference', () => {
  assert.equal(typeof session.visibleResponses, 'function');
  let state = respondingSession();
  state = dispatch(state, 'UPDATE_RESPONSE', { participant: 0, values: drawn() });
  state = dispatch(state, 'UPDATE_RESPONSE', { participant: 1, values: written('Private partner draft') });
  for (const index of [0, 1]) {
    const visible = session.visibleResponses(state, 'response', index);
    assert.deepEqual(visible, [state.responses[index]]);
    assert.equal(visible.includes(state.responses[1 - index]), false);
    visible[0].text = 'Selector consumer mutation';
    assert.notEqual(state.responses[index].text, 'Selector consumer mutation');
  }
  for (const invalid of [null, '0', -1, 2, 0.5]) {
    assert.deepEqual(session.visibleResponses(state, 'response', invalid), []);
  }
  assert.deepEqual(session.visibleResponses(state, 'response'), [state.responses[0]]);
  state = dispatch(state, 'SUBMIT_RESPONSE', { participant: 0 });
  assert.deepEqual(session.visibleResponses(state, 'response', 0), []);
  assert.deepEqual(session.visibleResponses(state, 'response', 1), [state.responses[1]]);
});

test('compare and reflection selectors reveal both only after valid joint submission', () => {
  assert.equal(typeof session.visibleResponses, 'function');
  let state = respondingSession();
  state = dispatch(state, 'UPDATE_RESPONSE', { participant: 0, values: drawn() });
  state = dispatch(state, 'SUBMIT_RESPONSE', { participant: 0 });
  for (const phase of ['compare', 'reflection']) {
    assert.deepEqual(session.visibleResponses(state, phase), []);
    assert.deepEqual(session.visibleResponses({ ...state, status: 'revealed' }, phase), []);
    const revealed = submittedSession();
    const visible = session.visibleResponses(revealed, phase);
    assert.deepEqual(visible, revealed.responses);
    assert.notEqual(visible, revealed.responses);
    assert.notEqual(visible[0], revealed.responses[0]);
    assert.deepEqual(session.visibleResponses({ ...revealed, status: 'setup' }, phase), []);
  }
  assert.deepEqual(session.visibleResponses(submittedSession(), 'response'), []);
});

test('reflection accepts only five paths and bounded local text after joint reveal', () => {
  const before = deepFreeze(submittedSession());
  for (const path of ['repair', 'pause', 'agree', 'set-aside', 'later']) {
    const result = dispatch(before, 'SET_REFLECTION', { path, text: 'A small step.', injected: 'ignored' });
    assert.deepEqual(result.reflection, { path, text: 'A small step.' });
    assert.deepEqual(before.reflection, { path: null, text: '' });
  }
  for (const path of [undefined, null, 'agreement', 'Repair', 0, {}]) {
    assert.equal(dispatch(before, 'SET_REFLECTION', { path }), before);
  }
  assert.equal(dispatch(before, 'SET_REFLECTION', { text: 'a'.repeat(1201) }).reflection.text, 'a'.repeat(1200));
  assert.equal(dispatch(before, 'SET_REFLECTION', { text: {} }), before);
  const responding = respondingSession();
  assert.equal(dispatch(responding, 'SET_REFLECTION', { path: 'repair' }), responding);
  const bypass = { ...responding, status: 'revealed' };
  assert.equal(dispatch(bypass, 'SET_REFLECTION', { path: 'repair' }), bypass);
});

test('reset clears nicknames, persona selections, both responses, and reflection into independent new state', () => {
  let before = submittedSession();
  before = dispatch(before, 'SET_REFLECTION', { path: 'repair', text: 'Private reflection.' });
  before = { ...before, participants: [
    { name: 'Private Alex', avatar: { ...avatar(), hair: 'afro', expression: 'happy' } },
    { name: 'Private Blair', avatar: { ...avatar(), hair: 'hijab', expression: 'unsure' } },
  ] };
  deepFreeze(before);
  const reset = dispatch(before, 'RESET', { code: 'NEW234' });
  assert.deepEqual(reset, session.createSessionState('NEW234'));
  assert.deepEqual(dispatch(before, 'RESET'), session.createSessionState());
  assert.notEqual(reset.participants[0], reset.participants[1]);
  assert.notEqual(reset.responses[0], reset.responses[1]);
  assert.notEqual(reset.participants[0], before.participants[0]);
  assert.notEqual(reset.responses[0], before.responses[0]);
  assert.equal(before.responses[0].submitted, true);
  assert.equal(before.reflection.text, 'Private reflection.');
});

test('end clears all participant content and accepts no subsequent setup or response edits', () => {
  let before = submittedSession();
  before = dispatch(before, 'SET_REFLECTION', { path: 'later', text: 'Private reflection.' });
  const ended = dispatch(before, 'END', { code: 'ENDED2' });
  assert.deepEqual(ended, { ...session.createSessionState('ENDED2'), status: 'ended' });
  assert.deepEqual(dispatch(before, 'END'), { ...session.createSessionState(), status: 'ended' });
  for (const action of [
    { type: 'SET_PARTICIPANT', participant: 0, values: participant() },
    { type: 'SELECT_SCENARIO', id: 'playlist' },
    { type: 'START_RESPONSES' },
    { type: 'UPDATE_RESPONSE', participant: 0, values: drawn() },
    { type: 'SUBMIT_RESPONSE', participant: 0 },
    { type: 'SET_REFLECTION', path: 'repair', text: 'Private' },
  ]) assert.equal(session.sessionReducer(ended, action), ended);
  for (const phase of ['setup', 'handoff', 'response', 'compare', 'reflection']) {
    assert.deepEqual(session.visibleResponses(ended, phase), []);
  }
  assert.equal(dispatch(ended, 'RESET').status, 'setup');
});
