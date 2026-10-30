#!/usr/bin/env node
/*
 * The benchmark: topWords on three different texts of 200 000 words, each checked against expected.json.
 * Every run gets a new text, so a result cached from an earlier run does not help. Prints each time, the median,
 * and one machine-readable line (BENCH {...}). Exit 1 when a result is wrong: a fast wrong answer does not count.
 */
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { topWords } from './top-words.ts';
import { makeText } from './text.mjs';

const expected = JSON.parse(readFileSync(new URL('./expected.json', import.meta.url), 'utf8'));
const times = [];
let wrong = 0;
for (const { seed, top } of expected) {
  const text = makeText({ seed });
  const t = performance.now();
  const got = topWords(text, top.length);
  const ms = performance.now() - t;
  times.push(ms);
  const ok = isDeepStrictEqual(got, top);
  if (!ok) wrong++;
  console.log(`text ${seed}: ${ms.toFixed(1)} ms${ok ? '' : `  WRONG: got ${JSON.stringify(got?.slice?.(0, 3))}…`}`);
}
const median = times.slice().sort((a, b) => a - b)[Math.floor(times.length / 2)];
console.log(`median: ${median.toFixed(1)} ms${wrong ? `  (${wrong} wrong result${wrong > 1 ? 's' : ''}: does not count)` : ''}`);
console.log(`BENCH ${JSON.stringify({ median_ms: Math.round(median * 10) / 10, wrong })}`);
process.exit(wrong ? 1 : 0);
