#!/usr/bin/env node
/* expected.json: the slow original's answers on the benchmark texts. Run only with the original top-words.ts. */
import { writeFileSync } from 'node:fs';
import { topWords } from './top-words.ts';
import { makeText } from './text.mjs';

const rows = [11, 12, 13].map((seed) => ({ seed, top: topWords(makeText({ seed }), 10) }));
writeFileSync(new URL('./expected.json', import.meta.url), `[\n${rows.map((r) => `  ${JSON.stringify(r)}`).join(',\n')}\n]\n`);
console.log('expected.json written');
