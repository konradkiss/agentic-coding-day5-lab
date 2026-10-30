#!/usr/bin/env node
/*
 * The referee: runs every case in cases.json against the TypeScript port (ts/number-words.ts) and prints what differs.
 * Exit 0 when all cases pass, 1 when any fails, 2 when the port is missing or does not load.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const port = resolve(root, 'ts', 'number-words.ts');
const { cases, errors } = JSON.parse(readFileSync(resolve(root, 'cases.json'), 'utf8'));
const ERROR = { type: TypeError, range: RangeError };
const SHOW = 10;

if (!existsSync(port)) {
  console.error('ts/number-words.ts does not exist yet.');
  process.exit(2);
}
let numberToWords;
try {
  ({ numberToWords } = await import(pathToFileURL(port).href));
} catch (e) {
  console.error(`ts/number-words.ts does not load: ${e.message}`);
  process.exit(2);
}
if (typeof numberToWords !== 'function') {
  console.error('ts/number-words.ts must export a function named numberToWords.');
  process.exit(2);
}

const failed = [];
for (const { n, want } of cases) {
  let got;
  try {
    got = numberToWords(n);
  } catch (e) {
    got = `${e?.name ?? 'Error'}: ${e?.message ?? e}`;
  }
  if (got !== want) failed.push(`numberToWords(${n})\n    want: ${want}\n    got:  ${got}`);
}
for (const { n, error } of errors) {
  const want = ERROR[error];
  try {
    const got = numberToWords(n);
    failed.push(`numberToWords(${JSON.stringify(n)})\n    want: ${want.name}\n    got:  ${JSON.stringify(got)}`);
  } catch (e) {
    if (!(e instanceof want)) failed.push(`numberToWords(${JSON.stringify(n)})\n    want: ${want.name}\n    got:  ${e?.name ?? e}`);
  }
}

const total = cases.length + errors.length;
for (const f of failed.slice(0, SHOW)) console.log(`✗ ${f}`);
if (failed.length > SHOW) console.log(`… and ${failed.length - SHOW} more`);
console.log(`${total - failed.length} of ${total} cases pass`);
process.exit(failed.length ? 1 : 0);
