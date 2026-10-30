#!/usr/bin/env node
/*
 * Codex PreToolUse on apply_patch: the same refusal as pre-edit.mjs, read out of the patch text. Fails closed: a
 * patch the parser cannot read is refused. An input in the Claude Code shape (file_path) goes to pre-edit.mjs.
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { parsePatch } from './codex-patch.mjs';
import { block, isProtected, PROTECTED_MESSAGE, readInput, repoPath } from './lib.mjs';

let input;
try {
  input = await readInput();
} catch (e) {
  block(`Blocked: cannot read this edit (${e.message}), so it cannot be checked.`);
}
const tool = input.tool_input ?? {};
if (tool.command === undefined) {
  const r = spawnSync(process.execPath, [resolve(import.meta.dirname, 'pre-edit.mjs')], { input: JSON.stringify(input), encoding: 'utf8' });
  process.stderr.write(r.stderr ?? '');
  process.exit(r.status ?? 2);
}
const patch = parsePatch(Array.isArray(tool.command) ? tool.command.join('\n') : String(tool.command));
if (patch.unreadable) block('Blocked: this edit names no file the hook can read, so it cannot be checked. Use a plain apply_patch with "*** Update File:" headers.');
const hit = patch.files.map((f) => repoPath(f, input.cwd)).find(isProtected);
if (hit) block(PROTECTED_MESSAGE(hit));
