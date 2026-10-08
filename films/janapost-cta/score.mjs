// Synthesizes this overlay's sound effects on its beat grid (see ../shared/sfx.mjs) and writes
// out/mix.wav at -14 LUFS. Effects only, to sit under the voice-over: no music, no tuned notes.
//
//   node films/janapost-cta/score.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mixer } from '../shared/sfx.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const beats = JSON.parse(readFileSync(path.join(dir, 'beats.json'), 'utf8'));
const H = Object.fromEntries(beats.hits.map((h) => [h.name, h.t]));
const { thump, whoosh, tick, click, pop, master } = mixer(beats);

// 1. Benefits: a fast swipe in, a second rush on «хурдан», a stamp, a bounce.
whoosh(0.12, { pre: 0.12, post: 0.3, from: 2400, to: 700, gain: 0.4, panFrom: -0.7, panTo: 0 });
whoosh(H['хурдан'] + 0.05, { pre: 0.15, post: 0.25, from: 800, to: 4200, gain: 0.26, panFrom: -0.6, panTo: 0.2 });
pop(H['хурдан'], 0.12, -0.1);
thump(H['найдвартай'] - 0.04, 0.5);
click(H['найдвартай'] + 0.04, 0.12);
pop(H['толгой'] - 0.08, 0.14, 0.2);
pop(H['өвдөхгүй'] - 0.02, 0.11, 0.3);
whoosh(H['захиалъя'] - 0.3, { pre: 0.12, post: 0.18, from: 3200, to: 900, gain: 0.16, panFrom: 0, panTo: 0 });

// 2. Download: the pill, the app icon, the button, the progress ring and the check.
pop(H['захиалъя'] - 0.06, 0.15, 0);
thump(H['jana post'] - 0.06, 0.5);
pop(H['jana post'] + 0.04, 0.1, 0);
whoosh(H['татаад'] + 0.1, { pre: 0.2, post: 0.25, from: 600, to: 2800, gain: 0.26, panFrom: -0.3, panTo: 0.5 });
for (let i = 0; i < 8; i++) tick(H['аваарай'] + i * 0.09, 0.05, -0.5 + i * 0.14, 2800 + i * 120);
thump(H['аваарай'] + 0.74, 0.45);
click(H['аваарай'] + 0.78, 0.15);

master(path.join(dir, 'out'));
