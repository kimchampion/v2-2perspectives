import { isAvatar } from './avatar.js';
import { scenarios } from './data.js';

const paths = ['repair', 'pause', 'agree', 'set-aside', 'later'];
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const keys = (value, allowed) => Object.keys(value).every(key => allowed.includes(key));
const png = value => typeof value === 'string' && value.length <= 2000000 && (value === '' || /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value));

export function readJointSnapshot(value) {
  if (!record(value) || !keys(value, ['code', 'participantIndex', 'round', 'revision', 'phase', 'scenarioId', 'reflectionPath', 'participants', 'responses'])
    || typeof value.code !== 'string' || !/^[A-Z0-9]{6}$/.test(value.code) || ![0, 1].includes(value.participantIndex)
    || !Number.isSafeInteger(value.round) || value.round < 1 || !Number.isSafeInteger(value.revision) || value.revision < 0
    || !['lobby', 'responding', 'revealed', 'ended'].includes(value.phase)
    || !Array.isArray(value.participants) || value.participants.length !== 2
    || !(value.scenarioId === null || scenarios.some(scenario => scenario.id === value.scenarioId))
    || !(value.reflectionPath === null || paths.includes(value.reflectionPath))) return null;
  const participants = [];
  for (const person of value.participants) {
    if (person === null) { participants.push(null); continue; }
    if (!record(person) || !keys(person, ['name', 'avatar', 'connected', 'submitted'])
      || typeof person.name !== 'string' || !person.name.trim() || person.name.length > 30 || !isAvatar(person.avatar)
      || typeof person.connected !== 'boolean' || typeof person.submitted !== 'boolean') return null;
    participants.push({ name: person.name.trim(), avatar: { ...person.avatar }, connected: person.connected, submitted: person.submitted });
  }
  if (participants[0] && participants[1] && participants[0].name.toLowerCase() === participants[1].name.toLowerCase()) return null;
  if (value.phase === 'ended') {
    if (participants.some(Boolean) || value.scenarioId !== null || value.reflectionPath !== null || Object.hasOwn(value, 'responses')) return null;
  } else if (!participants[value.participantIndex]) return null;
  if (value.phase === 'lobby' && (value.scenarioId !== null || value.reflectionPath !== null || participants.some(person => person?.submitted))) return null;
  if (['responding', 'revealed'].includes(value.phase) && (!value.scenarioId || participants.some(person => !person))) return null;
  const result = { code: value.code, participantIndex: value.participantIndex, round: value.round, revision: value.revision, phase: value.phase, scenarioId: value.scenarioId, reflectionPath: value.reflectionPath, participants };
  if (value.phase !== 'revealed') return Object.hasOwn(value, 'responses') || value.reflectionPath !== null ? null : result;
  if (!participants.every(person => person.submitted) || !Array.isArray(value.responses) || value.responses.length !== 2) return null;
  result.responses = [];
  for (const response of value.responses) {
    if (!record(response) || !keys(response, ['mode', 'text', 'drawing', 'color', 'submitted']) || response.submitted !== true
      || !['draw', 'write'].includes(response.mode) || typeof response.text !== 'string' || response.text.length > 1200
      || !png(response.drawing) || typeof response.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(response.color)) return null;
    result.responses.push({ mode: response.mode, text: response.text, drawing: response.drawing, color: response.color, submitted: true });
  }
  return result;
}
