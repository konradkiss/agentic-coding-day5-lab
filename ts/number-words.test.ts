import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { numberToWords } from './number-words.ts';

const { cases, errors } = JSON.parse(readFileSync(new URL('../cases.json', import.meta.url), 'utf8'));
const ERROR = { type: TypeError, range: RangeError };

test('every case in cases.json', () => {
  for (const { n, want } of cases) assert.equal(numberToWords(n), want, `numberToWords(${n})`);
});

test('the wrong inputs throw', () => {
  for (const { n, error } of errors) assert.throws(() => numberToWords(n), ERROR[error], `numberToWords(${JSON.stringify(n)})`);
});

test('two is két in front of a multiplier and kettő at the end', () => {
  assert.equal(numberToWords(2), 'kettő');
  assert.equal(numberToWords(2002002), 'kétmillió-kétezer-kettő');
});

test('a hyphen between the groups only above 2000', () => {
  assert.equal(numberToWords(1999), 'ezerkilencszázkilencvenkilenc');
  assert.equal(numberToWords(2001), 'kétezer-egy');
});
