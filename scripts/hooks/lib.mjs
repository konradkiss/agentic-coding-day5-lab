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

export function runCheck() {
  const r = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', resolve(root, 'scripts', 'check.mjs')], { cwd: root, encoding: 'utf8' });
  return { status: r.status, out: `${r.stdout}${r.stderr}`.trim() };
}

/*
 * What decides whether the port is right, and the hooks that guard it. The original program and the cases are the
 * specification; changing them makes the port pass without making it right.
 */
const PROTECTED = [/^python(\/|$)/, /^cases\.json$/, /^scripts(\/|$)/, /^\.claude(\/|$)/, /^\.codex(\/|$)/, /^package\.json$/];

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
  `Blocked: ${rel} is part of the specification (the Python original, cases.json) or of the checks. Change the port, not what it is measured against; if you think a case is wrong, stop and tell the user.`;
