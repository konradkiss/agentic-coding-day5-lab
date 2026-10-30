#!/usr/bin/env node
/*
 * PreToolUse on shell commands: no --no-verify, and nothing that writes to what the work is measured against or to
 * the checks. Reading those files is fine. A heuristic, not a sandbox: the command is cut into simple commands at
 * ; & | and each one is judged by its verb and the paths it writes to.
 */
import { resolve } from 'node:path';
import { block, isProtected, readInput, repoPath } from './lib.mjs';

/* verbs that change every path they name, and verbs that change only their last path (the destination) */
const WRITES_ALL = new Set(['rm', 'rmdir', 'unlink', 'truncate', 'touch', 'chmod', 'chown', 'mv', 'tee']);
const WRITES_LAST = new Set(['cp', 'rsync', 'ln', 'install']);
const GIT_WRITES = new Set(['checkout', 'restore', 'reset', 'rm', 'mv', 'apply', 'stash', 'clean', 'am', 'cherry-pick', 'revert', 'merge', 'rebase', 'pull']);
const WRITE_API = /\b(writeFile|appendFile|rmSync|unlink|rename|copyFile|cpSync|createWriteStream|truncate|write_text|write_bytes|open\([^)]*['"][wa])/;
const REDIRECT = /(?:^|[^\d&>])>>?\s*['"]?([^\s'";&|)]+)/g;
const GENERATORS = /make_cases|make_expected/;

const input = await readInput();
const raw = input.tool_input?.command ?? '';
const cmd = (Array.isArray(raw) ? raw.join(' ') : String(raw)).replace(/\d*>\s*\/dev\/null|\d*>&\d/g, '');
const hits = (paths, cwd = input.cwd) => paths.map((p) => repoPath(p, cwd)).find(isProtected);
const refuse = (rel) =>
  block(`Blocked: this command writes to ${rel}, which is part of what the work is measured against (python/, cases.json, the word counter's tests and benchmark) or of the checks (scripts/, package.json, .claude/, .codex/). Change the code instead; if a case is wrong, stop and tell the user.`);

if (/--no-verify\b/.test(cmd)) block('Blocked: --no-verify skips the checks. Make them pass instead.');
if (GENERATORS.test(cmd)) block('Blocked: regenerating the cases or the expected results changes what the work is measured against.');
if (/\bnpm\s+(pkg|set-script)\b/.test(cmd)) block('Blocked: package.json runs the checks; do not change it.');

for (const [, target] of cmd.matchAll(REDIRECT)) {
  const rel = hits([target]);
  if (rel) refuse(rel);
}

/* inline code (node -e, python -c, a heredoc) that names a protected file and a write function */
if (WRITE_API.test(cmd)) {
  const named = [...cmd.matchAll(/[\w./-]*(python\/[\w./-]+|cases\.json|wordcount\/[\w./-]+|scripts\/[\w./-]+|package\.json|\.claude\/[\w./-]*|\.codex\/[\w./-]*)/g)].map((m) => m[0]);
  const rel = hits(named);
  if (rel) refuse(rel);
}

/* cd changes where the later commands' relative paths point */
let cwd = input.cwd ?? process.cwd();
for (const segment of cmd.split(/[;&|\n]+/)) {
  const words = segment.trim().split(/\s+/).map((w) => w.replace(/^['"]|['"]$/g, '')).filter(Boolean);
  while (words.length && (/^\w+=/.test(words[0]) || ['sudo', 'command', 'xargs', 'env'].includes(words[0]))) words.shift();
  const [verb, ...rest] = words;
  const args = rest.filter((w) => !w.startsWith('-'));
  if (verb === 'cd') {
    cwd = resolve(cwd, args[0] ?? '');
    continue;
  }
  if (!verb || !args.length) continue;
  let written = [];
  if (WRITES_ALL.has(verb)) written = args;
  else if (WRITES_LAST.has(verb)) written = args.slice(-1);
  else if ((verb === 'sed' || verb === 'perl') && rest.some((w) => /^-[a-zA-Z]*i/.test(w))) written = args;
  else if (verb === 'dd') written = rest.filter((w) => w.startsWith('of=')).map((w) => w.slice(3));
  else if (verb === 'git' && GIT_WRITES.has(args[0])) written = args.slice(1);
  const rel = hits(written, cwd);
  if (rel) refuse(rel);
}
