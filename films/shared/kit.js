// Shared kit for the Хан Төгөл films: fonts, DOM helpers, line icons, text slots, the
// background, the series hook and the boot sequence. Everything that paints is a pure
// function of t, per the render contract in CLAUDE.md.
import { clamp, ease, lerp, mulberry32, prog, spring } from './motion.js';

export const W = 1080;
export const H = 1920;
export const C = { cream: '#f7f6ed', white: '#ffffff', ink: '#1b1e23', gold: '#ac905f', green: '#1e4e3e' };
const RENDER = new URLSearchParams(location.search).has('render');

// ---------------------------------------------------------------- fonts
const SUBSETS = {
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  cyrillic: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
  'cyrillic-ext': 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F',
};
const FONTS = [
  ['Noto Serif Display', 'noto-serif-display', 400, 'normal'],
  ['Noto Serif Display', 'noto-serif-display', 500, 'normal'],
  ['Noto Serif Display', 'noto-serif-display', 600, 'normal'],
  ['Noto Serif Display', 'noto-serif-display', 400, 'italic'],
  ['Manrope', 'manrope', 500, 'normal'],
  ['Manrope', 'manrope', 600, 'normal'],
  ['Manrope', 'manrope', 700, 'normal'],
];

async function loadFonts() {
  const loads = [];
  for (const [family, file, weight, style] of FONTS) {
    for (const [subset, range] of Object.entries(SUBSETS)) {
      const url = new URL(`./fonts/${file}-${subset}-${weight}-${style}.woff2`, import.meta.url);
      const face = new FontFace(family, `url(${url})`, { weight: String(weight), style, unicodeRange: range });
      document.fonts.add(face);
      loads.push(face.load());
    }
  }
  await Promise.all(loads);
}

// ---------------------------------------------------------------- DOM helpers
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
export function tf(e, x = 0, y = 0, s = 1, r = 0) {
  e.style.transform = `translate(${x}px, ${y}px) scale(${s}) rotate(${r}deg)`;
}
export function op(e, o) {
  e.style.opacity = o;
  e.style.visibility = o > 0.001 ? 'visible' : 'hidden';
}
export const shown = (e, visible) => (e.style.visibility = visible ? 'visible' : 'hidden');
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
export const mix = (a, b, k) => `rgb(${rgb(a).map((v, i) => Math.round(lerp(v, rgb(b)[i], k))).join(',')})`;

const measure = document.createElement('canvas').getContext('2d');
/** Ink bounds of `text` in the display face, plus the baseline offset inside a line-height:1 box. */
export function ink(text, weight, size) {
  measure.font = `${weight} ${size}px "Noto Serif Display"`;
  const m = measure.measureText(text);
  const baseline = (size - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
  return { left: -m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight, ascent: m.actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent, width: m.width, baseline };
}
/** Advance width of `text` in a CSS font shorthand, e.g. textWidth('600 34px Manrope', '100%'). */
export function textWidth(font, text) {
  measure.font = font;
  return measure.measureText(text).width;
}

// ---------------------------------------------------------------- line icons
// Each path draws on through pathLength="1" dashes.
const ICONS = {
  calendar: { vb: '0 0 100 100', paths: ['M20 30 Q20 24 26 24 H74 Q80 24 80 30 V76 Q80 82 74 82 H26 Q20 82 20 76 Z', 'M20 42 H80', 'M36 16 V31', 'M64 16 V31'], dots: [[36, 56], [50, 56], [64, 56], [36, 69], [50, 69]] },
  exchange: { vb: '0 0 100 100', paths: ['M22 42 C28 24 60 18 76 34', 'M62 35 H77 V20', 'M78 58 C72 76 40 82 24 66', 'M38 65 H23 V80'] },
  bank: { vb: '0 0 100 100', paths: ['M14 38 L50 16 L86 38 Z', 'M28 46 V74', 'M43 46 V74', 'M57 46 V74', 'M72 46 V74', 'M16 82 H84'] },
  car: {
    vb: '0 0 220 110',
    paths: [
      'M30 82 H14 Q8 82 8 76 V68 Q8 58 18 56 L58 50 L84 32 Q92 26 102 26 H140 Q152 26 162 34 L182 52 L200 55 Q212 57 212 69 V76 Q212 82 206 82 H190',
      'M62 82 H156',
      'M46 82 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0',
      'M174 82 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0',
      'M70 50 L90 35 Q94 32 100 32 H117 V50 Z',
      'M126 32 H139 Q147 32 153 38 L166 50 H126 Z',
      'M120 56 V74',
    ],
  },
  house: {
    vb: '0 0 220 130',
    paths: [
      'M6 118 H214',
      'M30 72 L100 22 L170 72',
      'M44 62 V118',
      'M156 62 V118',
      'M156 84 H200 V118',
      'M62 78 H100 V104 H62 Z',
      'M118 118 V88 H140 V118',
      'M128 44 V28 H140 V52',
      'M20 118 V100',
      'M20 100 C8 100 8 76 20 64 C32 76 32 100 20 100 Z',
    ],
  },
  check: { vb: '0 0 100 100', paths: ['M28 52 L44 68 L74 36'] },
  // СӨХ, the homeowners' association: a home inside a shield.
  hoa: { vb: '0 0 100 100', paths: ['M50 12 L80 24 V48 C80 68 66 82 50 88 C34 82 20 68 20 48 V24 Z', 'M35 56 L50 43 L65 56', 'M40 52 V68 H60 V52'] },
  // Utilities: power and water.
  utility: { vb: '0 0 100 100', paths: ['M44 14 L24 54 H42 L34 86 L58 42 H40 L50 14 Z', 'M74 38 C67 50 62 57 62 64 A12 12 0 0 0 86 64 C86 57 81 50 74 38 Z'] },
  // A single house in elevation, with the grove on either side.
  villa: {
    vb: '0 0 400 220',
    paths: [
      'M10 200 H390',
      'M52 112 L160 40 L268 112',
      'M70 200 V100',
      'M250 200 V100',
      'M244 132 H356',
      'M350 132 V200',
      'M96 128 H156 V176 H96 Z',
      'M126 128 V176',
      'M184 200 V140 H220 V200',
      'M178 200 V194 H226',
      'M160 86 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0',
      'M272 152 H330 V180 H272 Z',
      'M206 66 V44 H222 V77',
      'M34 200 V170',
      'M34 170 C16 170 14 136 34 116 C54 136 52 170 34 170 Z',
      'M372 200 V178',
      'M372 178 C360 178 359 156 372 144 C385 156 384 178 372 178 Z',
    ],
  },
};

export function makeIcon(parent, name, w, h, color, width) {
  const def = ICONS[name];
  const el = svg('svg', { viewBox: def.vb, width: w, height: h, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
  const strokes = def.paths.map((d) => svg('path', { d, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, el));
  const dots = (def.dots ?? []).map(([cx, cy]) => svg('circle', { cx, cy, r: 4.2, fill: color, stroke: 'none' }, el));
  return { el, strokes, dots };
}
/** Draw an icon's strokes on, overlapping in sequence; dots pop once the lines are in. */
export function drawIcon(icon, k) {
  const n = icon.strokes.length;
  const step = Math.min(0.14, 0.55 / n);
  icon.strokes.forEach((p, i) => {
    const pk = clamp((k - i * step) / (1 - (n - 1) * step));
    p.setAttribute('stroke-dashoffset', 1 - ease.inOutSoft(pk));
  });
  icon.dots.forEach((d, i) => d.setAttribute('r', 4.2 * spring(k * 1.6 - 0.9 - i * 0.06)));
}

// ---------------------------------------------------------------- text slots
/**
 * A slot shows one entry at a time at a fixed spot. Each entry rises in through a mask so it
 * lands on its beat. The next entry pushes it out in lockstep, like a slot reel, so two
 * entries never overlap. An entry with an explicit `exit` leaves on its own instead.
 * entry: { t, html | parts: [html], lead?, exit?, update?(t, parts) }
 */
export function slot(parent, x, y, cls, entries, { stagger = 0.05, dur = 0.85, clip } = {}) {
  const items = entries.map((entry) => {
    const wrap = $('div', 'abs', parent);
    box(wrap, x, y + (clip ? clip[0] : 0));
    const mask = $('div', `mask ${cls}`, wrap);
    if (clip) Object.assign(mask.style, { height: px(clip[1] - clip[0]), padding: '0', margin: '0' });
    const parts = (entry.parts ?? [entry.html]).map((html) => {
      const part = $('span', '', mask, html);
      if (clip) Object.assign(part.style, { position: 'relative', top: px(-clip[0]) });
      return part;
    });
    return { entry, wrap, parts, start: entry.t - (entry.lead ?? 0.2) };
  });
  const kin = (it, t, j) => ease.out(prog(t, it.start + j * stagger, dur));
  // Glyphs overhang a line-height:1 box, so unclipped slots travel further to clear the mask.
  const travel = clip ? 112 : 150;
  items.forEach((it, i) => {
    const next = items[i + 1];
    it.kout = it.entry.exit !== undefined || !next
      ? (t, j) => ease.inStrong(prog(t, (it.entry.exit ?? Infinity) + j * stagger * 0.5, 0.36))
      : (t, j) => kin(next, t, Math.min(j, next.parts.length - 1));
  });
  return (t) => {
    for (const it of items) {
      const out = it.kout(t, 0);
      const live = t >= it.start - 0.001 && it.kout(t, it.parts.length - 1) < 1;
      shown(it.wrap, live);
      if (!live) continue;
      it.parts.forEach((p, j) => {
        p.style.transform = `translateY(${(1 - kin(it, t, j)) * travel - it.kout(t, j) * travel}%)`;
      });
      if (out >= 0) it.entry.update?.(t, it.parts);
    }
  };
}

/** The hero numeral slot every film shares: big display numerals on one baseline. */
export const HERO_BASE = 724;
export const LABEL1 = HERO_BASE + 34;
export const LABEL2 = LABEL1 + 94;
export function heroSlot(world, entries) {
  const heroInk = ink('30%', '500', 340);
  const clip = [heroInk.baseline - heroInk.ascent - 22, heroInk.baseline + 34];
  return slot(world, 92, HERO_BASE - heroInk.baseline, 'hero', entries, { stagger: 0.055, dur: 0.95, clip });
}
export const unit = (s) => `<span class="unit">${s}</span>`;

// ---------------------------------------------------------------- background
function paintContours(canvas, seed) {
  const pad = 140;
  canvas.width = W + pad * 2;
  canvas.height = H + pad * 2;
  box(canvas, -pad, -pad);
  const ctx = canvas.getContext('2d');
  const rand = mulberry32(seed);
  const G = 16;
  const lattice = Array.from({ length: G * G }, rand);
  const smooth = (x) => x * x * x * (x * (x * 6 - 15) + 10);
  const at = (i, j) => lattice[(((j % G) + G) % G) * G + (((i % G) + G) % G)];
  const noise = (u, v) => {
    const i = Math.floor(u), j = Math.floor(v);
    const fu = smooth(u - i), fv = smooth(v - j);
    return lerp(lerp(at(i, j), at(i + 1, j), fu), lerp(at(i, j + 1), at(i + 1, j + 1), fu), fv);
  };
  const step = 6;
  const cols = Math.ceil(canvas.width / step) + 1;
  const rows = Math.ceil(canvas.height / step) + 1;
  const field = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c * step) / 260, y = (r * step) / 260;
      field[r * cols + c] = 0.62 * noise(x, y) + 0.28 * noise(x * 2.1 + 5.3, y * 2.1 + 1.7) + 0.1 * noise(x * 4.3 + 9.1, y * 4.3 + 3.3);
    }
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const levels = 22;
  for (let l = 1; l < levels; l++) {
    const iso = 0.12 + (l / levels) * 0.76;
    ctx.strokeStyle = 'rgba(148,153,163,0.12)';
    ctx.lineWidth = l % 4 === 0 ? 2.6 : 1.5;
    ctx.beginPath();
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const a = field[r * cols + c], b = field[r * cols + c + 1];
        const d = field[(r + 1) * cols + c], e = field[(r + 1) * cols + c + 1];
        const code = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (e > iso ? 2 : 0) | (d > iso ? 1 : 0);
        if (code === 0 || code === 15) continue;
        const x = c * step, y = r * step;
        const top = [x + step * ((iso - a) / (b - a)), y];
        const right = [x + step, y + step * ((iso - b) / (e - b))];
        const bottom = [x + step * ((iso - d) / (e - d)), y + step];
        const left = [x, y + step * ((iso - a) / (d - a))];
        const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
        switch (code) {
          case 1: case 14: seg(left, bottom); break;
          case 2: case 13: seg(bottom, right); break;
          case 3: case 12: seg(left, right); break;
          case 4: case 11: seg(top, right); break;
          case 5: seg(left, top); seg(bottom, right); break;
          case 6: case 9: seg(top, bottom); break;
          case 7: case 8: seg(left, top); break;
          case 10: seg(left, bottom); seg(top, right); break;
        }
      }
    }
    ctx.stroke();
  }
}

function paintGrain(el, seed) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(256, 256);
  const rand = mulberry32(seed);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (rand() - 0.5) * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  el.style.backgroundImage = `url(${c.toDataURL()})`;
}

/**
 * Topographic contours drifting slowly, like the foot of the mountain, under paper grain.
 * Every film draws the same terrain; `at` is the film's start on the reel's drift clock, so
 * back-to-back films hand the background over without a jump.
 */
export function background(every, at = 0) {
  const contours = document.getElementById('contours');
  paintContours(contours, 1157);
  paintGrain(document.getElementById('grain'), 77);
  every((t) => tf(contours, 0, -(t + at) * 2.6));
}

// ---------------------------------------------------------------- the series hook
/**
 * "N-th question" opener shared by the series: a big green numeral rises over a gold horizon,
 * three progress bars (answered ones grey, the current one fills on the word "асуулт"), and a
 * two-line headline that glides up into the header when the answer starts.
 * at: { ask, glide, leave, out } — the word "асуулт", the start of the answer, when the
 * eyebrow leaves, and when the headline leaves.
 */
export function hook(world, every, { numeral, current, lines, at }) {
  const HORIZON = 1010;
  const horizon = $('div', 'abs', world);
  horizon.style.background = C.gold;
  horizon.style.height = '2px';
  every((t) => {
    const k = ease.out(prog(t, 0, 0.9));
    const r = ease.inOut(prog(t, at.glide - 0.12, 0.48));
    box(horizon, 96 + 888 * r, HORIZON, Math.max(0, 888 * (k - r)));
  });

  const SIZE = 980;
  const numInk = ink(numeral, '500', SIZE);
  const numMask = $('div', 'abs', world);
  box(numMask, 0, 0, W, HORIZON);
  numMask.style.overflow = 'hidden';
  const num = $('div', 'abs', numMask, numeral);
  num.style.font = `500 ${SIZE}px/1 var(--display)`;
  num.style.color = C.green;
  box(num, 984 - numInk.right, HORIZON - numInk.baseline);
  every((t) => {
    const rise = ease.out(prog(t, -0.08, 1.1));
    const sink = ease.in(prog(t, at.glide - 0.3, 0.36));
    const drop = numInk.ascent + 40;
    num.style.transformOrigin = '50% 100%';
    tf(num, 0, (1 - rise) * drop + sink * drop, lerp(1.06, 1, rise));
    shown(num, sink < 1);
  });

  const eyebrow = $('div', 'abs', world);
  box(eyebrow, 96, 1054);
  const bars = [0, 1, 2].map((i) => {
    const track = $('div', 'abs', eyebrow);
    box(track, i * 62, 0, 52, 6);
    track.style.borderRadius = '3px';
    track.style.background = i < current ? 'var(--gray50)' : 'var(--gray12)';
    const fill = $('div', 'abs', track);
    box(fill, 0, 0, 52, 6);
    fill.style.borderRadius = '3px';
    fill.style.background = C.green;
    fill.style.transformOrigin = '0 50%';
    return { track, fill };
  });
  const ask = $('div', 'abs mask eyebrow', eyebrow);
  box(ask, 3 * 62 + 18, -10);
  const askInner = $('span', '', ask, 'Асуулт');
  every((t) => {
    const mv = ease.inOut(prog(t, at.glide - 0.12, 0.5));
    const out = ease.in(prog(t, at.leave, 0.32));
    tf(eyebrow, 0, -678 * mv - out * 40);
    op(eyebrow, 1 - out);
    bars.forEach((b, i) => {
      b.track.style.transformOrigin = '0 50%';
      b.track.style.transform = `scaleX(${ease.out(prog(t, 0.02 + i * 0.07, 0.6))})`;
      b.fill.style.transform = `scaleX(${i === current ? ease.out(prog(t, at.ask - 0.08, 0.55)) : 0})`;
    });
    askInner.style.transform = `translateY(${(1 - ease.out(prog(t, 0.12, 0.8))) * 115}%)`;
  });

  const head = $('div', 'abs', world);
  box(head, 96, 1100);
  head.style.transformOrigin = '0 0';
  const headLines = lines.map((text, i) => {
    const m = $('div', 'abs mask h1', head);
    box(m, 0, i * 158);
    return $('span', '', m, text);
  });
  const lineIn = [-0.12, at.ask - 0.24];
  every((t) => {
    const mv = ease.inOut(prog(t, at.glide - 0.12, 0.5));
    tf(head, 0, -660 * mv, lerp(1, 0.56, mv));
    let gone = true;
    headLines.forEach((line, i) => {
      const kin = ease.out(prog(t, lineIn[i], 0.9));
      const kout = ease.in(prog(t, at.out + i * 0.05, 0.42));
      line.style.transform = `translateY(${(1 - kin) * 115 - kout * 115}%)`;
      if (kout < 1) gone = false;
    });
    shown(head, !gone);
  });
}

// ---------------------------------------------------------------- boot
/** Loads fonts and beats.json, builds the film and exposes window.FILM / window.seek. */
export function boot(build, { fps = 60, audio = 'out/mix.wav' } = {}) {
  window.ready = (async () => {
    await loadFonts();
    const beats = await (await fetch('beats.json')).json();
    const hit = Object.fromEntries(beats.hits.map((h) => [h.name, h.t]));
    const painters = [];
    build({ hit, beats, world: document.getElementById('world'), every: (fn) => painters.push(fn) });
    const paint = (t) => {
      for (const p of painters) p(t);
    };
    window.FILM = { width: W, height: H, fps, duration: beats.duration, audio };
    window.seek = paint;
    paint(0);
    if (!RENDER) preview(paint, beats.duration);
  })();
}

// Browser preview only: render.mjs never runs this loop.
function preview(paint, duration) {
  const stage = document.getElementById('stage');
  const fit = () => (stage.style.transform = `scale(${Math.min(innerWidth / W, innerHeight / H)})`);
  fit();
  addEventListener('resize', fit);
  const t0 = performance.now();
  const loop = (now) => {
    paint(((now - t0) / 1000) % duration);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
