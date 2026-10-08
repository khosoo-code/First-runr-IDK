// Jana Post overlay for the testimonial: «Харин Жанапостоор захиалахад шал өөр байсан.
// Poizon-оос гутал, Pinduoduo-гоос хувцас, Taobao-гоос гэр ахуйн бүтээгдэхүүн гээд амархан
// захиалчихсан.» 1080×1920, 30 fps, 257 frames, transparent: it sits in the empty wall above
// her head (y 190–470), between the shelf and her hair.
//
// 1. «Жанапостоор захиалахад / шал өөр байсан!»: logo sticker, a text pill, then a green pill.
// 2. Three marketplace cards land one per shop, each turning its logo into the product.
// 3. «амархан»: each card checks off; «захиалчихсан»: they fly off and «Амархан захиалсан» lands.
//
// Pure function of time: window.seek(t) paints frame t. Add ?backdrop to review it over a
// frame of the footage (render.mjs --query backdrop); the render itself stays transparent.
import { clamp, ease, lerp, prog, spring } from '../shared/motion.js';
import { $, box, drawIcon, shown } from '../shared/kit.js';
import { C, W, boot, lineIcon, makeLogo, riseLogo } from '../janapost-shared/brand.js';

const BACKDROP = new URLSearchParams(location.search).has('backdrop');
const LOGOS = { poizon: 'logos/poizon.svg', pinduoduo: 'logos/pinduoduo.svg', taobao: 'logos/taobao.svg' };
const images = {};
const decode = (src) => {
  const img = new Image();
  img.src = src;
  return img.decode().then(() => img);
};
async function preload() {
  for (const [k, src] of Object.entries(LOGOS)) images[k] = await decode(src);
  if (BACKDROP) images.backdrop = await decode('backdrop.jpg');
}

/** A text run that rises through a mask; returns its element and a setter for 0..1. */
function riser(parent, cls, html) {
  const m = $('div', `abs mask ${cls}`, parent);
  const inner = $('span', '', m, html);
  return { m, inner, set: (k, out = 0) => (inner.style.transform = `translateY(${(1 - k) * 120 - out * 120}%)`) };
}

boot(({ hit, stage, every }) => {
  if (BACKDROP) {
    images.backdrop.id = 'backdrop';
    stage.appendChild(images.backdrop);
  }

  // ============================================================== 1. «шал өөр»
  const ROW1 = { y: 170, h: 136 };
  const LOGO_W = 212;
  const logoPill = $('div', 'abs sticker pill', stage);
  const logoPillW = LOGO_W + 72;
  box(logoPill, 0, ROW1.y, logoPillW, ROW1.h);
  const logoWrap = $('div', 'abs', logoPill);
  box(logoWrap, 36, (ROW1.h - (LOGO_W * 40) / 77) / 2 + 2);
  const logo = makeLogo(logoWrap, LOGO_W, C.green);

  const textPill = $('div', 'abs sticker pill', stage);
  const t1 = riser(textPill, 'pill-text', '-оор захиалахад');
  const t1W = t1.m.offsetWidth;
  const textPillW = t1W + 68;
  box(t1.m, 34, (ROW1.h - 60) / 2 - 2);
  const row1X = (W - (logoPillW + 14 + textPillW)) / 2;
  box(logoPill, row1X, ROW1.y);
  box(textPill, row1X + logoPillW + 14, ROW1.y, textPillW, ROW1.h);

  const ROW2 = { y: 326, h: 140 };
  const bigPill = $('div', 'abs big-pill', stage);
  const bigParts = ['шал өөр', 'байсан!'].map((s) => riser(bigPill, 'big-text', s));
  const gap = 22;
  const partW = bigParts.map((p) => p.m.offsetWidth);
  const bigW = partW[0] + gap + partW[1] + 84;
  box(bigPill, (W - bigW) / 2, ROW2.y, bigW, ROW2.h);
  box(bigParts[0].m, 42, (ROW2.h - 74) / 2 - 2);
  box(bigParts[1].m, 42 + partW[0] + gap, (ROW2.h - 74) / 2 - 2);

  every((t) => {
    // All of it lifts out of frame before Poizon lands.
    const out = (i) => ease.inStrong(prog(t, hit['байсан'] - 0.3 + i * 0.05, 0.3));

    const lp = spring(t - (hit['жана пост'] - 0.16), { freq: 2.2, damping: 0.6 });
    logoPill.style.transformOrigin = '50% 50%';
    logoPill.style.transform = `translateY(${-out(0) * 420}px) scale(${Math.max(0, lp)}) rotate(${(1 - lp) * -8}deg)`;
    shown(logoPill, lp > 0.001 && out(0) < 1);
    riseLogo(logo, t, hit['жана пост'] - 0.06);

    const tk = ease.out(prog(t, hit['захиалсан'] - 0.18, 0.5));
    textPill.style.clipPath = `inset(-40px ${(1 - tk) * 100}% -60px -40px round 34px)`;
    textPill.style.transform = `translate(${(1 - tk) * -40}px, ${-out(1) * 420}px)`;
    shown(textPill, tk > 0 && out(1) < 1);
    t1.set(ease.out(prog(t, hit['захиалсан'] - 0.1, 0.55)));

    // The green pill shrinks away in place just before the Poizon card lands there.
    const bp = spring(t - (hit['шал өөр'] - 0.14), { freq: 2.0, damping: 0.5 });
    const shrink = ease.in(prog(t, hit.poizon - 0.32, 0.22));
    bigPill.style.transformOrigin = '50% 50%';
    bigPill.style.transform = `scale(${Math.max(0, bp) * (1 - shrink)}) rotate(${-2.5 + (1 - bp) * 10 + shrink * 12}deg)`;
    shown(bigPill, bp > 0.001 && shrink < 1);
    bigParts[0].set(ease.out(prog(t, hit['шал өөр'] - 0.06, 0.5)));
    bigParts[1].set(ease.out(prog(t, hit['шал өөр'] + 0.12, 0.5)));
  });

  // ============================================================== 2. Shops → products
  const CARD = { w: 316, h: 294, gap: 16, y: 172 };
  const X0 = (W - (3 * CARD.w + 2 * CARD.gap)) / 2;
  const SHOPS = [
    { key: 'poizon', shop: 'Poizon-оос', item: 'Гутал', icon: 'shoe', at: hit.poizon, itemAt: hit['гутал'], rot: -3 },
    { key: 'pinduoduo', shop: 'Pinduoduo-гоос', item: 'Хувцас', icon: 'shirt', at: hit.pinduoduo, itemAt: hit['хувцас'], rot: 2.5 },
    { key: 'taobao', shop: 'Taobao-гоос', item: 'Гэр ахуй', icon: 'lamp', at: hit.taobao, itemAt: hit['гэр ахуй'], rot: -2 },
  ];
  const cards = SHOPS.map((d, i) => {
    const x = X0 + i * (CARD.w + CARD.gap);
    const el = $('div', 'abs sticker card', stage);
    box(el, x, CARD.y, CARD.w, CARD.h);
    const tile = $('div', 'abs logo-tile', el);
    box(tile, 24, 24, 118, 118);
    tile.appendChild(images[d.key]);
    const arrowWrap = $('div', 'abs', el);
    box(arrowWrap, CARD.w / 2 - 16, 67);
    const arrow = lineIcon(arrowWrap, 'chevron', 32, C.green, 12);
    const disc = $('div', 'abs disc', el);
    box(disc, CARD.w - 24 - 118, 24, 118, 118);
    const icon = lineIcon(disc, d.icon, 78, C.green, 6.5);
    const shop = riser(el, 'shop', d.shop);
    box(shop.m, 26, 170);
    const item = riser(el, 'item', d.item);
    box(item.m, 24, 214);
    // Fit the product name to the card.
    const room = CARD.w - 48;
    if (item.m.offsetWidth > room) item.m.style.fontSize = `${Math.floor((56 * room) / item.m.offsetWidth)}px`;
    const check = $('div', 'abs check', stage);
    box(check, x + CARD.w - 46, CARD.y - 22, 70, 70);
    const tick = lineIcon(check, 'check', 70, '#fff', 12);
    return { d, i, el, tile, arrow, disc, icon, shop, item, check, tick };
  });

  // ============================================================== 3. «Амархан захиалсан»
  const endPill = $('div', 'abs big-pill', stage);
  const endText = riser(endPill, 'big-text', 'Амархан захиалсан');
  const endW = endText.m.offsetWidth;
  const END = { h: 144, check: 84 };
  const endPillW = endW + 40 + END.check + 18 + 44;
  box(endPill, (W - endPillW) / 2, 248, endPillW, END.h);
  const endCheck = $('div', 'abs', endPill);
  box(endCheck, 26, (END.h - END.check) / 2, END.check, END.check);
  endCheck.style.cssText += 'background:#fff;border-radius:50%;display:grid;place-items:center';
  const endTick = lineIcon(endCheck, 'check', END.check, C.green, 12);
  box(endText.m, 26 + END.check + 18, (END.h - 74) / 2 - 2);

  every((t) => {
    cards.forEach((c) => {
      const { d, i } = c;
      const s = spring(t - (d.at - 0.08), { freq: 2.0, damping: 0.6 });
      const fly = ease.inStrong(prog(t, hit['захиалчихсан'] - 0.08 + i * 0.05, 0.3));
      const hop = spring(t - (hit['бүтээгдэхүүн'] + i * 0.05), { freq: 3, damping: 0.4 });
      const float = Math.sin(t * 2.1 + i * 1.7) * 3;
      c.el.style.transformOrigin = '50% 100%';
      c.el.style.transform = `translateY(${(1 - s) * 90 + float - fly * 560}px) scale(${lerp(0.72, 1, Math.max(0, s))}) rotate(${d.rot * Math.min(1, s) + fly * d.rot * 3}deg)`;
      shown(c.el, s > 0.001 && fly < 1);

      const lk = spring(t - (d.at - 0.04), { freq: 2.4, damping: 0.55 });
      c.tile.style.transform = `scale(${Math.max(0, lk)})`;
      c.shop.set(ease.out(prog(t, d.at, 0.5)));
      // The product: disc pops, icon draws, name rises; a hop on «бүтээгдэхүүн».
      const dk = spring(t - (d.itemAt - 0.14), { freq: 2.4, damping: 0.55 });
      const bump = t > hit['бүтээгдэхүүн'] ? Math.sin(Math.PI * clamp(hop)) * 0.12 * (1 - clamp(hop - 1)) : 0;
      c.disc.style.transform = `scale(${Math.max(0, dk) + bump})`;
      drawIcon(c.icon, prog(t, d.itemAt - 0.08, 0.7));
      drawIcon(c.arrow, prog(t, d.itemAt - 0.2, 0.35));
      c.item.set(ease.out(prog(t, d.itemAt - 0.1, 0.55)));

      // «амархан»: a check stamps on each card.
      const ck = spring(t - (hit['амархан'] - 0.04 + i * 0.09), { freq: 2.4, damping: 0.5 });
      c.check.style.transform = `translateY(${float - fly * 560}px) scale(${Math.max(0, lerp(1.7, 1, ck) * Math.min(1, ck * 3))})`;
      shown(c.check, ck > 0.01 && fly < 1);
      drawIcon(c.tick, prog(t, hit['амархан'] + 0.04 + i * 0.09, 0.3));
    });

    // «захиалчихсан»: the cards fly off and the green pill lands in their place.
    const ep = spring(t - (hit['захиалчихсан'] + 0.16), { freq: 2.0, damping: 0.55 });
    endPill.style.transformOrigin = '50% 50%';
    endPill.style.transform = `scale(${Math.max(0, ep)}) rotate(${-2 + (1 - ep) * 8}deg)`;
    shown(endPill, ep > 0.001);
    endText.set(ease.out(prog(t, hit['захиалчихсан'] + 0.2, 0.42)));
    drawIcon(endTick, prog(t, hit['захиалчихсан'] + 0.32, 0.3));
  });
}, { fps: 30, alpha: true, preload });
