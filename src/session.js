import { scenarios } from './data.js';
import { avatarOptions, isAvatar } from './avatar.js';
import { readJointSnapshot } from './joint-session.js';
export { readJointSnapshot };

const REFLECTION_PATHS = ['repair', 'pause', 'agree', 'set-aside', 'later'];
const TEXT_LIMIT = 1200;
const trimmed = (value) => typeof value === 'string' ? value.trim() : '';

export function createSessionState(code = '', codeSource = 'local') {
  return {
    code,
    codeSource: codeSource === 'server' ? 'server' : 'local',
    participants: Array.from({ length: 2 }, () => ({
      name: '', avatar: null,
    })),
    scenarioId: null,
    responses: Array.from({ length: 2 }, () => ({
      mode: 'draw', text: '', drawing: '', color: '#68547F', submitted: false,
    })),
    reflection: { path: null, text: '' },
    status: 'setup',
  };
}

export function normalizeSessionCode(value) {
  const code = trimmed(value).toUpperCase();
  return /^[A-Z0-9]{6}$/.test(code) ? code : '';
}

export function validateNickname(value, otherName = '') {
  const name = trimmed(value);
  if (!name) return 'Enter a nickname.';
  if (name.length > 30) return 'Keep your nickname to 30 characters.';
  if (name.toLowerCase() === trimmed(otherName).toLowerCase()) return 'Choose different nicknames.';
  return '';
}

export function validateParticipant(participant, otherName = '') {
  const issue = validateNickname(participant?.name, otherName);
  if (issue) return issue;
  if (!isAvatar(participant?.avatar)) return 'Choose an avatar option to create your person.';
  return '';
}

export function validateResponse(response) {
  if (!['draw', 'write'].includes(response?.mode)) return 'Choose drawing or writing.';
  if (typeof response.text !== 'string') return 'Use text for your response.';
  if (typeof response.drawing !== 'string') return 'Use the drawing pad to create an image.';
  const text = trimmed(response?.text);
  if (text.length > TEXT_LIMIT) return 'Keep your response to 1,200 characters.';
  return '';
}

export function newSessionCode() {
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

function bothResponsesSubmitted(state) {
  return Array.isArray(state?.responses) && state.responses.length === 2
    && state.responses[0]?.submitted === true && state.responses[1]?.submitted === true;
}

export function canReveal(state) {
  return state?.status === 'revealed' && bothResponsesSubmitted(state);
}

export function visibleResponses(state, phase, activeIndex = 0) {
  if (phase === 'response' && state?.status === 'responding' && validIndex(activeIndex)) {
    const draft = state.responses?.[activeIndex];
    return draft && !draft.submitted ? [{ ...draft }] : [];
  }
  if (['compare', 'reflection'].includes(phase) && state?.status === 'revealed' && canReveal(state)) {
    return state.responses.map((response) => ({ ...response }));
  }
  return [];
}

const validIndex = (index) => index === 0 || index === 1;
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isString = (value) => typeof value === 'string';
const hasScenario = (id) => scenarios.some((scenario) => scenario.id === id);

function allowedChanges(current, values, rules) {
  if (!isRecord(values)) return {};
  return Object.fromEntries(Object.entries(rules).flatMap(([key, validate]) => (
    Object.hasOwn(values, key) && validate(values[key]) && values[key] !== current[key]
      ? [[key, values[key]]] : []
  )));
}

function replaceItem(items, index, changes) {
  return items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item);
}

export function sessionReducer(state = createSessionState(), action) {
  if (!isRecord(action)) return state;
  const index = action.participant;
  switch (action.type) {
    case 'SYNC_JOINT': {
      const snapshot = readJointSnapshot(action.session);
      if (!snapshot || (state.code === snapshot.code && (snapshot.round < (state.jointRound ?? 0) || snapshot.revision <= (state.jointRevision ?? -1)))) return state;
      const next = createSessionState(snapshot.code, 'server');
      const sameRound = state.code === snapshot.code && state.jointRound === snapshot.round;
      const own = snapshot.participantIndex;
      next.jointRound = snapshot.round;
      next.jointRevision = snapshot.revision;
      if (snapshot.phase === 'ended') return { ...next, status: 'ended' };
      next.participants = snapshot.participants.map((person, index) => person ? {
        name: person.name,
        avatar: sameRound && index === own && snapshot.phase === 'responding' && !person.submitted && isAvatar(state.participants[own].avatar)
          ? { ...state.participants[own].avatar } : { ...person.avatar },
      } : { name: '', avatar: null });
      next.scenarioId = snapshot.phase === 'lobby' && sameRound && own === 0 ? state.scenarioId : snapshot.scenarioId;
      next.status = snapshot.phase === 'lobby' ? 'setup' : snapshot.phase === 'revealed' ? 'revealed' : 'responding';
      next.reflection.path = snapshot.reflectionPath;
      if (snapshot.phase === 'revealed') next.responses = snapshot.responses.map(response => ({ ...response }));
      else {
        if (sameRound && snapshot.phase === 'responding') next.responses[own] = { ...state.responses[own] };
        next.responses.forEach((response, index) => { response.submitted = snapshot.participants[index]?.submitted === true; });
      }
      return next;
    }
    case 'RESET':
      return createSessionState(action.code, action.codeSource);
    case 'END':
      return { ...createSessionState(action.code), status: 'ended' };
    case 'SET_PARTICIPANT': {
      if (state.status !== 'setup' || !validIndex(index)) return state;
      const changes = allowedChanges(state.participants[index], action.values, {
        name: isString,
        avatar: (value) => value === null || isAvatar(value),
      });
      if (!Object.keys(changes).length) return state;
      if (changes.avatar) changes.avatar = { ...changes.avatar };
      return { ...state, participants: replaceItem(state.participants, index, changes) };
    }
    case 'SET_EXPRESSION': {
      if (state.status !== 'responding' || !validIndex(index) || state.responses[index].submitted
        || !isAvatar(state.participants[index].avatar)
        || !avatarOptions.expression.some((option) => option.id === action.expression)
        || state.participants[index].avatar.expression === action.expression) return state;
      const avatar = { ...state.participants[index].avatar, expression: action.expression };
      return { ...state, participants: replaceItem(state.participants, index, { avatar }) };
    }
    case 'SELECT_SCENARIO':
      if (state.status !== 'setup' || !hasScenario(action.id) || state.scenarioId === action.id) return state;
      return { ...state, scenarioId: action.id };
    case 'START_RESPONSES':
      if (state.status !== 'setup' || !hasScenario(state.scenarioId)
        || !Array.isArray(state.participants) || state.participants.length !== 2
        || validateParticipant(state.participants[0], state.participants[1]?.name)
        || validateParticipant(state.participants[1], state.participants[0]?.name)) return state;
      return { ...state, status: 'responding' };
    case 'UPDATE_RESPONSE': {
      if (state.status !== 'responding' || !validIndex(index) || state.responses[index].submitted) return state;
      const changes = allowedChanges(state.responses[index], action.values, {
        mode: (value) => ['draw', 'write'].includes(value),
        text: isString,
        drawing: isString,
        color: (value) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value),
      });
      if (!Object.keys(changes).length) return state;
      return { ...state, responses: replaceItem(state.responses, index, changes) };
    }
    case 'SUBMIT_RESPONSE': {
      if (state.status !== 'responding' || !validIndex(index)
        || state.responses[index].submitted || validateResponse(state.responses[index])) return state;
      const next = { ...state, responses: replaceItem(state.responses, index, { submitted: true }) };
      return { ...next, status: bothResponsesSubmitted(next) ? 'revealed' : 'responding' };
    }
    case 'SET_REFLECTION': {
      if (state.status !== 'revealed' || !canReveal(state)) return state;
      const values = { ...action };
      if (isString(values.text)) values.text = values.text.slice(0, TEXT_LIMIT);
      const changes = allowedChanges(state.reflection, values, {
        path: (value) => REFLECTION_PATHS.includes(value),
        text: isString,
      });
      if (!Object.keys(changes).length) return state;
      return { ...state, reflection: { ...state.reflection, ...changes } };
    }
    default:
      return state;
  }
}
