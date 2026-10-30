"""Writes cases.json: the hand-checked cases, and random numbers of every size.

Run it again only when the rules in number_words.py change on purpose: python3 python/make_cases.py
"""

import json
import random
from pathlib import Path

from number_words import number_to_words

BY_HAND = [
    0, 1, 2, 10, 11, 12, 20, 21, 22, 30, 45, 99, 100, 101, 102, 110, 200, 222, 999,
    1000, 1001, 1002, 1100, 1999, 2000, 2001, 2002, 2010, 2026, 2100,
    10000, 12000, 12345, 100000, 101000, 200000, 999999,
    1000000, 1000001, 1001000, 1100000, 2000000, 2002002, 22000000,
    1000000000, 1000000002, 999999999999, -1, -2, -2001, -1000,
]
ERRORS = [
    {"n": 10**12, "error": "range"},
    {"n": -(10**12), "error": "range"},
    {"n": 1.5, "error": "type"},
    {"n": "12", "error": "type"},
    {"n": True, "error": "type"},
    {"n": None, "error": "type"},
]

rng = random.Random(5)
drawn = []
for digits in range(1, 13):
    for _ in range(12):
        n = rng.randrange(10 ** (digits - 1), 10**digits)
        drawn.append(-n if rng.random() < 0.1 else n)

numbers = list(dict.fromkeys(BY_HAND + drawn))
result = {
    "cases": [{"n": n, "want": number_to_words(n)} for n in numbers],
    "errors": ERRORS,
}
target = Path(__file__).resolve().parent.parent / "cases.json"
line = lambda e: "  " + json.dumps(e, ensure_ascii=False)
text = '{\n "cases": [\n' + ",\n".join(map(line, result["cases"])) + '\n ],\n "errors": [\n' + ",\n".join(map(line, ERRORS)) + "\n ]\n}\n"
target.write_text(text, encoding="utf-8")
print(f"{len(result['cases'])} cases and {len(ERRORS)} error cases: {target.name}")
