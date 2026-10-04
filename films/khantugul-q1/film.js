// Хан Төгөл Хотхон: "Эхний асуулт" (location), 9:16, 6.17 s at 30 fps.
// Pure function of time: window.seek(t) paints frame t. Every hit comes from beats.json,
// built from the reel's SRT. The film clears to the bare background on its last frame, which
// is where the Q2 film begins, so the three films cut together without a seam.
import { clamp, ease, lerp, prog, spring } from '../shared/motion.js';
import { $, C, LABEL1, LABEL2, background, boot, box, drawIcon, hook, makeIcon, shown, slot, svg, textWidth, tf } from '../shared/kit.js';

boot(({ hit, beats, world, every }) => {
  const END = beats.duration;
  const LEAVE = END - 0.36; // when the content starts clearing for the hand-off to Q2
  // The background drift runs on one clock across the reel, anchored at the Q3 film's start
  // (16.71 s in the sequence), so each film hands the terrain to the next without a jump.
  background(every, beats.sequenceStart - 16.71);

  // ================================================================ 1. Hook: "Эхний асуулт."
  // The question is short, so the headline leaves in place rather than gliding into a header.
  hook(world, every, {
    numeral: '1',
    current: 0,
    lines: ['Эхний', 'асуулт.'],
    glideHeader: false,
    at: { ask: hit['асуулт'], glide: hit['нүхтийн аманд'] + 0.1, leave: hit['нүхтийн аманд'] - 0.1, out: hit['нүхтийн аманд'] - 0.14 },
  });

  every(slot(world, 96, 376, 'eyebrow', [
    { t: hit['нүхтийн аманд'] + 0.3, html: 'Байршил', lead: 0.1, exit: LEAVE - 0.22 },
  ]));

  // ================================================================ 2. Where: the landscape draws itself
  const LAND = { x: 64, y: 400, w: 952, h: 340 };
  const land = svg('svg', { width: LAND.w, height: LAND.h, viewBox: `0 0 ${LAND.w} ${LAND.h}`, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, world);
  land.style.position = 'absolute';
  box(land, LAND.x, LAND.y);
  land.style.overflow = 'visible';
  const stroke = (d, color, width) => svg('path', { d, stroke: color, 'stroke-width': width, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, land);
  const ridges = [
    stroke('M0 236 C58 210 98 132 154 104 C210 76 240 14 304 0 C368 -12 388 54 428 92 C460 122 482 80 526 68 C580 54 618 150 690 255', C.gold, 4),
    stroke('M690 255 C718 214 744 168 780 124 C816 84 846 66 876 76 C912 88 934 124 952 140', C.gold, 4),
    stroke('M0 304 C80 284 146 260 222 266 C300 272 362 244 434 252 C506 260 566 284 640 292', C.ink, 4),
    stroke('M748 292 C812 272 876 264 952 270', C.ink, 4),
    stroke('M690 255 C676 280 704 300 684 340', C.green, 4),
  ];
  const ridgeAt = [0, 0.18, 0.32, 0.44, 0.56]; // draw order, as fractions of the draw window

  // The grove at the foot of the mountain.
  const TREES = [[512, 300, 1], [556, 312, 0.8], [602, 304, 1.1], [776, 306, 0.9], [818, 296, 1.15], [864, 302, 0.85]];
  const trees = TREES.map(([x, y, s]) => {
    const g = svg('g', {}, land);
    svg('path', { d: 'M0 0 V-14', stroke: C.green, 'stroke-width': 3.6 }, g);
    svg('path', { d: 'M0 -14 C-12 -14 -13 -40 0 -56 C13 -40 12 -14 0 -14 Z', stroke: C.green, 'stroke-width': 3.6, fill: 'rgba(30,78,62,0.1)' }, g);
    return { g, x, y, s };
  });

  // "уулын бэлд": dots trace the foot of the mountain.
  const footPath = svg('path', { d: 'M410 266 C500 278 600 272 690 255' }, land);
  const footLen = footPath.getTotalLength();
  const foot = Array.from({ length: 15 }, (_, i) => {
    const p = footPath.getPointAtLength((footLen * i) / 14);
    return svg('circle', { cx: p.x, cy: p.y, r: 0, fill: C.gold }, land);
  });

  // The pin drops on "Нүхтийн аманд" and pings on "байрлаж".
  const PIN = { x: 690, y: 255 };
  const ping = svg('circle', { cx: PIN.x, cy: PIN.y, r: 0, stroke: C.gold, 'stroke-width': 3, fill: 'none' }, land);
  const pinShadow = svg('ellipse', { cx: PIN.x, cy: PIN.y, rx: 14, ry: 4, fill: 'rgba(27,30,35,0.14)' }, land);
  const pin = svg('g', {}, land);
  svg('path', { d: 'M0 0 C-10 -14 -20 -24 -20 -38 A20 20 0 0 1 20 -38 C20 -24 10 -14 0 0 Z', fill: C.gold }, pin);
  svg('circle', { cx: 0, cy: -38, r: 7.5, fill: C.white }, pin);
  const place = $('div', 'abs caption', world, 'Нүхтийн ам');
  const placeW = textWidth('600 34px Manrope', 'Нүхтийн ам');
  Object.assign(place.style, { background: C.white, padding: '14px 22px', borderRadius: '30px', boxShadow: '0 0 0 1.5px var(--gray12), 0 12px 24px -14px rgba(27,30,35,0.35)', transformOrigin: '0 100%' });
  box(place, LAND.x + PIN.x + 30, LAND.y + PIN.y - 150);

  const drawK = (t) => prog(t, hit['нүхтийн аманд'] + 0.22, 1.4);
  const landOut = (t) => ease.in(prog(t, LEAVE, 0.28));
  every((t) => {
    const k = drawK(t);
    ridges.forEach((p, i) => p.setAttribute('stroke-dashoffset', 1 - ease.inOutSoft(clamp((k - ridgeAt[i]) / 0.44))));
    trees.forEach((tr, i) => {
      const s = spring(t - (hit['байгальтайгаа ойр'] - 0.06 + i * 0.07), { freq: 2.4, damping: 0.62 });
      tr.g.setAttribute('transform', `translate(${tr.x} ${tr.y}) scale(${Math.max(0, s) * tr.s})`);
    });
    foot.forEach((d, i) => d.setAttribute('r', 3.6 * clamp(spring(t - (hit['уулын бэлд'] - 0.08 + i * 0.035), { freq: 3, damping: 0.7 }))));
    const drop = spring(t - (hit['нүхтийн аманд'] + 0.26), { freq: 1.9, damping: 0.6 });
    pin.setAttribute('transform', `translate(${PIN.x} ${PIN.y - (1 - drop) * 240})`);
    shown(pin, drop > 0);
    pinShadow.setAttribute('rx', 14 * clamp(drop));
    const ringK = prog(t, hit['байрлаж'] - 0.04, 0.75);
    ping.setAttribute('r', 8 + 70 * ease.out(ringK));
    ping.setAttribute('opacity', ringK > 0 && ringK < 1 ? 1 - ringK : 0);
    const label = spring(t - (hit['нүхтийн аманд'] + 0.5), { freq: 2.2, damping: 0.7 });
    place.style.transform = `scale(${Math.max(0, label)})`;
    shown(place, label > 0);
    // Clear upward for the hand-off.
    const out = landOut(t);
    tf(land, 0, -out * 60);
    land.style.opacity = 1 - out;
    place.style.opacity = 1 - out;
  });

  every(slot(world, 96, LABEL1, 'label', [
    { t: hit['нүхтийн аманд'] + 0.34, html: 'Нүхтийн аманд', lead: 0.15 },
    { t: hit['уулын бэлд'], html: 'Уулын бэлд' },
    { t: hit['хэдий ч'], html: '<span class="gold it">Хэдий ч</span>' },
    { t: hit['төвийн'], html: 'Төвийн шугамд', exit: LEAVE - 0.18 },
  ]));
  every(slot(world, 96, LABEL2, 'label', [
    { t: hit['байгальтайгаа ойр'], html: '<span class="green">байгальтайгаа ойр</span>', exit: hit['хэдий ч'] - 0.2 },
    { t: hit['бүрэн'], html: '<span class="green">бүрэн холбогдсон</span>', exit: LEAVE - 0.14 },
  ]));

  // ================================================================ 3. Yet connected: the house to the city
  const PANEL = { x: 64, y: 948, w: 952, h: 500 };
  const panelRoot = $('div', 'abs', world);
  box(panelRoot, PANEL.x, PANEL.y, PANEL.w, PANEL.h);
  const panel = $('div', 'face', panelRoot);
  panel.style.borderRadius = '38px';
  const panelIn = (t) => ease.out(prog(t, hit['хэдий ч'] - 0.1, 0.95));
  const panelOut = (t) => ease.in(prog(t, LEAVE, 0.28));

  const caption = $('div', 'abs mask caption', panel);
  box(caption, 56, 44);
  const captionInner = $('span', '', caption, 'Төвийн шугам');
  const PCT_W = textWidth('700 38px Manrope', '100%');
  const pct = $('div', 'abs value', panel, '0%');
  Object.assign(pct.style, { width: `${PCT_W}px`, textAlign: 'right', fontVariantNumeric: 'tabular-nums' });
  box(pct, 896 - PCT_W, 42);

  const net = svg('svg', { width: PANEL.w, height: PANEL.h, viewBox: `0 0 ${PANEL.w} ${PANEL.h}`, fill: 'none', 'stroke-linecap': 'round' }, panel);
  net.style.position = 'absolute';
  box(net, 0, 0);
  const CABLES = [
    { d: 'M196 300 C330 300 340 180 476 180 C612 180 622 300 756 300', icon: 'flame', y: 180, at: hit['төвийн'] + 0.02 },
    { d: 'M196 300 H756', icon: 'drop', y: 300, at: hit['төвийн'] + 0.22 },
    { d: 'M196 300 C330 300 340 420 476 420 C612 420 622 300 756 300', icon: 'bolt', y: 420, at: hit['төвийн'] + 0.42 },
  ];
  const cables = CABLES.map((c) => {
    const base = svg('path', { d: c.d, stroke: C.green, 'stroke-width': 5, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, net);
    const flow = svg('path', { d: c.d, stroke: C.gold, 'stroke-width': 5, pathLength: 1, 'stroke-dasharray': '0.07 0.43', 'stroke-dashoffset': 0, opacity: 0 }, net);
    const disc = $('div', 'abs', panel);
    Object.assign(disc.style, { width: '76px', height: '76px', marginLeft: '-38px', marginTop: '-38px', borderRadius: '50%', background: C.white, boxShadow: `inset 0 0 0 3px ${C.green}`, display: 'grid', placeItems: 'center' });
    box(disc, 476, c.y);
    const icon = makeIcon(disc, c.icon, 42, 42, C.green, 4.2);
    return { ...c, base, flow, disc, icon };
  });

  const node = (x, name, w, h, color) => {
    const d = $('div', 'icon-disc', panel);
    Object.assign(d.style, { width: '132px', height: '132px', marginLeft: '-66px', marginTop: '-66px' });
    box(d, x, 300);
    const icon = makeIcon(d, name, w, h, color, name === 'villa' ? 9 : 4.2);
    const badge = $('div', 'abs', panel);
    Object.assign(badge.style, { width: '44px', height: '44px', marginLeft: '-22px', marginTop: '-22px', borderRadius: '50%', background: C.green });
    box(badge, x + 48, 300 - 48);
    const check = makeIcon(badge, 'check', 44, 44, C.white, 10);
    return { d, icon, badge, check };
  };
  const nodes = [node(130, 'villa', 96, 53, C.ink), node(822, 'skyline', 76, 76, C.green)];

  every((t) => {
    const k = panelIn(t);
    const out = panelOut(t);
    // Wipe up from the bottom on the way in (the shadow comes with the face), down on the way out.
    const top = lerp(PANEL.h + 2, -80, k) + out * (PANEL.h + 82);
    const halo = lerp(0, -80, k);
    panel.style.clipPath = k < 1 || out > 0 ? `inset(${top}px ${halo}px ${halo}px ${halo}px round 38px)` : 'none';
    tf(panelRoot, 0, (1 - k) * 80 + out * 60);
    shown(panelRoot, k > 0 && out < 1);
    captionInner.style.transform = `translateY(${(1 - ease.out(prog(t, hit['хэдий ч'] + 0.2, 0.8))) * 115}%)`;

    nodes.forEach((n, i) => {
      const s = spring(t - (hit['хэдий ч'] + 0.18 + i * 0.12), { freq: 2.2, damping: 0.7 });
      n.d.style.transform = `scale(${Math.max(0, s)})`;
      drawIcon(n.icon, prog(t, hit['хэдий ч'] + 0.24 + i * 0.12, 0.9));
      const b = spring(t - (hit['холбогдсон'] + i * 0.1), { freq: 2.4, damping: 0.6 });
      n.badge.style.transform = `scale(${Math.max(0, b)})`;
      drawIcon(n.check, prog(t, hit['холбогдсон'] + 0.08 + i * 0.1, 0.45));
    });

    let connected = 0;
    cables.forEach((c) => {
      const d = ease.inOut(prog(t, c.at, 0.62));
      connected += d / cables.length;
      c.base.setAttribute('stroke-dashoffset', 1 - d);
      const s = spring(t - (c.at + 0.24), { freq: 2.4, damping: 0.62 });
      c.disc.style.transform = `scale(${Math.max(0, s)})`;
      drawIcon(c.icon, prog(t, c.at + 0.3, 0.5));
      // On "бүрэн", flow runs along every line from the house to the city.
      const flowOn = clamp((t - hit['бүрэн'] + 0.04) / 0.2);
      c.flow.setAttribute('opacity', flowOn);
      c.flow.setAttribute('stroke-dashoffset', -(t - hit['бүрэн']) * 0.9);
    });
    pct.textContent = `${Math.round(connected * 100)}%`;
    pct.style.opacity = ease.out(prog(t, hit['төвийн'] - 0.1, 0.4));
  });

  // Gentle push on the whole layout so holds never sit dead still; back to rest at the cut.
  every((t) => {
    world.style.transformOrigin = '50% 45%';
    world.style.transform = `scale(${1 + 0.012 * Math.sin((t / END) * Math.PI)})`;
  });
}, { fps: 30 });
