// Builds beats.json for this film from the reel's SRT: cues 15 «Дараагийн асуулт» to
// 23 «байгаа.», rebased so the first cue starts at 0. The film runs 6.68 s, to the start
// of cue 24, so it ends on the frame where the Q3 film begins.
//
//   node films/khantugul-q2/cues.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBeats } from '../shared/srt.mjs';

// [name, cue, seconds into the cue where the word lands]
const HITS = [
  ['open', 15, 0],
  ['асуулт', 15, 0.52],
  ['сөх', 16, 0],
  ['болон', 16, 0.22],
  ['хэрэглээний', 17, 0],
  ['зардал', 18, 0],
  ['нэг', 19, 0],
  ['сингл хаус', 19, 0.27],
  ['ойролцоогоор', 20, 0],
  ['сарын', 20, 0.47],
  ['800 мянга', 21, 0],
  ['1 сая', 21, 0.48],
  ['хооронд', 22, 0],
  ['гардаг', 22, 0.24],
  ['байгаа', 23, 0],
];

buildBeats({ dir: path.dirname(fileURLToPath(import.meta.url)), firstCue: 15, lastCue: 23, duration: 6.68, hits: HITS });
