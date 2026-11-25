import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { onboarding } from '../src/content.js';

await mkdir(resolve('test-results'), { recursive: true });
const output = resolve('test-results/startup-ssr.mjs');
const bundle = await build({ entryPoints: [resolve('src/App.jsx')], bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external' });
await writeFile(output, bundle.outputFiles[0].text);
const { default: App } = await import(pathToFileURL(output));

test('a fresh app shows only the splash before mounting onboarding or navigation', () => {
  const html = renderToStaticMarkup(React.createElement(App));
  assert.match(html, /splash-screen/);
  assert.match(html, /Two Perspectives/);
  assert.match(html, /\/assets\/splash-filled\.svg/);
  assert.match(html, /\/assets\/splash-outline\.svg/);
  assert.doesNotMatch(html, /phone-header|Introduction 1 of 4|Skip for Now|<button|<input|<textarea/);
});

test('onboarding follows the requested order while retaining each screen’s copy and artwork', () => {
  assert.deepEqual(onboarding.map(page => page.title), ['Share your perspective', 'See both sides', 'Compare and reflect', 'Plan for next time']);
  assert.deepEqual(onboarding.map(page => page.image), ['onboarding-2.png', 'onboarding-1.png', 'onboarding-3.png', 'onboarding-4.png']);
  assert.match(onboarding[0].text, /Choose a scenario and read what happened/);
  assert.match(onboarding[1].text, /Explore how the same situation can feel different/);
});
