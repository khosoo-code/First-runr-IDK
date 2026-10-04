// Хан Төгөл Хотхон: "Сүүлийн асуулт" (payment terms), 9:16, 21 s.
// Pure function of time: window.seek(t) paints frame t. Every hit comes from beats.json,
// which is built from the reel's SRT, so each move lands on a spoken word.
import { clamp, lerp, prog, ease, spring, mulberry32 } from './motion.js';

const W = 1080;
const H = 1920;
const FPS = 60;
const RENDER = new URLSearchParams(location.search).has('render');
const C = { cream: '#f7f6ed', white: '#ffffff', ink: '#1b1e23', gold: '#ac905f', green: '#1e4e3e' };

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
      const face = new FontFace(family, `url(fonts/${file}-${subset}-${weight}-${style}.woff2)`, {
        weight: String(weight),
        style,
        unicodeRange: range,
      });
      document.fonts.add(face);
      loads.push(face.load());
    }
  }
  await Promise.all(loads);
}

// ---------------------------------------------------------------- DOM helpers
const $ = (tag, cls, parent, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
};
const SVG_NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs, parent) => {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};
const px = (v) => `${v}px`;
function box(e, x, y, w, h) {
  e.style.left = px(x);
  e.style.top = px(y);
  if (w !== undefined) e.style.width = px(w);
  if (h !== undefined) e.style.height = px(h);
}
function tf(e, x = 0, y = 0, s = 1, r = 0) {
  e.style.transform = `translate(${x}px, ${y}px) scale(${s}) rotate(${r}deg)`;
}
function op(e, o) {
  e.style.opacity = o;
  e.style.visibility = o > 0.001 ? 'visible' : 'hidden';
}
const shown = (e, visible) => (e.style.visibility = visible ? 'visible' : 'hidden');
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const mix = (a, b, k) => `rgb(${rgb(a).map((v, i) => Math.round(lerp(v, rgb(b)[i], k))).join(',')})`;

const measure = document.createElement('canvas').getContext('2d');
/** Ink bounds of `text` in `font`, plus the baseline offset inside a line-height:1 box. */
function ink(text, font, size) {
  measure.font = `${font} ${size}px "Noto Serif Display"`;
  const m = measure.measureText(text);
  const baseline = (size - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
  return { left: -m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight, ascent: m.actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent, width: m.width, baseline };
}

// Line icons. Each path draws on through pathLength="1" dashes.
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
};

function makeIcon(parent, name, w, h, color, width) {
  const def = ICONS[name];
  const el = svg('svg', { viewBox: def.vb, width: w, height: h, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
  const strokes = def.paths.map((d) => svg('path', { d, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, el));
  const dots = (def.dots ?? []).map(([cx, cy]) => svg('circle', { cx, cy, r: 4.2, fill: color, stroke: 'none' }, el));
  return { el, strokes, dots };
}
/** Draw an icon's strokes on, overlapping in sequence; dots pop once the lines are in. */
function drawIcon(icon, k) {
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
function slot(parent, x, y, cls, entries, { stagger = 0.05, dur = 0.85, clip } = {}) {
  const items = entries.map((entry, i) => {
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

// ---------------------------------------------------------------- the film
function build(hit) {
  const world = document.getElementById('world');
  const painters = [];
  const every = (fn) => painters.push(fn);

  // Background: topographic contours drifting slowly, like the foot of the mountain.
  const contours = document.getElementById('contours');
  paintContours(contours, 1157);
  paintGrain(document.getElementById('grain'), 77);
  every((t) => tf(contours, 0, -t * 2.6));

  // ================================================================ 1. Hook: "Сүүлийн асуулт."
  const HORIZON = 1010;
  const horizon = $('div', 'abs', world);
  horizon.style.background = C.gold;
  horizon.style.height = '2px';
  every((t) => {
    const k = ease.out(prog(t, 0, 0.9));
    const r = ease.inOut(prog(t, hit.options - 0.12, 0.48));
    box(horizon, 96 + 888 * r, HORIZON, Math.max(0, 888 * (k - r)));
  });

  const THREE = 980;
  const threeInk = ink('3', '500', THREE);
  const threeMask = $('div', 'abs', world);
  box(threeMask, 0, 0, W, HORIZON);
  threeMask.style.overflow = 'hidden';
  const three = $('div', 'abs', threeMask, '3');
  three.style.font = `500 ${THREE}px/1 var(--display)`;
  three.style.color = C.green;
  box(three, 984 - threeInk.right, HORIZON - threeInk.baseline);
  every((t) => {
    const rise = ease.out(prog(t, -0.08, 1.1));
    const sink = ease.in(prog(t, hit.options - 0.3, 0.36));
    const drop = threeInk.ascent + 40;
    three.style.transformOrigin = '50% 100%';
    tf(three, 0, (1 - rise) * drop + sink * drop, lerp(1.06, 1, rise));
    shown(three, sink < 1);
  });

  // Eyebrow: three progress bars (two answered, the third fills on "асуулт") and the word.
  const eyebrow1 = $('div', 'abs', world);
  box(eyebrow1, 96, 1054);
  const bars = [0, 1, 2].map((i) => {
    const track = $('div', 'abs', eyebrow1);
    box(track, i * 62, 0, 52, 6);
    track.style.borderRadius = '3px';
    track.style.background = i < 2 ? 'var(--gray50)' : 'var(--gray12)';
    const fill = $('div', 'abs', track);
    box(fill, 0, 0, 52, 6);
    fill.style.borderRadius = '3px';
    fill.style.background = C.green;
    fill.style.transformOrigin = '0 50%';
    return { track, fill };
  });
  const ask = $('div', 'abs mask eyebrow', eyebrow1);
  box(ask, 3 * 62 + 18, -10);
  const askInner = $('span', '', ask, 'Асуулт');
  every((t) => {
    const mv = ease.inOut(prog(t, hit.options - 0.12, 0.5));
    const out = ease.in(prog(t, hit['урьдчилгаа'] - 0.5, 0.32));
    tf(eyebrow1, 0, -678 * mv - out * 40);
    op(eyebrow1, 1 - out);
    bars.forEach((b, i) => {
      b.track.style.transformOrigin = '0 50%';
      b.track.style.transform = `scaleX(${ease.out(prog(t, 0.02 + i * 0.07, 0.6))})`;
      b.fill.style.transform = `scaleX(${i === 2 ? ease.out(prog(t, hit['асуулт'] - 0.08, 0.55)) : 0})`;
    });
    askInner.style.transform = `translateY(${(1 - ease.out(prog(t, 0.12, 0.8))) * 115}%)`;
  });

  // Headline. On "options" it glides up and shrinks into the header.
  const head1 = $('div', 'abs', world);
  box(head1, 96, 1100);
  head1.style.transformOrigin = '0 0';
  const h1Lines = ['Сүүлийн', 'асуулт.'].map((text, i) => {
    const m = $('div', 'abs mask h1', head1);
    box(m, 0, i * 158);
    return $('span', '', m, text);
  });
  const h1In = [-0.12, hit['асуулт'] - 0.24];
  every((t) => {
    const mv = ease.inOut(prog(t, hit.options - 0.12, 0.5));
    tf(head1, 0, -660 * mv, lerp(1, 0.56, mv));
    let gone = true;
    h1Lines.forEach((line, i) => {
      const kin = ease.out(prog(t, h1In[i], 0.9));
      const kout = ease.in(prog(t, hit['төлбөрийн'] - 0.3 + i * 0.05, 0.42));
      line.style.transform = `translateY(${(1 - kin) * 115 - kout * 115}%)`;
      if (kout < 1) gone = false;
    });
    shown(head1, !gone);
  });

  // ================================================================ 2. Three ways to pay
  const CARD = { x: 96, w: 888, h: 196, gap: 24, y0: 690, y1: 800 };
  const PANEL = { x: 64, y: 948, w: 952, h: 500 };
  const cardDefs = [
    { index: '01', title: 'Хувь лизинг', icon: 'calendar', t: hit['хувь лизинг'] },
    { index: '02', title: 'Бартер', icon: 'exchange', t: hit['бартер'] },
    { index: '03', title: 'Банкны зээл', icon: 'bank', t: hit['банкны зээл'] },
  ];
  const cards = cardDefs.map((def, i) => {
    const root = $('div', 'abs', world);
    root.style.perspective = '2600px';
    const front = $('div', 'face', root);
    const back = i === 0 ? $('div', 'face', root) : null;
    const content = $('div', 'abs', front);
    const disc = $('div', 'icon-disc', content);
    box(disc, 36, 38);
    const icon = makeIcon(disc, def.icon, 76, 76, C.green, 3.4);
    const title = $('div', 'abs mask card-title', content);
    box(title, 192, 62);
    const titleInner = $('span', '', title, def.title);
    const index = $('div', 'abs card-index', content, def.index);
    box(index, 888 - 44 - 44, 46);
    return { def, root, front, back, content, icon, titleInner, index };
  });

  const shiftK = (t) => ease.inOut(prog(t, hit['төлбөрийн'] - 0.16, 0.85));
  const morphK = (t) => ease.inOut(prog(t, hit['урьдчилгаа'] - 0.08, 0.85));
  const flipK = (t) => ease.inOut(prog(t, hit['мөн дээрээс нь'] - 0.1, 0.9));
  const shrinkK = (t) => ease.inOut(prog(t, hit['бартерт'] + 0.28, 0.8));

  cards.forEach((card, i) => {
    every((t) => {
      const start = card.def.t - (i === 0 ? 0.2 : 0.34);
      const k = ease.out(prog(t, start, 0.95));
      const yStack = lerp(CARD.y0, CARD.y1, shiftK(t)) + i * (CARD.h + CARD.gap);
      let x = CARD.x, y = yStack, w = CARD.w, h = CARD.h, radius = 30;
      if (i === 0) {
        const m = morphK(t);
        x = lerp(x, PANEL.x, m);
        y = lerp(y, PANEL.y, m);
        w = lerp(w, PANEL.w, m);
        h = lerp(h, PANEL.h, m) - lerp(0, PANEL.h - 252, shrinkK(t));
        radius = lerp(30, 38, m);
      }
      box(card.root, x, y, w, h);
      const lift = (1 - k) * 80;
      // Wipe up from the bottom edge; negative insets keep the soft shadow.
      const top = lerp(h + 2, -80, k);
      for (const face of [card.front, card.back]) {
        if (!face) continue;
        face.style.borderRadius = px(radius);
        face.style.clipPath = k < 1 ? `inset(${top}px -80px -80px -80px round ${radius}px)` : 'none';
      }
      let exitY = 0, exitR = 0;
      if (i > 0) {
        const out = ease.inStrong(prog(t, hit['урьдчилгаа'] - 0.3 + (2 - i) * 0.07, 0.6));
        exitY = out * 1250;
        exitR = out * (i === 1 ? -4 : 5);
      }
      tf(card.root, 0, lift + exitY, 1, exitR);
      shown(card.root, t >= start && exitY < 1240);

      const flip = i === 0 ? flipK(t) : 0;
      card.front.style.transform = `rotateY(${flip * -180}deg)`;
      if (card.back) card.back.style.transform = `rotateY(${180 - flip * 180}deg)`;

      // Card content: icon draws, title rises, index slides; leaves as the card becomes the panel.
      drawIcon(card.icon, prog(t, start + 0.18, 1.0));
      card.titleInner.style.transform = `translateY(${(1 - ease.out(prog(t, start + 0.12, 0.85))) * 115}%)`;
      const idx = ease.out(prog(t, start + 0.3, 0.7));
      tf(card.index, (1 - idx) * 24, 0);
      op(card.index, idx);
      const leave = i === 0 ? ease.in(prog(t, hit['урьдчилгаа'] - 0.16, 0.3)) : 0;
      tf(card.content, 0, -leave * 40);
      op(card.content, 1 - leave);
    });
  });

  // Header for the options: "Төлбөрийн уян хатан нөхцөл", with a gold line that flexes on "уян хатан".
  const head2 = $('div', 'abs', world);
  box(head2, 96, 440);
  const h2Text = ['Төлбөрийн', '<span class="green">уян хатан</span>', 'нөхцөл'];
  const h2Lines = h2Text.map((html, i) => {
    const m = $('div', 'abs mask h2', head2);
    box(m, 0, i * 104);
    return $('span', '', m, html);
  });
  const flexW = ink('уян хатан', '400', 96).width;
  const flex = svg('svg', { width: flexW + 40, height: 60, viewBox: `0 0 ${flexW + 40} 60`, fill: 'none' }, head2);
  flex.style.position = 'absolute';
  box(flex, -6, 104 + 104 - 14);
  const flexPath = svg('path', { stroke: C.gold, 'stroke-width': 4, 'stroke-linecap': 'round' }, flex);
  every((t) => {
    let gone = true;
    h2Lines.forEach((line, i) => {
      const kin = ease.out(prog(t, hit['төлбөрийн'] - 0.2 + i * 0.09, 0.9));
      const kout = ease.in(prog(t, hit['урьдчилгаа'] - 0.3 + i * 0.05, 0.42));
      line.style.transform = `translateY(${(1 - kin) * 115 - kout * 115}%)`;
      if (t >= hit['төлбөрийн'] - 0.2 && kout < 1) gone = false;
    });
    shown(head2, !gone);
    const draw = ease.out(prog(t, hit['уян хатан'] - 0.32, 0.8));
    const out = ease.in(prog(t, hit['урьдчилгаа'] - 0.3, 0.4));
    const amp = 13 * Math.sin(Math.PI * prog(t, hit['уян хатан'] - 0.1, 1.1)) * (1 - out);
    const len = (flexW + 12) * draw;
    const from = (flexW + 12) * out;
    const pts = [];
    for (let s = 0; s <= 48; s++) {
      const x = 6 + from + ((len - from) * s) / 48;
      const y = 30 + amp * Math.sin((x / flexW) * Math.PI * 3 - t * 7.5) * Math.sin((Math.PI * (x - 6)) / flexW);
      pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    flexPath.setAttribute('d', len - from > 1 ? `M${pts.join(' L')}` : '');
  });

  // ================================================================ 3–5. In-house leasing
  const eyebrow = slot(world, 96, 376, 'eyebrow', [
    { t: hit['урьдчилгаа'], html: '01 — Хувь лизинг', lead: 0.1 },
    { t: hit['мөн дээрээс нь'], html: '02 — Бартер', lead: 0.1 },
  ]);
  every(eyebrow);

  // Hero numerals sit on one baseline; labels below them carry the spoken words.
  const HERO_BASE = 724;
  const heroInk = ink('30%', '500', 340);
  const heroY = HERO_BASE - heroInk.baseline;
  const unit = (s) => `<span class="unit">${s}</span>`;
  const count18 = { value: 6 };
  const heroClip = [heroInk.baseline - heroInk.ascent - 22, heroInk.baseline + 34];
  const hero = slot(world, 92, heroY, 'hero', [
    { t: hit['30%'], parts: ['3', '0', '%'], lead: 0.24, exit: hit['үлдэгдэл'] - 0.24 },
    { t: hit['6 сар'], parts: ['6', unit('сар')], lead: 0.16 },
    { t: hit['хүүгүй'], parts: ['0', '%'], lead: 0.18, exit: hit['эсвэл'] - 0.12 },
    {
      t: hit['18 сар'],
      parts: ['18', unit('сар')],
      lead: 0.14,
      update: (t, parts) => {
        count18.value = Math.round(lerp(6, 18, ease.outSoft(prog(t, hit['18 сар'] - 0.04, 0.9))));
        parts[0].textContent = String(count18.value);
      },
    },
    { t: hit['1.6%'], parts: ['1', '.', '6', '%'], lead: 0.2, exit: hit['мөн дээрээс нь'] - 0.3 },
    { t: hit['30% бартер'], parts: ['<span class="gold">3</span>', '<span class="gold">0</span>', '<span class="gold">%</span>'], lead: 0.24, exit: Infinity },
  ], { stagger: 0.055, dur: 0.95, clip: heroClip });
  every(hero);

  // The "+" for "Мөн дээрээс нь" (and on top of that), in gold hairline bars.
  const plus = $('div', 'abs', world);
  const PLUS = 210;
  box(plus, 96 + 12, HERO_BASE - PLUS - 18, PLUS, PLUS);
  const arms = [0, 1].map((i) => {
    const a = $('div', 'abs', plus);
    box(a, 0, PLUS / 2 - 9, PLUS, 18);
    a.style.background = C.gold;
    a.style.borderRadius = '9px';
    a.style.transform = `rotate(${i * 90}deg)`;
    return a;
  });
  every((t) => {
    const s = spring(t - (hit['мөн дээрээс нь'] + 0.04), { freq: 1.5, damping: 0.78 });
    const out = ease.in(prog(t, hit['30% бартер'] - 0.3, 0.42));
    const scale = s * (1 - out);
    plus.style.transformOrigin = '50% 50%';
    tf(plus, 0, 0, Math.max(0.0001, scale), lerp(-90, 0, s) + out * 90);
    shown(plus, scale > 0.001);
    arms.forEach((a, i) => (a.style.transform = `rotate(${i * 90}deg) scaleX(${ease.out(prog(t, hit['мөн дээрээс нь'] + 0.04 + i * 0.08, 0.7))})`));
  });

  const LABEL1 = HERO_BASE + 34;
  const LABEL2 = LABEL1 + 94;
  const label1 = slot(world, 96, LABEL1, 'label', [
    { t: hit['урьдчилгаа'] + 0.3, html: 'Урьдчилгаа', lead: 0.06 },
    { t: hit['үлдэгдэл'], html: 'үлдэгдлийн' },
    { t: hit['хүүгүй'], html: '<span class="green">Хүүгүй</span>' },
    { t: hit['эсвэл'], html: '<span class="gold it">Эсвэл</span>' },
    { t: hit['18 сар'] + 0.62, html: 'хүртэл' },
    { t: hit['1.6%'], html: 'сарын хүүтэй' },
    { t: hit['мөн дээрээс нь'], html: 'Мөн дээрээс нь' },
    { t: hit['үнийн дүнгийн'], html: 'Үнийн дүнгийн' },
    { t: hit['гэрчилгээтэй'], html: 'Гэрчилгээтэй' },
    { t: hit['бартерт'], html: '<span class="gold">Бартерт</span> оролцуулах' },
  ]);
  const label2 = slot(world, 96, LABEL2, 'label', [
    { t: hit['6 сар'], html: 'хугацаа', exit: hit['хүүгүй'] - 0.3 },
    { t: hit['хүүгүй'] + 0.3, html: 'хувь лизинг', exit: hit['эсвэл'] - 0.3 },
    { t: hit['төлөх боломжтой'], html: 'төлөх боломжтой', exit: hit['мөн дээрээс нь'] - 0.42 },
    { t: hit['автомашин'], html: 'автомашин' },
    { t: hit['үл хөдлөх'], html: 'үл хөдлөх хөрөнгө', exit: hit['бартерт'] - 0.3 },
    { t: hit['боломжтой'], html: '<span class="green">боломжтой.</span>', lead: 0.16, exit: Infinity },
  ]);
  every(label1);
  every(label2);

  // Panel content, front face: the price bar, the months, the plan toggle.
  const front = cards[0].front;
  const lease = $('div', 'abs', front);
  box(lease, 0, 0, PANEL.w, PANEL.h);
  const BAR = { x: 56, y: 104, w: 840, h: 124 };
  const DOWN = Math.round(BAR.w * 0.3);
  const GAP = 8;

  function captionRow(parent) {
    const left = $('div', 'abs mask caption', parent);
    box(left, 56, 44);
    const leftInner = $('span', '', left, 'Үнийн дүн');
    const right = $('div', 'abs mask caption muted', parent);
    const rightInner = $('span', '', right, '100%');
    measure.font = '600 34px Manrope';
    box(right, 56 + BAR.w - measure.measureText('100%').width, 44);
    return (k) => {
      leftInner.style.transform = rightInner.style.transform = `translateY(${(1 - k) * 115}%)`;
    };
  }
  const leaseCaption = captionRow(lease);

  const bar = $('div', 'bar', lease);
  box(bar, BAR.x, BAR.y, BAR.w, BAR.h);
  const down = $('div', 'abs', bar);
  down.style.background = C.green;
  const downLabel = $('div', 'abs seg-label', bar, '30%');
  const rem = $('div', 'abs', bar);
  box(rem, DOWN + GAP, 0, BAR.w - DOWN - GAP, BAR.h);
  const REM_W = BAR.w - DOWN - GAP;
  const slots = Array.from({ length: 18 }, () => {
    const s = $('div', 'abs', rem);
    s.style.background = 'rgba(172,144,95,0.22)';
    return s;
  });
  const month6 = Array.from({ length: 6 }, (_, i) => {
    const m = $('div', 'abs mask', lease);
    return { m, inner: $('span', 'tick-label', m, String(i + 1)) };
  });
  const month18 = [0, 5, 11, 17].map((i) => {
    const m = $('div', 'abs mask', lease);
    return { i, m, inner: $('span', 'tick-label', m, String(i + 1)) };
  });
  const ticks = Array.from({ length: 18 }, () => {
    const k = $('div', 'abs', lease);
    k.style.background = 'var(--gray50)';
    return k;
  });

  const CTRL = { x: 56, y: 300, w: 840, h: 128 };
  const control = $('div', 'control', lease);
  box(control, CTRL.x, CTRL.y, CTRL.w, CTRL.h);
  const thumb = $('div', 'abs', control);
  thumb.style.background = C.green;
  thumb.style.borderRadius = '56px';
  const optA = $('div', 'abs mask opt', control);
  const optAInner = $('span', '', optA, '6 сар · 0% хүү');
  const optAWidth = (() => { measure.font = '700 38px Manrope'; return measure.measureText('6 сар · 0% хүү').width; })();
  box(optA, CTRL.w / 4 - optAWidth / 2, CTRL.h / 2 - 19);
  const optB = $('div', 'abs mask opt', control);
  box(optB, CTRL.w / 2 + 90, CTRL.h / 2 - 19);
  const optBMain = $('span', '', optB, '18 сар');
  const optBRate = $('span', '', optB, '&nbsp;· 1.6%');
  const checkWrap = $('div', 'abs', control);
  box(checkWrap, CTRL.w / 2 + 30, CTRL.h / 2 - 26);
  const check = makeIcon(checkWrap, 'check', 52, 52, C.white, 9);

  every((t) => {
    const m = morphK(t);
    shown(lease, m > 0.6 && flipK(t) < 0.5);
    leaseCaption(ease.out(prog(t, hit['урьдчилгаа'] + 0.3, 0.8)));
    const track = ease.out(prog(t, hit['урьдчилгаа'] + 0.36, 0.9));
    bar.style.clipPath = `inset(0 ${(1 - track) * 100}% 0 0 round 24px)`;

    // 30% down payment fills on "30%".
    const fill = ease.out(prog(t, hit['30%'] - 0.12, 0.85));
    box(down, 0, 0, DOWN * fill, BAR.h);
    box(downLabel, 30, BAR.h / 2 - 19);
    downLabel.style.transform = `translateY(${(1 - ease.out(prog(t, hit['30%'] + 0.12, 0.6))) * 40}px)`;
    op(downLabel, ease.out(prog(t, hit['30%'] + 0.12, 0.4)));

    // The remainder: one block on "үлдэгдэл", six on "6 сар", eighteen on "18 сар".
    const remFill = ease.out(prog(t, hit['үлдэгдэл'] - 0.1, 0.8));
    rem.style.clipPath = `inset(0 ${(1 - remFill) * 100}% 0 0)`;
    const gaps = [];
    for (let k = 1; k < 18; k++) {
      const g6 = k % 3 === 0 ? ease.inOut(prog(t, hit['6 сар'] - 0.14 + (k / 3 - 1) * 0.06, 0.6)) * 10 : 0;
      const g18 = ease.inOut(prog(t, hit['18 сар'] - 0.06 + k * 0.03, 0.55));
      gaps.push(lerp(g6, 5, g18));
    }
    const slotW = (REM_W - gaps.reduce((a, b) => a + b, 0)) / 18;
    const xs = [];
    let x = 0;
    slots.forEach((s, i) => {
      xs.push(x);
      box(s, x, 0, slotW + 0.5, BAR.h);
      const gl = i > 0 ? gaps[i - 1] : 12;
      const gr = i < 17 ? gaps[i] : 12;
      s.style.borderRadius = `${Math.min(8, gl)}px ${Math.min(8, gr)}px ${Math.min(8, gr)}px ${Math.min(8, gl)}px`;
      const centre = BAR.x + DOWN + GAP + x + slotW / 2;
      ticks[i].style.left = px(centre - 1);
      x += slotW + (gaps[i] ?? 0);
    });

    // Month labels: 1–6 under the six blocks, then 1 · 6 · 12 · 18 with ticks for all eighteen.
    month6.forEach((mo, i) => {
      const cx = BAR.x + DOWN + GAP + (xs[3 * i] + xs[3 * i + 2] + slotW) / 2;
      box(mo.m, cx - 30, BAR.y + BAR.h + 22);
      const kin = ease.out(prog(t, hit['6 сар'] + 0.05 + i * 0.05, 0.7));
      const kout = ease.in(prog(t, hit['18 сар'] - 0.1 + i * 0.03, 0.35));
      mo.inner.style.transform = `translateY(${(1 - kin) * 115 - kout * 115}%)`;
    });
    month18.forEach((mo, j) => {
      const centre = parseFloat(ticks[mo.i].style.left) + 1;
      box(mo.m, centre - 30, BAR.y + BAR.h + 40);
      mo.inner.style.transform = `translateY(${(1 - ease.out(prog(t, hit['18 сар'] + 0.25 + j * 0.07, 0.7))) * 115}%)`;
    });
    ticks.forEach((k, i) => {
      const kk = ease.out(prog(t, hit['18 сар'] + 0.05 + i * 0.025, 0.5));
      box(k, parseFloat(k.style.left), BAR.y + BAR.h + 14, 2, 14 * kk);
    });

    // Plan toggle: appears with "хүүгүй", grows option B on "эсвэл", switches on "18 сар".
    const cin = ease.out(prog(t, hit['хүүгүй'] - 0.2, 0.85));
    control.style.clipPath = `inset(0 ${(1 - cin) * 100}% 0 0 round 64px)`;
    const sw = ease.inOut(prog(t, hit['18 сар'] - 0.12, 0.7));
    box(thumb, lerp(8, CTRL.w / 2, sw), 8, CTRL.w / 2 - 8, CTRL.h - 16);
    optAInner.style.transform = `translateY(${(1 - ease.out(prog(t, hit['хүүгүй'], 0.8))) * 115}%)`;
    optA.style.color = sw < 0.5 ? C.white : C.ink;
    optB.style.color = sw < 0.5 ? C.ink : C.white;
    op(optA, sw < 0.5 ? 1 : lerp(0.45, 0.55, sw));
    optBMain.style.transform = `translateY(${(1 - ease.out(prog(t, hit['эсвэл'] - 0.08, 0.8))) * 115}%)`;
    optBRate.style.transform = `translateY(${(1 - ease.out(prog(t, hit['1.6%'] - 0.1, 0.8))) * 115}%)`;
    drawIcon(check, prog(t, hit['төлөх боломжтой'] - 0.06, 0.6));
  });

  // ================================================================ 6. Barter (back face)
  const back = cards[0].back;
  const barter = $('div', 'abs', back);
  box(barter, 0, 0, PANEL.w, PANEL.h);
  const barterCaption = captionRow(barter);
  const bar2 = $('div', 'bar', barter);
  box(bar2, BAR.x, BAR.y, BAR.w, BAR.h);
  const goldSeg = $('div', 'abs', bar2);
  goldSeg.style.background = C.gold;
  const goldLabel = $('div', 'abs seg-label', bar2, '30%');
  const restLabel = $('div', 'abs caption muted', bar2, '70%');

  const TILE = { y: 262, w: 408, h: 210 };
  const tiles = [
    { x: 56, icon: 'car', label: 'Автомашин', t: hit['автомашин'], iw: 232, ih: 116 },
    { x: 488, icon: 'house', label: 'Үл хөдлөх хөрөнгө', t: hit['үл хөдлөх'], iw: 206, ih: 122 },
  ].map((d, i) => {
    const tile = $('div', 'tile', barter);
    box(tile, d.x, TILE.y, TILE.w, TILE.h);
    const label = $('div', 'abs mask tile-label', tile);
    const labelInner = $('span', '', label, d.label);
    measure.font = '600 34px Manrope';
    box(label, (TILE.w - measure.measureText(d.label).width) / 2, TILE.h - 56);
    const seal = $('div', 'abs', tile);
    box(seal, TILE.w - 64, 18, 46, 46);
    seal.style.borderRadius = '50%';
    seal.style.background = C.gold;
    const sealCheck = makeIcon(seal, 'check', 46, 46, C.white, 10);
    // Icons live on the face, not in the tile, so they can fly into the bar.
    const iconWrap = $('div', 'abs', barter);
    const home = { x: d.x + (TILE.w - d.iw) / 2, y: TILE.y + 18 + (122 - d.ih) / 2 };
    box(iconWrap, home.x, home.y, d.iw, d.ih);
    iconWrap.style.transformOrigin = '0 0';
    const icon = makeIcon(iconWrap, d.icon, d.iw, d.ih, C.ink, 3.4);
    return { d, i, tile, labelInner, seal, sealCheck, iconWrap, icon, home };
  });

  every((t) => {
    const f = flipK(t);
    shown(barter, f > 0.5);
    barterCaption(ease.out(prog(t, hit['мөн дээрээс нь'] + 0.72, 0.8)));
    const track = ease.out(prog(t, hit['мөн дээрээс нь'] + 0.78, 0.9));
    bar2.style.clipPath = `inset(0 ${(1 - track) * 100}% 0 0 round 24px)`;
    const fill = ease.out(prog(t, hit['30% бартер'] - 0.12, 0.85));
    box(goldSeg, 0, 0, DOWN * fill, BAR.h);
    box(goldLabel, 30, BAR.h / 2 - 19);
    const swapOut = ease.in(prog(t, hit['бартерт'] - 0.1, 0.3));
    const gl = ease.out(prog(t, hit['30% бартер'] + 0.12, 0.6));
    goldLabel.style.transform = `translateY(${(1 - gl) * 40 - swapOut * 40}px)`;
    op(goldLabel, Math.min(gl, 1 - swapOut));
    box(restLabel, DOWN + (BAR.w - DOWN) / 2 - 34, BAR.h / 2 - 17);
    op(restLabel, ease.out(prog(t, hit['30% бартер'] + 0.3, 0.6)));

    const fly = ease.inOut(prog(t, hit['бартерт'] - 0.06, 0.95));
    const collapse = ease.in(prog(t, hit['бартерт'] + 0.18, 0.45));
    tiles.forEach((tl) => {
      const k = ease.out(prog(t, hit['гэрчилгээтэй'] - 0.3 + tl.i * 0.1, 0.9));
      tl.tile.style.clipPath = `inset(${lerp(TILE.h + 2, 0, k) + collapse * TILE.h}px 0 0 0 round 28px)`;
      tf(tl.tile, 0, (1 - k) * 50 + collapse * 30);
      shown(tl.tile, k > 0 && collapse < 1);
      const sealK = spring(t - (hit['гэрчилгээтэй'] + 0.05 + tl.i * 0.1), { freq: 2.4, damping: 0.6 });
      tl.seal.style.transform = `scale(${Math.max(0, sealK)})`;
      drawIcon(tl.sealCheck, prog(t, hit['гэрчилгээтэй'] + 0.2 + tl.i * 0.1, 0.5));
      tl.labelInner.style.transform = `translateY(${(1 - ease.out(prog(t, tl.d.t - 0.1, 0.8))) * 115}%)`;

      drawIcon(tl.icon, prog(t, tl.d.t - 0.16, 1.05));
      // Fly into the gold 30% along an arc, turning white on the gold.
      const scale = tl.i === 0 ? 0.4 : 0.42;
      const target = { x: BAR.x + 26 + tl.i * 118, y: BAR.y + (BAR.h - tl.d.ih * scale) / 2 };
      const s = lerp(1, scale, fly);
      const arc = Math.sin(Math.PI * fly) * -70;
      tf(tl.iconWrap, lerp(0, target.x - tl.home.x, fly), lerp(0, target.y - tl.home.y, fly) + arc, s);
      tl.icon.el.setAttribute('stroke', mix(C.ink, C.white, clamp((fly - 0.3) / 0.4)));
      tl.icon.el.setAttribute('stroke-width', lerp(3, 6, fly));
      shown(tl.iconWrap, t >= tl.d.t - 0.2);
    });
  });

  // Gentle push on the whole layout so holds never sit dead still.
  every((t) => {
    world.style.transformOrigin = '50% 45%';
    world.style.transform = `translateY(${shrinkK(t) * 96}px) scale(${1 + 0.012 * Math.sin((t / 21) * Math.PI)})`;
  });

  return (t) => {
    for (const paint of painters) paint(t);
  };
}

// ---------------------------------------------------------------- boot
async function main() {
  await loadFonts();
  const beats = await (await fetch('beats.json')).json();
  const hit = Object.fromEntries(beats.hits.map((h) => [h.name, h.t]));
  const paint = build(hit);
  window.FILM = { width: W, height: H, fps: FPS, duration: beats.duration, audio: 'out/mix.wav' };
  window.seek = paint;
  paint(0);
  if (!RENDER) preview(paint, beats.duration);
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

window.ready = main();
