// Builds beats.json for this film from the reel's SRT: cues 7 «Эхний асуулт» to
// 14 «холбогдсон байгаа.», rebased so the first cue starts at 0. The film runs 6.17 s, to the
// start of cue 15, so it ends on the frame where the Q2 film begins.
//
//   node films/khantugul-q1/cues.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBeats } from '../shared/srt.mjs';

// [name, cue, seconds into the cue where the word lands]
const HITS = [
  ['open', 7, 0],
  ['асуулт', 7, 0.3],
  ['нүхтийн аманд', 8, 0],
  ['байгальтайгаа ойр', 9, 0],
  ['уулын бэлд', 10, 0],
  ['байрлаж', 11, 0],
  ['хэдий ч', 12, 0],
  ['төвийн', 12, 0.45],
  ['шугамдаа', 13, 0],
  ['бүрэн', 13, 0.4],
  ['холбогдсон', 14, 0],
  ['байгаа', 14, 0.45],
];

buildBeats({ dir: path.dirname(fileURLToPath(import.meta.url)), firstCue: 7, lastCue: 14, duration: 6.17, hits: HITS });
