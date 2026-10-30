/* A benchmark text: made-up Hungarian-looking words with a Zipf distribution, the same every time (seeded). */
const SYLLABLES = ['a', 'e', 'i', 'o', 'ö', 'ka', 'ke', 'ki', 'ko', 'lo', 'mé', 'sze', 'rö', 'tű', 'gyá', 'ál', 'ít', 'ő', 'nyo', 'ba', 'ja', 'zsé', 'cso', 'fü', 'ho', 've', 'pi', 'tor', 'ség', 'nak', 'ben', 'ről', 'hoz', 'ból', 'ért', 'val', 'ság', 'ló', 'ny', 'gy', 'ű', 'ú'];
const PUNCTUATION = [', ', ', ', ' – ', '; '];

function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeText({ words = 200_000, vocabulary = 20_000, seed = 5 } = {}) {
  const r = random(seed);
  const set = new Set();
  while (set.size < vocabulary) {
    let word = '';
    const length = 1 + Math.floor(r() * 4);
    for (let i = 0; i < length; i++) word += SYLLABLES[Math.floor(r() * SYLLABLES.length)];
    set.add(word);
  }
  const list = [...set];
  const weights = [];
  let total = 0;
  for (let i = 0; i < list.length; i++) weights.push((total += 1 / (i + 1)));
  const pick = () => {
    const x = r() * total;
    let lo = 0, hi = weights.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (weights[m] < x) lo = m + 1; else hi = m; }
    return list[lo];
  };
  const parts = [];
  let sentenceStart = true;
  for (let i = 0; i < words; i++) {
    let word = pick();
    if (sentenceStart) word = word[0].toUpperCase() + word.slice(1);
    else if (r() < 0.03) word = word.toUpperCase();
    parts.push(word);
    const v = r();
    if (v < 0.07) { parts.push('. '); sentenceStart = true; }
    else { parts.push(v < 0.12 ? PUNCTUATION[Math.floor(r() * PUNCTUATION.length)] : ' '); sentenceStart = false; }
  }
  return parts.join('');
}
