// Builds beats.json, the hit grid both the picture and the sound sync to.
// The voice-over is the timing master: the segment runs from cue "Сүүлийн асуулт." to the
// "боломжтой." that ends the barter sentence, rebased so the first cue starts at 0.
// Each hit sits on a spoken word: cue start + the word's offset inside that cue.
//
//   node films/khantugul-q3/cues.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const FIRST_CUE = 24; // Сүүлийн асуулт.
const LAST_CUE = 52; // боломжтой.
const DURATION = 21;

// [name, cue, seconds into the cue where the word lands]
const HITS = [
  ['open', 24, 0],
  ['асуулт', 24, 0.4],
  ['options', 25, 0],
  ['хувь лизинг', 25, 0.42],
  ['бартер', 26, 0.42],
  ['банкны зээл', 27, 0.38],
  ['төлбөрийн', 29, 0],
  ['уян хатан', 30, 0],
  ['урьдчилгаа', 32, 0],
  ['30%', 33, 0],
  ['үлдэгдэл', 35, 0],
  ['6 сар', 36, 0],
  ['хүүгүй', 37, 0],
  ['эсвэл', 38, 0.42],
  ['18 сар', 39, 0],
  ['1.6%', 40, 0],
  ['төлөх боломжтой', 42, 0],
  ['мөн дээрээс нь', 44, 0],
  ['үнийн дүнгийн', 45, 0],
  ['30% бартер', 46, 0],
  ['гэрчилгээтэй', 47, 0],
  ['автомашин', 48, 0],
  ['үл хөдлөх', 49, 0],
  ['бартерт', 50, 0],
  ['боломжтой', 52, 0],
];

const toSec = (stamp) => {
  const [h, m, s] = stamp.trim().replace(',', '.').split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
};

const srt = readFileSync(path.join(dir, 'sequence.srt'), 'utf8').replace(/^﻿/, '');
const all = srt.trim().split(/\r?\n\r?\n/).map((block) => {
  const [n, times, ...text] = block.split(/\r?\n/);
  const [start, end] = times.split('-->').map(toSec);
  return { n: Number(n), start, end, text: text.join(' ').trim() };
});

const origin = all.find((c) => c.n === FIRST_CUE).start;
const round = (x) => Math.round(x * 1000) / 1000;
const cues = all
  .filter((c) => c.n >= FIRST_CUE && c.n <= LAST_CUE)
  .map((c) => ({ n: c.n, t0: round(c.start - origin), t1: round(c.end - origin), text: c.text }));
const hits = HITS.map(([name, n, offset]) => {
  const cue = cues.find((c) => c.n === n);
  return { name, t: round(cue.t0 + offset), cue: n, text: cue.text };
});

writeFileSync(
  path.join(dir, 'beats.json'),
  JSON.stringify({ source: 'sequence.srt', sequenceStart: origin, duration: DURATION, cues, hits }, null, 2) + '\n',
);
console.log(`beats.json: ${cues.length} cues, ${hits.length} hits, ${cues[0].text} → ${cues.at(-1).text} (${cues.at(-1).t1}s)`);
