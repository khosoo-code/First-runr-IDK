// Sound effects for the Хан Төгөл films, synthesized deterministically on the beat grid.
// No music and no tuned notes: whooshes, low hits, ticks, a switch click, pops and pencil.
//
//   const m = mixer(beats);  m.whoosh(...); m.thump(...);  m.master(outDir);
// master() adds the reverb, normalizes to -14 LUFS integrated (true peak under -1.5 dBTP),
// and writes out/mix.wav plus out/cues.json, the log sync_check.py measures against.
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { clamp, lerp, mulberry32 } from './motion.js';

const SR = 48000;
const TAU = Math.PI * 2;
const TARGET = -14;
const CEILING = -1.5;
const db = (d) => 10 ** (d / 20);
const pan = (p) => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];

export function mixer(beats) {
  const N = Math.round(beats.duration * SR);
  const bus = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
  const sfx = bus();
  const send = bus(); // reverb send
  const cueLog = []; // every placed sound: { t, kind }
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

  /** A two-stage switch, like a physical toggle landing. */
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

  /** Pencil on paper while a line drawing draws on. */
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

  /** Reverb, fades, -14 LUFS with a true-peak ceiling, then out/mix.wav and out/cues.json. */
  function master(outDir) {
    const verb = freeverb(send, { wet: 3.2 });
    for (let i = 0; i < N; i++) {
      sfx.L[i] += verb.L[i];
      sfx.R[i] += verb.R[i];
    }
    // Short fades so the clip starts and ends without clicks.
    for (let i = 0; i < N; i++) {
      const g = Math.min(1, i / (0.01 * SR), (N - 1 - i) / (0.12 * SR));
      sfx.L[i] *= g;
      sfx.R[i] *= g;
    }
    mkdirSync(outDir, { recursive: true });
    const probe = path.join(outDir, 'mix-raw.wav');
    // Gain to the target, limiting first only if that gain would push true peaks past the ceiling.
    wav(probe, sfx);
    let raw = ebur128(probe);
    console.log(`raw mix: ${raw.I.toFixed(1)} LUFS, ${raw.TP.toFixed(1)} dBTP`);
    let envelope = new Float32Array(N).fill(db(TARGET - raw.I));
    if (raw.TP + (TARGET - raw.I) > CEILING) {
      for (let pass = 0; pass < 6; pass++) {
        const gain = db(TARGET - raw.I);
        const limit = limiter(sfx, db(CEILING - 1.0) / gain);
        envelope = limit.map((g) => g * gain);
        wav(probe, sfx, envelope);
        const now = ebur128(probe);
        raw = { I: raw.I + (now.I - TARGET), TP: now.TP };
        if (Math.abs(now.I - TARGET) < 0.1 && now.TP <= CEILING) break;
      }
    }
    wav(path.join(outDir, 'mix.wav'), sfx, envelope);
    rmSync(probe);
    writeFileSync(path.join(outDir, 'cues.json'), JSON.stringify(cueLog.sort((a, b) => a.t - b.t), null, 1));
    const final = ebur128(path.join(outDir, 'mix.wav'));
    console.log(`mix.wav: ${final.I.toFixed(1)} LUFS integrated, ${final.TP.toFixed(1)} dBTP true peak (target ${TARGET} LUFS, ceiling ${CEILING} dBTP)`);
  }

  return { thump, whoosh, tick, click, pop, scribble, master };
}

/** Integrated loudness (LUFS) and true peak (dBTP) from ffmpeg's EBU R128 meter. */
function ebur128(file) {
  const { stderr } = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
  const summary = stderr.slice(stderr.lastIndexOf('Summary:'));
  return { I: Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)[1]), TP: Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)[1]) };
}
