import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { parse } from '@babel/parser';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as data from '../src/data.js';
import { onboarding, reflectionPaths } from '../src/content.js';
import { avatarOptions, createAvatar } from '../src/avatar.js';
import { createSessionState, sessionReducer } from '../src/session.js';
import { formatScenarioText } from '../src/scenario-copy.js';
import { spanishMessages, translate, translateError } from '../src/i18n.js';

await mkdir(resolve('test-results'), { recursive: true });
const output = resolve('test-results/localization-ssr.mjs');
const bundle = await build({ stdin: { contents: `
export { default as App } from './src/App.jsx';
export { LanguageProvider } from './src/Language.jsx';
export * from './src/screens/Onboarding.jsx';
export { ScenarioPicker, CreatePerson, JointStatus } from './src/screens/Setup.jsx';
export { default as Conversation } from './src/screens/Conversation.jsx';
export { default as Reflection, ReflectionPrompt } from './src/screens/Reflection.jsx';
export { AvatarOptions, AvatarDialog } from './src/AvatarBuilder.jsx';
export { ErrorMessage } from './src/components.jsx';
`, resolveDir: resolve('.'), sourcefile: 'localization-entry.jsx' }, bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external' });
await writeFile(output, bundle.outputFiles[0].text);
const { App, ChooseLanguage, Welcome, Onboarding, LanguageProvider, ScenarioPicker, CreatePerson, JointStatus, Conversation, Reflection, ReflectionPrompt, AvatarOptions, AvatarDialog, ErrorMessage } = await import(pathToFileURL(output));
const render = (Component, props = {}, language = 'es') => renderToStaticMarkup(React.createElement(LanguageProvider, { initialLanguage: language }, React.createElement(Component, props)));

test('a separate language screen offers English and Español before the introduction', () => {
  assert.equal(typeof ChooseLanguage, 'function');
  const html = render(ChooseLanguage, {}, 'en');
  assert.match(html, /lang="en">Language/);
  assert.match(html, /lang="es">Idioma/);
  assert.match(html, /<h1 class="sr-only">Choose your language<\/h1>/);
  assert.match(html, /Language.*Idioma/);
  assert.match(html, /<select[^>]*name="language"/);
  assert.match(html, /<option[^>]*value="en"[^>]*selected[^>]*>English<\/option>/);
  assert.match(html, /<option[^>]*value="es"[^>]*>Español<\/option>/);
  assert.match(html, /<button[^>]*>Continue<\/button>/);
  const spanish = render(ChooseLanguage);
  assert.match(spanish, /<h1 class="sr-only">Elige tu idioma<\/h1>/);
  assert.match(spanish, /value="es"[^>]*selected/);
  assert.match(spanish, /<button[^>]*>Continuar<\/button>/);
});

test('Welcome retains its acknowledgment and no longer repeats the language dropdown', () => {
  const html = render(Welcome, { acknowledged: true });
  assert.doesNotMatch(html, /<select|Language.*Idioma/);
  assert.match(html, /type="checkbox"[^>]*checked/);
  assert.match(html, /Comencemos/);
});

test('all four Spanish onboarding screens translate copy, artwork labels, navigation and dots', () => {
  onboarding.forEach((page, index) => {
    const spanish = render(Onboarding, { index });
    assert.ok(spanish.includes(translate(page.title, 'es')));
    assert.ok(spanish.includes(translate(page.text, 'es')));
    assert.ok(spanish.includes(translate(page.alt, 'es')));
    assert.match(spanish, /Siguiente/);
    assert.match(spanish, /Omitir por ahora/);
    assert.ok(spanish.includes(`Introducción ${index + 1} de 4`));
    assert.ok(spanish.includes(`Introducción ${index + 1}: ${translate(page.title, 'es')}`));
    assert.match(render(Onboarding, { index }, 'en'), new RegExp(page.title));
  });
});

test('Spanish interpolation is a single pass and never translates nickname values', () => {
  const name = 'Continue {number} $& [User 2]';
  assert.equal(translate('Hi {name}!', 'es', { name }), `¡Hola, ${name}!`);
  assert.equal(translate('Person {number} of 2', 'es', { number: 2 }), 'Persona 2 de 2');
  assert.equal(translate('Hi {name}!', 'en', { name }), `Hi ${name}!`);
  assert.equal(translate('Unknown public message', 'es'), 'Unknown public message');
  assert.equal(translate('constructor', 'es'), 'constructor');
});

test('language providers do not leak Spanish into independent English rendering', () => {
  const es = render(Welcome);
  const en = render(Welcome, {}, 'en');
  assert.match(es, /Una historia\.<br\/>Dos perspectivas\./);
  assert.match(en, /One story\.<br\/>Two perspectives\./);
  assert.doesNotMatch(en, /Una historia/);
  assert.match(renderToStaticMarkup(React.createElement(App, { initialLanguage: 'es' })), /lang="es"/);
});

test('Spanish scenarios retain literal nicknames and the passenger/driver assignment', () => {
  const participants = [{ name: '[User 2] $&' }, { name: 'Continue {name}' }];
  const ride = data.scenarios[0];
  const original = JSON.stringify(ride);
  const spanish = data.localizeScenario(ride, 'es');
  assert.equal(data.localizeScenario(ride, 'en'), ride);
  assert.equal(formatScenarioText(spanish.story, participants).startsWith('Continue {name} lleva a [User 2] $&'), true);
  assert.match(spanish.perspectives[0], /asiento del pasajero/);
  assert.match(spanish.perspectives[1], /al volante/);
  assert.equal(JSON.stringify(ride), original);
});

test('all onboarding, reflection, avatar and preset descriptions have Spanish translations', () => {
  const labels = [...onboarding.flatMap(page => [page.title, page.text, page.alt]), ...reflectionPaths.flatMap(path => [path.title, path.label, path.description, ...path.questions]), ...Object.values(avatarOptions).flatMap(options => options.map(option => option.label)), ...data.presetColors.flatMap(color => [color.label, color.note])];
  for (const label of labels) assert.ok(Object.hasOwn(spanishMessages, label), `Missing Spanish copy: ${label}`);
});

test('every explicit translation key in the UI exists in the Spanish catalog', async () => {
  const files = ['App.jsx', 'components.jsx', 'Avatar.jsx', 'AvatarBuilder.jsx', 'SelectionGrid.jsx', 'SketchPad.jsx', ...(await readdir('src/screens')).filter(file => file.endsWith('.jsx')).map(file => `screens/${file}`)];
  const keys = new Set();
  function strings(node) { if (node?.type === 'StringLiteral') keys.add(node.value); else if (node?.type === 'ConditionalExpression') { strings(node.consequent); strings(node.alternate); } }
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'CallExpression' && node.callee.name === 't') strings(node.arguments[0]);
    if (node.type === 'JSXAttribute' && node.name.name === 'message' && node.value?.type === 'StringLiteral') keys.add(node.value.value);
    for (const value of Object.values(node)) { if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value); }
  }
  for (const file of files) visit(parse(await readFile(`src/${file}`, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }));
  for (const key of keys) assert.ok(Object.hasOwn(spanishMessages, key), `Missing Spanish UI key: ${key}`);
});

test('Spanish views translate public UI while keeping responses literal and private', () => {
  let state = createSessionState();
  const names = ['Continue', 'Next {name}'];
  names.forEach((name, participant) => { state = sessionReducer(state, { type: 'SET_PARTICIPANT', participant, values: { name, avatar: createAvatar() } }); });
  state = sessionReducer(state, { type: 'SELECT_SCENARIO', id: 'ride' });
  state = sessionReducer(state, { type: 'START_RESPONSES' });
  state = sessionReducer(state, { type: 'UPDATE_RESPONSE', participant: 0, values: { text: 'My thoughts: Continue, Draw, {name}.' } });
  const own = render(Conversation, { screen: 'response', state, active: 0 });
  assert.match(own, /¿Qué piensas\?/);
  assert.match(own, /My thoughts: Continue, Draw, \{name\}\./);
  const handoff = render(Conversation, { screen: 'handoff', state, active: 1 });
  assert.doesNotMatch(handoff, /My thoughts:|<textarea|<canvas/);
  state = sessionReducer(state, { type: 'SUBMIT_RESPONSE', participant: 0 });
  assert.doesNotMatch(render(Conversation, { screen: 'compare', state }), /My thoughts:/);
  state = sessionReducer(state, { type: 'SUBMIT_RESPONSE', participant: 1 });
  const comparison = render(Conversation, { screen: 'compare', state });
  assert.match(comparison, /My thoughts: Continue, Draw, \{name\}\./);
  assert.match(comparison, /Next \{name\} no escribió una respuesta/);
  assert.match(comparison, /Continue no hizo un dibujo/);
  const perspective = render(Conversation, { screen: 'perspective', state, active: 0 });
  assert.match(perspective, /asiento del pasajero/);
  assert.match(perspective, /La perspectiva de Continue/);
});

test('Spanish persona, choices, reflection and status views have localized public labels', () => {
  assert.match(render(CreatePerson, { participant: { name: 'Ana', avatar: null } }), /Crea tu avatar/);
  assert.match(render(CreatePerson, { participant: { name: 'Ana', avatar: null } }), /Elige una opción para crear tu avatar/);
  assert.match(render(AvatarOptions, { field: 'expression', avatar: createAvatar() }), /Sin expresión/);
  assert.match(render(AvatarDialog, { field: 'clothing', avatar: createAvatar() }), /Aplicar ropa/);
  assert.match(render(Onboarding, { index: 0 }), /Comparte tu perspectiva/);
  const session = { participantIndex: 1, phase: 'lobby', participants: [{ name: 'Continue', connected: true }, { name: 'Ana', connected: true }] };
  assert.match(render(JointStatus, { session, connection: 'connected', error: '' }), /Esperando a que Continue elija una situación/);
  assert.match(render(JointStatus, { connection: 'error', error: 'This session is unavailable. Create a new session.' }), /Esta sesión no está disponible/);
  assert.match(render(ReflectionPrompt, { path: reflectionPaths[0] }), /¿Qué pequeño gesto/);
  assert.match(render(Reflection, { state: { status: 'responding' } }), /Ambas respuestas deben enviarse/);
  assert.match(render(ScenarioPicker, { participant: { name: 'Ana', avatar: createAvatar() }, participants: [{ name: 'Ana' }, { name: 'Luis' }] }), /Luis lleva a Ana/);
});

test('known validation errors translate and unknown technical failures get a Spanish fallback', () => {
  assert.equal(translateError('Choose different nicknames.', 'es'), 'Elijan nombres diferentes.');
  assert.equal(translateError('Network failed unexpectedly', 'es'), 'No se pudo completar la acción. Inténtalo de nuevo.');
  assert.equal(translateError('Network failed unexpectedly', 'en'), 'Network failed unexpectedly');
  assert.match(render(ErrorMessage, { children: 'Choose different nicknames.' }), /Elijan nombres diferentes/);
});

test('all scenarios have a complete Spanish copy with unchanged scenario and role mapping', () => {
  assert.equal(typeof data.localizeScenario, 'function');
  for (const scenario of data.scenarios) {
    const spanish = data.localizeScenario(scenario, 'es');
    assert.equal(spanish.id, scenario.id);
    assert.equal(spanish.image, scenario.image);
    for (const field of ['title', 'category', 'story', 'perspectives']) assert.ok(spanish[field], `${scenario.id}.${field}`);
    assert.equal(spanish.perspectives.length, 2);
    assert.notEqual(spanish.story, scenario.story);
  }
  const ride = data.localizeScenario(data.scenarios[0], 'es');
  assert.deepEqual(ride.roles, ['Pasajero', 'Conductor']);
  assert.match(ride.story, /\[User 2\].*\[User 1\]/);
});
