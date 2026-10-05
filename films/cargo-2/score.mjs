// Synthesizes this clip's sound effects on its beat grid (see ../shared/sfx.mjs) and writes
// out/mix.wav at -14 LUFS. Effects only: no music, no tuned notes.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mixer } from '../shared/sfx.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const beats = JSON.parse(readFileSync(path.join(dir, 'beats.json'), 'utf8'));
const H = Object.fromEntries(beats.hits.map((h) => [h.name, h.t]));
const { thump, whoosh, tick, click, pop, scribble, master } = mixer(beats);

// The numbers rise and count; their words slide in.
for (const [n, w] of [['21', 'аймгийн'], ['330', 'суманд']]) {
  thump(H[n], 0.45);
  for (let i = 0; i < 8; i++) tick(H[n] - 0.2 + i * 0.06 * (1 + i * 0.12), 0.04, -0.2, 3200);
  whoosh(H[w], { pre: 0.22, post: 0.2, from: 900, to: 3600, gain: 0.18, panFrom: -0.5, panTo: 0.2 });
}
// ХҮРГЭНЭ letter by letter, then the dashed route draws out to the pin.
[0, 1, 2, 3, 4, 5, 6].forEach((i) => pop(H['хүргэнэ'] - 0.1 + i * 0.035, 0.05, -0.5 + i * 0.15));
thump(H['хүргэнэ'] + 0.12, 0.35);
for (let i = 0; i < 10; i++) tick(H.route - 0.34 + i * 0.06, 0.035, -0.6 + i * 0.13, 2600);
pop(H.route + 0.22, 0.14, 0.5);
// Everything slides out to the left.
whoosh(H.out + 0.2, { pre: 0.3, post: 0.25, from: 600, to: 2800, gain: 0.4, panFrom: 0, panTo: -0.7 });

master(path.join(dir, 'out'));
