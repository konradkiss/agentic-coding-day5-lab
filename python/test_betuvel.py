"""Az eredeti program a közös esetekkel: python3 -m unittest discover python"""

import json
import unittest
from pathlib import Path

from betuvel import betuvel

ESETEK = json.loads((Path(__file__).resolve().parent.parent / "cases.json").read_text(encoding="utf-8"))
HIBA = {"type": TypeError, "range": ValueError}


class Betuvel(unittest.TestCase):
    def test_esetek(self):
        for eset in ESETEK["cases"]:
            with self.subTest(n=eset["n"]):
                self.assertEqual(betuvel(eset["n"]), eset["want"])

    def test_hibak(self):
        for eset in ESETEK["errors"]:
            with self.subTest(n=eset["n"]):
                with self.assertRaises(HIBA[eset["error"]]):
                    betuvel(eset["n"])


if __name__ == "__main__":
    unittest.main()
