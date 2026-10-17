// Builds beats.json for this overlay from its clip's SRT (sequence.srt, a copy of C3918.srt):
// all four cues, «танд илүү их орон зай» to «яг тохирно», from the clip's first frame.
// 171 frames at 30 fps (5.7 s): the voice ends 5.1 s in, the rest holds on the last line.
//
//   node films/khantugul-house/cues.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBeats } from '../shared/srt.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));

// [name, cue, seconds into the cue where the word lands]. The SRT is phrase-level, so words
// inside a cue sit at their syllable position.
const HITS = [
  ['танд', 1, 0],
  ['илүү', 1, 0.15],
  ['орон зай', 1, 0.6],
  ['зай', 1, 0.92],
  ['тав тух', 2, 0],
  ['үнэ цэнэ', 2, 0.42],
  ['хэрэгтэй', 2, 0.95],
  ['энэ хаус', 3, 0],
  ['хаус', 3, 0.4],
  ['танд 2', 3, 0.62],
  ['яг', 4, 0],
  ['тохирно', 4, 0.3],
];

buildBeats({
  dir,
  srt: path.join(dir, 'sequence.srt'),
  origin: 0,
  firstCue: 1,
  lastCue: 4,
  duration: 5.7,
  hits: HITS,
});
