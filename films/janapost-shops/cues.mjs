// Builds beats.json for this overlay from the reel's SRT: cue 12 «Харин» to cue 24
// «захиалчихсан.», starting on 00;00;08;03 of the 29.97 fps sequence (cue 12's first frame)
// and running 257 frames at 30 fps, up to the Jana Post tracking insert at 00;00;16;20.
//
//   node films/janapost-shops/cues.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBeats } from '../shared/srt.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const IN = (8 * 30 + 3) / (30000 / 1001); // 00;00;08;03 on the sequence

// [name, cue, seconds into the cue where the word lands]
const HITS = [
  ['харин', 12, 0],
  ['жана пост', 13, 0],
  ['захиалсан', 14, 0],
  ['шал өөр', 15, 0.2],
  ['байсан', 16, 0],
  ['poizon', 17, 0],
  ['гутал', 17, 0.8],
  ['pinduoduo', 18, 0],
  ['хувцас', 19, 0],
  ['taobao', 20, 0],
  ['гэр ахуй', 21, 0],
  ['бүтээгдэхүүн', 22, 0],
  ['амархан', 23, 0],
  ['захиалчихсан', 24, 0],
];

buildBeats({
  dir,
  srt: path.join(dir, '../janapost-shared/sequence.srt'),
  origin: IN,
  firstCue: 12,
  lastCue: 24,
  duration: Number((257 / 30).toFixed(5)),
  hits: HITS,
});
