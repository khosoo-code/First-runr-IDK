// Synthesizes this overlay's sound effects on its beat grid (see ../shared/sfx.mjs) and writes
// out/mix.wav at -14 LUFS. Effects only, to sit under the voice-over, kept soft for the luxury
// register: an airy swish as each line wipes in, low hits under the big lines, a pencil on the
// gold hairlines, and a swell as board A clears for board B.
//
//   node films/khantugul-house/score.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mixer } from '../shared/sfx.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const beats = JSON.parse(readFileSync(path.join(dir, 'beats.json'), 'utf8'));
const H = Object.fromEntries(beats.hits.map((h) => [h.name, h.t]));
const { thump, whoosh, tick, scribble, master } = mixer(beats);

const LEAD = 0.12; // words start their wipe this long before the syllable (film.js)
const swish = (t, gain, p = 0) => whoosh(t, { pre: 0.22, post: 0.3, from: 900, to: 3800, gain, panFrom: p - 0.4, panTo: p + 0.4 });

// Board A
swish(H['танд'] - LEAD + 0.15, 0.22, -0.2);
for (const w of ['танд', 'илүү', 'их']) tick(H[w] - 0.02, 0.05, -0.3, 3000);
thump(H['орон'] - 0.04, 0.45);
swish(H['орон'] + 0.1, 0.24);
scribble(H['зай'] + 0.15, 0.7, 0.035, 0);
swish(H['тав'] + 0.1, 0.18, 0.2);
tick(H['үнэ'] - 0.02, 0.06, 0.3, 2800);
swish(H['хэрэгтэй'] + 0.1, 0.14, -0.2);
// Board A clears for B
whoosh(H['энэ'] - 0.25, { pre: 0.25, post: 0.3, from: 3200, to: 700, gain: 0.26, panFrom: -0.5, panTo: 0.5 });
// Board B
thump(H['энэ'] - 0.04, 0.45);
thump(H['хаус'] - 0.04, 0.35);
tick(H['танд 2'] - 0.02, 0.06, 0, 3000);
thump(H['яг'] - 0.04, 0.35);
thump(H['тохирно'] - 0.04, 0.6);
swish(H['тохирно'] + 0.1, 0.24, 0.1);
scribble(H['тохирно'] + 0.3, 0.7, 0.035, 0);

master(path.join(dir, 'out'));
