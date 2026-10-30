#!/usr/bin/env node
/* expected.json: the slow original's answers on the benchmark texts. Run only with the original gyakori.ts. */
import { writeFileSync } from 'node:fs';
import { gyakoriSzavak } from './gyakori.ts';
import { szoveg } from './szoveg.mjs';

const rows = [11, 12, 13].map((mag) => ({ mag, top: gyakoriSzavak(szoveg({ mag }), 10) }));
writeFileSync(new URL('./expected.json', import.meta.url), `[\n${rows.map((r) => `  ${JSON.stringify(r)}`).join(',\n')}\n]\n`);
console.log('expected.json written');
