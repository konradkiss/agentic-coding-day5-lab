/* The n most frequent words of a text, most frequent first; equal counts in alphabetical order. */
export function topWords(text: string, n = 10): Array<[string, number]> {
  const words = text.toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length > 0);
  const counts: Array<[string, number]> = [];
  for (const word of words) {
    const seen = counts.find(([w]) => w === word);
    if (seen) seen[1]++;
    else counts.push([word, 1]);
  }
  counts.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'hu'));
  return counts.slice(0, n);
}
