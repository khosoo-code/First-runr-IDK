// Хан Төгөл luxury text overlay for the house walk-through: «танд илүү их орон зай / тав тух,
// үнэ цэнэ хэрэгтэй байгаа бол / Энэ Хаус танд яг тохирно». 1080×1920, 30 fps, 171 frames,
// transparent.
//
// The frame is bright almost everywhere (sky, cream facade), so the type sits on deep-green
// ribbons that bleed in from the left edge above her head (y 168–530), clear of the burned-in
// subtitles at the bottom. Three ribbons stay up for the whole clip and their words swap:
//   eyebrow  ◆ ТАНД → ◆ ХЭРЭГТЭЙ БАЙГАА БОЛ (leaves before «Энэ хаус»)
//   line 1   Илүү их → Тав тух, → Энэ хаус танд
//   line 2   орон зай (its letters spread apart on «зай») → үнэ цэнэ → яг тохирно. (underlined)
// Each ribbon eases its width to the words it holds.
//
// Pure function of time: window.seek(t) paints frame t. Add ?backdrop to review it over a
// frame of the footage (render.mjs --query backdrop); the render itself stays transparent.
import { ease, prog } from '../shared/motion.js';
import { $, boot, box, shown } from '../shared/kit.js';

const BACKDROP = new URLSearchParams(location.search).has('backdrop');
let backdrop;
async function preload() {
  if (!BACKDROP) return;
  backdrop = new Image();
  backdrop.src = 'backdrop.jpg';
  await backdrop.decode();
}

const LEAD = 0.18; // a word starts rising this long before it's spoken

/**
 * A ribbon at height y whose entries replace one another, each pushing the last up and out.
 * entry: { parts: [{ html, at }], spread?: { at, em } }. Parts rise on their own words; the
 * ribbon's width eases to the parts that have arrived.
 */
function ribbon(world, { y, h, cls, size, padL = 72, padR = 56, dy = 0, entries, exit = Infinity }) {
  const el = $('div', 'abs ribbon', world);
  const edge = $('div', 'abs ribbon-edge', el);
  const items = entries.map((e) => {
    const wrap = $('div', `abs line ${cls}`, el);
    const parts = e.parts.map((p, k) => {
      if (k) wrap.append(' ');
      return { ...p, s: $('span', '', wrap, p.html) };
    });
    box(wrap, padL, (h - size) / 2 + dy);
    const widths = parts.map((p) => p.s.offsetLeft + p.s.offsetWidth);
    let spreadW = 0;
    if (e.spread) {
      const base = getComputedStyle(wrap).letterSpacing;
      wrap.style.letterSpacing = `${-0.01 + e.spread.em}em`;
      spreadW = parts.at(-1).s.offsetLeft + parts.at(-1).s.offsetWidth - widths.at(-1);
      wrap.style.letterSpacing = base;
    }
    return { e, wrap, parts, widths, spreadW, start: e.parts[0].at - LEAD };
  });
  const keys = items.flatMap((it) => it.parts.map((p, k) => ({ t: p.at - LEAD, w: padL + it.widths[k] + padR })));
  const swapK = (t, it) => ease.inOut(prog(t, it.start, 0.55));

  return {
    items,
    paint(t) {
      let w = keys[0].w;
      for (let j = 1; j < keys.length; j++) w += (keys[j].w - keys[j - 1].w) * ease.inOut(prog(t, keys[j].t - 0.05, 0.55));
      items.forEach((it, i) => {
        const next = items[i + 1];
        const out = next ? swapK(t, next) : 0;
        if (it.e.spread) {
          const k = ease.inOut(prog(t, it.e.spread.at - 0.05, 0.7));
          it.wrap.style.letterSpacing = `${-0.01 + it.e.spread.em * k}em`;
          w += it.spreadW * k * (1 - out);
        }
        it.wrap.style.transform = `translateY(${-out * h}px)`;
        shown(it.wrap, t >= it.start - 0.01 && out < 1);
        it.parts.forEach((p) => {
          const k = ease.out(prog(t, p.at - LEAD, 0.75));
          p.s.style.transform = `translateY(${(1 - k) * h}px)`;
        });
      });
      // Wipes in from the left edge with its first word; an exit wipes it back.
      const f = ease.out(prog(t, items[0].start - 0.08, 0.6)) * (1 - ease.inOut(prog(t, exit, 0.5)));
      box(el, 0, y, w, h);
      el.style.clipPath = `inset(-60px ${(1 - f) * 100}% -60px 0)`;
      shown(el, f > 0);
      box(edge, w - 5, 0, 5, h);
    },
  };
}

boot(({ hit, world, every }) => {
  if (BACKDROP) {
    backdrop.id = 'backdrop';
    world.parentNode.insertBefore(backdrop, world);
  }

  const dm = '<i class="diamond" style="display:inline-block;width:12px;height:12px;margin:0 22px 5px 4px;vertical-align:middle"></i>';
  const eyebrow = ribbon(world, {
    y: 168, h: 62, cls: 'eyebrow', size: 27, padR: 30, dy: 1,
    entries: [
      { parts: [{ html: `${dm}Танд`, at: hit['танд'] }] },
      { parts: [{ html: `${dm}Хэрэгтэй`, at: hit['хэрэгтэй'] }, { html: 'байгаа бол', at: hit['хэрэгтэй'] + 0.36 }] },
    ],
    exit: hit['энэ хаус'] - 0.3,
  });
  const line1 = ribbon(world, {
    y: 238, h: 134, cls: 'line1', size: 100, dy: -4,
    entries: [
      { parts: [{ html: 'Илүү их', at: hit['илүү'] }] },
      { parts: [{ html: 'Тав тух,', at: hit['тав тух'] }] },
      { parts: [{ html: 'Энэ хаус', at: hit['энэ хаус'] }, { html: 'танд', at: hit['танд 2'] }] },
    ],
  });
  const line2 = ribbon(world, {
    y: 380, h: 150, cls: 'line2', size: 122, dy: -10,
    entries: [
      { parts: [{ html: 'орон зай', at: hit['орон зай'] }], spread: { at: hit['зай'], em: 0.12 } },
      { parts: [{ html: 'үнэ цэнэ', at: hit['үнэ цэнэ'] }] },
      { parts: [{ html: 'яг', at: hit['яг'] }, { html: 'тохирно.', at: hit['тохирно'] }] },
    ],
  });
  every((t) => {
    eyebrow.paint(t);
    line1.paint(t);
    line2.paint(t);
  });

  // A gold hairline draws under «тохирно.» once it lands.
  const last = line2.items.at(-1);
  const word = last.parts[1].s;
  const rule = $('div', 'abs hairline', last.wrap);
  every((t) => {
    const k = ease.inOut(prog(t, hit['тохирно'] + 0.22, 0.7));
    box(rule, word.offsetLeft + 6, 132, (word.offsetWidth - 20) * k, 3);
    shown(rule, k > 0);
  });
}, { fps: 30, alpha: true, preload });
