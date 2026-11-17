import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createAvatar } from '../src/avatar.js';

await mkdir(resolve('test-results'), { recursive: true });
const output = resolve('test-results/setup-avatar-ssr.mjs');
const bundle = await build({ entryPoints: [resolve('src/screens/Setup.jsx')], bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external' });
await writeFile(output, bundle.outputFiles[0].text);
const { CreatePerson, ScenarioPicker, SessionChoices, SessionInvitation, JoinCodeForm, JointStatus } = await import(pathToFileURL(output));
const render = (participant, otherName = 'Sky') => renderToStaticMarkup(React.createElement(CreatePerson, { participant, otherName, index: 0 }));
const submitButton = (html) => html.match(/<button\b[^>]*type="submit"[^>]*>/)?.[0] || '';

test('person setup uses the requested copy, nickname field, and local avatar preview', () => {
  assert.equal(typeof CreatePerson, 'function');
  const html = render({ name: '', avatar: null });
  assert.match(html, /<h1>Build your persona<\/h1>/);
  assert.match(html, /<p>Create an avatar that feels like you\.<\/p>/);
  assert.match(html, /Name or nickname/);
  assert.match(html, /placeholder="Enter your name or nickname"/);
  assert.match(html, /How are you feeling right now\?/);
  assert.match(html, /\/assets\/open-peeps\/head\/shaved-ink.svg/);
  assert.match(html, /No expression/);
  assert.doesNotMatch(html, /href="\/assets\/open-peeps\/expression\//);
  assert.match(submitButton(html), /disabled/);
});

test('a nickname alone cannot continue before an avatar option is selected', () => {
  const html = render({ name: 'River', avatar: null });
  assert.match(submitButton(html), /disabled/);
  assert.match(html, /Choose an avatar option/);
});

test('a valid nickname and avatar can continue and render the selected parts', () => {
  const html = render({ name: 'River', avatar: createAvatar({ hair: 'afro', expression: 'happy' }) });
  assert.ok(submitButton(html));
  assert.doesNotMatch(submitButton(html), /disabled/);
  assert.match(html, /head\/afro-ink.svg/);
  assert.match(html, /expression\/happy.svg/);
  for (const label of ['Hair style', 'Clothing', 'Accessories', 'Expression', 'Reset avatar']) assert.ok(html.includes(`>${label}<`));
  assert.doesNotMatch(html, />Hair color</);
});

test('duplicate nicknames disable Continue and explain the error inline', () => {
  const html = render({ name: ' sky ', avatar: createAvatar() });
  assert.match(submitButton(html), /disabled/);
  assert.match(html, /Choose different nicknames\./);
  assert.match(html, /aria-invalid="true"/);
});

test('scenario introduction shows the first participant’s configured avatar beside their greeting', () => {
  const participant = { name: 'River', avatar: createAvatar({ hair: 'afro', expression: 'happy' }) };
  const html = renderToStaticMarkup(React.createElement(ScenarioPicker, { participant }));
  assert.match(html, /Hi River!/);
  assert.match(html, /head\/afro-ink.svg/);
  assert.match(html, /expression\/happy.svg/);
});

test('session choices present three explicit routes without generating or displaying a code', () => {
  assert.equal(typeof SessionChoices, 'function');
  const html = renderToStaticMarkup(React.createElement(SessionChoices));
  for (const label of ['Create Session', 'Join Session', 'Share one device']) assert.ok(html.includes(`>${label}</button>`));
  assert.doesNotMatch(html, /session-code|Enter joint session|Local demo code|disabled/);
});

test('pending creation disables duplicate creation while keeping join and local choices available', () => {
  assert.equal(typeof SessionChoices, 'function');
  const html = renderToStaticMarkup(React.createElement(SessionChoices, { pending: true, waiting: true }));
  assert.match(html.match(/<button\b[^>]*>Creating session…<\/button>/)?.[0] || '', /disabled=""/);
  assert.match(html, /aria-busy="true"/);
  for (const label of ['Join Session', 'Share one device']) {
    const button = html.match(new RegExp(`<button\\b[^>]*>${label}</button>`))?.[0];
    assert.ok(button, `${label} remains available`);
    assert.doesNotMatch(button, /disabled/);
  }
  assert.match(html, /role="status"/);
  assert.match(html, /waking up/);
});

test('a failed creation keeps the three choices available and announces the error', () => {
  assert.equal(typeof SessionChoices, 'function');
  const html = renderToStaticMarkup(React.createElement(SessionChoices, { error: 'The session server is unavailable.' }));
  assert.match(html, /role="alert"/);
  assert.match(html, /The session server is unavailable\./);
  assert.doesNotMatch(html, /disabled/);
  assert.match(html, />Create Session<\/button>/);
  assert.match(html, />Share one device<\/button>/);
});

test('the creator can share the real code before persona setup without another joint-entry step', () => {
  assert.equal(typeof SessionInvitation, 'function');
  const html = renderToStaticMarkup(React.createElement(SessionInvitation, { code: 'A01BC2', onContinue() {} }));
  assert.match(html, /Your session is ready/);
  assert.match(html, /<strong class="session-code">A01BC2<\/strong>/);
  assert.match(html, /Copy code/);
  assert.match(html, /Build your persona/);
  assert.doesNotMatch(html, /Enter joint session|Local demo code|Have a session code|<input/);
});

test('an unavailable created code cannot be copied or used to continue', () => {
  assert.equal(typeof SessionInvitation, 'function');
  const html = renderToStaticMarkup(React.createElement(SessionInvitation, { code: '' }));
  assert.match(html, /Session code unavailable/);
  assert.equal((html.match(/disabled=""/g) || []).length, 2);
});

test('partner code entry is accessible before creating another session', () => {
  assert.equal(typeof JoinCodeForm, 'function');
  const html = renderToStaticMarkup(React.createElement(JoinCodeForm));
  assert.match(html, /Enter session code/);
  assert.match(html, /maxlength="6"/i);
  assert.match(html, /Continue/);
});

test('waiting for a partner mounts no response input or private response content', () => {
  assert.equal(typeof JointStatus, 'function');
  const html = renderToStaticMarkup(React.createElement(JointStatus, { code: 'ABC123', connection: 'connected', session: { phase: 'responding', participantIndex: 0, participants: [{ name: 'River', submitted: true, connected: true }, { name: 'Sky', submitted: false, connected: true }] } }));
  assert.match(html, /Waiting for Sky/);
  assert.doesNotMatch(html, /<textarea|<canvas|response-artwork/);
});
