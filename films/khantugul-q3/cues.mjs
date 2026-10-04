// Builds beats.json for this film from the reel's SRT: cues 24 «Сүүлийн асуулт.» to
// 52 «боломжтой.», rebased so the first cue starts at 0.
//
//   node films/khantugul-q3/cues.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBeats } from '../shared/srt.mjs';

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

buildBeats({ dir: path.dirname(fileURLToPath(import.meta.url)), firstCue: 24, lastCue: 52, duration: 21, hits: HITS });
