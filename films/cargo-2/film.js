// Cargo kinetic type, line 2: «21 аймгийн 330 суманд хүргэнэ». 9:16, 3.8 s, alpha.
// The numbers count up in a right-aligned column beside their words, then ХҮРГЭНЭ arrives
// as a dashed white route draws out to a pin; everything slides out to the left.
import { clamp, ease, lerp, prog, spring } from '../shared/motion.js';
import { $, W, boot, box, drawPath, shown, strokeLayer, svg, textWidth } from '../cargo-shared/lib.js';

boot(({ hit, stage, every }) => {
  const OUT = hit.out;
  const NUM = 210;
  const WORD = 78;
  const GAP = 30;
  const BASE = 0.859; // Montserrat baseline inside a line-height:1 box, in em
  const colW = textWidth(`900 ${NUM}px Montserrat`, '330');
  const wordW = Math.max(...['аймгийн', 'суманд'].map((s) => textWidth(`900 ${WORD}px Montserrat`, s.toUpperCase())));
  const X0 = (W - (colW + GAP + wordW)) / 2;
  const layer = strokeLayer(stage);

  const row = (value, word, y, at) => {
    const wrap = $('div', 'abs shade', stage);
    box(wrap, X0, y);
    const numMask = $('div', 'abs mask', wrap);
    numMask.style.fontSize = `${NUM}px`;
    const num = $('div', 'word solid', numMask, '0');
    Object.assign(num.style, { fontSize: `${NUM}px`, width: `${colW}px`, textAlign: 'right' });
    const wordMask = $('div', 'abs mask', wrap);
    wordMask.style.fontSize = `${WORD}px`;
    box(wordMask, colW + GAP, (BASE * (NUM - WORD)));
    const w = $('div', 'word white', wordMask, word);
    w.style.fontSize = `${WORD}px`;
    return { wrap, num, w, value, at };
  };
  const rows = [row(21, 'аймгийн', 560, [hit['21'], hit['аймгийн']]), row(330, 'суманд', 820, [hit['330'], hit['суманд']])];

  // ХҮРГЭНЭ, letter by letter.
  const deliver = $('div', 'abs shade', stage);
  box(deliver, X0, 1090);
  const letters = [...'хүргэнэ'].map((ch) => {
    const m = $('span', 'mask', deliver);
    Object.assign(m.style, { display: 'inline-block', fontSize: '150px' });
    const l = $('span', 'word solid', m, ch);
    l.style.fontSize = '150px';
    return l;
  });

  // The route: a dashed white line out to a pin.
  const RY = 1330;
  const x1 = X0 + colW + GAP + wordW - 40;
  const route = drawPath(layer, `M${X0 + 10} ${RY} C${X0 + 220} ${RY - 70} ${x1 - 320} ${RY + 80} ${x1} ${RY}`, { width: 14, dash: '26 22' });
  const pin = svg('g', {}, layer);
  svg('circle', { cx: 0, cy: 0, r: 24, stroke: '#ffffff', 'stroke-width': 13 }, pin);
  svg('circle', { cx: 0, cy: 0, r: 7, fill: '#ffffff' }, pin);

  const out = (t, i) => ease.inStrong(prog(t, OUT - 0.05 + i * 0.04, 0.34));
  every((t) => {
    rows.forEach((r, i) => {
      const [tn, tw] = r.at;
      const rise = ease.out(prog(t, tn - 0.3, 0.55));
      r.num.style.transform = `translateY(${(1 - rise) * 140}%)`;
      r.num.textContent = String(Math.round(lerp(0, r.value, ease.outSoft(prog(t, tn - 0.24, 0.62)))));
      const slide = ease.out(prog(t, tw - 0.2, 0.55));
      r.w.style.transform = `translateX(${(slide - 1) * 105}%)`;
      r.wrap.style.transform = `translateX(${-out(t, i) * 1250}px)`;
    });
    letters.forEach((l, i) => {
      const k = ease.out(prog(t, hit['хүргэнэ'] - 0.28 + i * 0.035, 0.5));
      l.style.transform = `translateY(${(1 - k) * 140}%)`;
    });
    deliver.style.transform = `translateX(${-out(t, 2) * 1250}px)`;
    route.draw(ease.inOut(prog(t, hit.route - 0.36, 0.6)), ease.in(prog(t, OUT + 0.02, 0.3)));
    const p = spring(t - (hit.route + 0.18), { freq: 2.4, damping: 0.55 }) * (1 - ease.in(prog(t, OUT + 0.12, 0.2)));
    pin.setAttribute('transform', `translate(${x1} ${RY}) scale(${Math.max(0, p)})`);
    shown(pin, p > 0.001);
  });
});
