// Synthesizes this film's sound effects on its beat grid (see ../shared/sfx.mjs) and writes
// out/mix.wav at -14 LUFS.
//
//   node films/khantugul-q3/score.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ease, lerp, prog } from '../shared/motion.js';
import { mixer } from '../shared/sfx.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const beats = JSON.parse(readFileSync(path.join(dir, 'beats.json'), 'utf8'));
const H = Object.fromEntries(beats.hits.map((h) => [h.name, h.t]));
const { thump, whoosh, tick, click, pop, scribble, master } = mixer(beats);

// Hook
whoosh(H['асуулт'], { pre: 0.45, post: 0.5, from: 300, to: 1600, gain: 0.5, panFrom: 0.4, panTo: -0.2 });
thump(H['асуулт'] + 0.02, 0.55);
whoosh(H.options + 0.2, { pre: 0.3, post: 0.35, from: 500, to: 2600, gain: 0.32, panFrom: -0.2, panTo: 0.5 });
// Three ways to pay
for (const name of ['хувь лизинг', 'бартер', 'банкны зээл']) {
  whoosh(H[name] - 0.02, { pre: 0.22, post: 0.25, from: 900, to: 3600, gain: 0.16, panFrom: 0, panTo: 0 });
}
whoosh(H['төлбөрийн'], { pre: 0.28, post: 0.4, from: 400, to: 2200, gain: 0.26 });
// In-house leasing
whoosh(H['урьдчилгаа'] + 0.25, { pre: 0.45, post: 0.6, from: 180, to: 1400, q: 0.5, gain: 0.55, panFrom: -0.3, panTo: 0.3 });
thump(H['30%'], 0.6);
whoosh(H['үлдэгдэл'] + 0.1, { pre: 0.25, post: 0.3, from: 1200, to: 4200, gain: 0.14, panFrom: -0.5, panTo: 0.5 });
for (let g = 0; g < 5; g++) tick(H['6 сар'] - 0.14 + g * 0.06 + 0.12, 0.09, -0.4 + g * 0.2);
thump(H['хүүгүй'], 0.5);
click(H['18 сар'] + 0.2, 0.3);
{
  // One tick per number as the count runs 6 → 18 (same curve as the picture).
  let last = 6;
  for (let t = H['18 сар'] - 0.04; t < H['18 сар'] + 0.9; t += 0.001) {
    const n = Math.round(lerp(6, 18, ease.outSoft(prog(t, H['18 сар'] - 0.04, 0.9))));
    if (n !== last) tick(t, 0.11, lerp(-0.5, 0.5, (n - 6) / 12), 2800 + (n - 6) * 60);
    last = n;
  }
}
thump(H['1.6%'], 0.55);
// Barter
whoosh(H['мөн дээрээс нь'] + 0.35, { pre: 0.5, post: 0.6, from: 220, to: 2000, q: 0.55, gain: 0.5, panFrom: 0.6, panTo: -0.6 });
thump(H['мөн дээрээс нь'] + 0.82, 0.28);
thump(H['30% бартер'], 0.6);
pop(H['гэрчилгээтэй'] + 0.12, 0.16, -0.35);
pop(H['гэрчилгээтэй'] + 0.22, 0.14, 0.35);
scribble(H['автомашин'] - 0.16, 1.0, 0.05, -0.35);
scribble(H['үл хөдлөх'] - 0.16, 1.0, 0.05, 0.35);
whoosh(H['бартерт'] + 0.4, { pre: 0.45, post: 0.45, from: 600, to: 3000, gain: 0.34, panFrom: 0.5, panTo: -0.4 });
tick(H['бартерт'] + 0.86, 0.14, -0.3, 2400);
// Resolve on "боломжтой."
thump(H['боломжтой'], 0.5);

master(path.join(dir, 'out'));
