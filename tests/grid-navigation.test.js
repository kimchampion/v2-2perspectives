import test from 'node:test';
import assert from 'node:assert/strict';
import { gridFocusIndex } from '../src/grid-navigation.js';

test('horizontal arrows follow reading order without wrapping past grid boundaries', () => {
  assert.equal(gridFocusIndex(2, 7, 3, 'ArrowRight'), 3);
  assert.equal(gridFocusIndex(3, 7, 3, 'ArrowLeft'), 2);
  assert.equal(gridFocusIndex(0, 7, 3, 'ArrowLeft'), 0);
  assert.equal(gridFocusIndex(6, 7, 3, 'ArrowRight'), 6);
});

test('vertical arrows keep the column and stop before missing cells in a short final row', () => {
  assert.equal(gridFocusIndex(1, 7, 3, 'ArrowDown'), 4);
  assert.equal(gridFocusIndex(3, 7, 3, 'ArrowDown'), 6);
  assert.equal(gridFocusIndex(4, 7, 3, 'ArrowDown'), 4);
  assert.equal(gridFocusIndex(5, 7, 3, 'ArrowDown'), 5);
  assert.equal(gridFocusIndex(4, 7, 3, 'ArrowUp'), 1);
  assert.equal(gridFocusIndex(1, 7, 3, 'ArrowUp'), 1);
});

test('Home and End find row boundaries, including an incomplete last row', () => {
  assert.equal(gridFocusIndex(43, 46, 3, 'Home'), 42);
  assert.equal(gridFocusIndex(43, 46, 3, 'End'), 44);
  assert.equal(gridFocusIndex(45, 46, 3, 'Home'), 45);
  assert.equal(gridFocusIndex(45, 46, 3, 'End'), 45);
});

test('Control or Command Home and End find the whole grid boundaries', () => {
  for (const modifier of [{ ctrlKey: true }, { metaKey: true }]) {
    assert.equal(gridFocusIndex(20, 46, 3, 'Home', modifier), 0);
    assert.equal(gridFocusIndex(20, 46, 3, 'End', modifier), 45);
  }
});

test('Tab, activation, Escape and browser modifier shortcuts retain their native behavior', () => {
  for (const key of ['Tab', 'Enter', ' ', 'Escape', 'PageDown', 'a']) {
    assert.equal(gridFocusIndex(1, 7, 3, key), null);
  }
  assert.equal(gridFocusIndex(1, 7, 3, 'ArrowLeft', { altKey: true }), null);
  assert.equal(gridFocusIndex(1, 7, 3, 'ArrowRight', { ctrlKey: true }), null);
});

test('single-row scenario choices do not invent a vertical target', () => {
  assert.equal(gridFocusIndex(2, 4, 4, 'ArrowDown'), 2);
  assert.equal(gridFocusIndex(2, 4, 4, 'ArrowUp'), 2);
  assert.equal(gridFocusIndex(2, 4, 4, 'Home'), 0);
  assert.equal(gridFocusIndex(2, 4, 4, 'End'), 3);
});

test('empty grids and malformed positions do not produce a focus target', () => {
  for (const args of [[0, 0, 3], [-1, 7, 3], [7, 7, 3], [0, 7, 0], [0, 7, 1.5], [NaN, 7, 3]]) {
    assert.equal(gridFocusIndex(...args, 'ArrowRight'), null);
  }
});
