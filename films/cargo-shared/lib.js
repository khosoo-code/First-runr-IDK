// Shared base for the cargo kinetic-type clips: Montserrat, DOM helpers and the boot sequence.
// Frames are a pure function of t; FILM.alpha tells render.mjs to keep the background
// transparent and encode ProRes 4444 with alpha.
import { lerp } from '../shared/motion.js';

export const W = 1080;
export const H = 1920;
export const GREEN = '#008c00';
export const WHITE = '#ffffff';
const RENDER = new URLSearchParams(location.search).has('render');

const SUBSETS = {
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
  cyrillic: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
  'cyrillic-ext': 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F',
};

async function loadFonts() {
  const loads = [];
  for (const weight of [600, 800, 900]) {
    for (const [subset, range] of Object.entries(SUBSETS)) {
      const url = new URL(`./fonts/montserrat-${subset}-${weight}-normal.woff2`, import.meta.url);
      const face = new FontFace('Montserrat', `url(${url})`, { weight: String(weight), unicodeRange: range });
      document.fonts.add(face);
      loads.push(face.load());
    }
  }
  await Promise.all(loads);
}

export const $ = (tag, cls, parent, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
};
const SVG_NS = 'http://www.w3.org/2000/svg';
export const svg = (tag, attrs, parent) => {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};
export const px = (v) => `${v}px`;
export function box(e, x, y, w, h) {
  e.style.left = px(x);
  e.style.top = px(y);
  if (w !== undefined) e.style.width = px(w);
  if (h !== undefined) e.style.height = px(h);
}
export const shown = (e, visible) => (e.style.visibility = visible ? 'visible' : 'hidden');
/** A full-frame SVG layer for white stroke graphics. */
export function strokeLayer(parent) {
  const s = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
  s.style.position = 'absolute';
  box(s, 0, 0);
  return s;
}
/** A path that draws on: set .draw(k) with k in 0..1 (pathLength-normalized dashes). */
export function drawPath(parent, d, { color = WHITE, width = 8, dash } = {}) {
  const p = svg('path', { d, stroke: color, 'stroke-width': width, pathLength: 1 }, parent);
  p.draw = (k, from = 0) => {
    if (dash) {
      // pathLength=1 rescales dash units too, so convert the pixel pattern to path fractions.
      const len = p.getTotalLength();
      p.setAttribute('stroke-dasharray', dash.split(/\s+/).map((v) => +v / len).join(' '));
      p.style.clipPath = `inset(0 ${(1 - k) * 100}% 0 ${from * 100}%)`;
    } else {
      p.setAttribute('stroke-dasharray', `${Math.max(0, k - from)} 2`);
      p.setAttribute('stroke-dashoffset', -from);
    }
    p.style.visibility = k > from ? 'visible' : 'hidden';
  };
  return p;
}
const measure = document.createElement('canvas').getContext('2d');
export function textWidth(font, text) {
  measure.font = font;
  return measure.measureText(text).width;
}
export const lerpX = lerp;

/** Loads fonts and beats.json, builds the clip and exposes window.FILM / window.seek. */
export function boot(build, { fps = 30, audio = 'out/mix.wav' } = {}) {
  window.ready = (async () => {
    await loadFonts();
    const beats = await (await fetch('beats.json')).json();
    const hit = Object.fromEntries(beats.hits.map((h) => [h.name, h.t]));
    const painters = [];
    build({ hit, beats, stage: document.getElementById('stage'), every: (fn) => painters.push(fn) });
    const paint = (t) => {
      for (const p of painters) p(t);
    };
    window.FILM = { width: W, height: H, fps, duration: beats.duration, audio, alpha: true };
    window.seek = paint;
    paint(0);
    if (!RENDER) {
      // Browser preview only: render.mjs never runs this loop.
      document.body.style.background = '#2b2e33';
      const stage = document.getElementById('stage');
      stage.style.transform = `scale(${Math.min(innerWidth / W, innerHeight / H)})`;
      const t0 = performance.now();
      const loop = (now) => {
        paint(((now - t0) / 1000) % beats.duration);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  })();
}
