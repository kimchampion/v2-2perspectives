import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { scenarios } from '../src/data.js';
import { scenarioImages } from '../src/content.js';
import { createAvatar } from '../src/avatar.js';
import { createSessionState, sessionReducer, visibleResponses } from '../src/session.js';

await mkdir(resolve('test-results'), { recursive: true });
async function bundleScreen(name) {
  const output = resolve(`test-results/shared-rides-${name}.mjs`);
  const bundle = await build({ entryPoints: [resolve(`src/screens/${name}.jsx`)], bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external' });
  await writeFile(output, bundle.outputFiles[0].text);
  return import(pathToFileURL(output));
}
const { ScenarioPicker } = await bundleScreen('Setup');
const { default: Conversation } = await bundleScreen('Conversation');
const participants = ['River', 'Sky'].map((name) => ({ name, avatar: createAvatar() }));
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));

test('Shared Rides appears first while preserving the order of the four existing scenarios', () => {
  assert.deepEqual(scenarios.map((scenario) => scenario.id), ['ride', 'playlist', 'project', 'cafe', 'studio']);
  const scenario = scenarios.find((item) => item.id === 'ride');
  assert.equal(scenario.title, 'Speeding and Changing Lanes');
  assert.equal(scenario.category, 'Shared Rides');
  assert.equal(scenario.image, 'shared-rides-scenario.png');
});

test('Shared Rides preserves the supplied copy with only the approved name-token swap', () => {
  const scenario = scenarios.find((item) => item.id === 'ride');
  assert.ok(scenario);
  assert.equal(scenario.cardDescription, '[User 2] is driving [User 1]. The driver speeds and changes lanes several times, making the passenger uneasy.');
  assert.equal(scenario.story, '[User 2] is driving [User 1]. During the ride, [User 2] drives faster than the surrounding traffic and changes lanes several times. [User 1] feels uneasy but stays quiet.');
  assert.deepEqual(scenario.roles, ['Passenger', 'Driver']);
  assert.deepEqual(scenario.perspectives, [
    'You are the passenger. The speeding and frequent lane changes make you feel tense and unsafe. You hold back from speaking because you do not want to criticize the driver.\n\nYou want [User 2] to slow down and understand how the driving affects you.',
    'You are the driver. You are focused on driving and think you are handling the car well. You do not realize that your speed and lane changes are making [User 1] uncomfortable.\n\nYou want to understand what [User 1] needs without feeling judged.',
  ]);
  assert.deepEqual(scenarioImages.ride, ['shared-rides-passenger.png', 'shared-rides-driver.png']);
});

test('scenario name tokens resolve once and preserve literal nickname characters', async () => {
  const { formatScenarioText } = await import('../src/scenario-copy.js');
  assert.equal(formatScenarioText('[User 2] drives [User 1].', participants), 'Sky drives River.');
  assert.equal(formatScenarioText('[User 1] / [User 2]', [{ name: '$& [User 2]' }, { name: '<Sky>' }]), '$& [User 2] / <Sky>');
  assert.equal(formatScenarioText('Unchanged copy.', participants), 'Unchanged copy.');
  assert.equal(formatScenarioText('[User 1]', []), '[User 1]');
});

test('scenario cards use dynamic nicknames and the short card copy while original cards stay unchanged', () => {
  const html = render(ScenarioPicker, { participants, participant: participants[0], selected: 'ride' });
  assert.ok(html.includes('Sky is driving River. The driver speeds and changes lanes several times, making the passenger uneasy.'));
  assert.match(html, /src="\/assets\/shared-rides-scenario.png"/);
  assert.doesNotMatch(html, /\[User [12]\]|During the ride/);
  assert.ok(html.indexOf('Speeding and Changing Lanes') < html.indexOf('The shared playlist'));
  for (const scenario of scenarios.filter((item) => item.id !== 'ride')) {
    assert.ok(html.includes(scenario.story));
    assert.ok(html.includes(`/assets/scenario-${scenario.id}.png`));
  }
});

test('each participant reads the correct role, image, setup, and private perspective with escaped nicknames', () => {
  const state = { ...createSessionState(), scenarioId: 'ride', participants };
  for (const [active, role, otherRole, name] of [[0, 'passenger', 'driver', 'Sky'], [1, 'driver', 'passenger', 'River']]) {
    const html = render(Conversation, { screen: 'perspective', state, active });
    assert.ok(html.includes(`You are the ${role}.`));
    assert.ok(!html.includes(`You are the ${otherRole}.`));
    assert.ok(html.includes(`/assets/shared-rides-${role}.png`));
    assert.ok(html.includes('Sky is driving River. During the ride, Sky drives faster'));
    assert.ok(html.includes(name));
    assert.match(html, /class="preserve-lines"/);
    assert.doesNotMatch(html, /\[User [12]\]/);
  }
  const html = render(Conversation, { screen: 'perspective', state: { ...state, participants: [{ ...participants[0], name: '<script>River</script>' }, participants[1]] }, active: 0 });
  assert.match(html, /&lt;script&gt;River&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test('all three supplied Shared Rides images are available as local PNG assets', async () => {
  for (const name of ['scenario', 'passenger', 'driver']) {
    const png = await readFile(new URL(`../public/assets/shared-rides-${name}.png`, import.meta.url));
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.ok(png.readUInt32BE(16) > 0 && png.readUInt32BE(20) > 0);
  }
});

test('Shared Rides follows the existing private submission, discussion, and reflection flow', () => {
  let state = createSessionState();
  for (const [participant, name] of ['River', 'Sky'].entries()) {
    state = sessionReducer(state, { type: 'SET_PARTICIPANT', participant, values: { name, avatar: createAvatar() } });
  }
  state = sessionReducer(state, { type: 'SELECT_SCENARIO', id: 'ride' });
  assert.equal(state.scenarioId, 'ride');
  state = sessionReducer(state, { type: 'START_RESPONSES' });
  assert.equal(state.status, 'responding');
  for (const participant of [0, 1]) {
    assert.deepEqual(visibleResponses(state, 'compare', participant), []);
    state = sessionReducer(state, { type: 'UPDATE_RESPONSE', participant, values: { mode: 'write', text: `Private response ${participant + 1}` } });
    state = sessionReducer(state, { type: 'SUBMIT_RESPONSE', participant });
  }
  assert.equal(state.status, 'revealed');
  assert.equal(visibleResponses(state, 'compare', 0).length, 2);
  state = sessionReducer(state, { type: 'SET_REFLECTION', path: 'repair' });
  assert.equal(state.reflection.path, 'repair');
});
