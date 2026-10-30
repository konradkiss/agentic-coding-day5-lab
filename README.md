# Nem vibe coding: labor

Az Agentic Coding sorozat 5. alkalmának gyakorló repója (2026. november 3.).

```
git clone https://github.com/konradkiss/agentic-coding-day5-lab.git
cd agentic-coding-day5-lab
```

## A program

A `python/number_words.py` egy egész számot betűvel ír ki, ahogy a csekken vagy a számlán szokás:

```
1234        → ezerkétszázharmincnégy
2026        → kétezer-huszonhat
2002002     → kétmillió-kétezer-kettő
```

Ezt portoljuk TypeScriptre, együtt, lépésről lépésre. A szabályokat a fájl elején találod. Kicsi program, de van benne néhány csapda: mikor két és mikor kettő, hová kerül kötőjel, és mikor marad el az „egy” a száz és az ezer elől.

## A lassú szószámláló

A `wordcount/top-words.ts` megmondja, melyik szó fordul elő a legtöbbször egy szövegben. Helyesen működik, de lassú: egy 200 000 szavas szövegen pár másodpercig dolgozik. Ezt gyorsítjuk fel úgy, hogy az eredmény ne változzon.

Az `npm run bench` három különböző szövegen méri az időt, és minden eredményt összevet az elvárttal. Ha bármelyik eredmény hibás, a mérés nem számít. Egyenlő gyakoriságnál a szavak magyar ábécérendben követik egymást (c, cs, d, dz, dzs…), ezért a sima karakterkód szerinti rendezés nem elég.

## A záró feladat: egy valódi hiba

A [marked](https://github.com/markedjs/marked) Markdownból HTML-t készítő könyvtár. Egy olyan hibáját keressük meg és javítjuk ki, amelyet a fejlesztői már kijavítottak. A javítás előtti változatot töltjük le friss git-repóként, a marked saját előzményei nélkül, így a megoldás nem olvasható ki a logból.

```
npm run bug:setup     # a marked javítás előtti változata a ../day5-marked mappába, telepítéssel együtt
npm run bug:referee   # a javítás saját tesztje: letölti és lefuttatja
```

Ezzel a hibajelentéssel dolgozunk:

> On our documentation site, some pages show raw HTML where text should have been escaped: a `<` in a sentence ends up in the page as a real tag and breaks the layout. It seems to happen mostly on pages that talk about keyboard shortcuts. We render with `marked.parse(markdown)` and default options. I can't share the pages, sorry.

Az agentet a `../day5-marked` mappában indítsd. Ott a marked saját `AGENTS.md`-je érvényes, ennek a repónak a hookjai nem. A `bug:referee`-t csak a végén futtasd: a javítás tesztfájljait a `../day5-marked` mappába tölti le, és onnantól az agent is látja őket.

## Ami kell hozzá

- Node.js 22.18 vagy újabb. Nincs függőség, `npm install` sem kell: a Node közvetlenül futtatja a TypeScriptet.
- Egy coding agent: Claude Code, Codex vagy opencode.
- Python 3 nem kötelező. Csak akkor kell, ha az eredeti programot is futtatni szeretnéd.

## Parancsok

```
npm run check                        # a bíró: a cases.json minden esete a TypeScript-porton
npm test                             # a port és a szószámláló tesztjei
npm run bench                        # a szószámláló sebességmérése
python3 -m unittest discover python  # az eredeti ugyanazokkal az esetekkel
```

## Mi védi a feladatot

A `cases.json` 195 esetet tartalmaz. Az eredetinek és a portnak is mindegyiken át kell mennie. A szószámlálót a tesztjei, a mérőszkript és az elvárt eredmények ellenőrzik.

Claude Code és Codex alatt az agent ezek egyikét sem írhatja át: a `.claude/settings.json` és a `.codex/hooks.json` hookjai visszautasítják. opencode alatt ezt csak az `AGENTS.md` kéri. Claude Code és Codex alatt a Stop hook visszaküldi dolgozni az agentet, ha a szószámláló tesztjei elbuknak, vagy ha a port már megvan, és az `npm run check` piros. Öt sikertelen kör után a feladat visszakerül hozzád.

## Ha lemaradtál

Minden lépésnek van git tagje. Az aktuálisra így ugorhatsz:

```
git checkout <tag>
```

A tagek listája: `git tag`.
