import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

await mkdir(resolve('test-results'), { recursive: true });
const output = resolve('test-results/session-menu-ssr.mjs');
const bundle = await build({ stdin: { contents: `
export * from './src/components.jsx';
export { LanguageProvider } from './src/Language.jsx';
export { Welcome, Onboarding } from './src/screens/Onboarding.jsx';
export { default as Ending } from './src/screens/Ending.jsx';
`, resolveDir: resolve('.'), sourcefile: 'session-menu-entry.jsx' }, bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external' });
await writeFile(output, bundle.outputFiles[0].text);
const { Header, SessionMenu, EndSessionDialog, LanguageProvider, Welcome, Onboarding, Ending } = await import(pathToFileURL(output));
const render = (Component, props = {}, language = 'en') => renderToStaticMarkup(React.createElement(LanguageProvider, { initialLanguage: language }, React.createElement(Component, props)));

test('the question mark advertises an accessible collapsed menu', () => {
  const html = render(Header, { onHelpSelect() {} });
  assert.match(html, /aria-haspopup="menu"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /Open help and session options/);
});

test('the compact menu contains exactly the three requested actions in both languages', () => {
  assert.equal(typeof SessionMenu, 'function');
  const html = render(SessionMenu);
  assert.match(html, /role="menu"/);
  assert.equal((html.match(/role="menuitem"/g) || []).length, 3);
  assert.match(html, />Ground Rules<\/button>/);
  assert.match(html, />Onboarding<\/button>/);
  assert.match(html, />End Session<\/button>/);
  assert.doesNotMatch(html, /Start over|View introduction/);
  const es = render(SessionMenu, {}, 'es');
  assert.match(es, /Acuerdos básicos/);
  assert.match(es, /Introducción/);
  assert.match(es, /Finalizar sesión/);
});

test('Welcome places Not Interested after the primary action without requiring acknowledgment', () => {
  const html = render(Welcome, { acknowledged: false });
  assert.match(html, /page-secondary-actions[^>]*><button[^>]*>Not Interested<\/button>/);
  assert.doesNotMatch(html, /disabled/);
  assert.match(render(Welcome, {}, 'es'), /No me interesa/);
});

test('the end confirmation uses the supplied compact title and one primary action', () => {
  assert.equal(typeof EndSessionDialog, 'function');
  const html = render(EndSessionDialog);
  assert.match(html, /Let’s do this another time/);
  assert.match(html, />End Session<\/button>/);
  assert.match(html, /Close<\/button>/);
  assert.doesNotMatch(html, /Keep exploring|Keep this session/);
  assert.match(render(EndSessionDialog, { busy: true }), /disabled[^>]*>Ending session…/);
  assert.match(render(EndSessionDialog, {}, 'es'), /Dejémoslo para otro momento/);
});

test('reviewing onboarding offers a return action instead of restarting the activity', () => {
  assert.match(render(Onboarding, { index: 0, reviewing: true }), /Return to activity/);
  assert.doesNotMatch(render(Onboarding, { index: 0, reviewing: true }), /Skip for Now/);
  assert.match(render(Onboarding, { index: 3, reviewing: true }, 'es'), /Volver a la actividad/);
  assert.match(render(Onboarding, { index: 0 }), /Skip for Now/);
});

test('ending reports manual closing guidance and unconfirmed shared cleanup honestly', () => {
  assert.match(render(Ending, { closeRequested: true }), /You can now close this tab/);
  assert.match(render(Ending, { closeRequested: true, sharedEndUnconfirmed: true }), /couldn’t confirm/);
  assert.match(render(Ending, { closeRequested: true }, 'es'), /Ya puedes cerrar esta pestaña/);
});
