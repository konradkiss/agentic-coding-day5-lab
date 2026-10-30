#!/usr/bin/env node
/*
 * Stop hook: the agent is done only when the checks pass. Once ts/betuvel.ts exists, every case in cases.json must
 * pass; the word counter's tests must always pass (the benchmark itself is too slow to run here). While a check
 * fails, the agent goes back to work, at most MAX_ROUNDS times in a row; then it is over to the user.
 * The round count per session lives in one file in the system's temp folder.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { block, readInput, root, runCheck, runNode } from './lib.mjs';

const MAX_ROUNDS = 5;
const STATE_FILE = resolve(tmpdir(), 'day5-lab-stop-rounds.json');

const load = () => { try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')); } catch { return {}; } };

const input = await readInput();
const session = String(input.session_id ?? 'unknown');
const state = load();
// stop_hook_active is false when the agent stops after a user turn: a new series of rounds begins.
const rounds = input.stop_hook_active ? Number(state[session] ?? 0) : 0;

const failures = [];
if (existsSync(resolve(root, 'ts', 'betuvel.ts'))) {
  const { status, out } = runCheck();
  if (status !== 0) failures.push(`npm run check (the port) fails:\n${out}`);
}
const words = runNode(['--test', '--test-reporter=dot', 'szavak/gyakori.test.ts']);
if (words.status !== 0) failures.push(`the word counter's tests (szavak/gyakori.test.ts) fail:\n${words.out}`);

if (!failures.length || rounds >= MAX_ROUNDS) {
  delete state[session];
  writeFileSync(STATE_FILE, JSON.stringify(state));
  if (failures.length) console.log(JSON.stringify({ systemMessage: `The checks still fail after ${MAX_ROUNDS} rounds; over to you.\n${failures.join('\n\n')}` }));
  process.exit(0);
}
state[session] = rounds + 1;
writeFileSync(STATE_FILE, JSON.stringify(state));
block(`Not done yet (round ${rounds + 1} of ${MAX_ROUNDS}). Fix the code; do not touch the tests, cases or benchmark. If one looks wrong, say so to the user.\n\n${failures.join('\n\n')}`);
