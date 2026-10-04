// Synthesizes this film's sound effects on its beat grid (see ../shared/sfx.mjs) and writes
// out/mix.wav at -14 LUFS. Effects only: no music, no tuned notes.
//
//   node films/khantugul-q2/score.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ease, lerp, prog } from '../shared/motion.js';
import { mixer } from '../shared/sfx.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const beats = JSON.parse(readFileSync(path.join(dir, 'beats.json'), 'utf8'));
const H = Object.fromEntries(beats.hits.map((h) => [h.name, h.t]));
const LEAVE = beats.duration - 0.42;
const { thump, whoosh, tick, click, pop, scribble, master } = mixer(beats);

// Hook
whoosh(H['асуулт'], { pre: 0.45, post: 0.5, from: 300, to: 1600, gain: 0.5, panFrom: 0.4, panTo: -0.2 });
thump(H['асуулт'] + 0.02, 0.55);
whoosh(H['сөх'] + 0.08, { pre: 0.3, post: 0.35, from: 500, to: 2600, gain: 0.32, panFrom: -0.2, panTo: 0.5 });
// СӨХ + хэрэглээний зардал
whoosh(H['сөх'] + 0.28, { pre: 0.22, post: 0.25, from: 900, to: 3600, gain: 0.16, panFrom: -0.3, panTo: -0.1 });
pop(H['болон'] + 0.04, 0.16, 0);
whoosh(H['хэрэглээний'] + 0.02, { pre: 0.22, post: 0.25, from: 900, to: 3600, gain: 0.16, panFrom: 0.1, panTo: 0.3 });
// The doors open onto one single house, which draws itself.
whoosh(H['нэг'] - 0.12, { pre: 0.3, post: 0.5, from: 200, to: 1500, q: 0.5, gain: 0.5, panFrom: -0.4, panTo: 0.4 });
thump(H['нэг'] + 0.02, 0.5);
scribble(H['нэг'] + 0.05, 1.3, 0.06, 0);
// About how much a month
whoosh(H['ойролцоогоор'] + 0.12, { pre: 0.2, post: 0.3, from: 1500, to: 4500, gain: 0.12, panFrom: -0.3, panTo: 0.3 });
whoosh(H['сарын'] + 0.1, { pre: 0.25, post: 0.3, from: 600, to: 2400, gain: 0.22, panFrom: 0.3, panTo: -0.3 });
thump(H['800 мянга'] + 0.02, 0.5);
pop(H['800 мянга'] - 0.04, 0.1, -0.4);
{
  // One tick per hundred as the count runs 0 → 800 (same curve as the picture).
  let last = 0;
  for (let t = H['800 мянга'] - 0.06; t < H['800 мянга'] + 0.6; t += 0.001) {
    const n = Math.floor(Math.round(lerp(0, 800, ease.outSoft(prog(t, H['800 мянга'] - 0.06, 0.55))) / 10) / 10);
    if (n !== last) tick(t, 0.11, lerp(-0.5, 0.2, n / 8), 2800 + n * 70);
    last = n;
  }
}
pop(H['1 сая'] - 0.02, 0.1, 0.2);
click(H['1 сая'] + 0.5, 0.3);
// "хооронд": the band between the thumbs fills.
whoosh(H['хооронд'] + 0.2, { pre: 0.25, post: 0.35, from: 1200, to: 4200, gain: 0.16, panFrom: -0.4, panTo: 0.4 });
tick(H['хооронд'] + 0.48, 0.12, 0.2, 2400);
// Clear the stage for the cut into Q3.
whoosh(LEAVE + 0.2, { pre: 0.3, post: 0.2, from: 700, to: 2400, gain: 0.26, panFrom: 0.3, panTo: -0.3 });

master(path.join(dir, 'out'));
