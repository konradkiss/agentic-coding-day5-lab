#!/usr/bin/env node
/*
 * PreToolUse on shell commands: no --no-verify, and nothing that writes to the specification or the checks.
 * A heuristic, not a sandbox: a redirect counts when its target is protected; any other writing command counts when
 * a protected path appears anywhere in the command.
 */
import { block, readInput } from './lib.mjs';

const PROTECTED_IN_COMMAND = /(^|[\s'"=:(/])(python|scripts|\.claude|\.codex)(\/|\s|$|['"])|cases\.json|package\.json/i;
const PROTECTED_PATH = /^(\.\/)?(python|scripts|\.claude|\.codex)(\/|$)|(^|\/)(cases|package)\.json$/i;
const REDIRECT = /(?:^|[^\d&>])>>?\s*['"]?([^\s'";&|)]+)/g;
const WRITES = [
  /\b(rm|rmdir|mv|cp|tee|touch|truncate|chmod|chown|ln|dd|rsync|unlink|patch|install)\b/,
  /\bsed\b[^|;&]*\s-[a-zA-Z]*i/,
  /\bperl\b[^|;&]*\s-[a-zA-Z]*i/,
  /\bgit\s+(checkout|restore|reset|rm|mv|apply|stash|clean|am|cherry-pick|revert|merge|rebase|pull)\b/,
  /\b(writeFile|appendFile|rmSync|unlink|rename|copyFile|cpSync|createWriteStream|truncate|mkdir|symlink|write_text|open\([^)]*['"]w)/,
  /\bnpm\s+(pkg|set-script)\b/,
  /make_cases/,
];

const { tool_input: { command = '' } = {} } = await readInput();
const cmd = (Array.isArray(command) ? command.join(' ') : String(command)).replace(/\d*>\s*\/dev\/null|\d*>&\d/g, '');

if (/--no-verify\b/.test(cmd)) block('Blocked: --no-verify skips the checks. Make them pass instead.');
const redirectsToProtected = [...cmd.matchAll(REDIRECT)].some(([, target]) => PROTECTED_PATH.test(target));
if (redirectsToProtected || (PROTECTED_IN_COMMAND.test(cmd) && WRITES.some((re) => re.test(cmd)))) {
  block('Blocked: this command looks like it writes to python/, cases.json, scripts/, package.json, .claude/ or .codex/. Change the port instead; if a case is wrong, stop and tell the user.');
}
