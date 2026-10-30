/* A szöveg n leggyakoribb szava, gyakoriság szerint csökkenő sorrendben; egyenlő gyakoriságnál ábécérendben. */
export function gyakoriSzavak(szoveg: string, n = 10): Array<[string, number]> {
  const szavak = szoveg.toLowerCase().split(/[^\p{L}]+/u).filter((s) => s.length > 0);
  const szamlalo: Array<[string, number]> = [];
  for (const szo of szavak) {
    const meglevo = szamlalo.find(([s]) => s === szo);
    if (meglevo) meglevo[1]++;
    else szamlalo.push([szo, 1]);
  }
  szamlalo.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'hu'));
  return szamlalo.slice(0, n);
}
