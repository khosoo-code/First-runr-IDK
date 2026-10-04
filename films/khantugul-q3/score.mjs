// Synthesizes the score and SFX for the film, deterministically, from beats.json.
// Every hit sits on the same word-level grid as the picture. Output (out/):
//   score.wav  pad + mallet notes      sfx.wav  whooshes, thumps, ticks, clicks
//   mix.wav    both, at -14 LUFS integrated (stems carry the same gain, so they sum to the mix)
//
//   node films/khantugul-q3/score.mjs
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clamp, ease, lerp, mulberry32, prog } from './motion.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const SR = 48000;
const beats = JSON.parse(readFileSync(path.join(dir, 'beats.json'), 'utf8'));
const hit = Object.fromEntries(beats.hits.map((h) => [h.name, h.t]));
const N = Math.round(beats.duration * SR);
const TAU = Math.PI * 2;

const bus = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
const score = bus();
const sfx = bus();
const send = bus(); // reverb send

const cueLog = []; // every placed sound: { t, kind }, written to out/cues.json for sync_check.py
const midi = (m) => 440 * 2 ** ((m - 69) / 12);
const db = (d) => 10 ** (d / 20);
const pan = (p) => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];
let seed = 1;
const noiseSource = () => {
  const r = mulberry32(seed++ * 7919);
  return () => r() * 2 - 1;
};

/** Writes a mono voice into a bus with equal-power panning; fn(s) returns the sample at s seconds. */
function voice(b, t0, dur, p, fn, sendLevel = 0) {
  const [gl, gr] = pan(p);
  const i0 = Math.round(t0 * SR);
  const len = Math.round(dur * SR);
  for (let i = 0; i < len; i++) {
    const j = i0 + i;
    if (j < 0 || j >= N) continue;
    const v = fn(i / SR);
    b.L[j] += v * gl;
    b.R[j] += v * gr;
    if (sendLevel) {
      send.L[j] += v * gl * sendLevel;
      send.R[j] += v * gr * sendLevel;
    }
  }
}

// ---------------------------------------------------------------- pad
// Band-limited wavetables: a dark one and a bright one, crossfaded slowly so the pad breathes.
function table(harmonics, tilt) {
  const T = new Float32Array(4096);
  for (let h = 1; h <= harmonics; h++) {
    for (let i = 0; i < 4096; i++) T[i] += Math.sin((TAU * h * i) / 4096) / h ** tilt;
  }
  const peak = T.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  return T.map((v) => v / peak);
}
const DARK = table(4, 1.6);
const BRIGHT = table(10, 1.15);
const read = (T, ph) => {
  const x = (ph - Math.floor(ph)) * 4096;
  const i = Math.floor(x);
  return lerp(T[i & 4095], T[(i + 1) & 4095], x - i);
};

const CHORDS = [
  { t: 0, notes: [50, 57, 61, 64, 66] }, // Dmaj9
  { t: hit['урьдчилгаа'], notes: [47, 54, 57, 61, 62] }, // Bm9
  { t: hit['18 сар'], notes: [43, 50, 54, 57, 59] }, // Gmaj9
  { t: hit['мөн дээрээс нь'], notes: [52, 59, 62, 66, 67] }, // Em9
  { t: hit['боломжтой'], notes: [38, 50, 57, 61, 64, 66] }, // Dmaj9, home
];
CHORDS.forEach((chord, k) => {
  const t0 = Math.max(0, chord.t - 0.25);
  const t1 = CHORDS[k + 1]?.t ?? beats.duration;
  const dur = t1 - t0 + 1.4;
  chord.notes.forEach((m, n) => {
    for (const [cents, p] of [[-7, -0.55], [6, 0.55]]) {
      const f = midi(m) * 2 ** (cents / 1200);
      let ph = (n * 0.137 + (cents > 0 ? 0.5 : 0)) % 1;
      const level = (m < 45 ? 0.022 : 0.016) * (k === 0 ? 0.85 : 1);
      voice(score, t0, dur, p * (0.4 + n * 0.12), (s) => {
        ph += f / SR;
        const t = t0 + s;
        const fadeIn = k === 0 ? ease.inOutSoft(prog(t, 0, 0.35)) : ease.inOutSoft(prog(s, 0, 0.9));
        const fadeOut = 1 - ease.inOutSoft(prog(t, t1 - 0.15, 1.1));
        const breathe = 0.5 + 0.5 * Math.sin(TAU * 0.11 * t + n);
        return level * fadeIn * fadeOut * lerp(read(DARK, ph), read(BRIGHT, ph), 0.25 + 0.35 * breathe);
      }, 0.35);
    }
  });
});

// ---------------------------------------------------------------- musical hits
const MALLET = [[1, 1, 0.9], [2, 0.3, 0.45], [3, 0.1, 0.25], [4.16, 0.05, 0.14]];
const BELL = [[1, 1, 1.6], [2.41, 0.42, 0.7], [3.87, 0.2, 0.4], [5.43, 0.08, 0.22]];
function mallet(t, m, gain, p = 0, partials = MALLET) {
  cueLog.push({ t, kind: 'mallet' });
  const f = midi(m);
  const noise = noiseSource();
  let lo = 0, bp = 0;
  const fcoef = 2 * Math.sin((Math.PI * 2400) / SR);
  voice(score, t, 2.4, p, (s) => {
    let v = 0;
    for (const [ratio, amp, decay] of partials) v += amp * Math.sin(TAU * f * ratio * s) * Math.exp(-s / decay);
    lo += fcoef * bp;
    bp += fcoef * (noise() - lo - 0.8 * bp);
    const felt = bp * 0.9 * Math.exp(-s / 0.006);
    return (v * Math.min(1, s / 0.003) + felt) * gain * 1.7;
  }, 0.5);
}

// ---------------------------------------------------------------- SFX
/** A soft low hit: 160 → 60 Hz with gentle saturation, so its harmonics carry on phone speakers. */
function thump(t, gain) {
  cueLog.push({ t, kind: 'thump' });
  let ph = 0;
  voice(sfx, t, 0.5, 0, (s) => {
    ph += (60 + 100 * Math.exp(-s / 0.04)) / SR;
    const x = Math.sin(TAU * ph) * Math.exp(-s / 0.13) * Math.min(1, s / 0.002);
    return Math.tanh(x * 2.2) * 0.62 * gain;
  });
}

/** Noise through a state-variable bandpass sweeping from→to, swelling into t and panning across. */
function whoosh(t, { pre, post, from, to, q = 0.7, gain, panFrom = -0.6, panTo = 0.6 }) {
  cueLog.push({ t, kind: 'whoosh' });
  const noise = noiseSource();
  let lo = 0, bp = 0;
  const dur = pre + post;
  const i0 = Math.round((t - pre) * SR);
  const len = Math.round(dur * SR);
  for (let i = 0; i < len; i++) {
    const s = i / SR;
    const fc = from * (to / from) ** clamp(s / pre);
    const fcoef = 2 * Math.sin((Math.PI * Math.min(fc, 9000)) / SR);
    lo += fcoef * bp;
    bp += fcoef * (noise() - lo - q * bp);
    const j = i0 + i;
    if (j < 0 || j >= N) continue;
    const env = s < pre ? (s / pre) ** 2.4 : Math.exp(-(s - pre) / (post * 0.35));
    const v = bp * env * gain * (1 - 0.5 * (s / dur));
    const [gl, gr] = pan(lerp(panFrom, panTo, i / len));
    sfx.L[j] += v * gl;
    sfx.R[j] += v * gr;
  }
}

function tick(t, gain, p = 0, freq = 3200) {
  cueLog.push({ t, kind: 'tick' });
  const noise = noiseSource();
  let prev = 0;
  voice(sfx, t, 0.05, p, (s) => {
    const x = noise();
    const hp = x - prev;
    prev = x;
    return (hp * 0.6 * Math.exp(-s / 0.004) + Math.sin(TAU * freq * s) * Math.exp(-s / 0.012)) * gain;
  });
}

function click(t, gain) {
  tick(t, gain, -0.1, 2600);
  tick(t + 0.028, gain * 0.7, 0.1, 3400);
  voice(sfx, t, 0.08, 0, (s) => Math.sin(TAU * 170 * s) * Math.exp(-s / 0.018) * gain * 0.8);
}

function pop(t, gain, p = 0) {
  cueLog.push({ t, kind: 'pop' });
  let ph = 0;
  voice(sfx, t, 0.16, p, (s) => {
    ph += (620 + 900 * clamp(s / 0.04)) / SR;
    return Math.sin(TAU * ph) * Math.exp(-s / 0.05) * Math.min(1, s / 0.002) * gain;
  }, 0.3);
}

/** Pencil on paper while a line icon draws on. */
function scribble(t, dur, gain, p = 0) {
  const noise = noiseSource();
  let lo = 0, bp = 0;
  const fcoef = 2 * Math.sin((Math.PI * 3800) / SR);
  voice(sfx, t, dur, p, (s) => {
    const x = noise();
    lo += fcoef * bp;
    bp += fcoef * (x - lo - 0.9 * bp);
    const strokes = 0.55 + 0.45 * Math.sin(TAU * 11 * s) * Math.sin(TAU * 3.1 * s + 1);
    return bp * strokes * Math.sin(Math.PI * clamp(s / dur)) * gain;
  });
}

/** A soft tone that bends with the flexing underline on "уян хатан". */
function bend(t, dur, gain) {
  cueLog.push({ t: t + dur / 2, kind: 'bend' });
  let ph = 0;
  voice(score, t, dur, 0.2, (s) => {
    const env = Math.sin(Math.PI * clamp(s / dur)) ** 1.5;
    ph += (midi(78) * (1 + 0.035 * Math.sin(TAU * 3.4 * s) * env)) / SR;
    return Math.sin(TAU * ph) * env * gain;
  }, 0.6);
}

// ---------------------------------------------------------------- the cue sheet
const H = hit;
// Hook
whoosh(H['асуулт'], { pre: 0.45, post: 0.5, from: 300, to: 1600, gain: 0.5, panFrom: 0.4, panTo: -0.2 });
thump(H['асуулт'] + 0.02, 0.55);
mallet(H['асуулт'], 74, 0.16, -0.1);
whoosh(H.options + 0.2, { pre: 0.3, post: 0.35, from: 500, to: 2600, gain: 0.32, panFrom: -0.2, panTo: 0.5 });
// Three ways to pay
mallet(H['хувь лизинг'], 69, 0.15, -0.3);
mallet(H['бартер'], 71, 0.15, 0);
mallet(H['банкны зээл'], 74, 0.15, 0.3);
for (const name of ['хувь лизинг', 'бартер', 'банкны зээл']) {
  whoosh(H[name] - 0.02, { pre: 0.22, post: 0.25, from: 900, to: 3600, gain: 0.16, panFrom: 0, panTo: 0 });
}
whoosh(H['төлбөрийн'], { pre: 0.28, post: 0.4, from: 400, to: 2200, gain: 0.26 });
mallet(H['төлбөрийн'], 78, 0.1, 0.2);
bend(H['уян хатан'] - 0.1, 1.1, 0.06);
// In-house leasing
whoosh(H['урьдчилгаа'] + 0.25, { pre: 0.45, post: 0.6, from: 180, to: 1400, q: 0.5, gain: 0.55, panFrom: -0.3, panTo: 0.3 });
thump(H['30%'], 0.6);
mallet(H['30%'], 66, 0.13, -0.2);
mallet(H['30%'] + 0.035, 69, 0.11, 0.2);
whoosh(H['үлдэгдэл'] + 0.1, { pre: 0.25, post: 0.3, from: 1200, to: 4200, gain: 0.14, panFrom: -0.5, panTo: 0.5 });
mallet(H['6 сар'], 71, 0.14, 0.1);
for (let g = 0; g < 5; g++) tick(H['6 сар'] - 0.14 + g * 0.06 + 0.12, 0.09, -0.4 + g * 0.2);
thump(H['хүүгүй'], 0.5);
mallet(H['хүүгүй'], 74, 0.14, 0);
mallet(H['эсвэл'], 69, 0.1, -0.2);
click(H['18 сар'] + 0.2, 0.3);
{
  // One tick per number as the count runs 6 → 18 (same curve as the picture).
  let last = 6;
  for (let t = H['18 сар'] - 0.04; t < H['18 сар'] + 0.9; t += 0.001) {
    const n = Math.round(lerp(6, 18, ease.outSoft(prog(t, H['18 сар'] - 0.04, 0.9))));
    if (n !== last) tick(t, 0.11, lerp(-0.5, 0.5, (n - 6) / 12), 2800 + (n - 6) * 60);
    last = n;
  }
}
thump(H['1.6%'], 0.55);
mallet(H['1.6%'], 71, 0.12, -0.15);
mallet(H['1.6%'] + 0.04, 74, 0.11, 0.15);
mallet(H['төлөх боломжтой'] + 0.06, 81, 0.09, 0.2, BELL);
mallet(H['төлөх боломжтой'] + 0.15, 86, 0.07, 0.3, BELL);
// Barter
whoosh(H['мөн дээрээс нь'] + 0.35, { pre: 0.5, post: 0.6, from: 220, to: 2000, q: 0.55, gain: 0.5, panFrom: 0.6, panTo: -0.6 });
thump(H['мөн дээрээс нь'] + 0.82, 0.28);
mallet(H['үнийн дүнгийн'], 76, 0.1, 0);
thump(H['30% бартер'], 0.6);
mallet(H['30% бартер'], 78, 0.13, 0.1);
pop(H['гэрчилгээтэй'] + 0.12, 0.16, -0.35);
pop(H['гэрчилгээтэй'] + 0.22, 0.14, 0.35);
scribble(H['автомашин'] - 0.16, 1.0, 0.05, -0.35);
mallet(H['автомашин'], 69, 0.11, -0.3);
scribble(H['үл хөдлөх'] - 0.16, 1.0, 0.05, 0.35);
mallet(H['үл хөдлөх'], 71, 0.11, 0.3);
whoosh(H['бартерт'] + 0.4, { pre: 0.45, post: 0.45, from: 600, to: 3000, gain: 0.34, panFrom: 0.5, panTo: -0.4 });
tick(H['бартерт'] + 0.86, 0.14, -0.3, 2400);
// Resolve on "боломжтой."
thump(H['боломжтой'], 0.5);
[74, 78, 81].forEach((m, i) => mallet(H['боломжтой'] + i * 0.045, m, 0.11, -0.25 + i * 0.25, BELL));

// ---------------------------------------------------------------- reverb (Freeverb)
function freeverb(input, { room = 0.86, damp = 0.25, wet = 1 } = {}) {
  const k = SR / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const allpasses = [556, 441, 341, 225];
  const out = bus();
  for (const [ch, spread] of [['L', 0], ['R', 23]]) {
    const x = input[ch];
    const y = out[ch];
    for (const c of combs) {
      const size = Math.round((c + spread) * k);
      const buf = new Float32Array(size);
      let idx = 0, store = 0;
      for (let i = 0; i < N; i++) {
        const o = buf[idx];
        store = o * (1 - damp) + store * damp;
        buf[idx] = x[i] * 0.015 + store * room;
        if (++idx >= size) idx = 0;
        y[i] += o;
      }
    }
    for (const a of allpasses) {
      const size = Math.round((a + spread) * k);
      const buf = new Float32Array(size);
      let idx = 0;
      for (let i = 0; i < N; i++) {
        const b = buf[idx];
        const o = -y[i] + b;
        buf[idx] = y[i] + b * 0.5;
        if (++idx >= size) idx = 0;
        y[i] = o;
      }
    }
    for (let i = 0; i < N; i++) y[i] *= wet;
  }
  return out;
}
const verb = freeverb(send, { wet: 3.2 });
for (let i = 0; i < N; i++) {
  score.L[i] += verb.L[i];
  score.R[i] += verb.R[i];
}

// ---------------------------------------------------------------- loudness and files
// Short fades so the clip starts and ends without clicks.
for (const b of [score, sfx]) {
  for (let i = 0; i < N; i++) {
    const g = Math.min(1, i / (0.01 * SR), (N - 1 - i) / (0.12 * SR));
    b.L[i] *= g;
    b.R[i] *= g;
  }
}
const mixBus = bus();
for (let i = 0; i < N; i++) {
  mixBus.L[i] = score.L[i] + sfx.L[i];
  mixBus.R[i] = score.R[i] + sfx.R[i];
}

function wav(file, b, envelope) {
  const data = Buffer.alloc(N * 8);
  for (let i = 0; i < N; i++) {
    const g = envelope ? envelope[i] : 1;
    data.writeFloatLE(b.L[i] * g, i * 8);
    data.writeFloatLE(b.R[i] * g, i * 8 + 4);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(3, 20); // IEEE float
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 8, 28);
  h.writeUInt16LE(8, 32);
  h.writeUInt16LE(32, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  writeFileSync(file, Buffer.concat([h, data]));
}

/** Integrated loudness (LUFS) and true peak (dBTP) from ffmpeg's EBU R128 meter. */
function ebur128(file) {
  const { stderr } = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
  const summary = stderr.slice(stderr.lastIndexOf('Summary:'));
  return { I: Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)[1]), TP: Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)[1]) };
}

/** Gain envelope of a 2 ms look-ahead limiter that keeps |sample| under `ceiling` (linear). */
function limiter(b, ceiling) {
  const look = Math.round(0.002 * SR);
  const want = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const p = Math.max(Math.abs(b.L[i]), Math.abs(b.R[i]));
    want[i] = p > ceiling ? ceiling / p : 1;
  }
  const g = new Float32Array(N);
  const attack = Math.exp(-1 / (0.0004 * SR));
  const release = Math.exp(-1 / (0.08 * SR));
  let cur = 1;
  for (let i = 0; i < N; i++) {
    let target = 1;
    for (let j = i; j < Math.min(N, i + look); j++) target = Math.min(target, want[j]);
    cur = target < cur ? target + (cur - target) * attack : target + (cur - target) * release;
    g[i] = cur;
  }
  return g;
}

const out = path.join(dir, 'out');
mkdirSync(out, { recursive: true });
const TARGET = -14;
const CEILING = -1.5;
const probe = path.join(out, 'mix-raw.wav');

// Gain to the target, limiting first only if that gain would push true peaks past the ceiling.
wav(probe, mixBus);
let raw = ebur128(probe);
console.log(`raw mix: ${raw.I.toFixed(1)} LUFS, ${raw.TP.toFixed(1)} dBTP`);
let envelope = new Float32Array(N).fill(db(TARGET - raw.I));
if (raw.TP + (TARGET - raw.I) > CEILING) {
  for (let pass = 0; pass < 3; pass++) {
    const gain = db(TARGET - raw.I);
    const limit = limiter(mixBus, db(CEILING - 0.6) / gain);
    envelope = limit.map((g) => g * gain);
    wav(probe, mixBus, envelope);
    const now = ebur128(probe);
    raw = { I: raw.I + (now.I - TARGET), TP: now.TP };
    if (Math.abs(now.I - TARGET) < 0.1 && now.TP <= CEILING) break;
  }
}
wav(path.join(out, 'mix.wav'), mixBus, envelope);
wav(path.join(out, 'score.wav'), score, envelope);
wav(path.join(out, 'sfx.wav'), sfx, envelope);
rmSync(probe);
writeFileSync(path.join(out, 'cues.json'), JSON.stringify(cueLog.sort((a, b) => a.t - b.t), null, 1));
const final = ebur128(path.join(out, 'mix.wav'));
console.log(`mix.wav: ${final.I.toFixed(1)} LUFS integrated, ${final.TP.toFixed(1)} dBTP true peak (target ${TARGET} LUFS, ceiling ${CEILING} dBTP)`);
