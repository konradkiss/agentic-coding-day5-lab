/* A benchmark text: made-up Hungarian-looking words with a Zipf distribution, the same every time (seeded). */
const SZOTAGOK = ['a', 'e', 'i', 'o', 'ö', 'ka', 'ke', 'ki', 'ko', 'lo', 'mé', 'sze', 'rö', 'tű', 'gyá', 'ál', 'ít', 'ő', 'nyo', 'ba', 'ja', 'zsé', 'cso', 'fü', 'ho', 've', 'pi', 'tor', 'ség', 'nak', 'ben', 'ről', 'hoz', 'ból', 'ért', 'val', 'ság', 'ló', 'ny', 'gy', 'ű', 'ú'];
const ESZKOZ = [', ', ', ', ' – ', '; '];

function sorsolo(mag) {
  let s = mag >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function szoveg({ szavak = 200_000, szokincs = 20_000, mag = 5 } = {}) {
  const r = sorsolo(mag);
  const lista = new Set();
  while (lista.size < szokincs) {
    let szo = '';
    const hossz = 1 + Math.floor(r() * 4);
    for (let i = 0; i < hossz; i++) szo += SZOTAGOK[Math.floor(r() * SZOTAGOK.length)];
    lista.add(szo);
  }
  const szok = [...lista];
  const suly = [];
  let osszeg = 0;
  for (let i = 0; i < szok.length; i++) suly.push((osszeg += 1 / (i + 1)));
  const valaszt = () => {
    const x = r() * osszeg;
    let lo = 0, hi = suly.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (suly[m] < x) lo = m + 1; else hi = m; }
    return szok[lo];
  };
  const reszek = [];
  let mondatEleje = true;
  for (let i = 0; i < szavak; i++) {
    let szo = valaszt();
    if (mondatEleje) szo = szo[0].toUpperCase() + szo.slice(1);
    else if (r() < 0.03) szo = szo.toUpperCase();
    reszek.push(szo);
    const v = r();
    if (v < 0.07) { reszek.push('. '); mondatEleje = true; }
    else { reszek.push(v < 0.12 ? ESZKOZ[Math.floor(r() * ESZKOZ.length)] : ' '); mondatEleje = false; }
  }
  return reszek.join('');
}
