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
  const L1 = slot(s1, 96, 236, 'h1', [
    { t: 0.14, html: 'Захиалгаа', lead: 0.34 },
    { t: hit['бусдыг'], html: 'Бусдыг нь…' },
  ]);
  const L2 = slot(s1, 96, 362, 'h1', [
    { t: hit['апп'], parts: ['<span class="green">апп</span>', '&nbsp;дээрээсээ'], lead: 0.2, exit: hit['бусдыг'] - 0.42 },
  ], { stagger: hit['дээрээсээ'] - hit['апп'] });
  const L3 = slot(s1, 96, 488, 'h1', [
    { t: hit['хянаад'], html: 'хянаад л', lead: 0.2 },
    { t: hit['хүлээж'], html: 'хүлээсэн.', lead: 0.16, exit: hit['бусдыг'] - 0.36 },
  ]);
  every(L1);
  every(L2);
  every(L3);

  // The phone rises from below the frame; its lower half stays off-screen.
  const PH = { x: 160, y: 690, w: 760, h: 1500, bez: 18 };
  const SW = PH.w - 2 * PH.bez;
  const phone = $('div', 'abs phone', s1);
  box(phone, PH.x, PH.y, PH.w, PH.h);
  const screen = $('div', 'abs screen', phone);
  box(screen, PH.bez, PH.bez, SW, PH.h - 2 * PH.bez);
  const island = $('div', 'abs island', screen);
  box(island, (SW - 176) / 2, 24, 176, 48);

  const appLogoWrap = $('div', 'abs', screen);
  box(appLogoWrap, 40, 104);
  appLogoWrap.style.transformOrigin = '0 50%';
  makeLogo(appLogoWrap, 150, C.green);
  const appTitle = maskText(screen, 40, 214, 'app-title', 'Миний захиалга');

  const ROW = { x: 36, y: 300, w: SW - 72, h: 132, gap: 18 };
  const rowDefs = [
    { icon: 'shoe', name: 'Poizon · Гутал', sub: 'JP 2048 1173', status: 'Замд' },
    { icon: 'shirt', name: 'Pinduoduo · Хувцас', sub: 'JP 2048 1190', status: 'Замд' },
    { icon: 'lamp', name: 'Taobao · Гэр ахуй', sub: 'JP 2048 1206', status: 'Агуулахад' },
  ];
  const rows = rowDefs.map((d, i) => {
    const el = $('div', 'abs row', screen);
    box(el, ROW.x, ROW.y + i * (ROW.h + ROW.gap), ROW.w, ROW.h);
    const sq = $('div', 'abs icon-sq', el);
    box(sq, 22, 22, 88, 88);
    const icon = lineIcon(sq, d.icon, 62, C.green, 6);
    $('div', 'abs row-name', el, d.name).style.cssText += `left:134px;top:34px`;
    $('div', 'abs row-sub', el, d.sub).style.cssText += `left:134px;top:80px`;
    const pw = Math.ceil(textWidth('700 25px Manrope', d.status)) + 40;
    const pill = $('div', 'abs status', el, d.status);
    box(pill, ROW.w - 24 - pw, (ROW.h - 46) / 2, pw, 46);
    return { el, icon };
  });

  // Tracking map: opens under the first order on «хаана».
  const MAP = { x: ROW.x, y: ROW.y + ROW.h + ROW.gap, w: ROW.w, h: 520 };
  const map = $('div', 'abs map', screen);
  box(map, MAP.x, MAP.y, MAP.w, MAP.h);
  const mapSvg = svg('svg', { width: MAP.w, height: MAP.h, viewBox: `0 0 ${MAP.w} ${MAP.h}`, fill: 'none' }, map);
  mapSvg.style.position = 'absolute';
  for (const d of ['M-10 130 L700 70', 'M-10 318 L700 392', 'M176 -10 L236 540', 'M470 -10 L418 540', 'M-10 220 Q200 260 330 200 T700 236']) {
    svg('path', { d, stroke: '#ffffff', 'stroke-width': 12, 'stroke-linecap': 'round' }, mapSvg);
  }
  const ROUTE1 = 'M84 110 C250 40 330 270 460 250 S590 300 572 352';
  const routeBase = svg('path', { d: ROUTE1, stroke: 'rgba(27,137,24,0.28)', 'stroke-width': 9, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1' }, mapSvg);
  const routeTrail = svg('path', { d: ROUTE1, stroke: C.green, 'stroke-width': 9, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '0 1' }, mapSvg);
  const route1Len = routeTrail.getTotalLength();
  const startDot = svg('circle', { cx: 84, cy: 110, r: 13, fill: C.green }, mapSvg);
  const endPin = svg('g', {}, mapSvg);
  svg('path', { d: 'M0 0 C-6 -10 -20 -18 -20 -32 A20 20 0 1 1 20 -32 C20 -18 6 -10 0 0 Z', fill: C.ink }, endPin);
  svg('circle', { cx: 0, cy: -32, r: 7.5, fill: '#fff' }, endPin);
  const ripple = svg('circle', { r: 20, stroke: C.green, 'stroke-width': 4, fill: 'none' }, mapSvg);
  const parcelDot = svg('g', {}, mapSvg);
  svg('circle', { r: 24, fill: '#fff' }, parcelDot);
  svg('circle', { r: 15, fill: C.green }, parcelDot);
  const lblChina = maskText(map, 48, 150, 'map-label', 'Хятад');
  const lblUB = maskText(map, 508, 384, 'map-label', 'Улаанбаатар');
  const bubble = $('div', 'abs bubble', map, 'Хаана явна?');

  // Status steps along the bottom of the map.
  const STEP_Y = 456;
  const stepXs = [70, MAP.w / 2, MAP.w - 70];
  const stepLine = svg('path', { d: `M${stepXs[0]} ${STEP_Y} H${stepXs[2]}`, stroke: '#cfdccd', 'stroke-width': 6, 'stroke-linecap': 'round' }, mapSvg);
  const stepFill = svg('path', { d: `M${stepXs[0]} ${STEP_Y} H${stepXs[2]}`, stroke: C.green, 'stroke-width': 6, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '0 1' }, mapSvg);
  const steps = stepXs.map((x) => {
    const g = svg('g', { transform: `translate(${x} ${STEP_Y})` }, mapSvg);
    const ring = svg('circle', { r: 15, fill: '#fff', stroke: '#cfdccd', 'stroke-width': 6 }, g);
    return { g, ring };
  });
  const stepLabels = ['Агуулах', 'Замд', 'Салбар'].map((s, i) => {
    const w = textWidth('700 25px Manrope', s);
    return maskText(map, stepXs[i] - w / 2, STEP_Y - 64, 'step-label', s);
  });
  const waitDots = [0, 1, 2].map(() => svg('circle', { r: 4.5, fill: C.green }, mapSvg));

  const parcelU = (t) =>
    lerp(0.16, 0.54, ease.inOut(prog(t, hit['хянаад'] - 0.1, 0.95))) + 0.035 * ease.outSoft(prog(t, hit['хүлээж'], 1.6));

  every((t) => {
    // Phone rise, then a push towards the map on «Бусдыг нь».
    const rise = spring(t + 0.16, { freq: 1.6, damping: 0.78 });
    const push = ease.inOut(prog(t, hit['бусдыг'] - 0.08, 0.9));
    phone.style.transformOrigin = `${PH.w / 2}px 760px`;
    tf(phone, 0, (1 - rise) * 1250 - push * 120, 1 + push * 0.08, (1 - rise) * -9);

    // App header: logo pops on «апп», title rises.
    const lp = spring(t - (hit['апп'] - 0.12), { freq: 2.2, damping: 0.6 });
    appLogoWrap.style.transform = `scale(${Math.max(0, lp)})`;
    appTitle.set(ease.out(prog(t, hit['апп'], 0.7)));

    // Orders slide up into the list; the first is selected on «хаана», the others drop away.
    rows.forEach((r, i) => {
      const k = ease.out(prog(t, hit['захиалгуудаа'] - 0.42 + i * 0.1, 0.75));
      const drop = i === 0 ? 0 : ease.inStrong(prog(t, hit['хаана'] - 0.28 + (2 - i) * 0.05, 0.42));
      r.el.style.clipPath = `inset(${(1 - k) * 100}% 0 0 0 round 30px)`;
      tf(r.el, 0, (1 - k) * 70 + drop * 900);
      shown(r.el, k > 0 && drop < 1);
      drawIcon(r.icon, prog(t, hit['захиалгуудаа'] - 0.2 + i * 0.1, 0.8));
      if (i === 0) r.el.style.boxShadow = `inset 0 0 0 ${3.5 * ease.out(prog(t, hit['хаана'] - 0.1, 0.4))}px ${C.green}`;
    });

    // Map opens downward from under the first order.
    const mk = ease.out(prog(t, hit['хаана'] - 0.08, 0.7));
    map.style.clipPath = `inset(0 0 ${(1 - mk) * 100}% 0 round 34px)`;
    shown(map, mk > 0);
    routeBase.setAttribute('stroke-dasharray', `${ease.inOut(prog(t, hit['хаана'] + 0.05, 0.75))} 1`);
    startDot.setAttribute('r', 13 * spring(t - (hit['хаана'] + 0.02), { freq: 2.4, damping: 0.6 }));
    const pinK = spring(t - (hit['хаана'] + 0.55), { freq: 2.2, damping: 0.55 });
    endPin.setAttribute('transform', `translate(572 352) scale(${Math.max(0, pinK)})`);
    lblChina.set(ease.out(prog(t, hit['хаана'] + 0.12, 0.6)));
    lblUB.set(ease.out(prog(t, hit['хаана'] + 0.62, 0.6)));

    // The parcel dot drops on «явааг», rides on «хянаад», and creeps while she waits.
    const u = parcelU(t);
    const p = routeTrail.getPointAtLength(u * route1Len);
    const dk = spring(t - (hit['явааг'] - 0.06), { freq: 2.4, damping: 0.5 });
    parcelDot.setAttribute('transform', `translate(${p.x} ${p.y}) scale(${Math.max(0, dk)})`);
    shown(parcelDot, dk > 0.001);
    routeTrail.setAttribute('stroke-dasharray', `${t > hit['явааг'] ? u : 0} 1`);
    // A ripple every 0.75 s from «явааг» while the dot waits.
    const rp = t > hit['явааг'] + 0.2 ? ((t - hit['явааг'] - 0.2) % 0.75) / 0.75 : -1;
    ripple.setAttribute('cx', p.x);
    ripple.setAttribute('cy', p.y);
    ripple.setAttribute('r', 22 + 46 * ease.outSoft(Math.max(0, rp)));
    ripple.setAttribute('stroke-opacity', rp < 0 ? 0 : 0.55 * (1 - rp));

    // «Хаана явна?» bubble pops above the dot, then leaves as tracking starts.
    const bIn = spring(t - (hit['явааг'] + 0.05), { freq: 2.2, damping: 0.62 });
    const bOut = ease.in(prog(t, hit['хүлээж'] - 0.1, 0.25));
    const bw = textWidth('700 27px Manrope', 'Хаана явна?') + 44;
    box(bubble, p.x - bw / 2, p.y - 108);
    bubble.style.transformOrigin = '50% 120%';
    bubble.style.transform = `scale(${Math.max(0, bIn * (1 - bOut))})`;
    shown(bubble, bIn > 0.01 && bOut < 1);

    // Steps: «Агуулах» done when the map opens, «Замд» on «хянаад», then the wait.
    const s2 = ease.inOut(prog(t, hit['хянаад'] - 0.02, 0.8));
    stepFill.setAttribute('stroke-dasharray', `${0.5 * s2} 1`);
    const lit = [mk >= 1 ? 1 : 0, s2 >= 0.99 ? 1 : 0, 0];
    steps.forEach((s, i) => {
      const sk = ease.out(prog(t, hit['хаана'] + 0.3 + i * 0.08, 0.5));
      s.g.setAttribute('transform', `translate(${stepXs[i]} ${STEP_Y}) scale(${sk})`);
      s.ring.setAttribute('stroke', lit[i] ? C.green : '#cfdccd');
      s.ring.setAttribute('fill', lit[i] && i === 0 ? C.green : '#fff');
      stepLabels[i].set(ease.out(prog(t, hit['хаана'] + 0.36 + i * 0.08, 0.6)));
      stepLabels[i].inner.style.color = i === 1 && lit[1] ? C.green : i === 0 ? C.ink : C.muted;
    });
    // Waiting: three dots bounce after «Замд».
    const wk = ease.out(prog(t, hit['хүлээж'] - 0.05, 0.4));
    const lw = textWidth('700 25px Manrope', 'Замд');
    waitDots.forEach((d, i) => {
      const bounce = Math.max(0, Math.sin((t - hit['хүлээж']) * 9 - i * 0.9)) * 7;
      d.setAttribute('cx', stepXs[1] + lw / 2 + 12 + i * 13);
      d.setAttribute('cy', STEP_Y - 46 - bounce * wk);
      d.setAttribute('r', 4.5 * wk);
    });
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
