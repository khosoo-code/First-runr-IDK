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

// The unit line rises letter by letter.
whoosh(H['100гр тутамд'], { pre: 0.3, post: 0.25, from: 300, to: 1800, gain: 0.16, panFrom: -0.3, panTo: 0.3 });
// The tag draws itself; the hole punches; the string loops out.
scribble(H.tag - 0.3, 0.6, 0.04, 0);
pop(H.tag + 0.24, 0.1, -0.4);
// ₮ springs in, the price counts up and lands.
thump(H['₮270'], 0.36);
pop(H['₮270'] + 0.03, 0.09, 0);
for (let i = 0; i < 9; i++) tick(H['₮270'] - 0.1 + i * 0.05 * (1 + i * 0.1), 0.04, 0.2, 3200);
click(H.count + 0.2, 0.16);
// The tag swings down and drops away.
whoosh(H.out + 0.2, { pre: 0.32, post: 0.3, from: 1400, to: 300, gain: 0.4, panFrom: 0, panTo: 0 });

master(path.join(dir, 'out'));
