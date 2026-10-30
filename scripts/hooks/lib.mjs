/*
 * Shared helpers for the Claude Code hooks in .claude/settings.json and the Codex hooks in .codex/hooks.json.
 */
import { spawnSync } from 'node:child_process';
import { isAbsolute, relative, resolve } from 'node:path';

export const root = resolve(import.meta.dirname, '..', '..');

export async function readInput() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  return JSON.parse(raw);
}

/* Exit 2: the agent's tool call is blocked (Pre), or the message goes back to the agent (Stop). */
export function block(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

export function runNode(args) {
  const r = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', ...args], { cwd: root, encoding: 'utf8' });
  return { status: r.status, out: `${r.stdout}${r.stderr}`.trim() };
}

export function runCheck() {
  const r = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', resolve(root, 'scripts', 'check.mjs')], { cwd: root, encoding: 'utf8' });
  return { status: r.status, out: `${r.stdout}${r.stderr}`.trim() };
}

/*
 * What decides whether the work is right, and the hooks that guard it: the port's original program and cases, and
 * the word counter's tests, benchmark and expected results. Changing them makes the work pass without making it right.
 */
const PROTECTED = [
  /^python(\/|$)/,
  /^cases\.json$/,
  /^szavak\/(bench\.mjs|szoveg\.mjs|make_expected\.mjs|expected\.json|[^/]*\.test\.ts)$/,
  /^scripts(\/|$)/,
  /^\.claude(\/|$)/,
  /^\.codex(\/|$)/,
  /^package\.json$/,
];

/*
 * The file's path inside the repository. The agent may name the file through another spelling of the same
 * directory (a symlink such as /tmp on macOS), so the session cwd is tried too; the first candidate inside wins.
 */
export function repoPath(file, cwd = process.cwd()) {
  const abs = isAbsolute(file) ? file : resolve(cwd, file);
  const candidates = [relative(root, abs), relative(cwd, abs)];
  const inside = candidates.find((r) => r && !r.startsWith('..') && !isAbsolute(r));
  return (inside ?? candidates[0]).split('\\').join('/');
}

export const isProtected = (rel) => PROTECTED.some((re) => re.test(rel.toLowerCase()));

export const PROTECTED_MESSAGE = (rel) =>
  `Blocked: ${rel} is part of what the work is measured against (the Python original, cases.json, the word counter's tests and benchmark) or of the checks. Change the code, not the measure; if you think a case is wrong, stop and tell the user.`;
