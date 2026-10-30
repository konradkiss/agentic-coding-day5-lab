/* The n most frequent words of a text, most frequent first; equal counts in alphabetical order. */
export function topWords(text: string, n = 10): Array<[string, number]> {
  const words = text.toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length > 0);
  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'hu'))
    .slice(0, n);
}
