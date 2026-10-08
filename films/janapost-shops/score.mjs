// Synthesizes this overlay's sound effects on its beat grid (see ../shared/sfx.mjs) and writes
// out/mix.wav at -14 LUFS. Effects only, to sit under the voice-over: no music, no tuned notes.
//
//   node films/janapost-shops/score.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mixer } from '../shared/sfx.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const beats = JSON.parse(readFileSync(path.join(dir, 'beats.json'), 'utf8'));
const H = Object.fromEntries(beats.hits.map((h) => [h.name, h.t]));
const { thump, whoosh, tick, click, pop, scribble, master } = mixer(beats);

// 1. «Жанапостоор захиалахад / шал өөр байсан!»
pop(H['жана пост'] - 0.06, 0.16, -0.2);
whoosh(H['захиалсан'] - 0.02, { pre: 0.2, post: 0.25, from: 900, to: 3600, gain: 0.2, panFrom: -0.4, panTo: 0.3 });
thump(H['шал өөр'] - 0.04, 0.5);
pop(H['шал өөр'] + 0.12, 0.1, 0.3);
whoosh(H['байсан'] - 0.12, { pre: 0.18, post: 0.2, from: 1400, to: 4200, gain: 0.18, panFrom: 0, panTo: 0 });
whoosh(H.poizon - 0.2, { pre: 0.1, post: 0.15, from: 3000, to: 900, gain: 0.14, panFrom: 0, panTo: 0 });

// 2. One card per shop; the product draws in on its word.
for (const [shop, item, p] of [['poizon', 'гутал', -0.6], ['pinduoduo', 'хувцас', 0], ['taobao', 'гэр ахуй', 0.6]]) {
  thump(H[shop] + 0.02, 0.32);
  pop(H[shop] + 0.06, 0.12, p);
  pop(H[item] - 0.04, 0.12, p);
  scribble(H[item] - 0.06, 0.6, 0.04, p);
}
for (let i = 0; i < 3; i++) tick(H['бүтээгдэхүүн'] + 0.08 + i * 0.05, 0.06, -0.6 + i * 0.6, 3000);

// 3. «амархан»: three checks; «захиалчихсан»: the cards fly off and the green pill lands.
for (let i = 0; i < 3; i++) click(H['амархан'] + i * 0.09, 0.12);
whoosh(H['захиалчихсан'] + 0.1, { pre: 0.2, post: 0.3, from: 400, to: 2600, gain: 0.32, panFrom: -0.3, panTo: 0.3 });
thump(H['захиалчихсан'] + 0.2, 0.55);
pop(H['захиалчихсан'] + 0.34, 0.12, 0);

master(path.join(dir, 'out'));
