# day5-lab

A small Python program, `python/betuvel.py`, writes a whole number out in Hungarian words, the way an amount is
written on a cheque or an invoice: 1234 → `ezerkétszázharmincnégy`. The task is to port it to TypeScript.

## The specification

- `python/betuvel.py` is the original. Its docstring states the rules; the code is the final word on behaviour.
- `cases.json` holds the cases both versions must pass: `cases` (number → words) and `errors` (`type` or `range`).
- Both are read-only. If a case looks wrong, stop and say so; do not change it.

## The port

- `ts/betuvel.ts` exports `betuvel(n: unknown): string`.
- A non-integer or a non-number throws `TypeError`; a number outside ±999 999 999 999 throws `RangeError`.
- Run as a script, it prints each argument in words: `node ts/betuvel.ts 1234`.
- Node only (22.18 or newer runs TypeScript directly). No dependencies, no build step.
- Tests go in `ts/*.test.ts`, using `node:test`.

## Commands

- `npm run check`: the referee. Runs every case in `cases.json` against `ts/betuvel.ts`.
- `npm test`: the port's own tests.
- `python3 -m unittest discover python`: the original against the same cases (needs Python 3).

## Hooks

`.claude/settings.json` and `.codex/hooks.json` refuse edits to `python/`, `cases.json`, `scripts/`, `package.json`,
`.claude/` and `.codex/`, and refuse `--no-verify`. Once `ts/betuvel.ts` exists, the agent is done only when
`npm run check` passes.
