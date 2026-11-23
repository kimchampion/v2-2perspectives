import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

await mkdir(resolve('test-results'), { recursive: true });
const output = resolve('test-results/page-layout-ssr.mjs');
const bundle = await build({ entryPoints: [resolve('src/components.jsx')], bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external' });
await writeFile(output, bundle.outputFiles[0].text);
const { Page, Action } = await import(pathToFileURL(output));
const el = React.createElement;
const render = props => renderToStaticMarkup(el(Page, props, el('form', { id: 'original-form' }, el('input', { name: 'nickname' }))));

test('pagination precedes the primary slot and secondary actions follow without losing form ownership', () => {
  const html = render({ pagination: el('nav', { 'aria-label': 'Introduction pages' }, 'Pages'), actions: el(React.Fragment, null,
    false, el(Action, { type: 'submit', form: 'original-form' }, 'Continue'),
    el(React.Fragment, null, null, el('button', { type: 'button' }, 'Back')),
  ) });
  assert.match(html, /page-pagination-slot[^>]*><nav aria-label="Introduction pages"/);
  assert.match(html, /page-primary-action[^>]*><button[^>]*type="submit"[^>]*form="original-form"/);
  assert.match(html, /page-secondary-actions[^>]*><button type="button">Back/);
  assert.equal((html.match(/>Continue<|>Back</g) || []).length, 2);
  assert.ok(html.indexOf('Introduction pages') < html.indexOf('>Continue<'));
  assert.ok(html.indexOf('>Continue<') < html.indexOf('>Back<'));
});

test('a lone primary action does not reserve empty pagination or secondary rows', () => {
  const html = render({ actions: el(Action, null, 'Next') });
  assert.doesNotMatch(html, /page-pagination-slot|page-secondary-actions/);
  assert.equal((html.match(/<button\b/g) || []).length, 1);
  assert.equal((html.match(/tabindex=/g) || []).length, 1);
});

test('an empty conditional action cannot hide the following primary and secondary buttons', () => {
  const error = '';
  const html = render({ actions: el(React.Fragment, null,
    error && el(Action, null, 'Try reconnecting'),
    el(React.Fragment, null, '', el(Action, null, 'Choose a scenario')),
    el('button', { type: 'button' }, 'End session'),
  ) });
  assert.match(html, /page-primary-action[^>]*><button[^>]*>Choose a scenario<\/button>/);
  assert.match(html, /page-secondary-actions[^>]*><button[^>]*>End session<\/button>/);
  assert.doesNotMatch(html, /Try reconnecting/);
});

test('real secondary actions remain in reading and Tab order without adding unused pagination', () => {
  const html = render({ actions: el(React.Fragment, null,
    el(Action, null, 'End session'), el('button', { type: 'button' }, 'Choose a new scenario'),
  ) });
  assert.doesNotMatch(html, /page-pagination-slot|aria-hidden="true"/);
  assert.match(html, /page-secondary-actions[^>]*><button type="button">Choose a new scenario/);
  assert.ok(html.indexOf('>End session<') < html.indexOf('>Choose a new scenario<'));
  assert.equal((html.match(/<button\b/g) || []).length, 2);
});

test('status pages without actions have no empty footer group', () => {
  const html = render({ actions: el(React.Fragment, null, false, null) });
  assert.doesNotMatch(html, /aria-label="Page actions"/);
});
