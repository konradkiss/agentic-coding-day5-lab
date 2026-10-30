#!/usr/bin/env node
/*
 * One setting of an agent, measured on your own repository: the same task several times, each run on its own
 * throwaway copy, then your referee command decides whether the result is right. A copy holds the files at --ref
 * as a new repository with a single commit, so the agent can't find the fix or its test in the git history.
 *
 *   node homework/bench.mjs --repo ../my-app --prompt task.md --referee "npm test" --variant opus --runs 3 -- --model opus
 *
 * Everything after `--` goes to the agent unchanged. Each run appends one line to <out>/results.jsonl and keeps
 * the agent's output, the referee's output and the diff in <out>/runs/<variant>-<n>/. summary.mjs makes the table.
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const USAGE = `usage: node homework/bench.mjs --repo <path> --prompt <file> --referee "<command>" --variant <name> [options] [-- <agent flags>]

  --repo <path>       the git repository to work on (it is not changed: every run gets its own copy)
  --ref <commit>      where each run starts (default HEAD); for a fixed bug, the fix's parent commit
  --prompt <file>     the task, as you would type it to the agent
  --referee "<cmd>"   run in the copy after the agent; exit code 0 means the result is right
  --variant <name>    a name for this setting, e.g. opus, sonnet, effort-high
  --runs <n>          how many runs (default 3)
  --agent <name>      claude (default), codex or opencode; none runs only the referee, to check it first
  --setup "<cmd>"     run in each copy before the agent, e.g. "npm ci"
  --hidden <dir>      copied into the copy after the agent and before the referee (a test the agent must not see)
  --timeout <min>     stop a run after this many minutes (default 30)
  --out <dir>         where the results go (default bench-results)
  --keep              keep the copies instead of removing them`;

/* ------------------------------------------------------------------ arguments */
const argv = process.argv.slice(2);
const dash = argv.indexOf('--');
const own = dash < 0 ? argv : argv.slice(0, dash);
const agentArgs = dash < 0 ? [] : argv.slice(dash + 1);
const opt = { ref: 'HEAD', runs: '3', agent: 'claude', timeout: '30', out: 'bench-results' };
for (let i = 0; i < own.length; i++) {
  const key = own[i].replace(/^--/, '');
  if (key === 'keep') opt.keep = true;
  else if (key === 'help' || key === 'h') { console.log(USAGE); process.exit(0); }
  else if (own[i].startsWith('--') && i + 1 < own.length) opt[key] = own[++i];
  else fail(`unknown argument: ${own[i]}`);
}
for (const k of ['repo', 'prompt', 'referee', 'variant']) if (!opt[k]) fail(`--${k} is required`);
if (!['claude', 'codex', 'opencode', 'none'].includes(opt.agent)) fail('--agent must be claude, codex, opencode or none');
if (!/^[\w.-]+$/.test(opt.variant)) fail('--variant: letters, digits, dot, dash and underscore only');
const runs = Number(opt.runs);
if (!(runs >= 1 && runs <= 50)) fail('--runs must be between 1 and 50');
const timeoutMs = Number(opt.timeout) * 60_000;

function fail(msg) {
  console.error(`error: ${msg}\n\n${USAGE}`);
  process.exit(2);
}

const sh = (cmd, args, o = {}) => spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...o });
const git = (...args) => {
  const r = sh('git', ['-C', repo, ...args]);
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr.trim()}`);
  return r.stdout.trim();
};

const repo = resolve(opt.repo);
if (sh('git', ['-C', repo, 'rev-parse', '--git-dir']).status !== 0) fail(`not a git repository: ${repo}`);
const sha = git('rev-parse', '--verify', `${opt.ref}^{commit}`);
const prompt = readFileSync(opt.prompt, 'utf8').trim();
if (!prompt) fail(`the prompt file is empty: ${opt.prompt}`);
const hidden = opt.hidden ? resolve(opt.hidden) : null;
if (hidden && !existsSync(hidden)) fail(`--hidden: no such directory: ${hidden}`);
const out = resolve(opt.out);
mkdirSync(join(out, 'runs'), { recursive: true });

/* ------------------------------------------------------------------ the agents */
/* the command line for one run; the prompt goes in on stdin where the agent reads it from there */
function agentCommand() {
  if (opt.agent === 'claude') return { cmd: 'claude', args: ['-p', '--output-format', 'json', '--permission-mode', 'acceptEdits', '--no-session-persistence', ...agentArgs], stdin: prompt };
  if (opt.agent === 'codex') return { cmd: 'codex', args: ['exec', '--json', '-s', 'workspace-write', ...agentArgs, '-'], stdin: prompt };
  return { cmd: 'opencode', args: ['run', '--format', 'json', ...agentArgs, prompt], stdin: '' };
}

const lines = (text) => text.split('\n').filter((l) => l.trim().startsWith('{')).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

/* what each agent reports: cost (claude, opencode), turns or steps, tokens */
function readAgent(stdout) {
  if (opt.agent === 'claude') {
    let j = null;
    try { j = JSON.parse(stdout); } catch { j = lines(stdout).find((x) => x.type === 'result') || null; }
    if (!j) return {};
    const u = j.usage || {};
    return {
      cost_usd: j.total_cost_usd ?? null, turns: j.num_turns ?? null, agent_error: !!j.is_error,
      tokens: { input: u.input_tokens ?? 0, cache_write: u.cache_creation_input_tokens ?? 0, cache_read: u.cache_read_input_tokens ?? 0, output: u.output_tokens ?? 0 },
      denied: (j.permission_denials || []).length, answer: String(j.result ?? '').slice(-2000),
    };
  }
  if (opt.agent === 'codex') {
    const ev = lines(stdout);
    const t = { input: 0, cache_read: 0, output: 0 };
    for (const e of ev.filter((x) => x.type === 'turn.completed')) {
      t.input += e.usage?.input_tokens ?? 0; t.cache_read += e.usage?.cached_input_tokens ?? 0; t.output += e.usage?.output_tokens ?? 0;
    }
    const msgs = ev.filter((x) => x.type === 'item.completed' && x.item?.type === 'agent_message');
    return { cost_usd: null, turns: ev.filter((x) => x.type === 'item.completed' && x.item?.type === 'command_execution').length, tokens: t, answer: String(msgs.at(-1)?.item?.text ?? '').slice(-2000) };
  }
  const steps = lines(stdout).filter((x) => x.type === 'step_finish').map((x) => x.part || {});
  const t = { input: 0, cache_read: 0, output: 0 };
  for (const p of steps) { t.input += p.tokens?.input ?? 0; t.cache_read += p.tokens?.cache?.read ?? 0; t.output += p.tokens?.output ?? 0; }
  const texts = lines(stdout).filter((x) => x.type === 'text').map((x) => x.part?.text ?? '');
  return { cost_usd: steps.reduce((s, p) => s + (p.cost ?? 0), 0), turns: steps.length, tokens: t, answer: texts.join('\n').slice(-2000) };
}

/* ------------------------------------------------------------------ the runs */
const win = process.platform === 'win32';
console.log(`${opt.variant}: ${runs} run(s) of ${opt.agent} on ${repo} at ${sha.slice(0, 10)}${agentArgs.length ? `, with ${agentArgs.join(' ')}` : ''}`);

for (let n = 1; n <= runs; n++) {
  const dir = mkdtempSync(join(tmpdir(), `bench-${opt.variant}-`));
  const keep = join(out, 'runs', `${opt.variant}-${n}`);
  rmSync(keep, { recursive: true, force: true });
  mkdirSync(keep, { recursive: true });
  const row = { variant: opt.variant, run: n, agent: opt.agent, ref: sha, flags: agentArgs, started: new Date().toISOString() };
  try {
    /* the tracked files at --ref (no submodules, no untracked files), committed once in a new repository */
    const tar = join(dir, '.src.tar');
    git('archive', '--format=tar', '-o', tar, sha);
    const x = sh('tar', ['-xf', tar, '-C', dir]);
    rmSync(tar, { force: true });
    if (x.status !== 0) throw new Error(`could not unpack ${sha.slice(0, 10)}: ${x.stderr.trim()}`);
    for (const args of [['init', '-q'], ['add', '-A'], ['-c', 'user.name=bench', '-c', 'user.email=bench@localhost', '-c', 'commit.gpgsign=false', 'commit', '-q', '-m', `start: ${sha.slice(0, 10)}`]]) {
      const g = sh('git', ['-C', dir, ...args]);
      if (g.status !== 0) throw new Error(`git ${args.at(-1)} in the copy: ${g.stderr.trim()}`);
    }
    if (opt.setup) {
      const s = sh(opt.setup, [], { cwd: dir, shell: true, timeout: timeoutMs });
      writeFileSync(join(keep, 'setup.txt'), `${s.stdout}${s.stderr}`);
      if (s.status !== 0) throw new Error(`--setup failed (exit ${s.status}), see ${join(keep, 'setup.txt')}`);
    }

    const a = opt.agent === 'none' ? null : agentCommand();
    /* the agent; with --agent none only the referee runs, on the untouched copy */
    if (a) {
      const t0 = Date.now();
      /* PWD too: opencode takes its folder from it, not from the working directory */
      const r = sh(a.cmd, a.args, { cwd: dir, env: { ...process.env, PWD: dir }, input: a.stdin, timeout: timeoutMs, shell: win });
      row.wall_s = Math.round((Date.now() - t0) / 100) / 10;
      row.timed_out = r.error?.code === 'ETIMEDOUT';
      row.agent_exit = r.status;
      if (r.error && !row.timed_out) throw new Error(`could not start ${a.cmd}: ${r.error.message}`);
      writeFileSync(join(keep, opt.agent === 'claude' ? 'agent.json' : 'agent.jsonl'), r.stdout || '');
      writeFileSync(join(keep, 'agent-stderr.txt'), r.stderr || '');
      Object.assign(row, readAgent(r.stdout || ''));
    }

    /* the diff, before any hidden files go in */
    sh('git', ['-C', dir, 'add', '-A']);
    writeFileSync(join(keep, 'diff.patch'), sh('git', ['-C', dir, 'diff', '--cached', 'HEAD']).stdout);
    row.files_changed = sh('git', ['-C', dir, 'diff', '--cached', '--name-only', 'HEAD']).stdout.split('\n').filter(Boolean).length;

    if (hidden) cpSync(hidden, dir, { recursive: true });
    const ref = sh(opt.referee, [], { cwd: dir, shell: true, timeout: timeoutMs });
    writeFileSync(join(keep, 'referee.txt'), `${ref.stdout}${ref.stderr}`);
    row.referee_pass = ref.status === 0;
  } catch (err) {
    row.error = err.message;
  } finally {
    if (!opt.keep) rmSync(dir, { recursive: true, force: true });
    else row.copy = dir;
  }
  appendFileSync(join(out, 'results.jsonl'), `${JSON.stringify(row)}\n`);
  const cost = row.cost_usd == null ? '' : ` $${row.cost_usd.toFixed(2)}`;
  const verdict = row.referee_pass ? 'referee passed' : 'referee FAILED';
  const agent = opt.agent === 'none' ? '' : `, ${row.wall_s} s${cost}, ${row.turns ?? '?'} turns${row.timed_out ? ', timed out' : ''}`;
  console.log(`  run ${n}: ${row.error ? `error: ${row.error}` : `${verdict}${agent}`}`);
}
console.log(`results: ${join(out, 'results.jsonl')}  ·  table: node homework/summary.mjs ${opt.out === 'bench-results' ? '' : opt.out}`.trimEnd());
