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
  const signW = textWidth(`900 ${PRICE}px Montserrat`, 'T');
  const numW = textWidth(`900 ${PRICE}px Montserrat`, '270');
  const GAP = 14;
  const priceW = signW + GAP + numW;
  const PX = (W - priceW) / 2 + 15;
  const PY = 860;
  const price = $('div', 'abs shade', stage);
  box(price, PX, PY);
  price.style.transformOrigin = `${-90}px ${PRICE / 2}px`;
  // ₮ built from a T and two slash bars: Montserrat's ₮ has overlapping contours that show
  // through a heavy stroke, so every white outline is painted first and all the green on top.
  const sign = $('div', 'abs', price);
  Object.assign(sign.style, { width: `${signW}px`, height: `${PRICE}px`, transformOrigin: '50% 60%' });
  const bars = (fill, stroke) => {
    const g = svg('svg', { width: signW, height: PRICE, style: 'position:absolute;left:0;top:0;overflow:visible' }, sign);
    [0.5, 0.67].forEach((y) => svg('rect', {
      x: signW / 2 - PRICE * 0.24, y: PRICE * (y - 0.04), width: PRICE * 0.48, height: PRICE * 0.08,
      fill, stroke, 'stroke-width': stroke ? 22 : 0, 'stroke-linejoin': 'round',
      transform: `rotate(-22 ${signW / 2} ${PRICE * y})`,
    }, g));
  };
  const back = $('div', 'abs word solid', sign, 'T');
  Object.assign(back.style, { fontSize: `${PRICE}px`, color: '#ffffff' });
  bars('#ffffff', '#ffffff');
  const front = $('div', 'abs word', sign, 'T');
  Object.assign(front.style, { fontSize: `${PRICE}px`, color: 'var(--green)' });
  bars('var(--green)', null);
  const num = $('div', 'abs word solid', price, '0');
  Object.assign(num.style, { fontSize: `${PRICE}px`, fontVariantNumeric: 'tabular-nums' });
  box(num, signW + GAP, 0);

  const T = { l: PX - 70, r: PX + priceW + 80, t: PY - 40, b: PY + PRICE + 30 };
  const midY = (T.t + T.b) / 2;
  const tag = drawPath(layer, `M${T.l - 70} ${midY} L${T.l} ${T.t} H${T.r - 30} Q${T.r} ${T.t} ${T.r} ${T.t + 30} V${T.b - 30} Q${T.r} ${T.b} ${T.r - 30} ${T.b} H${T.l} Z`, { width: 14 });
  const hole = svg('circle', { cx: T.l - 22, cy: midY, r: 0, stroke: '#ffffff', 'stroke-width': 11 }, layer);
  const string = drawPath(layer, `M${T.l - 22} ${midY} C${T.l - 70} ${midY - 90} ${T.l - 90} ${T.t - 40} ${T.l - 30} ${T.t - 78}`, { width: 10 });

  every((t) => {
    letters.forEach((l, i) => {
      const k = ease.out(prog(t, hit['100гр тутамд'] - 0.3 + i * 0.03, 0.5));
      l.style.transform = `translateY(${(1 - k) * 140}%)`;
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
