"""The original against the shared cases: python3 -m unittest discover python"""

import json
import unittest
from pathlib import Path

from number_words import number_to_words

CASES = json.loads((Path(__file__).resolve().parent.parent / "cases.json").read_text(encoding="utf-8"))
ERROR = {"type": TypeError, "range": ValueError}


class NumberToWords(unittest.TestCase):
    def test_cases(self):
        for case in CASES["cases"]:
            with self.subTest(n=case["n"]):
                self.assertEqual(number_to_words(case["n"]), case["want"])

    def test_errors(self):
        for case in CASES["errors"]:
            with self.subTest(n=case["n"]):
                with self.assertRaises(ERROR[case["error"]]):
                    number_to_words(case["n"])


if __name__ == "__main__":
    unittest.main()
