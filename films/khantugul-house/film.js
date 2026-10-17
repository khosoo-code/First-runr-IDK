// Хан Төгөл house clip: luxury text overlay. «танд илүү их орон зай / тав тух, үнэ цэнэ
// хэрэгтэй байгаа бол / Энэ Хаус танд яг тохирно». 1080×1920, 30 fps, 171 frames, transparent.
//
// Two boards build word by word and hold, instead of cutting phrase by phrase:
//   A (0.2–3.0 s)  ТАНД ИЛҮҮ ИХ / ОРОН ЗАЙ / ТАВ ТУХ · ҮНЭ ЦЭНЭ / ХЭРЭГТЭЙ БАЙГАА БОЛ
//   B (3.1–5.7 s)  ЭНЭ ХАУС / ТАНД / ЯГ ТОХИРНО
// Tracked Montserrat capitals in white with a soft shadow (no boxes, no outlines), key words
// and hairlines in gold. Each word wipes in on its spoken syllable; board A wipes off before B.
// Everything sits above her head (y 190–550), clear of the burned-in subtitles at the bottom.
//
// Pure function of time: window.seek(t) paints frame t. Add ?backdrop to review it over a
// frame of the footage (render.mjs --query backdrop); the render itself stays transparent.
import { ease, prog } from '../shared/motion.js';
import { $, boot, box, shown } from '../shared/kit.js';

const W = 1080;
const MAX_W = 960;
const BACKDROP = new URLSearchParams(location.search).has('backdrop');
const SUBSETS = {
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
  cyrillic: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
  'cyrillic-ext': 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F',
};
let backdrop;
/** Montserrat 600/800 (from ../cargo-shared/fonts) and, for review, the backdrop frame. */
async function preload() {
  const loads = [];
  for (const weight of [600, 800]) {
    for (const [subset, range] of Object.entries(SUBSETS)) {
      const url = new URL(`../cargo-shared/fonts/montserrat-${subset}-${weight}-normal.woff2`, import.meta.url);
      const face = new FontFace('Montserrat', `url(${url})`, { weight: String(weight), unicodeRange: range });
      document.fonts.add(face);
      loads.push(face.load());
    }
  }
  if (BACKDROP) {
    backdrop = new Image();
    backdrop.src = 'backdrop.jpg';
    loads.push(backdrop.decode());
  }
  await Promise.all(loads);
}

// Each word: [text, its word in beats.json, extra class]. A line's top is y. «хэрэгтэй байгаа
// бол» comes in whole on «хэрэгтэй»: its last words land as board A has to clear for B.
const BOARDS = [
  [
    { cls: 'small', y: 190, words: [['Танд', 'танд'], ['илүү', 'илүү'], ['их', 'их']] },
    { cls: 'big gold', y: 252, words: [['Орон', 'орон'], ['зай', 'зай']] },
    { hair: 150, y: 404, at: 'зай' },
    { cls: 'mid', y: 428, words: [['Тав', 'тав'], ['тух', 'тух'], ['·', 'үнэ'], ['үнэ', 'үнэ'], ['цэнэ', 'цэнэ']] },
    { cls: 'small', size: 36, y: 510, words: [['Хэрэгтэй байгаа бол', 'хэрэгтэй']] },
  ],
  [
    { cls: 'big', y: 196, words: [['Энэ', 'энэ'], ['хаус', 'хаус', 'gold']] },
    { cls: 'small', y: 354, words: [['танд', 'танд 2']] },
    { cls: 'big', size: 108, y: 420, words: [['яг', 'яг'], ['тохирно', 'тохирно', 'gold']] },
    { hair: 220, y: 546, at: 'тохирно', delay: 0.3 },
  ],
];
const LEAD = 0.12; // a word starts its wipe this long before its syllable
const WIPE = 0.7; // and takes this long

boot(({ hit, world, every }) => {
  if (BACKDROP) {
    backdrop.id = 'backdrop';
    world.parentNode.insertBefore(backdrop, world);
  }

  const boards = BOARDS.map((spec) => {
    const el = $('div', 'abs', world);
    box(el, 0, 0, W, 760);
    const lines = spec.map((l) => {
      if (l.hair) {
        const hair = $('div', 'abs hair', el);
        box(hair, (W - l.hair) / 2, l.y, l.hair, 3);
        return { hair, at: hit[l.at] + (l.delay ?? 0.15) };
      }
      const line = $('div', `abs ln ${l.cls}`, el);
      if (l.size) line.style.fontSize = `${l.size}px`;
      const words = l.words.map(([text, name, cls], i) => {
        if (i) line.append(' ');
        return { s: $('span', cls ?? '', line, text), at: hit[name] };
      });
      // Centre on the letters: tracking adds space after the last one too.
      let ls = parseFloat(getComputedStyle(line).letterSpacing) || 0;
      if (line.offsetWidth - ls > MAX_W) {
        const size = (parseFloat(getComputedStyle(line).fontSize) * MAX_W) / (line.offsetWidth - ls);
        line.style.fontSize = `${size}px`;
        ls = parseFloat(getComputedStyle(line).letterSpacing) || 0;
      }
      box(line, (W - (line.offsetWidth - ls)) / 2, l.y);
      return { line, words };
    });
    const first = Math.min(...lines.filter((l) => l.words).map((l) => l.words[0].at));
    return { el, lines, first };
  });

  every((t) => {
    boards.forEach((b, i) => {
      const next = boards[i + 1];
      const start = b.first - LEAD;
      // A board holds until just before the next one, then wipes off line by line.
      const exitAt = next ? next.first - LEAD - 0.3 : Infinity;
      const end = next ? next.first : 5.7;
      const live = t >= start - 0.05 && t < exitAt + 0.6;
      b.el.style.display = live ? '' : 'none';
      if (!live) return;
      b.el.style.transformOrigin = '50% 360px';
      b.el.style.transform = `scale(${1 + 0.03 * prog(t, start, end - start)})`;

      b.lines.forEach((l, j) => {
        const out = ease.inOut(prog(t, exitAt + j * 0.04, 0.35));
        if (l.hair) {
          const k = ease.inOut(prog(t, l.at, 0.7));
          l.hair.style.transform = `scaleX(${k * (1 - out)})`;
          shown(l.hair, k > 0 && out < 1);
          return;
        }
        // Words wipe in left to right while settling up; the board wipes off the same way.
        l.words.forEach((w) => {
          const k = ease.out(prog(t, w.at - LEAD, WIPE));
          w.s.style.clipPath = `inset(-60px ${(1 - k) * 100}% -80px -60px)`;
          w.s.style.transform = `translateY(${(1 - k) * 0.22}em)`;
          w.s.style.visibility = k > 0 ? 'inherit' : 'hidden';
        });
        l.line.style.clipPath = out > 0 ? `inset(-60px -80px -80px ${out * 100}%)` : 'none';
        l.line.style.transform = `translateY(${-out * 14}px)`;
      });
    });
  });
}, { fps: 30, alpha: true, preload });
