// Builds beats.json for this film from the reel's SRT (../janapost-shared/sequence.srt, a copy of C6751.srt).
// The clip runs 00;00;16;20 → 00;00;26;01 on a 29.97 fps sequence: 281 frames, starting
// 0.16 s into cue 25 «Би болохлоор» and ending early in cue 39 «Тэгээд л би бүх».
//
//   node films/janapost-track/cues.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBeats } from '../shared/srt.mjs';

const FPS = 30000 / 1001;
const IN = 16 * 30 + 20; // 00;00;16;20 (no frames dropped before the first minute)
const OUT = 26 * 30 + 1; // 00;00;26;01
const dir = path.dirname(fileURLToPath(import.meta.url));

// [name, cue, seconds into the cue where the word lands]. The SRT is phrase-level, so words
// inside a cue sit at their syllable position.
const HITS = [
  ['open', 25, 0.163],
  ['захиалгуудаа', 26, 0],
  ['апп', 26, 0.52],
  ['дээрээсээ', 27, 0],
  ['хаана', 27, 0.52],
  ['явааг', 28, 0],
  ['хянаад', 28, 0.36],
  ['хүлээж', 29, 0],
  ['бусдыг', 30, 0],
  ['болохлоор', 31, 0],
  ['харин', 32, 0],
  ['jana post', 32, 0.3],
  ['өөрсдөө', 33, 0],
  ['хятадын', 33, 0.28],
  ['агуулахаас', 34, 0],
  ['аваад', 35, 0],
  ['гэрт', 35, 0.72],
  ['хамгийн', 36, 0],
  ['ойр', 36, 0.24],
  ['салбарт', 37, 0],
  ['ирсэн', 38, 0],
  ['тэгээд', 39, 0],
];

buildBeats({
  dir,
  srt: path.join(dir, '../janapost-shared/sequence.srt'),
  origin: IN / FPS,
  firstCue: 25,
  lastCue: 39,
  duration: Number(((OUT - IN) / FPS).toFixed(5)),
  hits: HITS,
});
