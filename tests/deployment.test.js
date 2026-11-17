import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build as bundle } from 'esbuild';
import { build, resolveConfig } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createAvatar } from '../src/avatar.js';

const siteBase = '/';
const componentFile = resolve('test-results/deployment-components-ssr.mjs');
await mkdir(resolve('test-results'), { recursive: true });
const components = await bundle({
  stdin: { contents: "export { Artwork } from './src/components.jsx'; export { default as Avatar } from './src/Avatar.jsx';", resolveDir: resolve('.') },
  bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external',
  define: { 'import.meta.env': JSON.stringify({ BASE_URL: siteBase }) },
});
await writeFile(componentFile, components.outputFiles[0].text);
const { Artwork, Avatar } = await import(pathToFileURL(componentFile));

test('the production HTML loads compiled code, styles, and favicon from the site root', async () => {
  const result = await build({ logLevel: 'silent', build: { write: false } });
  const html = String(result.output.find((file) => file.fileName === 'index.html').source);
  assert.match(html, /src="\/assets\/[^" ]+\.js"/);
  assert.match(html, /href="\/assets\/[^" ]+\.css"/);
  assert.match(html, /href="\/favicon\.svg"/);
  assert.doesNotMatch(html, /\/src\/main\.jsx|\/v2-2perspectives\//);
});

test('the GitHub Pages workflow builds code, styles, and favicon under the repository path', async () => {
  const workflow = await readFile(resolve('.github/workflows/deploy-pages.yml'), 'utf8');
  const buildStep = workflow.match(/- name: Build\s+run: npm run build([^\n]*)/);
  assert.ok(buildStep, 'The Pages workflow must build the app.');
  const base = buildStep[1].match(/--base=(\S+)/)?.[1] ?? '/';
  const result = await build({ base, logLevel: 'silent', build: { write: false } });
  const html = String(result.output.find((file) => file.fileName === 'index.html').source);
  assert.match(html, /src="\/v2-2perspectives\/assets\/[^" ]+\.js"/);
  assert.match(html, /href="\/v2-2perspectives\/assets\/[^" ]+\.css"/);
  assert.match(html, /href="\/v2-2perspectives\/favicon\.svg"/);
  assert.doesNotMatch(html, /(?:src|href)="\/(?:assets\/|favicon\.svg)/);
});

test('development keeps the existing local root URL', async () => {
  const config = await resolveConfig({}, 'serve');
  assert.equal(config.base, '/');
});

test('illustrations use the configured site-root path', () => {
  const html = renderToStaticMarkup(React.createElement(Artwork, { name: 'welcome.png', alt: 'Welcome' }));
  assert.ok(html.includes(`src="${siteBase}assets/welcome.png"`));
});

test('every composed avatar part uses the configured site-root path and preserves its fragment', () => {
  const avatar = createAvatar({ hair: 'afro', clothing: 'hoodie', accessory: 'glasses', facialHair: 'full', expression: 'happy' });
  const html = renderToStaticMarkup(React.createElement(Avatar, { avatar }));
  const paths = [...html.matchAll(/<use\b[^>]*href="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(paths.length, 5);
  for (const path of paths) {
    assert.ok(path.startsWith(`${siteBase}assets/open-peeps/`), path);
    assert.ok(path.endsWith('.svg#avatar-part'), path);
  }
});
