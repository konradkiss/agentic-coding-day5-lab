#!/usr/bin/env node
/*
 * Stop hook: once ts/betuvel.ts exists, the agent is done only when every case passes. While the referee fails,
 * the agent goes back to work, at most MAX_ROUNDS times in a row; then it is over to the user.
 * The round count per session lives in one file in the system's temp folder.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { block, readInput, root, runCheck } from './lib.mjs';

const MAX_ROUNDS = 5;
const STATE_FILE = resolve(tmpdir(), 'day5-lab-stop-rounds.json');

const load = () => { try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')); } catch { return {}; } };

const input = await readInput();
if (!existsSync(resolve(root, 'ts', 'betuvel.ts'))) process.exit(0);

const session = String(input.session_id ?? 'unknown');
const state = load();
// stop_hook_active is false when the agent stops after a user turn: a new series of rounds begins.
const rounds = input.stop_hook_active ? Number(state[session] ?? 0) : 0;

const { status, out } = runCheck();
if (status === 0 || rounds >= MAX_ROUNDS) {
  delete state[session];
  writeFileSync(STATE_FILE, JSON.stringify(state));
  if (status !== 0) console.log(JSON.stringify({ systemMessage: `npm run check still fails after ${MAX_ROUNDS} rounds; over to you.\n${out}` }));
  process.exit(0);
}
state[session] = rounds + 1;
writeFileSync(STATE_FILE, JSON.stringify(state));
block(`npm run check fails (round ${rounds + 1} of ${MAX_ROUNDS}). Fix the port; do not touch the cases. If a case looks wrong, say so to the user:\n${out}`);
