/* The n most frequent words of a text, most frequent first; equal counts in alphabetical order. */
const COLLATOR = new Intl.Collator('hu');
const LETTER = /\p{L}/u;

export function topWords(text: string, n = 10): Array<[string, number]> {
  const lower = text.toLowerCase();
  const counts = new Map<string, number>();
  let start = -1;
  for (let i = 0; i <= lower.length; i++) {
    const code = i < lower.length ? lower.charCodeAt(i) : 32;
    // ASCII letters quickly; everything else (accented, other scripts, surrogate pairs) through the regex
    const letter = code < 128 ? (code >= 97 && code <= 122) || (code >= 65 && code <= 90) : LETTER.test(String.fromCodePoint(lower.codePointAt(i)!));
    if (letter) {
      if (start < 0) start = i;
      if (code >= 0xd800 && code <= 0xdbff) i++;
    } else if (start >= 0) {
      const word = lower.slice(start, i);
      counts.set(word, (counts.get(word) ?? 0) + 1);
      start = -1;
    }
  }
  return [...counts].sort((a, b) => b[1] - a[1] || COLLATOR.compare(a[0], b[0])).slice(0, n);
}
