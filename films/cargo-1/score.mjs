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

// ХУРДАН whips in from the left.
whoosh(H['хурдан'], { pre: 0.28, post: 0.3, from: 400, to: 3000, gain: 0.35, panFrom: -0.7, panTo: 0 });
thump(H['хурдан'] + 0.02, 0.5);
// НАЙДВАРТАЙ drops and its frame draws shut.
thump(H['найдвартай'], 0.4);
scribble(H.frame - 0.22, 0.5, 0.05, 0);
click(H.frame + 0.28, 0.16);
// ХЯМД pops; ТЭЭВЭР rises onto its underline.
pop(H['хямд'], 0.16, 0);
thump(H['хямд'] + 0.01, 0.35);
tick(H['тээвэр'] + 0.43, 0.08, 0.2, 3000);
// Everything whips out to the right.
whoosh(H.out + 0.2, { pre: 0.3, post: 0.25, from: 600, to: 2800, gain: 0.4, panFrom: 0, panTo: 0.7 });

master(path.join(dir, 'out'));
