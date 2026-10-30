import assert from 'node:assert/strict';
import { test } from 'node:test';
import { topWords } from './top-words.ts';

test('counts the words, most frequent first', () => {
  assert.deepEqual(topWords('alma körte alma szilva alma körte'), [['alma', 3], ['körte', 2], ['szilva', 1]]);
});

test('ignores case', () => {
  assert.deepEqual(topWords('Alma ALMA alma Őz ŐZ'), [['alma', 3], ['őz', 2]]);
});

test('a word is a run of letters: hyphens, digits and punctuation split', () => {
  assert.deepEqual(topWords('kétezer-egy, 2026: egy!'), [['egy', 2], ['kétezer', 1]]);
});

test('equal counts in Hungarian alphabetical order (c < cs, d < dzs, o < ö < z < zs)', () => {
  assert.deepEqual(
    topWords('zsák csak ölt dzsem cukor zebra dal ok'),
    [['cukor', 1], ['csak', 1], ['dal', 1], ['dzsem', 1], ['ok', 1], ['ölt', 1], ['zebra', 1], ['zsák', 1]],
  );
});

test('returns at most n words', () => {
  assert.deepEqual(topWords('a b b c c c', 2), [['c', 3], ['b', 2]]);
});

test('an empty text has no words', () => {
  assert.deepEqual(topWords(''), []);
  assert.deepEqual(topWords(' 12, 34. '), []);
});
