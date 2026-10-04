// Builds a film's beats.json, the hit grid both its picture and its sound sync to.
// The voice-over is the timing master: a film covers SRT cues firstCue..lastCue of the reel,
// rebased so firstCue starts at 0. Each hit sits on a spoken word: cue start + the word's
// offset inside that cue.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'sequence.srt');

const toSec = (stamp) => {
  const [h, m, s] = stamp.trim().replace(',', '.').split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
};
const round = (x) => Math.round(x * 1000) / 1000;

/** hits: [[name, cue, seconds into the cue where the word lands], ...] */
export function buildBeats({ dir, firstCue, lastCue, duration, hits }) {
  const srt = readFileSync(SRT, 'utf8').replace(/^﻿/, '');
  const all = srt.trim().split(/\r?\n\r?\n/).map((block) => {
    const [n, times, ...text] = block.split(/\r?\n/);
    const [start, end] = times.split('-->').map(toSec);
    return { n: Number(n), start, end, text: text.join(' ').trim() };
  });
  const origin = all.find((c) => c.n === firstCue).start;
  const cues = all
    .filter((c) => c.n >= firstCue && c.n <= lastCue)
    .map((c) => ({ n: c.n, t0: round(c.start - origin), t1: round(c.end - origin), text: c.text }));
  const grid = hits.map(([name, n, offset]) => {
    const cue = cues.find((c) => c.n === n);
    return { name, t: round(cue.t0 + offset), cue: n, text: cue.text };
  });
  writeFileSync(
    path.join(dir, 'beats.json'),
    JSON.stringify({ source: '../shared/sequence.srt', sequenceStart: origin, duration, cues, hits: grid }, null, 2) + '\n',
  );
  console.log(`beats.json: ${cues.length} cues, ${grid.length} hits, ${cues[0].text} → ${cues.at(-1).text} (${cues.at(-1).t1}s of ${duration}s), starts at ${origin}s in the sequence`);
}
