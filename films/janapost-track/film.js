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
import { $, box, drawIcon, mix, op, shown, slot, svg, textWidth, tf } from '../shared/kit.js';
import { C, H, W, boot, lineIcon, makeLogo, maskText, riseLogo } from '../janapost-shared/brand.js';

const FPS = 30000 / 1001;

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
}, { fps: FPS });
