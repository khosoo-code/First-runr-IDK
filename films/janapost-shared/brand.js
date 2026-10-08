// Shared kit for the Jana Post films: brand tokens, fonts, the logo, line icons and boot.
// Everything that paints is a pure function of t, per the render contract in CLAUDE.md.
import { clamp, ease, prog, spring } from '../shared/motion.js';
import { $, box, svg } from '../shared/kit.js';

export const W = 1080;
export const H = 1920;
export const C = { green: '#1b8918', ink: '#10140f', white: '#ffffff', mist: '#f2f5f1', tint: '#e3f0e2', muted: '#7d867b' };
const RENDER = new URLSearchParams(location.search).has('render');

// ---------------------------------------------------------------- fonts
const SUBSETS = {
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  cyrillic: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
  'cyrillic-ext': 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F',
};
const FONTS = [
  ['Montserrat', '../cargo-shared/fonts/montserrat', 800],
  ['Montserrat', '../cargo-shared/fonts/montserrat', 900],
  ['Manrope', '../shared/fonts/manrope', 600],
  ['Manrope', '../shared/fonts/manrope', 700],
];
async function loadFonts() {
  const loads = [];
  for (const [family, file, weight] of FONTS) {
    for (const [subset, range] of Object.entries(SUBSETS)) {
      const url = new URL(`${file}-${subset}-${weight}-normal.woff2`, import.meta.url);
      const face = new FontFace(family, `url(${url})`, { weight: String(weight), unicodeRange: range });
      document.fonts.add(face);
      loads.push(face.load());
    }
  }
  await Promise.all(loads);
}

// ---------------------------------------------------------------- the logo (logo.svg)
// Glyphs of the supplied mark, tagged so they can rise one by one: the JANA letters, the
// accent over N, and the small POST.
const LOGO = [
  ['J', 'big', 0, 'M0.00411881 23.57L0 28.4143C1.39264 28.5695 6.41674 28.5131 7.64097 28.2563C9.80501 27.8021 11.0908 26.4955 11.2783 24.1269C11.4647 21.771 11.3157 18.8602 11.3157 16.4452C11.3157 13.8632 11.319 11.2807 11.3119 8.69873L5.84201 8.69844L5.8479 21.532C5.84909 22.3543 5.99837 23.2461 5.23639 23.4851C4.57923 23.6913 1.06141 23.4862 0.00441352 23.5697L0.00411881 23.57Z'],
  ['A', 'big', 1, 'M23.0526 14.4311L25.0209 20.4756L20.964 20.4563L23.0526 14.4311ZM12.3652 28.3497L18.3556 28.3651L19.5616 24.7509C20.0406 24.6015 24.8928 24.6991 25.9003 24.6994C26.6767 24.6994 26.3794 24.5548 26.9792 26.3196C27.19 26.9398 27.404 27.7597 27.6669 28.3188L33.6653 28.3631L25.9239 8.68437L20.114 8.69589C19.8431 9.13701 19.3664 10.5102 19.1444 11.0829L16.2149 18.4942C15.9151 19.236 12.4718 27.7328 12.3655 28.3499L12.3652 28.3497Z'],
  ['N', 'big', 2, 'M34.9873 28.3605L40.4284 28.3694L40.4522 17.8255C41.2271 18.6211 42.0899 19.5154 42.7964 20.3689C44.1716 22.0303 46.6448 24.6249 48.1676 26.3415L49.9127 28.3578L54.2302 28.3636L54.2378 8.72654L48.7964 8.68967L48.7657 19.2249C48.4706 19.0449 48.3223 18.7895 48.0441 18.5024C46.4686 16.875 44.5743 14.4911 43.004 12.8735L39.4668 8.93932C39.1194 8.56038 38.8346 8.6845 38.17 8.68708C37.1213 8.69111 36.072 8.68681 35.0233 8.68997L34.9873 28.36V28.3605Z'],
  ['A', 'big', 3, 'M66.5132 14.5496L68.4712 20.5863L64.4249 20.5676L66.5132 14.5496ZM55.8075 28.4574L61.7867 28.4662L63.0395 24.8165L69.9106 24.8237L71.1227 28.4592L77.1182 28.4677C77.0178 27.8632 76.4483 26.6368 76.1928 25.9849C75.55 24.3454 69.6072 9.18613 69.3435 8.81441L63.5701 8.8L56.762 25.9448C56.4735 26.6827 55.9755 27.7283 55.808 28.457L55.8075 28.4574Z'],
  ['´', 'accent', 4, 'M42.4678 6.86535C43.5863 6.89992 44.706 6.87485 45.8251 6.88408C46.951 6.89358 46.8989 6.71391 48.2554 5.86678C48.8194 5.51434 52.214 3.48665 52.3923 3.22405L47.3942 3.22002C46.6505 3.21685 46.3957 3.08814 45.963 3.5261C45.3489 4.14719 44.7528 4.57219 44.1934 5.15556C43.769 5.59841 42.6891 6.43431 42.4678 6.86564V6.86535Z'],
  ['P', 'small', 0, 'M0.897287 31.7174C1.87361 31.639 2.9462 31.6271 2.92589 32.6651C2.90527 33.7029 1.86831 33.622 0.897583 33.5895L0.896991 31.7174H0.897287ZM0.904059 34.4286C1.57035 34.3536 4.3206 34.7223 3.82361 32.1954C3.53094 30.7071 1.57447 30.704 0.00311279 30.9349L0.00899988 36.6854L0.886099 36.6926L0.904059 34.4286Z'],
  ['O', 'small', 1, 'M5.33956 34.1034C5.00273 31.1013 9.30371 30.803 9.56281 33.5414C9.83781 36.4453 5.63251 36.7152 5.33956 34.1034ZM4.4124 34.3912C5.05102 37.9526 11.1009 37.4878 10.4994 33.2421C9.97824 29.5665 3.65042 30.1408 4.4124 34.3912Z'],
  ['S', 'small', 2, 'M14.4957 31.1471C11.8815 29.8851 10.1983 32.059 12.1097 33.5789C12.8519 34.1689 13.8206 34.637 13.7217 35.3339C13.558 36.4877 11.8232 35.5964 11.2485 35.527L10.9414 36.3345C11.7325 36.5827 12.3862 36.9651 13.4691 36.7194C14.2446 36.5435 14.7522 35.9788 14.7039 35.068C14.61 33.2926 11.8936 33.115 12.3726 31.8146C13.1146 31.4654 13.4638 31.7974 14.1627 31.9387L14.4957 31.1471Z'],
  ['T', 'small', 3, 'M17.5448 36.6753L17.5569 31.7063L19.2039 31.6774L19.2075 30.9467C18.6206 30.8183 15.6861 30.856 14.9824 30.9182L15.0122 31.6922L16.6474 31.7309L16.6718 36.6981L17.5445 36.6753H17.5448Z'],
];
let logoId = 0;
/** The mark at `width` px; returns { el, glyphs: [{ g, kind, order }] }. */
export function makeLogo(parent, width, color) {
  const id = `logo${logoId++}`;
  const el = svg('svg', { width, height: (width * 40) / 77, viewBox: '0 0 77 40', fill: color }, parent);
  el.style.overflow = 'visible';
  el.style.display = 'block';
  const defs = svg('defs', {}, el);
  // Each glyph rises inside its own band: JANA + accent above the baseline, POST below it.
  svg('rect', { x: -2, y: -2, width: 81, height: 30.6 }, svg('clipPath', { id: `${id}-big` }, defs));
  svg('rect', { x: -2, y: 29.6, width: 81, height: 10 }, svg('clipPath', { id: `${id}-small` }, defs));
  const glyphs = LOGO.map(([, kind, order, d]) => {
    const outer = svg('g', { 'clip-path': `url(#${id}-${kind === 'small' ? 'small' : 'big'})` }, el);
    const g = svg('g', {}, outer);
    svg('path', { d, 'fill-rule': 'evenodd' }, g);
    return { g, kind, order };
  });
  return { el, glyphs };
}
/** Glyph-by-glyph rise; `at` is when the first letter starts. */
export function riseLogo(logo, t, at) {
  for (const gl of logo.glyphs) {
    if (gl.kind === 'big') {
      const k = ease.out(prog(t, at + gl.order * 0.06, 0.6));
      gl.g.setAttribute('transform', `translate(0 ${(1 - k) * 24})`);
    } else if (gl.kind === 'accent') {
      const k = spring(t - (at + 0.3), { freq: 2.4, damping: 0.55 });
      gl.g.setAttribute('transform', `translate(${(1 - k) * 6} ${(1 - k) * -10})`);
    } else {
      const k = ease.out(prog(t, at + 0.22 + gl.order * 0.04, 0.5));
      gl.g.setAttribute('transform', `translate(0 ${(1 - k) * 10})`);
    }
  }
}

// ---------------------------------------------------------------- line icons
const ICON = {
  shoe: ['M10 70 V58 Q10 50 18 48 L36 42 L44 50 Q54 57 62 50 L82 60 Q90 64 90 72 V74 H10 Z', 'M10 82 H90', 'M30 46 L35 53', 'M38 44 L43 51'],
  shirt: ['M36 18 L16 28 L8 46 L22 53 L28 44 V86 H72 V44 L78 53 L92 46 L84 28 L64 18 Q50 32 36 18 Z'],
  lamp: ['M32 16 H68 L78 50 H22 Z', 'M50 50 V80', 'M32 84 H68'],
  warehouse: ['M10 42 L50 16 L90 42', 'M18 37 V86 H82 V37', 'M30 86 V56 H70 V86', 'M30 66 H70', 'M30 76 H70'],
  house: ['M12 48 L50 18 L88 48', 'M22 40 V86 H78 V40', 'M42 86 V62 H58 V86'],
  store: ['M12 40 L20 16 H80 L88 40', 'M12 40 Q12 50 22 50 Q32 50 32 40 Q32 50 42 50 Q52 50 50 40 Q50 50 60 50 Q70 50 68 40 Q68 50 78 50 Q88 50 88 40', 'M20 52 V86 H80 V52', 'M40 86 V64 H60 V86'],
  check: ['M27 52 L43 68 L74 36'],
  // The Jana Post app's «Захиалгууд» screen.
  clock: ['M50 14 A36 36 0 1 1 49.9 14', 'M50 30 V50 L64 59'],
  globe: ['M50 14 A36 36 0 1 1 49.9 14', 'M14 50 H86', 'M50 14 C30 32 30 68 50 86', 'M50 14 C70 32 70 68 50 86'],
  cube: ['M50 12 L84 30 V70 L50 88 L16 70 V30 Z', 'M16 30 L50 48 L84 30', 'M50 48 V88'],
  truck: ['M8 28 H58 V70 H8 Z', 'M58 42 H76 L90 56 V70 H58', 'M26 74 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0', 'M72 74 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0'],
  courier: ['M34 30 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0', 'M12 86 V72 Q12 54 34 54 Q48 54 54 62', 'M60 56 H88 V86 H60 Z', 'M74 56 V66'],
  received: ['M16 30 L50 14 L84 30 V70 L50 86 L16 70 Z', 'M35 50 L46 61 L66 40'],
  search: ['M44 44 m-27 0 a27 27 0 1 0 54 0 a27 27 0 1 0 -54 0', 'M64 64 L86 86'],
  wallet: ['M14 32 H80 Q86 32 86 38 V76 Q86 82 80 82 H20 Q14 82 14 76 Z', 'M62 50 H86 V64 H62 Q55 64 55 57 Q55 50 62 50 Z', 'M20 32 L64 16 L70 32'],
  chevron: ['M38 22 L66 50 L38 78'],
  chat: ['M14 22 H86 V68 H44 L28 82 V68 H14 Z', 'M32 45 H68'],
  person: ['M50 34 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0', 'M18 86 Q18 58 50 58 Q82 58 82 86'],
  home: ['M12 48 L50 16 L88 48', 'M24 40 V86 H76 V40'],
  scan: ['M18 38 V18 H38', 'M62 18 H82 V38', 'M82 62 V82 H62', 'M38 82 H18 V62', 'M16 50 H84'],
  wifi: ['M12 42 Q50 8 88 42', 'M26 56 Q50 34 74 56', 'M40 70 Q50 62 60 70'],
  // Benefits and the download call to action.
  bolt: ['M57 10 L27 55 H49 L42 90 L73 43 H51 L60 10 Z'],
  shield: ['M50 10 L82 22 V48 C82 70 68 84 50 90 C32 84 18 70 18 48 V22 Z', 'M35 50 L46 61 L66 40'],
  smile: ['M50 12 A38 38 0 1 1 49.9 12', 'M33 57 Q50 74 67 57', 'M38 39 V41', 'M62 39 V41'],
  download: ['M50 14 V62', 'M30 44 L50 64 L70 44', 'M22 84 H78'],
};
export function lineIcon(parent, name, size, color, width) {
  const el = svg('svg', { viewBox: '0 0 100 100', width: size, height: size, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
  el.style.display = 'block';
  const strokes = ICON[name].map((d) => svg('path', { d, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, el));
  return { el, strokes, dots: [] };
}

/** Mask-rise for a single element inside a .mask wrapper. */
export function maskText(parent, x, y, cls, html) {
  const m = $('div', `abs mask ${cls}`, parent);
  box(m, x, y);
  const inner = $('span', '', m, html);
  return { m, inner, set: (k, out = 0) => (inner.style.transform = `translateY(${(1 - k) * 120 - out * 120}%)`) };
}

// ---------------------------------------------------------------- boot
/**
 * Loads fonts and beats.json, builds the film and exposes window.FILM / window.seek.
 * preload: an optional async step (e.g. decoding images) that must finish before frame 0.
 */
export function boot(build, { fps, alpha = false, preload }) {
  window.ready = (async () => {
    await Promise.all([loadFonts(), preload?.()]);
    const beats = await (await fetch('beats.json')).json();
    const hit = Object.fromEntries(beats.hits.map((h) => [h.name, h.t]));
    const painters = [];
    const stage = document.getElementById('stage');
    build({ hit, beats, stage, every: (fn) => painters.push(fn) });
    const paint = (t) => {
      for (const p of painters) p(t);
    };
    window.FILM = { width: W, height: H, fps, duration: beats.duration, audio: 'out/mix.wav', alpha };
    window.seek = paint;
    paint(0);
    if (!RENDER) {
      // Browser preview only: render.mjs never runs this loop.
      const fit = () => (stage.style.transform = `scale(${Math.min(innerWidth / W, innerHeight / H)})`);
      fit();
      addEventListener('resize', fit);
      const t0 = performance.now();
      const loop = (now) => {
        paint(((now - t0) / 1000) % beats.duration);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  })();
}
