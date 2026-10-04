// Synthesizes this film's sound effects on its beat grid (see ../shared/sfx.mjs) and writes
// out/mix.wav at -14 LUFS. Effects only: no music, no tuned notes.
//
//   node films/khantugul-q1/score.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mixer } from '../shared/sfx.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const beats = JSON.parse(readFileSync(path.join(dir, 'beats.json'), 'utf8'));
const H = Object.fromEntries(beats.hits.map((h) => [h.name, h.t]));
const LEAVE = beats.duration - 0.36;
const { thump, whoosh, tick, click, pop, scribble, master } = mixer(beats);

// Hook
whoosh(H['асуулт'] + 0.04, { pre: 0.32, post: 0.45, from: 300, to: 1600, gain: 0.5, panFrom: 0.4, panTo: -0.2 });
thump(H['асуулт'] + 0.02, 0.5);
// The landscape draws itself; the pin drops on "Нүхтийн аманд".
scribble(H['нүхтийн аманд'] + 0.24, 1.4, 0.06, 0);
thump(H['нүхтийн аманд'] + 0.56, 0.42);
pop(H['нүхтийн аманд'] + 0.6, 0.12, 0.3);
// The grove rises on "байгальтайгаа ойр".
[0, 1, 2, 3, 4, 5].forEach((i) => pop(H['байгальтайгаа ойр'] + 0.02 + i * 0.07, 0.05, -0.5 + i * 0.2));
// "уулын бэлд": dots trace the foot of the mountain.
for (let i = 0; i < 15; i += 2) tick(H['уулын бэлд'] - 0.06 + i * 0.035, 0.05, -0.6 + i * 0.07, 3400);
// "байрлаж": the pin pings.
pop(H['байрлаж'], 0.12, 0.3);
// "хэдий ч": the panel rises; "төвийн шугамдаа": three lines connect the house to the city.
whoosh(H['хэдий ч'] + 0.15, { pre: 0.35, post: 0.5, from: 200, to: 1500, q: 0.5, gain: 0.45, panFrom: -0.3, panTo: 0.3 });
[0, 1, 2].forEach((i) => {
  const at = H['төвийн'] + 0.02 + i * 0.2;
  whoosh(at + 0.4, { pre: 0.32, post: 0.18, from: 1200, to: 5000, gain: 0.12, panFrom: -0.6, panTo: 0.6 });
  pop(at + 0.28, 0.08, -0.1 + i * 0.1);
  tick(at + 0.62, 0.1, 0.5, 2600 + i * 300);
});
// "бүрэн": fully connected; "холбогдсон": both ends check.
thump(H['бүрэн'] + 0.02, 0.45);
click(H['холбогдсон'] + 0.06, 0.16);
// Clear the stage for the cut into Q2.
whoosh(LEAVE + 0.16, { pre: 0.26, post: 0.16, from: 700, to: 2400, gain: 0.26, panFrom: 0.3, panTo: -0.3 });

master(path.join(dir, 'out'));
