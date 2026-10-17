// Synthesizes this overlay's sound effects on its beat grid (see ../shared/sfx.mjs) and writes
// out/mix.wav at -14 LUFS. Effects only, to sit under the voice-over: no music, no tuned notes.
// Kept soft and airy for the luxury register: long swells, low hits, a pencil on the rule.
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

// The three ribbons wipe in from the left.
whoosh(H['танд'] + 0.1, { pre: 0.3, post: 0.4, from: 300, to: 1800, q: 0.55, gain: 0.4, panFrom: -0.8, panTo: -0.1 });
thump(H['илүү'] - 0.02, 0.35);
whoosh(H['орон зай'] - 0.05, { pre: 0.22, post: 0.3, from: 400, to: 2200, gain: 0.26, panFrom: -0.6, panTo: 0.1 });
// «зай»: the letters spread apart on a long, opening swell.
whoosh(H['зай'] + 0.35, { pre: 0.45, post: 0.5, from: 250, to: 3200, q: 0.5, gain: 0.3, panFrom: -0.4, panTo: 0.6 });
// Word swaps.
for (const name of ['тав тух', 'үнэ цэнэ', 'энэ хаус']) {
  whoosh(H[name] - 0.02, { pre: 0.2, post: 0.25, from: 900, to: 3400, gain: 0.18, panFrom: -0.3, panTo: 0.3 });
}
thump(H['тав тух'], 0.3);
tick(H['хэрэгтэй'] - 0.1, 0.06, -0.5, 3000);
tick(H['хэрэгтэй'] + 0.26, 0.05, -0.4, 2600);
thump(H['энэ хаус'] + 0.02, 0.4);
tick(H['танд 2'] - 0.1, 0.05, 0.2, 2800);
// «яг тохирно.»: a low landing and the gold rule drawn on.
whoosh(H['яг'] - 0.04, { pre: 0.22, post: 0.3, from: 500, to: 2600, gain: 0.2, panFrom: -0.4, panTo: 0.2 });
thump(H['тохирно'] - 0.02, 0.55);
scribble(H['тохирно'] + 0.22, 0.7, 0.04, 0.1);

master(path.join(dir, 'out'));
