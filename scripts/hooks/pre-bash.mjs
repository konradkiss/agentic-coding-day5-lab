#!/usr/bin/env node
/*
 * PreToolUse on shell commands: no --no-verify, and nothing that writes to what the work is measured against or to
 * the checks. Reading those files is fine. A heuristic, not a sandbox: the command is cut into simple commands at
 * ; & | and each one is judged by its verb and the paths it writes to.
 */
import { readFileSync } from 'node:fs';
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

/* inline code (node -e, python -c, a heredoc) that names a protected file and a write function */
if (WRITE_API.test(cmd)) {
  const named = [...cmd.matchAll(/[\w./-]*(python\/[\w./-]+|cases\.json|wordcount\/[\w./-]+|scripts\/[\w./-]+|package\.json|\.claude\/[\w./-]*|\.codex\/[\w./-]*)/g)].map((m) => m[0]);
  const rel = hits(named);
  if (rel) refuse(rel);
}

/* the files a diff changes, from its ---/+++ headers; null when the diff cannot be read */
function diffTargets(file, cwd) {
  try {
    const text = readFileSync(resolve(cwd, file), 'utf8');
    return [...text.matchAll(/^(?:---|\+\+\+) (?:[ab]\/)?(\S+)/gm)].map((m) => m[1]).filter((f) => f !== '/dev/null');
  } catch {
    return null;
  }
}

/* cd changes where the later commands' relative paths point, redirects included */
let cwd = input.cwd ?? process.cwd();
for (const segment of cmd.split(/[;&|\n]+/)) {
  for (const [, target] of segment.matchAll(REDIRECT)) {
    const rel = hits([target], cwd);
    if (rel) refuse(rel);
  }
  const words = segment.trim().split(/\s+/).map((w) => w.replace(/^['"]|['"]$/g, '')).filter(Boolean);
  while (words.length && (/^\w+=/.test(words[0]) || ['sudo', 'command', 'xargs', 'env', 'npx', 'pnpm', 'yarn', 'bunx'].includes(words[0]))) words.shift();
  const [verb, ...rest] = words;
  const args = rest.filter((w) => !w.startsWith('-'));
  if (verb === 'cd') {
    cwd = resolve(cwd, args[0] ?? '');
    continue;
  }
  if (!verb) continue;
  /* a diff applied by patch or git apply: the files it names; a diff that cannot be read is refused */
  if (verb === 'patch' || (verb === 'git' && (args[0] === 'apply' || args[0] === 'am'))) {
    const source = segment.match(/<\s*['"]?([^\s'";&|)]+)/)?.[1] ?? rest.find((w, i) => rest[i - 1] === '-i' || rest[i - 1] === '--input');
    const diffs = verb === 'git' ? args.slice(1) : source ? [source] : [];
    const named = verb === 'patch' ? args.filter((a) => a !== source) : [];
    const targets = diffs.map((d) => diffTargets(d, cwd));
    if (!diffs.length || targets.includes(null)) block('Blocked: this command applies a diff the hook cannot read, so it cannot be checked. Make the change with the edit tool.');
    const rel = hits([...named, ...targets.flat()], cwd);
    if (rel) refuse(rel);
    continue;
  }
  if (!args.length) continue;
  let written = [];
  if (WRITES_ALL.has(verb)) written = args;
  else if (WRITES_LAST.has(verb)) written = args.slice(-1);
  else if ((verb === 'sed' || verb === 'perl') && rest.some((w) => /^-[a-zA-Z]*i/.test(w))) written = args;
  else if (verb === 'dd') written = rest.filter((w) => w.startsWith('of=')).map((w) => w.slice(3));
  else if (verb === 'git' && GIT_WRITES.has(args[0])) written = args.slice(1);
  /* formatters and fixers that rewrite the files they are given (prettier --write, eslint --fix, …) */
  else if (rest.some((w) => ['--write', '--fix', '--in-place'].includes(w) || (w === '-w' && verb === 'prettier'))) written = args;
  const rel = hits(written, cwd);
  if (rel) refuse(rel);
}
