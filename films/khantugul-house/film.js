// Хан Төгөл house clip: viral word-by-word timing in the luxury register. «танд илүү их орон
// зай / тав тух, үнэ цэнэ хэрэгтэй байгаа бол / Энэ Хаус танд яг тохирно». 1080×1920, 30 fps,
// 171 frames, transparent.
//
// Words pop in one at a time on their spoken syllable and each phrase snap-cuts in with a soft
// zoom punch, as in viral captions, but dressed as Хан Төгөл: cream Noto Serif Display on
// deep-green plates that widen as the words arrive (the bright footage needs a backing; no
// outlines), key words in gold italic, a gold house medallion on «хаус», and the finale «Яг
// тохирно» on a cream plate with a check medallion. Everything sits above her head
// (y 170–560), clear of the burned-in subtitles at the bottom.
//
// Pure function of time: window.seek(t) paints frame t. Add ?backdrop to review it over a
// frame of the footage (render.mjs --query backdrop); the render itself stays transparent.
import { ease, lerp, prog, spring } from '../shared/motion.js';
import { $, boot, box, shown, svg } from '../shared/kit.js';

const W = 1080;
const BACKDROP = new URLSearchParams(location.search).has('backdrop');
let backdrop;
async function preload() {
  if (!BACKDROP) return;
  backdrop = new Image();
  backdrop.src = 'backdrop.jpg';
  await backdrop.decode();
}

const BASE = 118; // px; a line shrinks to fit MAX_W
const MAX_W = 920;
const LINE_Y = [292, 458]; // line centres
const PAD = 0.36; // plate padding either side, em
const POP = 0.04; // a word pops this long before its syllable

// Pages: lines of words; * marks a key word (gold italic). The last page puts its second line
// on a cream plate.
// «зай» lands only 0.15 s before the next phrase, so «орон зай» pops as one word on «орон».
const PAGES = [
  { lines: [['танд', 'илүү', 'их'], ['орон зай*']] },
  { lines: [['тав', 'тух,'], ['үнэ*', 'цэнэ*']] },
  { lines: [['хэрэгтэй*'], ['байгаа', 'бол']] },
  { lines: [['энэ', 'хаус*'], ['танд 2']], sticker: 'house' },
  { lines: [['яг'], ['тохирно*']], boxed: true, sticker: 'check' },
];

/** A round medallion: the gold house on green, or the green check on cream with a gold ring. */
function medal(parent, kind, size) {
  const el = $('div', 'abs medal', parent);
  box(el, 0, 0, size, size);
  el.style.background = kind === 'house' ? 'var(--green)' : 'var(--cream)';
  if (kind === 'check') el.style.boxShadow += ', inset 0 0 0 5px var(--gold)';
  const icon = svg('svg', { viewBox: '0 0 100 100', width: size * 0.62, height: size * 0.62, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, el);
  if (kind === 'house') {
    const st = { stroke: 'var(--gold)', 'stroke-width': 6 };
    svg('path', { d: 'M12 48 L50 16 L88 48', ...st }, icon);
    svg('path', { d: 'M22 40 V86 H78 V40', ...st }, icon);
    svg('path', { d: 'M42 86 V62 H58 V86', ...st }, icon);
  } else {
    svg('path', { d: 'M28 52 L44 67 L73 36', stroke: 'var(--green)', 'stroke-width': 10 }, icon);
  }
  return el;
}

boot(({ hit, world, every }) => {
  if (BACKDROP) {
    backdrop.id = 'backdrop';
    world.parentNode.insertBefore(backdrop, world);
  }

  const pages = PAGES.map((p) => {
    const el = $('div', 'abs', world);
    box(el, 0, 0, W, 760);
    const lines = p.lines.map((names, li) => {
      const light = p.boxed && li === 1;
      const plate = $('div', `abs plate${light ? ' light' : ''}`, el);
      const line = $('div', `abs vline${light ? ' on-light' : ''}`, el);
      const words = names.map((raw, wi) => {
        const text = raw.replace('*', '').replace(/ \d$/, ''); // shown, with punctuation
        const name = raw.replace('*', '').replace(/[,.!]$/, ''); // its word in beats.json
        if (wi) line.append(' ');
        const s = $('span', `vw${raw.endsWith('*') ? ' key' : ''}`, line, text);
        // A two-word key («орон зай») pops as one, on its first word.
        return { name, s, at: hit[name] ?? hit[name.split(' ')[0]] };
      });
      // Fit the line to MAX_W, then centre it on its row.
      line.style.fontSize = `${BASE}px`;
      const size = Math.min(BASE * (light ? 1.1 : 1), (BASE * MAX_W) / line.offsetWidth);
      line.style.fontSize = `${size}px`;
      const w = line.offsetWidth;
      const x = (W - w) / 2;
      box(line, x, LINE_Y[li] - size * 0.56);
      // Plate edges as each word arrives: from the first word's left to the latest word's right.
      const pad = PAD * size;
      const rights = words.map((wd) => x + wd.s.offsetLeft + wd.s.offsetWidth + pad);
      const plateBox = { left: x - pad, top: LINE_Y[li] - size * 0.66, h: size * 1.32 };
      return { line, plate, words, size, w, x, rights, plateBox };
    });
    let md = null;
    if (p.sticker) {
      // Beside the word it celebrates: «хаус» or «тохирно».
      const house = p.sticker === 'house';
      const host = house ? lines[0] : lines[1];
      const size = house ? 128 : 116;
      md = medal(el, p.sticker, size);
      box(md, Math.min(host.rights.at(-1) - size * 0.28, W - size - 12), host.plateBox.top - size * 0.55);
    }
    return { p, el, lines, first: lines[0].words[0].at, md };
  });

  every((t) => {
    pages.forEach((pg, i) => {
      const next = pages[i + 1];
      // Cut: a page holds until the next one's first word pops.
      const live = t >= pg.first - POP && (!next || t < next.first - POP);
      pg.el.style.display = live ? '' : 'none';
      if (!live) return;
      // A soft zoom punch as the page lands, then a slow push while it holds.
      const punch = 1 + 0.09 * (1 - ease.out(prog(t, pg.first - POP, 0.3)));
      const push = 1 + 0.02 * prog(t, pg.first, 1.4);
      pg.el.style.transformOrigin = `50% ${LINE_Y[0] + 70}px`;
      pg.el.style.transform = `scale(${punch * push})`;

      pg.lines.forEach((l) => {
        // The plate grows word by word; it pops up with the line's first word.
        let right = l.rights[0];
        l.words.forEach((wd, k) => {
          if (k) right += (l.rights[k] - l.rights[k - 1]) * ease.out(prog(t, wd.at - POP - 0.04, 0.2));
          const s = spring(t - (wd.at - POP), { freq: 3.0, damping: 0.5 });
          wd.s.style.visibility = t >= wd.at - POP ? 'inherit' : 'hidden';
          wd.s.style.transform = `translateY(${(1 - s) * 0.32 * l.size}px) scale(${Math.max(0, lerp(0.55, 1, s))})`;
        });
        const k0 = spring(t - (l.words[0].at - POP - 0.03), { freq: 2.6, damping: 0.6 });
        const pb = l.plateBox;
        box(l.plate, pb.left, pb.top, right - pb.left, pb.h);
        l.plate.style.transformOrigin = '50% 50%';
        l.plate.style.transform = `scaleY(${Math.max(0, Math.min(1.08, k0))})`;
        shown(l.plate, t >= l.words[0].at - POP - 0.03);
      });

      if (pg.md) {
        const at = pg.p.sticker === 'house' ? hit['хаус'] + 0.1 : hit['тохирно'] + 0.3;
        const k = spring(t - at, { freq: 2.4, damping: 0.5 });
        pg.md.style.transform = `scale(${Math.max(0, k)}) rotate(${(1 - Math.min(1, k)) * -30}deg)`;
        shown(pg.md, k > 0.001);
      }
    });
  });
}, { fps: 30, alpha: true, preload });
