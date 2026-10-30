# Nem vibe coding: labor

Az Agentic Coding sorozat 5. alkalmának gyakorló repója (2026. november 3.).

## A program

A `python/betuvel.py` egy egész számot betűvel ír ki, ahogy a csekken vagy a számlán szokás:

```
1234        → ezerkétszázharmincnégy
2026        → kétezer-huszonhat
2002002     → kétmillió-kétezer-kettő
```

Ezt portoljuk TypeScriptre, együtt, lépésről lépésre. A szabályokat a fájl elején találod. Kicsi program, de van benne néhány csapda: mikor két és mikor kettő, hová kerül kötőjel, és mikor marad el az „egy” a száz és az ezer elől.

## Ami kell hozzá

- Node.js 22.18 vagy újabb. Nincs függőség, `npm install` sem kell: a Node közvetlenül futtatja a TypeScriptet.
- Egy coding agent: Claude Code, Codex vagy opencode.
- Python 3 nem kötelező. Csak akkor kell, ha az eredeti programot is futtatni szeretnéd.

## Parancsok

```
npm run check                        # a bíró: a cases.json minden esete a TypeScript-porton
npm test                             # a port saját tesztjei
python3 -m unittest discover python  # az eredeti ugyanazokkal az esetekkel
```

## Mi védi a feladatot

A `cases.json` 195 esetet tartalmaz. Az eredetinek és a portnak is mindegyiken át kell mennie. Claude Code és Codex alatt az agent nem írhatja át sem az eseteket, sem az eredetit: a `.claude/settings.json` és a `.codex/hooks.json` hookjai visszautasítják. opencode alatt ezt csak az `AGENTS.md` kéri. Ha a port már létezik, és az `npm run check` piros, a hook visszaküldi dolgozni az agentet. Öt sikertelen kör után a feladat visszakerül hozzád.

## Ha lemaradtál

Minden lépésnek van git tagje. Az aktuálisra így ugorhatsz:

```
git checkout <tag>
```

A tagek listája: `git tag`.
