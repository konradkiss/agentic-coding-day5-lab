"""A cases.json előállítása: a kézzel ellenőrzött esetek, és sorsolt számok minden nagyságrendből.

Csak akkor futtasd újra, ha a betuvel.py szabályai szándékosan változnak: python3 python/make_cases.py
"""

import json
import random
from pathlib import Path

from betuvel import betuvel

KEZZEL = [
    0, 1, 2, 10, 11, 12, 20, 21, 22, 30, 45, 99, 100, 101, 102, 110, 200, 222, 999,
    1000, 1001, 1002, 1100, 1999, 2000, 2001, 2002, 2010, 2026, 2100,
    10000, 12000, 12345, 100000, 101000, 200000, 999999,
    1000000, 1000001, 1001000, 1100000, 2000000, 2002002, 22000000,
    1000000000, 1000000002, 999999999999, -1, -2, -2001, -1000,
]
HIBAK = [
    {"n": 10**12, "error": "range"},
    {"n": -(10**12), "error": "range"},
    {"n": 1.5, "error": "type"},
    {"n": "12", "error": "type"},
    {"n": True, "error": "type"},
    {"n": None, "error": "type"},
]

sorsolo = random.Random(5)
sorsolt = []
for jegyek in range(1, 13):
    for _ in range(12):
        n = sorsolo.randrange(10 ** (jegyek - 1), 10**jegyek)
        sorsolt.append(-n if sorsolo.random() < 0.1 else n)

szamok = list(dict.fromkeys(KEZZEL + sorsolt))
eredmeny = {
    "cases": [{"n": n, "want": betuvel(n)} for n in szamok],
    "errors": HIBAK,
}
cel = Path(__file__).resolve().parent.parent / "cases.json"
sor = lambda e: "  " + json.dumps(e, ensure_ascii=False)
szoveg = '{\n "cases": [\n' + ",\n".join(map(sor, eredmeny["cases"])) + '\n ],\n "errors": [\n' + ",\n".join(map(sor, HIBAK)) + "\n ]\n}\n"
cel.write_text(szoveg, encoding="utf-8")
print(f"{len(eredmeny['cases'])} eset és {len(HIBAK)} hibaeset: {cel.name}")
