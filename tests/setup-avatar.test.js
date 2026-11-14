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
const { CreatePerson, ScenarioPicker } = await import(pathToFileURL(output));
const render = (participant, otherName = 'Sky') => renderToStaticMarkup(React.createElement(CreatePerson, { participant, otherName, index: 0 }));
const submitButton = (html) => html.match(/<button\b[^>]*type="submit"[^>]*>/)?.[0] || '';

test('person setup uses the requested copy, nickname field, and local avatar preview', () => {
  assert.equal(typeof CreatePerson, 'function');
  const html = render({ name: '', avatar: null });
  assert.match(html, /<h1>Persona<\/h1>/);
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
