// Хан Төгөл Хотхон: "Сүүлийн асуулт" (payment terms), 9:16, 21 s.
// Pure function of time: window.seek(t) paints frame t. Every hit comes from beats.json,
// which is built from the reel's SRT, so each move lands on a spoken word.
import { clamp, ease, lerp, prog, spring } from '../shared/motion.js';
import { $, C, LABEL1, LABEL2, HERO_BASE, background, boot, box, drawIcon, heroSlot, hook, ink, makeIcon, mix, op, px, shown, slot, svg, textWidth, tf, unit } from '../shared/kit.js';

boot(({ hit, world, every }) => {
  background(every);

  // ================================================================ 1. Hook: "Сүүлийн асуулт."
  hook(world, every, {
    numeral: '3',
    current: 2,
    lines: ['Сүүлийн', 'асуулт.'],
    at: { ask: hit['асуулт'], glide: hit.options, leave: hit['урьдчилгаа'] - 0.5, out: hit['төлбөрийн'] - 0.3 },
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
  const count18 = { value: 6 };
  const hero = heroSlot(world, [
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
  ]);
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
    box(right, 56 + BAR.w - textWidth('600 34px Manrope', '100%'), 44);
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
  const optAWidth = textWidth('700 38px Manrope', '6 сар · 0% хүү');
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
    box(label, (TILE.w - textWidth('600 34px Manrope', d.label)) / 2, TILE.h - 56);
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
});
