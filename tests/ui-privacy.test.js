import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSessionState, sessionReducer } from '../src/session.js';
import { createAvatar } from '../src/avatar.js';

const output = resolve('test-results/conversation-ssr.mjs');
await mkdir(resolve('test-results'), { recursive: true });
const bundle = await build({
  entryPoints: [resolve('src/screens/Conversation.jsx')], bundle: true, write: false,
  platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external',
});
await writeFile(output, bundle.outputFiles[0].text);
const { default: Conversation } = await import(pathToFileURL(output));

function privateSession() {
  const state = createSessionState();
  state.status = 'responding';
  state.scenarioId = 'playlist';
  state.participants[0].name = 'River';
  state.participants[1].name = 'Sky';
  state.participants[0].avatar = createAvatar({ expression: 'happy' });
  state.participants[1].avatar = createAvatar({ expression: 'tired' });
  state.responses[0] = { mode: 'write', text: 'PRIVATE_RIVER_TEXT', drawing: 'PRIVATE_RIVER_DRAWING', color: '#68547F', submitted: true };
  state.responses[1] = { mode: 'write', text: 'PRIVATE_SKY_TEXT', drawing: 'PRIVATE_SKY_DRAWING', color: '#68547F', submitted: false };
  return state;
}
const render = (screen, state, active = 1) => renderToStaticMarkup(React.createElement(Conversation, { screen, state, active }));

test('handoff mounts no completed or unfinished response text or drawings', () => {
  const html = render('handoff', privateSession());
  assert.match(html, /Pass the device/);
  assert.doesNotMatch(html, /PRIVATE_/);
  assert.doesNotMatch(html, /<canvas|<textarea/);
  assert.doesNotMatch(html, /open-peeps|Change expression|Current expression/);
});

test('a participant response view mounts only their own draft', () => {
  const html = render('response', privateSession());
  assert.match(html, /PRIVATE_SKY_TEXT/);
  assert.doesNotMatch(html, /PRIVATE_RIVER_/);
  assert.match(html, /expression\/tired.svg/);
  assert.doesNotMatch(html, /expression\/happy.svg/);
  assert.match(html, /Change expression/);
});

test('each perspective shows only the active participant’s avatar and no private draft', () => {
  const state = privateSession();
  for (const [active, own, partner] of [[0, 'happy', 'tired'], [1, 'tired', 'happy']]) {
    const html = render('perspective', state, active);
    assert.ok(html.includes(`expression/${own}.svg`));
    assert.ok(!html.includes(`expression/${partner}.svg`));
    assert.doesNotMatch(html, /PRIVATE_|<canvas|<textarea|Change expression/);
  }
});

test('drawing and explanation use separate views without losing the private draft', () => {
  const state = privateSession();
  state.responses[1].mode = 'draw';
  const drawing = render('response', state);
  assert.match(drawing, /This represents\.\.\./);
  assert.doesNotMatch(drawing, /<textarea|PRIVATE_SKY_TEXT|Write instead/);

  const explaining = sessionReducer(state, {
    type: 'UPDATE_RESPONSE', participant: 1, values: { mode: 'write' },
  });
  const explanation = render('response', explaining);
  assert.match(explanation, /What does this drawing represent for you\?/);
  assert.match(explanation, /<textarea/);
  assert.match(explanation, /PRIVATE_SKY_TEXT/);
  assert.equal(explaining.responses[1].drawing, 'PRIVATE_SKY_DRAWING');
  assert.doesNotMatch(explanation, /PRIVATE_RIVER_/);
});

test('submitting from the explanation view reveals the drawing with its explanation', () => {
  const state = privateSession();
  const submitted = sessionReducer(state, { type: 'SUBMIT_RESPONSE', participant: 1 });
  const html = render('compare', submitted, 0);
  assert.match(html, /PRIVATE_SKY_DRAWING/);
  assert.match(html, /PRIVATE_SKY_TEXT/);
});

test('comparison refuses to render either response before both submissions', () => {
  const html = render('compare', privateSession());
  assert.match(html, /Responses are still private/);
  assert.doesNotMatch(html, /PRIVATE_/);
  assert.doesNotMatch(html, /open-peeps|<svg/);
});

test('both comparison views show each response with the correct avatar and put the partner first', () => {
  const state = privateSession();
  state.responses[1].submitted = true;
  state.status = 'revealed';
  const texts = ['PRIVATE_RIVER_TEXT', 'PRIVATE_SKY_TEXT'];
  const expressions = ['happy', 'tired'];
  for (const active of [0, 1]) {
    const html = render('compare', state, active);
    const partner = 1 - active;
    assert.ok(html.indexOf(texts[partner]) < html.indexOf(texts[active]));
    const partnerArticle = html.match(/<article\b[^>]*class="partner-response"[\s\S]*?<\/article>/)?.[0] || '';
    const ownArticle = html.match(/<article\b[^>]*class="own-response"[\s\S]*?<\/article>/)?.[0] || '';
    assert.ok(partnerArticle.includes(`expression/${expressions[partner]}.svg`));
    assert.ok(!partnerArticle.includes(`expression/${expressions[active]}.svg`));
    assert.ok(ownArticle.includes(`expression/${expressions[active]}.svg`));
    assert.ok(!ownArticle.includes(`expression/${expressions[partner]}.svg`));
    assert.ok(partnerArticle.includes(texts[partner]));
    assert.ok(ownArticle.includes(texts[active]));
    assert.match(ownArticle, />You</);
  }
});

function emptyRevealedSession() {
  const state = privateSession();
  state.status = 'revealed';
  state.responses = state.responses.map((response) => ({ ...response, drawing: '', text: '', submitted: true }));
  return state;
}

test('both comparison views name each missing drawing and text, including whitespace-only entries', () => {
  const state = emptyRevealedSession();
  state.responses[0].drawing = ' \n ';
  state.responses[1].text = ' \n ';
  for (const active of [0, 1]) {
    const html = render('compare', state, active);
    for (const name of ['River', 'Sky']) {
      assert.ok(html.includes(`${name} did not draw anything`));
      assert.ok(html.includes(`${name} did not provide a response.`));
    }
    assert.doesNotMatch(html, /<img/);
  }
});

test('a drawing-only submission retains the drawing and names its missing text', () => {
  const state = emptyRevealedSession();
  state.responses[1].drawing = 'PRIVATE_SKY_DRAWING';
  const html = render('compare', state, 0);
  assert.match(html, /PRIVATE_SKY_DRAWING/);
  assert.match(html, /Sky did not provide a response\./);
  assert.doesNotMatch(html, /Sky did not draw anything/);
});

test('a text-only submission retains the text and names its missing drawing', () => {
  const state = emptyRevealedSession();
  state.responses[1].text = 'I felt unheard.';
  const html = render('compare', state, 0);
  assert.match(html, /I felt unheard\./);
  assert.match(html, /Sky did not draw anything/);
  assert.doesNotMatch(html, /Sky did not provide a response/);
});

test('missing-content messages remain unmounted before both submissions and during handoff', () => {
  const state = privateSession();
  state.responses = state.responses.map((response) => ({ ...response, drawing: '', text: '' }));
  for (const screen of ['handoff', 'response', 'compare']) {
    const html = render(screen, state, 1);
    assert.doesNotMatch(html, /did not draw anything|did not provide a response/);
  }
});
