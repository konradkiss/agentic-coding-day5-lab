"""Egy egész szám betűvel, ahogy a csekken és a számlán írjuk: 1234 → ezerkétszázharmincnégy.

Szabályok:
- 2000-ig egybeírjuk, 2000 fölött a hármas számcsoportok közé kötőjel kerül: kétezer-egy.
- A kettő előtag szerepben két: kétszáz, tizenkétezer, kétmillió. A szám végén kettő: ezerkettő.
- A száz és az ezer elé csak akkor nem írunk egyet, ha a szám ezzel kezdődik: száz, ezer, százegyezer,
  de ezeregyszáz, kétezer-egyszáz és egymillió-egyezer. A millió és a milliárd mindig egymillió, egymilliárd.
- A negatív szám elé mínusz kerül. A határ ±999 999 999 999.
"""

import sys

EGYES = ["", "egy", "kettő", "három", "négy", "öt", "hat", "hét", "nyolc", "kilenc"]
KEREK_TIZES = ["", "tíz", "húsz", "harminc", "negyven", "ötven", "hatvan", "hetven", "nyolcvan", "kilencven"]
TIZES_ELOTAG = ["", "tizen", "huszon", "harminc", "negyven", "ötven", "hatvan", "hetven", "nyolcvan", "kilencven"]
CSOPORTOK = ["", "ezer", "millió", "milliárd"]
HATAR = 10**12


def egyes(szamjegy, elotag):
    """Egy számjegy; előtagként (száz, ezer, millió előtt) a kettőből két lesz."""
    if szamjegy == 2 and elotag:
        return "két"
    return EGYES[szamjegy]


def harom_jegy(n, elso, elotag):
    """Egy 1 és 999 közötti számcsoport. elso: ezzel kezdődik a szám; elotag: szorzó (ezer, millió…) követi."""
    szazas, maradek = divmod(n, 100)
    tizes, egy = divmod(maradek, 10)
    szo = ""
    if szazas:
        szo += ("" if szazas == 1 and elso else egyes(szazas, True)) + "száz"
    if tizes:
        szo += (KEREK_TIZES if egy == 0 else TIZES_ELOTAG)[tizes]
    if egy:
        szo += egyes(egy, elotag)
    return szo


def betuvel(n):
    """Az n egész szám betűvel. Más típusra TypeError, a határon túl ValueError."""
    if isinstance(n, bool) or not isinstance(n, int):
        raise TypeError(f"egész számot várok, ezt kaptam: {n!r}")
    if not -HATAR < n < HATAR:
        raise ValueError(f"a szám túl nagy: {n}")
    if n == 0:
        return "nulla"
    if n < 0:
        return "mínusz " + betuvel(-n)

    csoportok = []
    maradek = n
    while maradek:
        maradek, csoport = divmod(maradek, 1000)
        csoportok.append(csoport)

    szavak = []
    for helyiertek in range(len(csoportok) - 1, -1, -1):
        csoport = csoportok[helyiertek]
        if csoport == 0:
            continue
        elso = not szavak
        if csoport == 1 and helyiertek == 1 and elso:
            szavak.append("ezer")
        else:
            szavak.append(harom_jegy(csoport, elso, helyiertek > 0) + CSOPORTOK[helyiertek])

    return ("-" if n > 2000 else "").join(szavak)


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        print(betuvel(int(arg)))
