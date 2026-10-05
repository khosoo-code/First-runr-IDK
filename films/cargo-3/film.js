// Cargo kinetic type, line 3: «100гр тутамд ₮270». 9:16, 3.4 s, alpha.
// The unit line rises letter by letter, a white price tag draws itself around ₮270 and the
// price counts up; the tag swings down and out as the unit line lifts away.
import { clamp, ease, lerp, prog, spring } from '../shared/motion.js';
import { $, W, boot, box, drawPath, shown, strokeLayer, svg, textWidth } from '../cargo-shared/lib.js';

boot(({ hit, stage, every }) => {
  const OUT = hit.out;
  const layer = strokeLayer(stage);

  // «100гр тутамд», letter by letter.
  const UNIT = 84;
  const unitText = '100гр тутамд';
  const unitW = textWidth(`900 ${UNIT}px Montserrat`, unitText.toUpperCase());
  const unit = $('div', 'abs shade', stage);
  box(unit, (W - unitW) / 2, 640);
  const letters = [...unitText].map((ch) => {
    const m = $('span', 'mask', unit);
    Object.assign(m.style, { display: 'inline-block', fontSize: `${UNIT}px` });
    const l = $('span', 'word white', m, ch === ' ' ? '&nbsp;' : ch);
    l.style.fontSize = `${UNIT}px`;
    return l;
  });

  // ₮270 inside a drawn price tag.
  const PRICE = 250;
  const signW = textWidth(`900 ${PRICE}px Montserrat`, '₮');
  const numW = textWidth(`900 ${PRICE}px Montserrat`, '270');
  const priceW = signW + numW;
  const PX = (W - priceW) / 2 + 15;
  const PY = 860;
  const price = $('div', 'abs shade', stage);
  box(price, PX, PY);
  price.style.transformOrigin = `${-90}px ${PRICE / 2}px`;
  const sign = $('div', 'abs word solid', price, '₮');
  sign.style.fontSize = `${PRICE}px`;
  sign.style.transformOrigin = '50% 60%';
  const num = $('div', 'abs word solid', price, '0');
  Object.assign(num.style, { fontSize: `${PRICE}px`, fontVariantNumeric: 'tabular-nums' });
  box(num, signW, 0);

  const T = { l: PX - 70, r: PX + priceW + 80, t: PY - 40, b: PY + PRICE + 30 };
  const midY = (T.t + T.b) / 2;
  const tag = drawPath(layer, `M${T.l - 70} ${midY} L${T.l} ${T.t} H${T.r - 30} Q${T.r} ${T.t} ${T.r} ${T.t + 30} V${T.b - 30} Q${T.r} ${T.b} ${T.r - 30} ${T.b} H${T.l} Z`, { width: 8 });
  const hole = svg('circle', { cx: T.l - 22, cy: midY, r: 0, stroke: '#ffffff', 'stroke-width': 7 }, layer);
  const string = drawPath(layer, `M${T.l - 22} ${midY} C${T.l - 70} ${midY - 90} ${T.l - 90} ${T.t - 40} ${T.l - 30} ${T.t - 78}`, { width: 6 });

  every((t) => {
    letters.forEach((l, i) => {
      const k = ease.out(prog(t, hit['100гр тутамд'] - 0.3 + i * 0.03, 0.5));
      l.style.transform = `translateY(${(1 - k) * 110}%)`;
    });
    const lift = ease.inStrong(prog(t, OUT - 0.02, 0.34));
    unit.style.transform = `translateY(${-lift * 260}px)`;
    unit.style.opacity = 1 - lift;

    tag.draw(ease.inOut(prog(t, hit.tag - 0.3, 0.6)));
    hole.setAttribute('r', 13 * clamp(spring(t - (hit.tag + 0.2), { freq: 2.6, damping: 0.6 })));
    string.draw(ease.out(prog(t, hit.tag + 0.18, 0.4)));

    const s = spring(t - (hit['₮270'] - 0.2), { freq: 2.2, damping: 0.5 });
    sign.style.transform = `scale(${Math.max(0, s)})`;
    shown(sign, s > 0.001);
    const c = ease.outSoft(prog(t, hit['₮270'] - 0.12, 0.6));
    num.textContent = String(Math.round(lerp(0, 270, c)));
    num.style.opacity = clamp((t - (hit['₮270'] - 0.12)) / 0.06);

    // Out: the tag and price swing down from the hole and drop away.
    const drop = ease.inStrong(prog(t, OUT - 0.05, 0.36));
    const swing = `rotate(${drop * 14}deg) translateY(${drop * 1400}px)`;
    price.style.transform = swing;
    layer.style.transformOrigin = `${T.l - 22}px ${midY}px`;
    layer.style.transform = swing;
  });
});
