// Builds beats.json for this overlay from the reel's SRT: cue 44 «Хятадаас хурдан,» to cue 49
// «татаад аваарай.», starting on 00;00;28;15 of the 29.97 fps sequence and running 180 frames
// at 30 fps (6 s): the voice ends 5.23 s in, the rest holds on the download button.
//
//   node films/janapost-cta/cues.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBeats } from '../shared/srt.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IN = (28 * 30 + 15) / (30000 / 1001); // 00;00;28;15 on the sequence

// [name, cue, seconds into the cue where the word lands]
const HITS = [
  ['хятадаас', 44, 0.02],
  ['хурдан', 44, 0.86],
  ['найдвартай', 45, 0],
  ['толгой', 46, 0],
  ['өвдөхгүй', 46, 0.23],
  ['захиалъя', 47, 0],
  ['jana post', 48, 0],
  ['татаад', 49, 0],
  ['аваарай', 49, 0.3],
];

buildBeats({
  dir,
  srt: path.join(dir, '../janapost-shared/sequence.srt'),
  origin: IN,
  firstCue: 44,
  lastCue: 49,
  duration: 6,
  hits: HITS,
});
