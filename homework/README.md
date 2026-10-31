# Házi feladat: mérj meg egy beállítást a saját kódodon

Egy feladat a saját repódból, két beállítás, például két modell, mindkettő legalább háromszor. Minden futás a repód egy friss, git-előzmények nélküli másolatán dolgozik, és a végén egy referee dönti el, jó lett-e az eredmény: egy parancs, amelyet nem az agent írt. A `bench.mjs` lefuttatja a futásokat, a `summary.mjs` táblázatot készít belőlük. A feladatot, a referee-t és a két beállítást te választod ki.

Kb. 1–2 óra. A futások pénzbe kerülnek: a laborban egy port 29–38 cent volt Opus 5.5-tel. Először egy futással próbáld ki, hogy minden a helyén van-e.

## 1. Egy feladat referee-vel

A legjobb feladat egy olyan hiba, amelyet a repódban már kijavítottatok, és a javítással együtt teszt is készült. Ilyenkor a futás a javítás előtti állapotból indul, és a referee a javítás saját tesztje, amelyet az agent munka közben nem lát. A másolatban nincsenek meg a git-előzmények, így a javítást a logból sem tudja kiolvasni. Ugyanígy működött a záró feladat a markedben.

Kerestesd meg az agenteddel, a saját repódban:

```
Keress ennek a repónak a git-előzményeiben 3 olyan hibajavítást, amelyhez a javítással együtt teszt is készült, és amelyet egy agent fél óra alatt megcsinálhat. Mindegyikhez add meg a javító commit hash-ét, egy mondatban a hibát, a tesztfájlokat, és azt a parancsot, amely csak ezeket a teszteket futtatja. Ne módosíts semmit.
```

Válassz egyet. Tedd félre a tesztjét egy külön mappába, az útvonalával együtt. A parancsok mind a labor mappájából indulnak, a saját repód mellette van, a `../my-repo` mappában; a `<fix>` a javító commit, utána a tesztfájlok jönnek:

```
mkdir -p ../hw/hidden
git -C ../my-repo archive <fix> <test-file> <test-file-2> | tar -x -C ../hw/hidden
```

Aztán írasd meg a hibajelentést. A javítást és a fájlneveket ne tartalmazza, különben a jelentésből kiolvasható, hová kell nyúlni:

```
Írj egy rövid hibajelentést a <fix> commit által javított hibáról úgy, ahogy egy felhasználó írná: a tünetet, és hogy hogyan lehet előidézni. A javítást, a fájlneveket és a teszteket ne említsd. Csak a jelentés szövegét írd ki. Ne módosíts semmit.
```

A jelentést tedd egy `task.md` fájlba, és írd alá a kérést, például:

```
Egy felhasználó ezt a hibát jelentette:

<a jelentés>

Keresd meg az okát, és javítsd ki. Írj rá tesztet, és futtasd le a meglévő teszteket is.
```

Ha nincs ilyen javítás, más is jó, amíg egy parancs eldönti, jó-e az eredmény. Lehet egy új függvény a meglévő tesztjeiddel, vagy egy gyorsítás, ha a mérés ellenőrzi az eredményt is, ahogy a labor `npm run bench`-e.

## 2. A referee ellenőrzése

Mielőtt egy agentet futtatsz, nézd meg, tényleg különbséget tesz-e a referee. Az `--agent none` agent nélkül, csak a referee-t futtatja: a javítás előtti commiton el kell buknia, a javításon át kell mennie.

```
node homework/bench.mjs --repo ../my-repo --ref <fix>^ --prompt ../hw/task.md \
  --hidden ../hw/hidden --setup "npm ci" --referee "<test command>" \
  --agent none --variant check-before --runs 1
node homework/bench.mjs --repo ../my-repo --ref <fix> --prompt ../hw/task.md \
  --hidden ../hw/hidden --setup "npm ci" --referee "<test command>" \
  --agent none --variant check-after --runs 1
```

A `--setup` minden másolatban lefut az agent előtt. Kell, mert a másolatban csak a gitben követett fájlok vannak: a `node_modules` és a `.env` nincs benne, és a submodule-ok sem. A referee-ellenőrzések a táblázat alatt, külön sorban jelennek meg. Ha a referee mindkétszer átmegy, nem méri a hibát; ha mindkétszer elbukik, a parancs vagy a beállítás rossz.

## 3. A beállítások

Ami a `--` után jön, változtatás nélkül az agenthez kerül. Egyszerre csak egy dolgot változtass:

| Mit hasonlítasz össze | Az egyik | A másik |
|---|---|---|
| Modell | `-- --model opus` | `-- --model sonnet` |
| Effort | `-- --effort high` | `-- --effort medium` |
| Egy eszköz (MCP-szerver) | `-- --mcp-config /abs/path/tool.json --strict-mcp-config` | `-- --strict-mcp-config` |
| CLAUDE.md | `--setup "cp /abs/path/CLAUDE.a.md CLAUDE.md && npm ci"` | `--setup "cp /abs/path/CLAUDE.b.md CLAUDE.md && npm ci"` |
| Másik agent | `--agent claude` | `--agent codex` vagy `--agent opencode -- --standalone --auto` |

A Claude Code a másolatban szerkeszthet, de parancsot csak akkor futtathat, ha megengeded. A teszteket engedd meg mindkét beállításnál ugyanúgy, például: `--allowedTools "Bash(npm test *)"`. Amit nem engedtél, azt a Claude Code letiltja; a `runs/` mappa `agent.json` fájljában a `permission_denials` mutatja, mit próbált futtatni.

A Codex nem ír költséget, csak tokeneket; az opencode a modell szolgáltatójától függően ír költséget.

## 4. A futások

Beállításonként legalább háromszor. A laborban ugyanaz a port 8 és 13 kör között szórt, egy futásból nem lehet következtetni.

```
node homework/bench.mjs --repo ../my-repo --ref <fix>^ --prompt ../hw/task.md \
  --hidden ../hw/hidden --setup "npm ci" --referee "<test command>" \
  --variant opus --runs 3 -- --model opus --allowedTools "Bash(npm test *)"
node homework/bench.mjs --repo ../my-repo --ref <fix>^ --prompt ../hw/task.md \
  --hidden ../hw/hidden --setup "npm ci" --referee "<test command>" \
  --variant sonnet --runs 3 -- --model sonnet --allowedTools "Bash(npm test *)"
node homework/summary.mjs
```

A repódat a script nem módosítja: minden futás egy ideiglenes másolatban dolgozik, amelyet a végén töröl. A `bench-results/results.jsonl` futásonként egy sort kap, a `bench-results/runs/<beállítás>-<n>/` mappában pedig ott van az agent kimenete, a referee kimenete és a változás (`diff.patch`). A `--timeout` (alapból 30 perc) után a futás leáll.

## 5. Az eredmény

A `summary.mjs` beállításonként egy sort ír: hányszor ment át a referee, és a költség, az idő, a körök és a kimeneti tokenek mediánja, mellette a legkisebb és a legnagyobb érték. Az utolsó oszlop az első beállításhoz méri a költséget, vagy ha nincs költség (Codex), a kimeneti tokeneket. A körök száma agentenként mást jelent (Claude Code-ban kör, Codexben parancs, opencode-ban lépés), ezért csak azonos agent beállításai között vethető össze.

A két változás közti különbséget az agenteddel is megnézetheted:

```
A bench-results mappában egy mérés eredménye van: a results.jsonl futásonként egy sor, a runs/ mappában az egyes futások kimenete és diff.patch fájlja. Hasonlítsd össze a két beállítást: hányszor ment át a referee, mennyibe került, meddig tartott, és miben különböztek a javítások. Ne módosíts semmit.
```

Jövő keddre hozd el a táblázatot, és egy mondatban azt, hogy mit mértél, melyik lett jobb, és erre számítottál-e.

## Gyakorlásnak: a labor záró feladata

Ha előbb egy ismert feladaton próbálnád ki, a marked hibája kész példa. A javító commit `4562b6f`, a teszt két fájl:

```
git clone https://github.com/markedjs/marked.git ../marked
mkdir -p ../hw/hidden
git -C ../marked archive 4562b6f test/specs/new/unclosed_inline_raw_tag.md test/specs/new/unclosed_inline_raw_tag.html | tar -x -C ../hw/hidden
```

A `../hw/task.md`-be a nap hibajelentése kerül a promptjával együtt; a hibajelentés a labor README-jében is megvan, a prompt az aicode.page/5 laptopnézetében. A referee ellenőrzése és egy futás:

```
node homework/bench.mjs --repo ../marked --ref 4562b6f^ --prompt ../hw/task.md \
  --hidden ../hw/hidden --setup "npm ci" \
  --referee "npm run -s build:esbuild && node --test --test-name-pattern=unclosed_inline_raw_tag test/run-spec-tests.js" \
  --agent none --variant check-before --runs 1
node homework/bench.mjs --repo ../marked --ref 4562b6f^ --prompt ../hw/task.md \
  --hidden ../hw/hidden --setup "npm ci" \
  --referee "npm run -s build:esbuild && node --test --test-name-pattern=unclosed_inline_raw_tag test/run-spec-tests.js" \
  --variant opus --runs 1 -- --model opus --allowedTools "Bash(npm *)"
```

A `check-before` futásnak el kell buknia; a javítással (`--ref 4562b6f`) átmegy.

## Ha valami nem megy

- `not a git repository`: a `--repo` a repód gyökerére mutasson.
- `--setup failed`: a `runs/<beállítás>-<n>/setup.txt` mutatja, miért.
- A referee minden futásban elbukik, és az agent szerint kész: nézd meg a `referee.txt`-t. Ha a tesztek el sem indultak, a referee parancsa rossz.
- macOS-en próbáltam ki, Windowson nem. Kell hozzá a `git`, a `tar` és a Node 22.18 vagy újabb.
