import test from 'node:test';
import assert from 'node:assert/strict';
import { handoffReturnScreen } from '../src/navigation.js';

test('hiding a perspective returns the reader to that perspective after the private handoff', () => {
  assert.equal(handoffReturnScreen('responding', 'perspective'), 'perspective');
});

test('hiding a response returns to the same private draft after handoff', () => {
  assert.equal(handoffReturnScreen('responding', 'response'), 'response');
});

test('completed responses resume comparison and invalid origins cannot open a draft', () => {
  assert.equal(handoffReturnScreen('revealed', 'response'), 'compare');
  assert.equal(handoffReturnScreen('responding', 'scenario'), 'perspective');
  assert.equal(handoffReturnScreen('setup', 'response'), 'perspective');
});
