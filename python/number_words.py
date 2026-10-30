"""A whole number in Hungarian words, the way it is written on a cheque or an invoice: 1234 → ezerkétszázharmincnégy.

Rules:
- Up to 2000 it is one word; above 2000 a hyphen goes between the groups of three digits: kétezer-egy.
- Two in front of a multiplier is két: kétszáz, tizenkétezer, kétmillió. At the end of the number it is kettő: ezerkettő.
- No egy goes in front of száz or ezer only when the number starts with it: száz, ezer, százegyezer,
  but ezeregyszáz, kétezer-egyszáz and egymillió-egyezer. Millió and milliárd are always egymillió, egymilliárd.
- A negative number starts with mínusz. The limit is ±999 999 999 999.
"""

import sys

ONES = ["", "egy", "kettő", "három", "négy", "öt", "hat", "hét", "nyolc", "kilenc"]
ROUND_TENS = ["", "tíz", "húsz", "harminc", "negyven", "ötven", "hatvan", "hetven", "nyolcvan", "kilencven"]
TENS_PREFIX = ["", "tizen", "huszon", "harminc", "negyven", "ötven", "hatvan", "hetven", "nyolcvan", "kilencven"]
GROUPS = ["", "ezer", "millió", "milliárd"]
LIMIT = 10**12


def ones(digit, prefix):
    """One digit; as a prefix (in front of száz, ezer, millió) kettő becomes két."""
    if digit == 2 and prefix:
        return "két"
    return ONES[digit]


def three_digits(n, first, prefix):
    """A group from 1 to 999. first: the number starts with it; prefix: a multiplier (ezer, millió…) follows it."""
    hundreds, rest = divmod(n, 100)
    tens, one = divmod(rest, 10)
    word = ""
    if hundreds:
        word += ("" if hundreds == 1 and first else ones(hundreds, True)) + "száz"
    if tens:
        word += (ROUND_TENS if one == 0 else TENS_PREFIX)[tens]
    if one:
        word += ones(one, prefix)
    return word


def number_to_words(n):
    """The whole number n in words. TypeError for any other type, ValueError beyond the limit."""
    if isinstance(n, bool) or not isinstance(n, int):
        raise TypeError(f"expected a whole number, got {n!r}")
    if not -LIMIT < n < LIMIT:
        raise ValueError(f"number too large: {n}")
    if n == 0:
        return "nulla"
    if n < 0:
        return "mínusz " + number_to_words(-n)

    groups = []
    rest = n
    while rest:
        rest, group = divmod(rest, 1000)
        groups.append(group)

    words = []
    for place in range(len(groups) - 1, -1, -1):
        group = groups[place]
        if group == 0:
            continue
        first = not words
        if group == 1 and place == 1 and first:
            words.append("ezer")
        else:
            words.append(three_digits(group, first, place > 0) + GROUPS[place])

    return ("-" if n > 2000 else "").join(words)


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        print(number_to_words(int(arg)))
