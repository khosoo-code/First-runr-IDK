// Jana Post overlay for the testimonial's close: «Хятадаас хурдан, найдвартай. Толгой
// өвдөхгүй. Захиалъя гэвэл Jana Post-ыг татаад аваарай.» 1080×1920, 30 fps, 180 frames,
// transparent, in the empty wall above her head (y 170–480).
//
// 1. Three benefit stickers stack up, one per word: ⚡ Хятадаас хурдан (slides in on speed
//    lines), 🛡 Найдвартай (stamps on), 🙂 Толгой өвдөхгүй (bounces up).
// 2. «Захиалъя гэвэл» → the Jana Post app icon → «Татаад аваарай»: a download button slides
//    out of the icon, a progress ring runs round the icon and it checks off.
//
// Pure function of time: window.seek(t) paints frame t. Add ?backdrop to review it over a
// frame of the footage (render.mjs --query backdrop); the render itself stays transparent.
import { ease, lerp, prog, spring } from '../shared/motion.js';
import { $, box, drawIcon, shown, svg } from '../shared/kit.js';
import { C, W, boot, lineIcon, makeLogo, riseLogo } from '../janapost-shared/brand.js';

const BACKDROP = new URLSearchParams(location.search).has('backdrop');
const images = {};
async function preload() {
  if (!BACKDROP) return;
  const img = new Image();
  img.src = '../janapost-shared/backdrop.jpg';
  await img.decode();
  images.backdrop = img;
}

/** A text run that rises through a mask; returns its element, width and a 0..1 setter. */
function riser(parent, cls, html) {
  const m = $('div', `abs mask ${cls}`, parent);
  const inner = $('span', '', m, html);
  return { m, inner, w: m.offsetWidth, set: (k) => (inner.style.transform = `translateY(${(1 - k) * 120}%)`) };
}

boot(({ hit, stage, every }) => {
  if (BACKDROP) {
    images.backdrop.id = 'backdrop';
    stage.appendChild(images.backdrop);
  }

  // ============================================================== 1. Benefits
  const ROW = { h: 96, gap: 10, y0: 170, disc: 76, pad: 10, textGap: 16 };
  const BENEFITS = [
    { icon: 'bolt', parts: ['Хятадаас', '<span class="green">хурдан</span>'], at: [hit['хятадаас'], hit['хурдан']], rot: -2 },
    { icon: 'shield', parts: ['<span class="green">Найдвартай</span>'], at: [hit['найдвартай']], rot: 1.5 },
    { icon: 'smile', parts: ['Толгой', '<span class="green">өвдөхгүй</span>'], at: [hit['толгой'], hit['өвдөхгүй']], rot: -1.5 },
  ];
  const rows = BENEFITS.map((d, i) => {
    const y = ROW.y0 + i * (ROW.h + ROW.gap);
    const pill = $('div', 'abs sticker pill', stage);
    pill.style.overflow = 'hidden'; // words wait inside it while it widens
    const disc = $('div', 'abs disc', pill);
    box(disc, ROW.pad, (ROW.h - ROW.disc) / 2, ROW.disc, ROW.disc);
    const icon = lineIcon(disc, d.icon, 50, '#fff', 9);
    const textX = ROW.pad + ROW.disc + 20;
    let x = textX;
    const parts = d.parts.map((html) => {
      const r = riser(pill, 'row-text', html);
      box(r.m, x, (ROW.h - 60) / 2 - 2);
      r.x = x;
      x += r.w + ROW.textGap;
      return r;
    });
    const widths = parts.map((p) => p.x + p.w + 34);
    return { d, i, y, pill, disc, icon, parts, widths };
  });
  // Speed lines behind «Хятадаас хурдан».
  const speed = [0, 1, 2].map(() => $('div', 'abs speed', stage));

  every((t) => {
    rows.forEach((r) => {
      const { d, i } = r;
      // Width grows as each word arrives, so the sticker stays centred on what's said.
      const grow = r.widths.length > 1 ? ease.inOut(prog(t, d.at[1] - 0.3, 0.3)) : 0;
      const w = lerp(r.widths[0], r.widths.at(-1), grow);
      const x = (W - w) / 2;
      box(r.pill, x, r.y, w, ROW.h);

      let tx = 0, ty = 0, s = 1, live = true;
      if (i === 0) {
        // Slides in from the left, already moving on frame 0.
        const k = ease.out(prog(t, d.at[0] - 0.14, 0.5));
        tx = -(1 - k) * 900;
        live = k > 0;
        speed.forEach((line, j) => {
          const again = Math.sin(Math.PI * prog(t, d.at[1] - 0.12, 0.4));
          const len = Math.max((1 - k) * 260, again * 150) * (1 - j * 0.22);
          box(line, x + tx - 22 - len, r.y + 22 + j * 24, len, 7);
          shown(line, len > 2);
        });
      } else if (i === 1) {
        // Stamps on.
        const k = spring(t - (d.at[0] - 0.14), { freq: 2.2, damping: 0.5 });
        s = Math.max(0, lerp(1.6, 1, k) * Math.min(1, k * 3));
        live = k > 0.001;
      } else {
        // Bounces up.
        const k = spring(t - (d.at[0] - 0.14), { freq: 1.9, damping: 0.45 });
        ty = (1 - k) * 80;
        s = Math.max(0, Math.min(1, k * 2));
        live = k > 0.001;
      }
      // All three shrink away just before «Захиалъя гэвэл» lands.
      const out = ease.in(prog(t, hit['захиалъя'] - 0.44 + i * 0.05, 0.26));
      const float = Math.sin(t * 2.3 + i * 1.9) * 2.5;
      r.pill.style.transformOrigin = '50% 50%';
      r.pill.style.transform = `translate(${tx}px, ${ty + float}px) scale(${s * (1 - out)}) rotate(${d.rot + out * 10}deg)`;
      shown(r.pill, live && out < 1);

      drawIcon(r.icon, prog(t, d.at[0] - 0.02, 0.55));
      r.parts.forEach((p, j) => p.set(ease.out(prog(t, d.at[j] - 0.08, 0.5))));
      // The icon kicks on its key word: «хурдан», «Найдвартай», «өвдөхгүй».
      const kick = spring(t - (d.at.at(-1) - 0.02), { freq: 3, damping: 0.35 });
      r.disc.style.transform = `scale(${t > d.at.at(-1) - 0.02 ? 1 + 0.25 * Math.sin(Math.PI * Math.min(1, kick)) * (1 - prog(t, d.at.at(-1), 0.5)) : 1})`;
    });
  });

  // ============================================================== 2. Download
  const cta = $('div', 'abs sticker pill', stage);
  const ctaText = riser(cta, 'cta-text', 'Захиалъя гэвэл');
  const CTA = { y: 176, h: 118 };
  const ctaW = ctaText.w + 76;
  box(cta, (W - ctaW) / 2, CTA.y, ctaW, CTA.h);
  box(ctaText.m, 38, (CTA.h - 62) / 2 - 2);

  const ICON = { size: 150, y: 318, ring: 10 };
  const DL = { h: 120, disc: 94 };
  const dl = $('div', 'abs big-pill', stage); // under the icon, so it slides out from behind it
  const app = $('div', 'abs app-icon', stage);
  const appLogo = makeLogo(app, 112, '#fff');
  const ring = svg('svg', { width: ICON.size + 2 * ICON.ring + 10, height: ICON.size + 2 * ICON.ring + 10, fill: 'none' }, stage);
  ring.style.position = 'absolute';
  const rs = ICON.size + 2 * ICON.ring;
  const rectAttrs = { x: 5, y: 5, width: rs, height: rs, rx: 50, 'stroke-width': 8 };
  const track = svg('rect', { ...rectAttrs, stroke: '#fff' }, ring);
  const progress = svg('rect', { ...rectAttrs, stroke: C.green, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '0 1' }, ring);
  const appCheck = $('div', 'abs check', stage);
  const appTick = lineIcon(appCheck, 'check', 64, '#fff', 12);

  dl.style.background = C.ink;
  const dlDisc = $('div', 'abs disc', dl);
  box(dlDisc, 13, (DL.h - DL.disc) / 2, DL.disc, DL.disc);
  const dlArrowWrap = $('div', 'abs', dlDisc);
  box(dlArrowWrap, (DL.disc - 58) / 2, (DL.disc - 58) / 2);
  const dlArrow = lineIcon(dlArrowWrap, 'download', 58, '#fff', 10);
  const dlParts = ['Татаад', 'аваарай'].map((s) => riser(dl, 'big-text', s));
  let dx = 13 + DL.disc + 22;
  dlParts.forEach((p) => {
    box(p.m, dx, (DL.h - 66) / 2 - 2);
    dx += p.w + 18;
  });
  const dlW = dx - 18 + 42;
  const ROW2W = ICON.size + 20 + dlW;
  const iconX = { start: (W - ICON.size) / 2, end: (W - ROW2W) / 2 };
  const dlX = iconX.end + ICON.size + 20;
  box(dl, dlX, ICON.y + (ICON.size - DL.h) / 2, dlW, DL.h);

  every((t) => {
    const float = Math.sin(t * 2.1) * 2.5;
    const cp = spring(t - (hit['захиалъя'] - 0.14), { freq: 2.0, damping: 0.55 });
    cta.style.transformOrigin = '50% 50%';
    cta.style.transform = `translateY(${float}px) scale(${Math.max(0, cp)}) rotate(${-1.5 + (1 - cp) * 8}deg)`;
    shown(cta, cp > 0.001);
    ctaText.set(ease.out(prog(t, hit['захиалъя'] - 0.04, 0.5)));

    // The app icon springs in on «Jana Post-ыг», then steps left for the download button.
    const ap = spring(t - (hit['jana post'] - 0.16), { freq: 2.0, damping: 0.5 });
    const slide = ease.inOut(prog(t, hit['татаад'] - 0.32, 0.36));
    const ix = lerp(iconX.start, iconX.end, slide);
    box(app, ix, ICON.y, ICON.size, ICON.size);
    app.style.transform = `translateY(${float}px) scale(${Math.max(0, ap)}) rotate(${(1 - ap) * -14}deg)`;
    shown(app, ap > 0.001);
    riseLogo(appLogo, t, hit['jana post'] - 0.04);

    // «Татаад аваарай»: the button wipes out of the icon; the arrow draws and bounces.
    const dk = ease.out(prog(t, hit['татаад'] - 0.02, 0.5));
    // Only the part right of the icon shows, so it reads as coming out from behind it.
    const hidden = (1 - dk) * (dlW - 40);
    dl.style.clipPath = `inset(-40px -60px -60px ${Math.max(-60, hidden - 20)}px)`;
    dl.style.transform = `translate(${-hidden}px, ${float}px)`;
    shown(dl, dk > 0);
    dlParts[0].set(ease.out(prog(t, hit['татаад'] - 0.02, 0.5)));
    dlParts[1].set(ease.out(prog(t, hit['аваарай'] - 0.08, 0.5)));
    drawIcon(dlArrow, prog(t, hit['татаад'] + 0.06, 0.45));
    const bounce = t > hit['аваарай'] ? Math.max(0, Math.sin((t - hit['аваарай']) * 11)) * 7 : 0;
    dlArrow.el.style.transform = `translateY(${bounce}px)`;

    // Progress ring round the icon, then it checks off.
    const rk = ease.out(prog(t, hit['аваарай'] - 0.2, 0.3));
    const fill = ease.inOut(prog(t, hit['аваарай'] - 0.06, 0.75));
    box(ring, ix - ICON.ring - 5, ICON.y - ICON.ring - 5);
    ring.style.transform = `translateY(${float}px)`;
    ring.style.opacity = rk;
    shown(ring, rk > 0);
    progress.setAttribute('stroke-dasharray', `${fill} 1`);
    const ck = spring(t - (hit['аваарай'] + 0.72), { freq: 2.4, damping: 0.5 });
    box(appCheck, ix + ICON.size - 40, ICON.y - 26, 64, 64);
    appCheck.style.transform = `translateY(${float}px) scale(${Math.max(0, lerp(1.7, 1, ck) * Math.min(1, ck * 3))})`;
    shown(appCheck, ck > 0.01);
    drawIcon(appTick, prog(t, hit['аваарай'] + 0.78, 0.3));
    void track;
  });
}, { fps: 30, alpha: true, preload });
