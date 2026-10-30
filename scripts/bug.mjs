#!/usr/bin/env node
/*
 * The closing problem: a real bug in marked (github.com/markedjs/marked), fixed upstream in 4562b6f.
 *
 *   node scripts/bug.mjs setup     marked at the commit before the fix, in ../day5-marked next to this repo, as a
 *                                   fresh git repo without upstream history (so the fix cannot be found in git log)
 *   node scripts/bug.mjs referee   fetches the fix's own test files from GitHub and runs them on ../day5-marked
 *
 * The copy sits outside this repo on purpose: an agent started inside it would otherwise also read this repo's
 * CLAUDE.md and AGENTS.md, and this repo's hooks would not fit it.
 *
 * Node and tar only (tar ships with macOS, Linux and Windows 10+).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PARENT = 'f0fd3e0e22c1acc7b5a65ebfe54138af38955e10';
const FIX = '4562b6f97988a75a9f20234626f8bbaab72af927';
const HIDDEN = ['test/specs/new/unclosed_inline_raw_tag.md', 'test/specs/new/unclosed_inline_raw_tag.html'];
const root = resolve(import.meta.dirname, '..');
const dir = resolve(root, '..', 'day5-marked');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: dir, stdio: 'inherit', shell: process.platform === 'win32', ...opts });
  if (r.status !== 0) {
    console.error(`${cmd} ${args.join(' ')} failed`);
    process.exit(1);
  }
}

async function setup() {
  if (existsSync(dir)) {
    console.error(`${dir} already exists. Delete it first if you want a fresh copy.`);
    process.exit(1);
  }
  mkdirSync(dir, { recursive: true });
  console.log(`Downloading marked at ${PARENT.slice(0, 7)}…`);
  const res = await fetch(`https://codeload.github.com/markedjs/marked/tar.gz/${PARENT}`);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  const archive = resolve(dir, '..', 'day5-marked.tar.gz');
  writeFileSync(archive, Buffer.from(await res.arrayBuffer()));
  run('tar', ['-xzf', archive, '--strip-components=1']);
  rmSync(archive);
  run('git', ['init', '-q']);
  run('git', ['add', '-A']);
  run('git', ['-c', 'user.name=dev', '-c', 'user.email=dev@example.com', 'commit', '-qm', 'marked, current main']);
  console.log('Installing (npm ci)…');
  run(npm, ['ci', '--no-audit', '--no-fund']);
  console.log(`\nReady: ${dir}`);
}

async function referee() {
  if (!existsSync(dir)) {
    console.error(`${dir} does not exist yet: node scripts/bug.mjs setup`);
    process.exit(1);
  }
  for (const file of HIDDEN) {
    const res = await fetch(`https://raw.githubusercontent.com/markedjs/marked/${FIX}/${file}`);
    if (!res.ok) throw new Error(`download failed: ${file} ${res.status}`);
    writeFileSync(resolve(dir, file), await res.text());
  }
  console.log('The upstream test is in place. Building and running it…');
  run(npm, ['run', '-s', 'build:esbuild']);
  const r = spawnSync(process.execPath, ['--test', '--test-name-pattern=unclosed_inline_raw_tag', 'test/run-spec-tests.js'], { cwd: dir, encoding: 'utf8' });
  const pass = /# pass (\d+)/.exec(r.stdout)?.[1];
  const fail = /# fail (\d+)/.exec(r.stdout)?.[1];
  console.log(r.status === 0 ? `The upstream test passes (${pass} of ${Number(pass) + Number(fail)}).` : `The upstream test fails (${fail} of ${Number(pass) + Number(fail)}):\n${r.stdout.split('\n').filter((l) => /not ok|expected|actual|\+|-/.test(l)).slice(0, 30).join('\n')}`);
  process.exit(r.status === 0 ? 0 : 1);
}

const cmd = process.argv[2];
if (cmd === 'setup') await setup();
else if (cmd === 'referee') await referee();
else {
  console.error('usage: node scripts/bug.mjs setup | referee');
  process.exit(2);
}
