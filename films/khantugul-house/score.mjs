// Synthesizes this overlay's sound effects on its beat grid (see ../shared/sfx.mjs) and writes
// out/mix.wav at -14 LUFS. Effects only, to sit under the voice-over: a pop for every word as
// it lands, a low hit under each key word, a swish on each phrase cut, and the sticker clicks.
//
//   node films/khantugul-house/score.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mixer } from '../shared/sfx.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const beats = JSON.parse(readFileSync(path.join(dir, 'beats.json'), 'utf8'));
const H = Object.fromEntries(beats.hits.map((h) => [h.name, h.t]));
const { thump, whoosh, pop, click, master } = mixer(beats);

const POP = 0.04; // words pop this long before their syllable (film.js)
// Words as they pop (зай rides with орон); key words get a low hit too.
const WORDS = ['танд', 'илүү', 'их', 'орон', 'тав', 'тух', 'үнэ', 'цэнэ', 'хэрэгтэй', 'байгаа', 'бол', 'энэ', 'хаус', 'танд 2', 'яг', 'тохирно'];
const KEYS = ['орон', 'үнэ', 'хэрэгтэй', 'хаус', 'тохирно'];
WORDS.forEach((w, i) => pop(H[w] - POP, KEYS.includes(w) ? 0.15 : 0.1, ((i % 3) - 1) * 0.35));
for (const w of KEYS) thump(H[w] - POP, w === 'тохирно' ? 0.6 : 0.38);
// Phrase cuts: a short swish into each new page.
for (const w of ['тав', 'хэрэгтэй', 'энэ', 'яг']) {
  whoosh(H[w] - POP, { pre: 0.12, post: 0.14, from: 1500, to: 4500, gain: 0.2, panFrom: -0.4, panTo: 0.4 });
}
// Stickers: the house on «хаус», the check on «тохирно».
click(H['хаус'] + 0.1, 0.12);
click(H['тохирно'] + 0.32, 0.15);

master(path.join(dir, 'out'));
