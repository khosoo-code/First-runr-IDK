// Pure timing helpers shared by the picture (film.js) and the sound (score.mjs).
// Everything here is a function of its arguments only: no clocks, no state.

export const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
export const lerp = (a, b, k) => a + (b - a) * k;
/** 0..1 progress of t through [start, start + duration]. */
export const prog = (t, start, duration) => clamp((t - start) / duration);

/** CSS-style cubic-bezier easing, solved with Newton steps plus bisection fallback. */
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u;
  const sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(u) - x;
      const d = dx(u);
      if (Math.abs(err) < 1e-6) return sy(u);
      if (Math.abs(d) < 1e-6) break;
      u -= err / d;
    }
    let lo = 0, hi = 1;
    u = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(u);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = u; else hi = u;
      u = (lo + hi) / 2;
    }
    return sy(u);
  };
}

export const ease = {
  linear: (x) => x,
  out: bezier(0.16, 1, 0.3, 1), // long, soft landing for entrances
  outSoft: bezier(0.25, 1, 0.5, 1),
  inOut: bezier(0.7, 0, 0.2, 1), // decisive moves between layouts
  inOutSoft: bezier(0.45, 0, 0.25, 1),
  in: bezier(0.55, 0, 0.9, 0.4), // quick exits
  inStrong: bezier(0.7, 0, 0.84, 0),
};

/** Damped spring step response at time s (seconds since release), settles at 1. */
export function spring(s, { freq = 2.2, damping = 0.72 } = {}) {
  if (s <= 0) return 0;
  const w = 2 * Math.PI * freq;
  const wd = w * Math.sqrt(1 - damping * damping);
  return 1 - Math.exp(-damping * w * s) * (Math.cos(wd * s) + ((damping * w) / wd) * Math.sin(wd * s));
}

/** Seeded PRNG; the only source of noise allowed in a film. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let r = Math.imul(a ^ (a >>> 15), a | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
