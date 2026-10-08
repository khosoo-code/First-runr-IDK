// Synthesizes this film's sound effects on its beat grid (see ../shared/sfx.mjs) and writes
// out/mix.wav at -14 LUFS. Effects only, to sit under the voice-over: no music, no tuned notes.
//
//   node films/janapost-track/score.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ease, prog } from '../shared/motion.js';
import { mixer } from '../shared/sfx.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const beats = JSON.parse(readFileSync(path.join(dir, 'beats.json'), 'utf8'));
const H = Object.fromEntries(beats.hits.map((h) => [h.name, h.t]));
const { thump, whoosh, tick, click, pop, scribble, master } = mixer(beats);

// 1. The app: phone rises, orders land, the map opens, the dot drops, tracking, waiting.
whoosh(0.3, { pre: 0.3, post: 0.4, from: 200, to: 1500, q: 0.6, gain: 0.5, panFrom: 0, panTo: 0 });
thump(0.34, 0.4);
for (let i = 0; i < 3; i++) tick(H['захиалгуудаа'] - 0.1 + i * 0.1, 0.07, -0.3 + i * 0.3, 2900);
pop(H['апп'] - 0.02, 0.14, -0.3);
whoosh(H['дээрээсээ'] + 0.05, { pre: 0.18, post: 0.2, from: 900, to: 3600, gain: 0.16, panFrom: -0.2, panTo: 0.4 });
// Tracking: the highlight lands on «хаана» with its bubble, steps down a status on «явааг»
// and «хянаад» (each passed status checks off), and the parcel chip pops on «Замд яваа».
whoosh(H['хаана'] - 0.04, { pre: 0.2, post: 0.25, from: 1200, to: 3600, gain: 0.2, panFrom: -0.5, panTo: 0 });
pop(H['хаана'] + 0.06, 0.13, -0.5);
for (const name of ['явааг', 'хянаад']) {
  tick(H[name] - 0.02, 0.08, 0.1, 3000);
  pop(H[name] + 0.08, 0.12, 0.4);
}
pop(H['хянаад'] + 0.16, 0.15, 0.3);
// Waiting: a clock ticking under «хүлээж байсан».
for (let i = 0; i < 6; i++) tick(H['хүлээж'] + 0.05 + i * 0.25, i % 2 ? 0.05 : 0.07, i % 2 ? 0.25 : -0.25, i % 2 ? 2300 : 2700);
whoosh(H['бусдыг'] + 0.25, { pre: 0.35, post: 0.4, from: 300, to: 1200, q: 0.5, gain: 0.22, panFrom: 0, panTo: 0 });

// 2. «Харин Jana Post»: green floods out, the logo lands.
whoosh(H['харин'] + 0.2, { pre: 0.45, post: 0.5, from: 180, to: 2600, q: 0.55, gain: 0.6, panFrom: -0.5, panTo: 0.5 });
thump(H['jana post'] + 0.02, 0.62);
pop(H['jana post'] + 0.08, 0.1, 0.3); // the accent drops over N

// 3. The route: logo flies onto the parcel at the warehouse, the parcel rides to the branch.
whoosh(H['өөрсдөө'] + 0.24, { pre: 0.28, post: 0.3, from: 2600, to: 600, gain: 0.34, panFrom: 0.3, panTo: -0.4 });
pop(H['өөрсдөө'] + 0.4, 0.16, -0.2);
pop(H['хятадын'] + 0.14, 0.14, -0.5);
scribble(H['агуулахаас'] - 0.2, 0.8, 0.045, -0.5);
whoosh(H['аваад'] + 0.5, { pre: 0.55, post: 0.5, from: 300, to: 1800, q: 0.6, gain: 0.34, panFrom: -0.5, panTo: 0.5 });
whoosh(H['аваад'] + 1.45, { pre: 0.4, post: 0.4, from: 1600, to: 500, q: 0.6, gain: 0.24, panFrom: 0.5, panTo: 0 });
pop(H['гэрт'] - 0.08, 0.15, 0.5);
// Radar from home: a pop for each pin as the first ring passes it (same curve as the picture).
const RING = { t0: H['хамгийн'] - 0.1, dur: 1.2, max: 520 };
const HOME = { x: 880, y: 1150 };
for (const [b, gain] of [[{ x: 600, y: 1290 }, 0.13], [{ x: 990, y: 700 }, 0.08], [{ x: 250, y: 1300 }, 0.07]]) {
  const d = Math.hypot(b.x - HOME.x, b.y - HOME.y);
  let at = RING.t0 + RING.dur;
  for (let s = RING.t0; s < RING.t0 + RING.dur; s += 1 / 240) {
    if (RING.max * ease.out(prog(s, RING.t0, RING.dur)) >= d) {
      at = s;
      break;
    }
  }
  pop(at, gain, (b.x - 540) / 540);
}
whoosh(H['хамгийн'] + 0.1, { pre: 0.12, post: 0.7, from: 3000, to: 900, q: 0.9, gain: 0.18, panFrom: 0.4, panTo: 0.4 });
click(H['ойр'] - 0.04, 0.12);
pop(H['салбарт'] - 0.04, 0.16, 0.1);
whoosh(H['салбарт'] + 0.3, { pre: 0.18, post: 0.2, from: 1200, to: 4000, gain: 0.14, panFrom: -0.3, panTo: 0.3 });
// Arrival: the parcel sets down and the check stamps on «ирсэн».
thump(H['ирсэн'] - 0.02, 0.55);
click(H['ирсэн'] + 0.02, 0.15);

master(path.join(dir, 'out'));
