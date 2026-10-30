/*
 * A whole number in Hungarian words, the way it is written on a cheque or an invoice: 1234 → ezerkétszázharmincnégy.
 * A port of python/number_words.py; the rules are written down there.
 */

import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ONES = ['', 'egy', 'kettő', 'három', 'négy', 'öt', 'hat', 'hét', 'nyolc', 'kilenc'];
const ROUND_TENS = ['', 'tíz', 'húsz', 'harminc', 'negyven', 'ötven', 'hatvan', 'hetven', 'nyolcvan', 'kilencven'];
const TENS_PREFIX = ['', 'tizen', 'huszon', 'harminc', 'negyven', 'ötven', 'hatvan', 'hetven', 'nyolcvan', 'kilencven'];
const GROUPS = ['', 'ezer', 'millió', 'milliárd'];
const LIMIT = 10 ** 12;

/* One digit; as a prefix (in front of száz, ezer, millió) kettő becomes két. */
function ones(digit: number, prefix: boolean): string {
  if (digit === 2 && prefix) return 'két';
  return ONES[digit];
}

/* A group from 1 to 999. first: the number starts with it; prefix: a multiplier (ezer, millió…) follows it. */
function threeDigits(n: number, first: boolean, prefix: boolean): string {
  const hundreds = Math.floor(n / 100);
  const tens = Math.floor((n % 100) / 10);
  const one = n % 10;
  let word = '';
  if (hundreds) word += (hundreds === 1 && first ? '' : ones(hundreds, true)) + 'száz';
  if (tens) word += (one === 0 ? ROUND_TENS : TENS_PREFIX)[tens];
  if (one) word += ones(one, prefix);
  return word;
}

/* The whole number n in words. TypeError for any other type, RangeError beyond the limit. */
export function numberToWords(n: unknown): string {
  if (typeof n !== 'number' || !Number.isInteger(n)) throw new TypeError(`expected a whole number, got ${String(n)}`);
  if (!(-LIMIT < n && n < LIMIT)) throw new RangeError(`number too large: ${n}`);
  if (n === 0) return 'nulla';
  if (n < 0) return 'mínusz ' + numberToWords(-n);

  const groups: number[] = [];
  for (let rest = n; rest; rest = Math.floor(rest / 1000)) groups.push(rest % 1000);

  const words: string[] = [];
  for (let place = groups.length - 1; place >= 0; place--) {
    const group = groups[place];
    if (group === 0) continue;
    const first = words.length === 0;
    if (group === 1 && place === 1 && first) words.push('ezer');
    else words.push(threeDigits(group, first, place > 0) + GROUPS[place]);
  }
  return words.join(n > 2000 ? '-' : '');
}

/* Run as a script (node ts/number-words.ts 1234), it prints each argument in words. */
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const arg of process.argv.slice(2)) console.log(numberToWords(Number(arg)));
}
