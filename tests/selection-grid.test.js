import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

await mkdir(resolve('test-results'), { recursive: true });
const output = resolve('test-results/selection-grid-ssr.mjs');
const bundle = await build({ entryPoints: [resolve('src/SelectionGrid.jsx')], bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external' });
await writeFile(output, bundle.outputFiles[0].text);
const { default: SelectionGrid } = await import(pathToFileURL(output));
const items = Array.from({ length: 7 }, (_, index) => ({ id: `option-${index}`, label: `Option ${index + 1}` }));
const render = (props = {}) => renderToStaticMarkup(React.createElement(SelectionGrid, {
  items, label: 'Example choices', columns: 3, selectedId: null,
  renderOption: (item) => item.label, ...props,
}));
const buttons = (html) => html.match(/<button\b[^>]*>/g) || [];

test('a grid exposes labeled rows, cells, and keyboard instructions', () => {
  const html = render();
  assert.match(html, /role="grid"/);
  assert.match(html, /aria-label="Example choices"/);
  assert.match(html, /aria-describedby=/);
  assert.match(html, /arrow keys/i);
  assert.equal((html.match(/role="row"/g) || []).length, 3);
  assert.equal((html.match(/role="gridcell"/g) || []).length, 7);
});

test('an unselected grid has only its first native button in the Tab sequence', () => {
  const choices = buttons(render());
  assert.equal(choices.length, 7);
  assert.equal(choices.filter((tag) => /tabindex="0"/i.test(tag)).length, 1);
  assert.match(choices[0], /tabindex="0"/i);
  for (const tag of choices.slice(1)) assert.match(tag, /tabindex="-1"/i);
  for (const tag of choices) assert.match(tag, /type="button"/);
});

test('a newly opened grid uses the selected choice as its single Tab stop', () => {
  const choices = buttons(render({ selectedId: 'option-6', getLabel: (item) => item.label }));
  assert.equal(choices.filter((tag) => /tabindex="0"/i.test(tag)).length, 1);
  assert.match(choices[6], /tabindex="0"/i);
  assert.match(choices[6], /aria-pressed="true"/);
  assert.match(choices[6], /aria-label="Option 7"/);
});

test('independent choice groups each have a Tab stop and empty groups render nothing', () => {
  assert.equal(render({ items: [] }), '');
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(SelectionGrid, { items, label: 'Accessories', columns: 3, selectedId: 'option-2', renderOption: (item) => item.label }),
    React.createElement(SelectionGrid, { items, label: 'Facial hair', columns: 3, selectedId: 'option-5', renderOption: (item) => item.label }),
  ));
  assert.equal((html.match(/role="grid"/g) || []).length, 2);
  assert.equal(buttons(html).filter((tag) => /tabindex="0"/i.test(tag)).length, 2);
});
