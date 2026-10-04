// Хан Төгөл Хотхон: "Дараагийн асуулт" (monthly costs of a single house), 9:16, 6.68 s.
// Pure function of time: window.seek(t) paints frame t. Every hit comes from beats.json,
// built from the reel's SRT. The film clears to the bare background on its last frame,
// which is where the Q3 film begins, so the two cut together without a seam.
import { clamp, ease, lerp, prog, spring } from '../shared/motion.js';
import { $, C, HERO_BASE, LABEL1, LABEL2, background, boot, box, drawIcon, heroSlot, hook, makeIcon, op, shown, slot, svg, textWidth, tf, unit } from '../shared/kit.js';

boot(({ hit, beats, world, every }) => {
  const END = beats.duration;
  const LEAVE = END - 0.42; // when the content starts clearing for the hand-off to Q3
  background(every, -END);

  // ================================================================ 1. Hook: "Дараагийн асуулт."
  hook(world, every, {
    numeral: '2',
    current: 1,
    lines: ['Дараагийн', 'асуулт.'],
    at: { ask: hit['асуулт'], glide: hit['сөх'] - 0.12, leave: hit['нэг'] - 0.58, out: hit['нэг'] - 0.52 },
  });

  // ================================================================ 3. The panel (built first so the tiles sit above it)
  const PANEL = { x: 64, y: 948, w: 952, h: 500, slim: 330 };
  const panelRoot = $('div', 'abs', world);
  const panel = $('div', 'face', panelRoot);
  const panelIn = (t) => ease.out(prog(t, hit['нэг'] - 0.3, 0.95));
  const slimK = (t) => ease.inOut(prog(t, hit['сарын'] - 0.1, 0.55));
  const panelOut = (t) => ease.in(prog(t, LEAVE - 0.08, 0.34));
  every((t) => {
    const k = panelIn(t);
    const out = panelOut(t);
    const h = lerp(PANEL.h, PANEL.slim, slimK(t));
    box(panelRoot, PANEL.x, PANEL.y, PANEL.w, h);
    // Wipe up from the bottom edge on the way in, down from the top on the way out.
    const top = lerp(h + 2, -80, k) + out * (h + 82);
    const halo = lerp(0, -80, k);
    panel.style.clipPath = k < 1 || out > 0 ? `inset(${top}px ${halo}px ${halo}px ${halo}px round 38px)` : 'none';
    panel.style.borderRadius = '38px';
    tf(panelRoot, 0, (1 - k) * 80 + out * 60);
    shown(panelRoot, k > 0 && out < 1);
  });

  // A single house in elevation draws itself, then folds into the caption as the range arrives.
  const HOUSE = { x: 76, y: 30, w: 800, h: 440 };
  const houseWrap = $('div', 'abs', panel);
  box(houseWrap, HOUSE.x, HOUSE.y, HOUSE.w, HOUSE.h);
  houseWrap.style.transformOrigin = '0 0';
  const house = makeIcon(houseWrap, 'villa', HOUSE.w, HOUSE.h, C.ink, 1.6);
  const MINI = { x: 56, y: 38, w: 76 };
  const caption = $('div', 'abs mask caption', panel);
  box(caption, MINI.x + MINI.w + 22, 44);
  const captionInner = $('span', '', caption, 'Сингл хаус · сард');
  every((t) => {
    drawIcon(house, prog(t, hit['нэг'] + 0.05, 1.3));
    const s = slimK(t);
    const scale = lerp(1, MINI.w / HOUSE.w, s);
    tf(houseWrap, lerp(0, MINI.x - HOUSE.x, s), lerp(0, MINI.y - HOUSE.y, s), scale);
    // Keep the line about 3 px on screen at every size.
    house.el.setAttribute('stroke-width', 3 / (2 * scale));
    captionInner.style.transform = `translateY(${(1 - ease.out(prog(t, hit['сарын'] + 0.36, 0.8))) * 115}%)`;
  });

  // The range, on a 600 мянга – 1.2 сая scale: one thumb runs to 800 мянга with the count,
  // the second lands on 1 сая, and on "хооронд" the band between them fills.
  const TRACK = { x: 56, y: 196, w: 840 };
  const at = (v) => TRACK.x + (TRACK.w * (v - 600)) / 600; // v in thousands
  const track = $('div', 'track', panel);
  box(track, TRACK.x, TRACK.y, TRACK.w);
  track.style.transformOrigin = '0 50%';
  const band = $('div', 'band', panel);
  box(band, at(800), TRACK.y, at(1000) - at(800));
  band.style.transformOrigin = '0 50%';
  const ticks = Array.from({ length: 7 }, (_, i) => {
    const k = $('div', 'abs', panel);
    box(k, at(600 + i * 100) - 1, TRACK.y + 30, 2, 16);
    k.style.background = 'var(--gray50)';
    k.style.transformOrigin = '50% 0';
    return k;
  });
  const ends = [['600 мянга', 'left'], ['1.2 сая', 'right']].map(([text, side]) => {
    const m = $('div', 'abs mask scale-label', panel);
    const w = textWidth('600 26px Manrope', text);
    box(m, side === 'left' ? TRACK.x : TRACK.x + TRACK.w - w, TRACK.y + 62);
    return $('span', '', m, text);
  });
  const thumbs = [0, 1].map(() => $('div', 'thumb', panel));
  const values = [['800 мянга', 800], ['1 сая', 1000]].map(([text, v]) => {
    const m = $('div', 'abs mask value', panel);
    box(m, at(v) - textWidth('700 38px Manrope', text) / 2, TRACK.y - 92);
    return $('span', '', m, text);
  });
  const countK = (t) => ease.outSoft(prog(t, hit['800 мянга'] - 0.06, 0.55));
  every((t) => {
    const rangeOn = slimK(t) > 0.5;
    for (const e of [track, band, ...ticks, ...thumbs]) shown(e, rangeOn);
    track.style.transform = `scaleX(${ease.out(prog(t, hit['800 мянга'] - 0.28, 0.7))})`;
    ticks.forEach((k, i) => (k.style.transform = `scaleY(${ease.out(prog(t, hit['800 мянга'] - 0.12 + i * 0.03, 0.45))})`));
    ends.forEach((e, i) => (e.style.transform = `translateY(${(1 - ease.out(prog(t, hit['800 мянга'] + i * 0.06, 0.7))) * 115}%)`));
    // Thumb A rides the count to 800 мянга; thumb B leaves it on "1 сая" and lands on 1 сая.
    const a = at(lerp(600, 800, countK(t)));
    const b = lerp(at(800), at(1000), ease.inOut(prog(t, hit['1 сая'] - 0.08, 0.6)));
    const popA = spring(t - (hit['800 мянга'] - 0.16), { freq: 2.2, damping: 0.7 });
    const popB = spring(t - (hit['1 сая'] - 0.12), { freq: 2.2, damping: 0.7 });
    box(thumbs[0], a, TRACK.y + 7);
    box(thumbs[1], b, TRACK.y + 7);
    thumbs[0].style.transform = `scale(${Math.max(0, popA)})`;
    thumbs[1].style.transform = `scale(${Math.max(0, popB)})`;
    band.style.transform = `scaleX(${ease.inOut(prog(t, hit['хооронд'] - 0.06, 0.55))})`;
    values[0].style.transform = `translateY(${(1 - ease.out(prog(t, hit['800 мянга'] + 0.18, 0.8))) * 115}%)`;
    values[1].style.transform = `translateY(${(1 - ease.out(prog(t, hit['1 сая'] + 0.16, 0.8))) * 115}%)`;
  });

  // ================================================================ 2. What it covers: СӨХ + хэрэглээний зардал
  const TILE = { y: 740, w: 426, h: 360 };
  const tileDefs = [
    { x: 96, index: '01', icon: 'hoa', lines: ['СӨХ'], words: [hit['сөх']], start: hit['сөх'] - 0.02 },
    { x: 558, index: '02', icon: 'utility', lines: ['Хэрэглээний', 'зардал'], words: [hit['хэрэглээний'], hit['зардал']], start: hit['хэрэглээний'] - 0.3 },
  ];
  const doorsK = (t) => ease.inOut(prog(t, hit['нэг'] - 0.4, 0.6));
  tileDefs.forEach((def, i) => {
    const root = $('div', 'abs', world);
    box(root, def.x, TILE.y, TILE.w, TILE.h);
    root.style.perspective = '1800px';
    const face = $('div', 'face', root);
    face.style.transformOrigin = i === 0 ? '0 50%' : '100% 50%';
    const disc = $('div', 'icon-disc', face);
    box(disc, 36, 36);
    const icon = makeIcon(disc, def.icon, 76, 76, C.green, 3.4);
    const index = $('div', 'abs card-index', face, def.index);
    box(index, TILE.w - 44 - 44, 46);
    const lines = def.lines.map((text, j) => {
      const m = $('div', 'abs mask tile-title', face);
      box(m, 40, TILE.h - 52 - 56 - (def.lines.length - 1 - j) * 64);
      return $('span', '', m, text);
    });
    every((t) => {
      const k = ease.out(prog(t, def.start, 0.95));
      const top = lerp(TILE.h + 2, -80, k);
      const halo = lerp(0, -80, k);
      face.style.clipPath = k < 1 ? `inset(${top}px ${halo}px ${halo}px ${halo}px round 30px)` : 'none';
      // On "нэг" the tiles swing apart like doors onto the house.
      const d = doorsK(t);
      tf(root, (i === 0 ? -1 : 1) * 620 * d, (1 - k) * 80);
      face.style.transform = `rotateY(${(i === 0 ? 1 : -1) * 22 * d}deg)`;
      shown(root, t >= def.start && d < 1);
      drawIcon(icon, prog(t, def.start + 0.18, 1.0));
      const idx = ease.out(prog(t, def.start + 0.3, 0.7));
      tf(index, (1 - idx) * 24, 0);
      op(index, idx);
      lines.forEach((line, j) => {
        line.style.transform = `translateY(${(1 - ease.out(prog(t, def.words[j] - 0.22, 0.85))) * 115}%)`;
      });
    });
  });

  // The "+" for "болон" (and) pops between the two tiles.
  const plus = $('div', 'plus-disc', world);
  box(plus, 540 - 38, TILE.y + TILE.h / 2 - 38);
  every((t) => {
    const s = spring(t - (hit['болон'] - 0.06), { freq: 2.2, damping: 0.62 }) * (1 - ease.in(prog(t, hit['нэг'] - 0.42, 0.28)));
    plus.style.transform = `scale(${Math.max(0, s)}) rotate(${lerp(-90, 0, clamp(s))}deg)`;
    shown(plus, s > 0.001);
  });

  // ================================================================ 3–5. Single house, about how much a month
  every(slot(world, 96, 376, 'eyebrow', [
    { t: hit['нэг'] - 0.05, html: 'СӨХ + хэрэглээний зардал', lead: 0.1, exit: LEAVE - 0.16 },
  ]));

  every(heroSlot(world, [
    { t: hit['нэг'], parts: ['1'], lead: 0.22, exit: hit['ойролцоогоор'] - 0.24 },
    {
      t: hit['800 мянга'],
      parts: ['0', unit('мянга')],
      lead: 0.18,
      exit: LEAVE - 0.12,
      update: (t, parts) => {
        parts[0].textContent = String(Math.round(lerp(0, 800, ease.outSoft(prog(t, hit['800 мянга'] - 0.06, 0.55))) / 10) * 10);
      },
    },
  ]));

  // "≈" for "ойролцоогоор" (about): two gold waves that draw on and keep a slow swell.
  const APPROX = { x: 104, y: HERO_BASE - 196, w: 236, h: 150 };
  const approx = svg('svg', { width: APPROX.w, height: APPROX.h, viewBox: `0 0 ${APPROX.w} ${APPROX.h}`, fill: 'none' }, world);
  approx.style.position = 'absolute';
  box(approx, APPROX.x, APPROX.y);
  const waves = [0, 1].map(() => svg('path', { stroke: C.gold, 'stroke-width': 16, 'stroke-linecap': 'round' }, approx));
  every((t) => {
    const draw = ease.out(prog(t, hit['ойролцоогоор'] - 0.12, 0.7));
    const out = ease.inOut(prog(t, hit['800 мянга'] - 0.38, 0.28));
    shown(approx, draw > 0 && out < 1);
    waves.forEach((p, i) => {
      const y0 = 48 + i * 56;
      const pts = [];
      const len = draw - out;
      for (let s = 0; s <= 40; s++) {
        const u = out + (s / 40) * len;
        const x = 12 + u * (APPROX.w - 24);
        const y = y0 + 15 * Math.sin(u * Math.PI * 2 + i * 0.35 + t * 2.4);
        pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
      }
      p.setAttribute('d', len > 0.01 ? `M${pts.join(' L')}` : '');
    });
  });

  every(slot(world, 96, LABEL1, 'label', [
    { t: hit['сингл хаус'], html: 'Сингл хаус' },
    { t: hit['ойролцоогоор'], html: 'Сард ойролцоогоор' },
    { t: hit['1 сая'], html: '– 1 сая төгрөгийн', exit: LEAVE - 0.08 },
  ]));
  every(slot(world, 96, LABEL2, 'label', [
    { t: hit['хооронд'], html: '<span class="green">хооронд</span>', lead: 0.18, exit: LEAVE - 0.04 },
  ]));

  // Gentle push on the whole layout so holds never sit dead still; back to rest at the cut.
  every((t) => {
    world.style.transformOrigin = '50% 45%';
    world.style.transform = `scale(${1 + 0.012 * Math.sin((t / END) * Math.PI)})`;
  });
});
