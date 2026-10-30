# day5-lab

Two exercises:

- **The port.** A small Python program, `python/betuvel.py`, writes a whole number out in Hungarian words, the way
  an amount is written on a cheque or an invoice: 1234 → `ezerkétszázharmincnégy`. The task is to port it to
  TypeScript.
- **The speed-up.** `szavak/gyakori.ts` returns the most frequent words of a text, and it is slow. The task is to
  make it faster without changing what it returns.

## The port: specification

- `python/betuvel.py` is the original. Its docstring states the rules; the code is the final word on behaviour.
- `cases.json` holds the cases both versions must pass: `cases` (number → words) and `errors` (`type` or `range`).
- Both are read-only. If a case looks wrong, stop and say so; do not change it.

## The port: what to write

- `ts/betuvel.ts` exports `betuvel(n: unknown): string`.
- A non-integer or a non-number throws `TypeError`; a number outside ±999 999 999 999 throws `RangeError`.
- Run as a script, it prints each argument in words: `node ts/betuvel.ts 1234`.
- Node only (22.18 or newer runs TypeScript directly). No dependencies, no build step.
- Tests go in `ts/*.test.ts`, using `node:test`.

## The speed-up

- `gyakoriSzavak(szoveg, n = 10)` returns the `n` most frequent words as `[word, count]` pairs: most frequent
  first, equal counts in Hungarian alphabetical order (`localeCompare(…, 'hu')`: c < cs, o < ö, z < zs). A word is a
  run of letters (`\p{L}`), lowercased; everything else separates words.
- `szavak/gyakori.ts` is the only file to change. The tests (`szavak/gyakori.test.ts`), the benchmark
  (`szavak/bench.mjs`, `szavak/szoveg.mjs`) and its expected results (`szavak/expected.json`) are read-only.
- `npm run bench` times three different 200 000-word texts and checks every result; a wrong result does not count.
  The last line is machine-readable: `BENCH {"median_ms": …, "wrong": 0}`.

## Commands

- `npm run check`: the referee. Runs every case in `cases.json` against `ts/betuvel.ts`.
- `npm test`: the port's own tests and the word counter's tests.
- `npm run bench`: the word counter's benchmark.
- `python3 -m unittest discover python`: the original against the same cases (needs Python 3).

## Hooks

`.claude/settings.json` and `.codex/hooks.json` refuse edits to what the work is measured against (`python/`,
`cases.json`, the word counter's tests, benchmark and expected results) and to the checks (`scripts/`,
`package.json`, `.claude/`, `.codex/`), and refuse `--no-verify`. The agent is done only when the word counter's
tests pass and, once `ts/betuvel.ts` exists, `npm run check` passes.
