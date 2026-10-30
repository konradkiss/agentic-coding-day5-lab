#!/usr/bin/env node
/*
 * The table of a measurement: one row per setting, from the results.jsonl that bench.mjs wrote.
 *
 *   node homework/summary.mjs [bench-results]
 *
 * Medians with the lowest and highest run beside them; the last column compares each setting's median cost
 * (or, without cost, its output tokens) with the first setting's. Turns are what each agent reports, so they
 * only compare within one agent: Claude Code's turns, Codex's commands, opencode's steps.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] || 'bench-results';
let rows;
try {
  rows = readFileSync(join(dir, 'results.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
} catch (err) {
  console.error(`error: cannot read ${join(dir, 'results.jsonl')}: ${err.message}`);
  process.exit(2);
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const nums = (rs, f) => rs.map(f).filter((x) => typeof x === 'number' && Number.isFinite(x));
const spread = (xs, fmt) => (xs.length ? `${fmt(median(xs))} (${fmt(Math.min(...xs))}–${fmt(Math.max(...xs))})` : '–');
const usd = (x) => `$${x.toFixed(2)}`;
const sec = (x) => `${Math.round(x)} s`;
const int = (x) => String(Math.round(x));

/* referee checks (--agent none) have no agent numbers: they get their own lines under the table */
const checks = rows.filter((r) => r.agent === 'none');
rows = rows.filter((r) => r.agent !== 'none');
const variants = [...new Set(rows.map((r) => r.variant))];
let base = null;
const out = [
  '| Setting | Runs | Referee passed | Cost | Time | Turns | Output tokens | Cost vs first |',
  '|---|---|---|---|---|---|---|---|',
];
for (const v of variants) {
  const rs = rows.filter((r) => r.variant === v);
  const ok = rs.filter((r) => !r.error);
  const cost = nums(ok, (r) => r.cost_usd);
  const outTok = nums(ok, (r) => r.tokens?.output);
  /* compare on cost when there is one, otherwise on output tokens */
  const key = cost.length ? median(cost) : outTok.length ? median(outTok) : null;
  if (base === null) base = { key, cost: cost.length > 0 };
  const ratio = key !== null && base.key && (cost.length > 0) === base.cost ? `${(key / base.key).toFixed(2)}×` : '–';
  const errors = rs.length - ok.length;
  out.push(`| ${v} (${rs[0].agent}) | ${rs.length}${errors ? `, ${errors} error` : ''} | ${ok.filter((r) => r.referee_pass).length}/${ok.length} | ${spread(cost, usd)} | ${spread(nums(ok, (r) => r.wall_s), sec)} | ${spread(nums(ok, (r) => r.turns), int)} | ${spread(outTok, int)} | ${ratio} |`);
}
if (variants.length) console.log(out.join('\n'));
if (checks.length) console.log(`${variants.length ? '\n' : ''}Referee checks, without an agent:\n${checks.map((r) => `- ${r.variant} at ${r.ref.slice(0, 10)}: ${r.error ? `error: ${r.error}` : r.referee_pass ? 'passed' : 'failed'}`).join('\n')}`);
const errs = rows.filter((r) => r.error);
if (errs.length) console.log(`\nErrors:\n${errs.map((r) => `- ${r.variant} run ${r.run}: ${r.error}`).join('\n')}`);
if (rows.some((r) => r.timed_out)) console.log('\nSome runs timed out; their numbers are in the table, but the referee ran on unfinished work.');
