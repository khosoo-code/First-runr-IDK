// Jana Post testimonial insert, 9:16, 29.97 fps, 281 frames (00;00;16;20 → 00;00;26;01).
// Pure function of time: window.seek(t) paints frame t. Every hit comes from beats.json,
// built from the reel's SRT, so each move lands on a spoken word.
//
// 1. "Захиалгуудаа апп дээрээсээ хянаад л хүлээж байсан" — the Jana Post app: three orders,
//    one opens into a tracking map, the parcel creeps along and waits.
// 2. "Харин Jana Post" — brand green floods out of the parcel dot; the logo rises.
// 3. "өөрсдөө Хятадын агуулахаас нь аваад … хамгийн ойр салбарт аваад ирсэн" — the logo
//    lands on a parcel at the China warehouse, rides the route, a radar from home finds the
//    nearest branch, and the parcel arrives there.
import { clamp, ease, lerp, prog, spring } from '../shared/motion.js';
import { $, box, drawIcon, mix, op, px, shown, slot, svg, textWidth, tf } from '../shared/kit.js';

const W = 1080;
const H = 1920;
const FPS = 30000 / 1001;
const C = { green: '#1b8918', ink: '#10140f', white: '#ffffff', mist: '#f2f5f1', tint: '#e3f0e2', muted: '#7d867b' };
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
function makeLogo(parent, width, color) {
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
function riseLogo(logo, t, at) {
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
};
function lineIcon(parent, name, size, color, width) {
  const el = svg('svg', { viewBox: '0 0 100 100', width: size, height: size, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
  el.style.display = 'block';
  const strokes = ICON[name].map((d) => svg('path', { d, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, el));
  return { el, strokes, dots: [] };
}

/** Mask-rise for a single element inside a .mask wrapper. */
function maskText(parent, x, y, cls, html) {
  const m = $('div', `abs mask ${cls}`, parent);
  box(m, x, y);
  const inner = $('span', '', m, html);
  return { m, inner, set: (k, out = 0) => (inner.style.transform = `translateY(${(1 - k) * 120 - out * 120}%)`) };
}

// ---------------------------------------------------------------- boot
function boot(build) {
  window.ready = (async () => {
    await loadFonts();
    const beats = await (await fetch('beats.json')).json();
    const hit = Object.fromEntries(beats.hits.map((h) => [h.name, h.t]));
    const painters = [];
    const stage = document.getElementById('stage');
    build({ hit, beats, stage, every: (fn) => painters.push(fn) });
    const paint = (t) => {
      for (const p of painters) p(t);
    };
    window.FILM = { width: W, height: H, fps: FPS, duration: beats.duration, audio: 'out/mix.wav' };
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

boot(({ hit, stage, every }) => {
  // ============================================================== 1. The app
  const s1 = $('div', 'abs', stage);
  box(s1, 0, 0, W, H);
  const dots1 = $('div', 'abs dots', s1);
  box(dots1, -60, -60, W + 120, H + 120);
  every((t) => tf(dots1, 0, -t * 5));

  // Headline: «Захиалгаа / апп дээрээсээ / хянаад л → хүлээсэн.», then «Бусдыг нь».
  const L1 = slot(s1, 96, 196, 'h1', [
    { t: 0.14, html: 'Захиалгаа', lead: 0.34 },
    { t: hit['бусдыг'], html: 'Бусдыг нь…' },
  ]);
  const L2 = slot(s1, 96, 318, 'h1', [
    { t: hit['апп'], parts: ['<span class="green">апп</span>', '&nbsp;дээрээсээ'], lead: 0.2, exit: hit['бусдыг'] - 0.42 },
  ], { stagger: hit['дээрээсээ'] - hit['апп'] });
  const L3 = slot(s1, 96, 440, 'h1', [
    { t: hit['хянаад'], html: 'хянаад л', lead: 0.2 },
    { t: hit['хүлээж'], html: 'хүлээсэн.', lead: 0.16, exit: hit['бусдыг'] - 0.36 },
  ]);
  every(L1);
  every(L2);
  every(L3);

  // The phone rises from below the frame, whole: the app's «Захиалгууд» screen.
  const PH = { x: 220, y: 600, w: 640, h: 1312, bez: 16 };
  const SW = PH.w - 2 * PH.bez;
  const SH = PH.h - 2 * PH.bez;
  const phone = $('div', 'abs phone', s1);
  box(phone, PH.x, PH.y, PH.w, PH.h);
  const screen = $('div', 'abs screen app', phone);
  box(screen, PH.bez, PH.bez, SW, SH);

  // Status bar and header.
  box($('div', 'abs island', screen), (SW - 156) / 2, 20, 156, 44);
  box($('div', 'abs sb-time', screen, '18:09'), 54, 30);
  const wifi = lineIcon($('div', 'abs', screen), 'wifi', 34, C.ink, 9);
  box(wifi.el.parentNode, SW - 140, 26);
  drawIcon(wifi, 1);
  const batt = $('div', 'abs sb-batt', screen, '77');
  box(batt, SW - 96, 30, 46, 26);
  const title = maskText(screen, (SW - textWidth('700 32px Manrope', 'Захиалгууд')) / 2, 112, 'app-head', 'Захиалгууд');
  const searchWrap = $('div', 'abs', screen);
  box(searchWrap, SW - 76, 106);
  const search = lineIcon(searchWrap, 'search', 42, C.ink, 8);

  // Wallet card.
  const WAL = { x: 24, y: 186, w: SW - 48, h: 112 };
  const wallet = $('div', 'abs wallet', screen);
  box(wallet, WAL.x, WAL.y, WAL.w, WAL.h);
  const wIcon = $('div', 'abs wallet-icon', wallet);
  box(wIcon, 22, 28, 56, 56);
  const wIc = lineIcon(wIcon, 'wallet', 38, '#fff', 8);
  box($('div', 'abs wallet-name', wallet, 'Миний хэтэвч'), 96, 28);
  box($('div', 'abs wallet-sum', wallet, '0.0 $'), 96, 64);
  const topW = Math.ceil(textWidth('600 24px Manrope', 'Цэнэглэх')) + 56;
  const topUp = $('div', 'abs wallet-btn', wallet, 'Цэнэглэх');
  box(topUp, WAL.w - 62 - topW, 30, topW, 52);
  const wChevWrap = $('div', 'abs', wallet);
  box(wChevWrap, WAL.w - 50, 38);
  drawIcon(lineIcon(wChevWrap, 'chevron', 36, '#fff', 11), 1);

  // The status list.
  const LIST = { x: 24, y: 322, w: SW - 48, pad: 8, row: 72 };
  const STATUSES = [
    ['clock', 'Хүлээгдэж байна'],
    ['warehouse', 'Агуулахад байна'],
    ['globe', 'Замд яваа'],
    ['cube', 'Ялгаж байна'],
    ['truck', 'Хүргэгдэж байна'],
    ['store', 'Салбарт ирсэн'],
    ['courier', 'Курьерт шилжсэн'],
    ['received', 'Хүлээн авсан'],
  ];
  LIST.h = LIST.pad * 2 + STATUSES.length * LIST.row;
  const list = $('div', 'abs app-card', screen);
  box(list, LIST.x, LIST.y, LIST.w, LIST.h);
  // Tracking highlight: steps down the statuses to «Замд яваа».
  const band = $('div', 'abs track-band', list);
  const rows = STATUSES.map(([icon, label], i) => {
    const y = LIST.pad + i * LIST.row;
    const row = $('div', 'abs', list);
    box(row, 0, y, LIST.w, LIST.row);
    const iw = $('div', 'abs', row);
    box(iw, 24, 16);
    const ic = lineIcon(iw, icon, 40, C.green, 7);
    const text = $('div', 'abs row-label', row, label);
    box(text, 84, 0);
    const chevWrap = $('div', 'abs', row);
    box(chevWrap, LIST.w - 52, 21);
    const chev = lineIcon(chevWrap, 'chevron', 30, '#b9bdc3', 10);
    const done = $('div', 'abs row-check', row);
    box(done, LIST.w - 60, 16, 40, 40);
    const doneIc = lineIcon(done, 'check', 40, '#fff', 13);
    return { row, ic, text, chev, chevWrap, done, doneIc, y };
  });
  // The parcel chip on «Замд яваа»: where the brand green floods from.
  const parcelDot = $('div', 'abs parcel-chip', list);
  box(parcelDot, LIST.w - 64, rows[2].y + 12, 48, 48);
  drawIcon(lineIcon(parcelDot, 'cube', 30, '#fff', 9), 1);
  const ripple = $('div', 'abs chip-ripple', list);
  box(ripple, LIST.w - 64, rows[2].y + 12, 48, 48);
  const waitDots = [0, 1, 2].map(() => $('div', 'abs wait-dot', list));

  // «Эзэнгүй бараа хайх».
  const lost = $('div', 'abs app-card', screen);
  box(lost, LIST.x, LIST.y + LIST.h + 20, LIST.w, 76);
  const lostIw = $('div', 'abs', lost);
  box(lostIw, 24, 18);
  const lostIc = lineIcon(lostIw, 'cube', 40, C.green, 7);
  box($('div', 'abs row-label', lost, 'Эзэнгүй бараа хайх'), 84, 2);
  const lostChev = $('div', 'abs', lost);
  box(lostChev, LIST.w - 52, 23);
  drawIcon(lineIcon(lostChev, 'chevron', 30, '#b9bdc3', 10), 1);

  // Tab bar with the «Захиалгууд» tab and the green scan button.
  const TAB = { y: SH - 150, h: 150 };
  const tabBar = $('div', 'abs tabbar', screen);
  box(tabBar, 0, TAB.y, SW, TAB.h);
  const tabs = [['home', 'Үндсэн', 0.1], ['cube', 'Захиалгууд', 0.29], ['chat', 'Зурвас', 0.71], ['person', 'Профайл', 0.9]].map(([icon, label, fx]) => {
    const cx = SW * fx;
    const iw = $('div', 'abs', tabBar);
    box(iw, cx - 20, 22);
    const ic = lineIcon(iw, icon, 40, '#9aa0a6', 7);
    drawIcon(ic, 1);
    const lw = textWidth('600 19px Manrope', label);
    const lb = $('div', 'abs tab-label', tabBar, label);
    box(lb, cx - lw / 2, 72);
    return { iw, ic, lb };
  });
  const scanBtn = $('div', 'abs scan-btn', screen);
  box(scanBtn, SW / 2 - 48, TAB.y - 38, 96, 96);
  drawIcon(lineIcon(scanBtn, 'scan', 48, '#fff', 8), 1);
  box($('div', 'abs home-bar', screen), (SW - 180) / 2, SH - 22, 180, 8);

  // «Хаана явна?» sits outside the phone, pointing at the highlighted row from the left.
  const bubble = $('div', 'abs bubble side', s1, 'Хаана явна?');
  const bw = textWidth('700 30px Manrope', 'Хаана явна?') + 48;

  const bandPos = (t) => ease.inOut(prog(t, hit['явааг'] - 0.12, 0.32)) + ease.inOut(prog(t, hit['хянаад'] - 0.12, 0.32));

  every((t) => {
    // Phone rise, then a push into «Замд яваа» on «Бусдыг нь».
    const rise = spring(t + 0.16, { freq: 1.6, damping: 0.78 });
    const push = ease.inOut(prog(t, hit['бусдыг'] - 0.08, 0.9));
    phone.style.transformOrigin = `${PH.bez + LIST.x + LIST.w - 40}px ${PH.bez + LIST.y + rows[2].y + 36}px`;
    tf(phone, 0, (1 - rise) * 1250 - push * 70, 1 + push * 0.2, (1 - rise) * -9);

    // Header, wallet and list build as the orders are named.
    title.set(ease.out(prog(t, 0.05, 0.6)));
    drawIcon(search, prog(t, 0.2, 0.6));
    const wk = ease.out(prog(t, hit['захиалгуудаа'] - 0.5, 0.7));
    wallet.style.clipPath = `inset(0 ${(1 - wk) * 100}% 0 0 round 22px)`;
    drawIcon(wIc, prog(t, hit['захиалгуудаа'] - 0.3, 0.6));
    const lk = ease.out(prog(t, hit['захиалгуудаа'] - 0.36, 0.8));
    list.style.clipPath = `inset(0 0 ${(1 - lk) * 100}% 0 round 26px)`;
    const lostK = ease.out(prog(t, hit['захиалгуудаа'] + 0.2, 0.6));
    lost.style.clipPath = `inset(0 ${(1 - lostK) * 100}% 0 0 round 22px)`;
    drawIcon(lostIc, prog(t, hit['захиалгуудаа'] + 0.3, 0.6));

    // The «Захиалгууд» tab lights up on «апп».
    const tabK = spring(t - (hit['апп'] - 0.08), { freq: 2.4, damping: 0.55 });
    const on = t >= hit['апп'] - 0.08;
    tabs[1].ic.el.setAttribute('stroke', on ? C.green : '#9aa0a6');
    tabs[1].lb.style.color = on ? C.green : '';
    tabs[1].iw.style.transform = `scale(${on ? 1 + 0.25 * Math.sin(Math.PI * clamp(tabK)) : 1})`;
    const sk = spring(t - (hit['апп'] + 0.05), { freq: 2.2, damping: 0.5 });
    scanBtn.style.transform = `scale(${0.82 + 0.18 * sk})`;

    // Tracking: the highlight lands on «Хүлээгдэж байна» on «хаана», steps to «Агуулахад»
    // on «явааг» and to «Замд яваа» on «хянаад»; passed statuses get a check.
    const pos = bandPos(t);
    const bk = ease.out(prog(t, hit['хаана'] - 0.1, 0.45));
    box(band, 8, LIST.pad + pos * LIST.row + 4, LIST.w - 16, LIST.row - 8);
    band.style.clipPath = `inset(0 ${(1 - bk) * 100}% 0 0 round 18px)`;
    shown(band, bk > 0);
    const wait = ease.out(prog(t, hit['хүлээж'] - 0.05, 0.5));
    rows.forEach((r, i) => {
      const k = ease.out(prog(t, hit['захиалгуудаа'] - 0.3 + i * 0.06, 0.6));
      tf(r.row, 0, (1 - k) * 26);
      drawIcon(r.ic, prog(t, hit['захиалгуудаа'] - 0.2 + i * 0.06, 0.7));
      drawIcon(r.chev, prog(t, hit['захиалгуудаа'] + i * 0.06, 0.4));
      const passAt = i === 0 ? hit['явааг'] + 0.06 : i === 1 ? hit['хянаад'] + 0.06 : Infinity;
      const pk = spring(t - passAt, { freq: 2.6, damping: 0.55 });
      r.done.style.transform = `scale(${Math.max(0, pk)})`;
      shown(r.done, pk > 0.001);
      drawIcon(r.doneIc, prog(t, passAt + 0.05, 0.3));
      shown(r.chevWrap, pk < 0.3 && !(i === 2 && t >= hit['хянаад'] + 0.1));
      const reached = bk > 0 && pos >= i - 0.5 && i <= 2;
      r.text.style.color = reached ? C.green : C.ink;
      r.text.style.fontWeight = reached ? '700' : '600';
      op(r.row, i > 2 ? 1 - 0.55 * wait : 1);
    });
    const ck = spring(t - (hit['хянаад'] + 0.1), { freq: 2.4, damping: 0.5 });
    parcelDot.style.transform = `scale(${Math.max(0, ck)})`;
    shown(parcelDot, ck > 0.001);
    // A ripple every 0.75 s from the chip while she waits.
    const rp = t > hit['хүлээж'] ? ((t - hit['хүлээж']) % 0.75) / 0.75 : -1;
    ripple.style.transform = `scale(${1 + 1.1 * ease.outSoft(Math.max(0, rp))})`;
    ripple.style.opacity = rp < 0 ? 0 : 0.7 * (1 - rp);
    const lw = textWidth('700 27px Manrope', 'Замд яваа');
    waitDots.forEach((d, i) => {
      const bounce = Math.max(0, Math.sin((t - hit['хүлээж']) * 9 - i * 0.9)) * 7;
      box(d, 84 + lw + 12 + i * 15, rows[2].y + 40 - bounce * wait, 9, 9);
      d.style.transform = `scale(${wait})`;
    });
    // «Хаана явна?» rides beside the highlight until tracking lands.
    const bIn = spring(t - (hit['хаана'] + 0.05), { freq: 2.2, damping: 0.62 });
    const bOut = ease.in(prog(t, hit['хүлээж'] - 0.12, 0.25));
    const rowMid = PH.y + (1 - rise) * 1250 + PH.bez + LIST.y + LIST.pad + pos * LIST.row + LIST.row / 2;
    box(bubble, PH.x + PH.bez + LIST.x - bw - 6, rowMid - 32);
    bubble.style.transformOrigin = '100% 50%';
    bubble.style.transform = `scale(${Math.max(0, bIn * (1 - bOut))})`;
    shown(bubble, bIn > 0.01 && bOut < 1);
  });

  // ============================================================== 2–3. Brand green
  const s3 = $('div', 'abs', stage);
  box(s3, 0, 0, W, H);
  s3.style.background = C.green;
  const dots3 = $('div', 'abs dots light', s3);
  box(dots3, -60, -60, W + 120, H + 120);
  const world3 = $('div', 'abs', s3);
  box(world3, 0, 0, W, H);
  const stageRect = () => stage.getBoundingClientRect();

  // Green floods out of the parcel dot on «Харин».
  const wipeK = (t) => ease.inOut(prog(t, hit['харин'] - 0.1, 0.62));
  every((t) => {
    const k = wipeK(t);
    shown(s3, k > 0);
    shown(s1, k < 1);
    if (k <= 0) return;
    const sr = stageRect();
    const scale = sr.width / W;
    const r = parcelDot.getBoundingClientRect();
    const ox = (r.x + r.width / 2 - sr.x) / scale;
    const oy = (r.y + r.height / 2 - sr.y) / scale;
    s3.style.clipPath = k >= 1 ? 'none' : `circle(${k * 2300}px at ${ox}px ${oy}px)`;
    tf(dots3, 0, -t * 5);
  });

  // Headline: «Өөрсдөө / аваад» → «Салбарт / ирсэн.»
  const M1 = slot(world3, 96, 214, 'h1w', [
    { t: hit['өөрсдөө'], html: 'Өөрсдөө', lead: 0.22 },
    { t: hit['салбарт'], html: 'Салбарт', lead: 0.2 },
  ]);
  const M2 = slot(world3, 96, 350, 'h1w', [
    { t: hit['аваад'], html: 'аваад', lead: 0.2 },
    { t: hit['ирсэн'], html: '<span class="pill">ирсэн.</span>', lead: 0.18 },
  ]);
  every(M1);
  every(M2);

  // Map geometry.
  const WH = { x: 196, y: 700 }; // warehouse tile centre
  const HOME = { x: 880, y: 1150 };
  const BR = [
    { x: 600, y: 1290 }, // nearest branch
    { x: 250, y: 1300 },
    { x: 990, y: 700 },
  ];
  const START = { x: 430, y: 700 };
  const END = { x: BR[0].x, y: BR[0].y - 75 - 62 };
  const ROUTE3 = `M${START.x} ${START.y} C800 690 860 900 720 980 C610 1036 580 1090 ${END.x} ${END.y}`;

  const layer = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, fill: 'none' }, world3);
  layer.style.position = 'absolute';
  box(layer, 0, 0);
  const defs = svg('defs', {}, layer);
  const routeMask = svg('mask', { id: 'route-reveal', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs);
  const maskPath = svg('path', { d: ROUTE3, stroke: '#fff', 'stroke-width': 40, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '0 1' }, routeMask);
  svg('path', { d: ROUTE3, stroke: 'rgba(255,255,255,0.55)', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-dasharray': '0.1 22', mask: 'url(#route-reveal)' }, layer);
  const trail = svg('path', { d: ROUTE3, stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '0 1' }, layer);
  const route3Len = trail.getTotalLength();
  const rings = [0, 1, 2].map(() => svg('circle', { cx: HOME.x, cy: HOME.y, r: 0, stroke: '#fff', 'stroke-width': 4 }, layer));
  const nearLine = svg('path', { d: `M${HOME.x} ${HOME.y} L${BR[0].x} ${BR[0].y}`, stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': '2 16' }, layer);
  const pins = BR.map((b) => {
    const g = svg('g', {}, layer);
    svg('path', { d: 'M0 0 C-8 -14 -28 -26 -28 -46 A28 28 0 1 1 28 -46 C28 -26 8 -14 0 0 Z', fill: '#fff' }, g);
    svg('circle', { cx: 0, cy: -46, r: 11, fill: C.green }, g);
    return { g, b, d: Math.hypot(b.x - HOME.x, b.y - HOME.y) };
  });

  // Tiles: warehouse, home, and the branch the nearest pin becomes.
  function tile(cx, cy, size, icon) {
    const el = $('div', 'abs tile', world3);
    box(el, cx - size / 2, cy - size / 2, size, size);
    const ic = lineIcon(el, icon, size * 0.66, C.green, 6.5);
    return { el, ic };
  }
  const whTile = tile(WH.x, WH.y, 180, 'warehouse');
  const whLabel = maskText(world3, 96, 818, 'node-label', 'Хятадын агуулах');
  const homeTile = tile(HOME.x, HOME.y, 156, 'house');
  const homeLabelW = textWidth('700 42px Manrope', 'Манай гэр');
  const homeLabel = maskText(world3, HOME.x - homeLabelW / 2, HOME.y + 104, 'node-label', 'Манай гэр');
  const brTile = tile(BR[0].x, BR[0].y, 150, 'store');
  const tag = $('div', 'abs tag', world3, 'Хамгийн ойр салбар');
  const tagW = textWidth('800 36px Montserrat', 'Хамгийн ойр салбар') + 60;
  box(tag, BR[0].x - tagW / 2, BR[0].y + 98);

  // The parcel, with the logo landing on it.
  const PC = { w: 160, h: 136 };
  const parcel = $('div', 'abs parcel', world3);
  box(parcel, -PC.w / 2, -PC.h / 2, PC.w, PC.h);
  const tape = $('div', 'abs tape', parcel);
  box(tape, 0, 0, PC.w, 26);
  const badge = $('div', 'abs', world3);
  box(badge, -36, -36, 72, 72);
  badge.style.cssText += `border-radius:50%;background:${C.ink};box-shadow:0 0 0 6px #fff`;
  const badgeCheck = lineIcon(badge, 'check', 72, '#fff', 11);

  const LOGO_W = 640;
  const logoWrap = $('div', 'abs', world3);
  box(logoWrap, -LOGO_W / 2, (-LOGO_W * 40) / 77 / 2, LOGO_W, (LOGO_W * 40) / 77);
  const bigLogo = makeLogo(logoWrap, LOGO_W, '#fff');
  const LOGO0 = { x: 540, y: 880 };

  const travel = (t) => ease.inOut(prog(t, hit['аваад'] - 0.04, 1.82));
  const parcelPos = (t) => {
    const u = travel(t);
    const p = trail.getPointAtLength(u * route3Len);
    return { x: p.x, y: p.y, u };
  };

  // Radar from home: the time ring 0 reaches a distance, so pins appear as it passes.
  const RING = { t0: hit['хамгийн'] - 0.1, dur: 1.2, max: 520 };
  const ringR = (t, i) => RING.max * ease.out(prog(t, RING.t0 + i * 0.2, RING.dur));
  const reach = (d) => {
    for (let s = RING.t0; s < RING.t0 + RING.dur; s += 1 / 240) if (ringR(s, 0) >= d) return s;
    return RING.t0 + RING.dur;
  };
  pins.forEach((p) => (p.at = reach(p.d)));

  every((t) => {
    // Logo rises on «Jana Post», then flies down onto the parcel on «өөрсдөө».
    riseLogo(bigLogo, t, hit['jana post'] - 0.24);
    const fly = ease.inOut(prog(t, hit['өөрсдөө'] - 0.04, 0.56));
    const pp = parcelPos(t);
    const settle = spring(t - (hit['ирсэн'] - 0.16), { freq: 2.6, damping: 0.45 });
    const land = pp.u >= 1 ? (1 - settle) * 18 : 0;
    const tilt = Math.sin(Math.PI * pp.u) * -7;
    const lx = lerp(LOGO0.x, pp.x, fly);
    const ly = lerp(LOGO0.y, pp.y + 12 + land, fly) - Math.sin(Math.PI * fly) * 120;
    logoWrap.style.transform = `translate(${lx}px, ${ly}px) scale(${lerp(1, 112 / LOGO_W, fly)}) rotate(${tilt * fly}deg)`;
    // White on green until the parcel is behind it, then brand green on the parcel.
    bigLogo.el.setAttribute('fill', mix('#ffffff', C.green, clamp((t - (hit['өөрсдөө'] + 0.4)) / 0.12)));

    // Parcel grows under the landing logo, then rides the route.
    const pk = spring(t - (hit['өөрсдөө'] + 0.36), { freq: 2.0, damping: 0.62 });
    parcel.style.transform = `translate(${pp.x}px, ${pp.y + land}px) rotate(${tilt}deg) scale(${Math.max(0, pk)})`;
    shown(parcel, pk > 0.001);

    // Warehouse on «Хятадын», its icon draws on «агуулахаас».
    const wk = spring(t - (hit['хятадын'] + 0.08), { freq: 2.0, damping: 0.65 });
    whTile.el.style.transform = `scale(${Math.max(0, wk)})`;
    shown(whTile.el, wk > 0.001);
    drawIcon(whTile.ic, prog(t, hit['агуулахаас'] - 0.2, 0.8));
    whLabel.set(ease.out(prog(t, hit['хятадын'] + 0.1, 0.7)));

    // Route: dots reveal ahead on «аваад», a solid trail behind the parcel.
    maskPath.setAttribute('stroke-dasharray', `${ease.inOut(prog(t, hit['аваад'] - 0.3, 0.9))} 1`);
    trail.setAttribute('stroke-dasharray', `${pp.u} 1`);

    // Home on «гэрт».
    const hk = spring(t - (hit['гэрт'] - 0.14), { freq: 2.0, damping: 0.65 });
    homeTile.el.style.transform = `scale(${Math.max(0, hk)})`;
    shown(homeTile.el, hk > 0.001);
    drawIcon(homeTile.ic, prog(t, hit['гэрт'] - 0.04, 0.7));
    homeLabel.set(ease.out(prog(t, hit['гэрт'], 0.7)));

    // Radar on «хамгийн», pins pop as it passes them, the nearest is picked on «ойр».
    rings.forEach((rg, i) => {
      const r = ringR(t, i);
      const k = prog(t, RING.t0 + i * 0.2, RING.dur);
      rg.setAttribute('r', r);
      rg.setAttribute('stroke-opacity', k > 0 && k < 1 ? 0.7 * (1 - k) : 0);
    });
    const pick = ease.out(prog(t, hit['ойр'] - 0.06, 0.5));
    const become = ease.inOut(prog(t, hit['салбарт'] - 0.12, 0.4));
    pins.forEach((p, i) => {
      const s = spring(t - p.at, { freq: 2.4, damping: 0.5 });
      const scale = i === 0 ? s * (1 + 0.25 * pick) * (1 - become) : s * (1 - 0.25 * pick);
      p.g.setAttribute('transform', `translate(${p.b.x} ${p.b.y + (i === 0 ? 46 * become : 0)}) scale(${Math.max(0, scale)})`);
      p.g.setAttribute('opacity', i === 0 ? 1 : 1 - 0.55 * pick);
    });
    nearLine.setAttribute('stroke-opacity', pick * (1 - ease.in(prog(t, hit['ирсэн'], 0.3))));
    nearLine.style.clipPath = `inset(0 0 0 ${(1 - pick) * 100}%)`;

    // The nearest pin becomes the branch on «салбарт»; the tag wipes in under it.
    const bk = spring(t - (hit['салбарт'] - 0.06), { freq: 2.0, damping: 0.62 });
    brTile.el.style.transform = `scale(${Math.max(0, bk)})`;
    shown(brTile.el, bk > 0.001);
    drawIcon(brTile.ic, prog(t, hit['салбарт'] + 0.02, 0.7));
    const tk = ease.out(prog(t, hit['салбарт'] + 0.1, 0.6));
    tag.style.clipPath = `inset(0 ${(1 - tk) * 100}% 0 0 round 40px)`;
    shown(tag, tk > 0);

    // Arrival on «ирсэн»: the check badge stamps onto the parcel.
    const sk = spring(t - (hit['ирсэн'] - 0.02), { freq: 2.2, damping: 0.5 });
    badge.style.transform = `translate(${pp.x + PC.w / 2 - 14}px, ${pp.y + land - PC.h / 2 + 10}px) scale(${Math.max(0, lerp(1.8, 1, sk) * Math.min(1, sk * 3))})`;
    shown(badge, sk > 0.01);
    drawIcon(badgeCheck, prog(t, hit['ирсэн'] + 0.06, 0.4));

    // A slow push on the map so the closing hold isn't still.
    world3.style.transformOrigin = '50% 60%';
    world3.style.transform = `translateY(110px) scale(${1 + 0.035 * ease.inOutSoft(prog(t, hit['өөрсдөө'], 3.9))})`;
  });
});
