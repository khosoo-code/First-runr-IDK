// Cargo kinetic type, line 1: «Хурдан, Найдвартай, Хямд тээвэр». 9:16, 3.4 s, alpha.
// ХУРДАН whips in on speed lines, НАЙДВАРТАЙ drops and locks into a drawn frame,
// ХЯМД pops, ТЭЭВЭР rises onto an underline; everything whips out to the right.
import { ease, prog, spring } from '../shared/motion.js';
import { $, W, boot, box, drawPath, shown, strokeLayer, textWidth } from '../cargo-shared/lib.js';

boot(({ hit, beats, stage, every }) => {
  const OUT = hit.out;
  const line = (text, cls, size, y, masked = true) => {
    const w = textWidth(`900 ${size}px Montserrat`, text.toUpperCase());
    const wrap = $('div', 'abs shade', stage);
    box(wrap, (W - w) / 2, y);
    let host = wrap;
    if (masked) {
      host = $('div', 'mask', wrap);
      host.style.fontSize = `${size}px`;
    }
    const el = $('div', `word ${cls}`, host, text);
    el.style.fontSize = `${size}px`;
    return { wrap, el, w, x: (W - w) / 2, y, size };
  };
  const lines = strokeLayer(stage);

  const fast = line('Хурдан', 'solid', 176, 650);
  const reliable = line('Найдвартай', 'white', 112, 872);
  const cheap = line('Хямд', 'solid', 176, 1032, false);
  const transport = line('тээвэр', 'white', 112, 1236);

  // Speed lines trailing ХУРДАН.
  const speed = [0.22, 0.5, 0.78].map((f) => drawPath(lines, `M-20 ${650 + f * 176} H${fast.x - 34}`, { width: 12 }));
  // The frame that locks НАЙДВАРТАЙ in place.
  const PAD = 30;
  const fr = { x: reliable.x - PAD, y: reliable.y - 22, w: reliable.w + PAD * 2, h: reliable.size + 44 };
  const frame = drawPath(lines, `M${fr.x + 20} ${fr.y} H${fr.x + fr.w - 20} Q${fr.x + fr.w} ${fr.y} ${fr.x + fr.w} ${fr.y + 20} V${fr.y + fr.h - 20} Q${fr.x + fr.w} ${fr.y + fr.h} ${fr.x + fr.w - 20} ${fr.y + fr.h} H${fr.x + 20} Q${fr.x} ${fr.y + fr.h} ${fr.x} ${fr.y + fr.h - 20} V${fr.y + 20} Q${fr.x} ${fr.y} ${fr.x + 20} ${fr.y}`, { width: 12 });
  // The underline ТЭЭВЭР lands on.
  const under = drawPath(lines, `M${transport.x} ${transport.y + transport.size + 26} H${transport.x + transport.w}`, { width: 15 });

  const out = (t, i) => ease.inStrong(prog(t, OUT - 0.05 + i * 0.04, 0.34));
  every((t) => {
    // ХУРДАН: a fast whip from the left with a skew that settles.
    const kf = ease.out(prog(t, hit['хурдан'] - 0.26, 0.5));
    const skew = -20 * (1 - spring(t - (hit['хурдан'] - 0.12), { freq: 2.6, damping: 0.55 }));
    fast.wrap.style.transform = `translateX(${(kf - 1) * 1150 + out(t, 0) * 1250}px) skewX(${t < hit['хурдан'] - 0.12 ? -20 : skew}deg)`;
    shown(fast.wrap, kf > 0);
    speed.forEach((s, i) => {
      const draw = ease.out(prog(t, hit['хурдан'] - 0.24 + i * 0.03, 0.34));
      const tail = ease.inOut(prog(t, hit['хурдан'] + 0.02 + i * 0.04, 0.4));
      s.draw(draw, tail);
    });

    // НАЙДВАРТАЙ: drops in and locks, then its frame draws around it.
    const drop = spring(t - (hit['найдвартай'] - 0.2), { freq: 2.4, damping: 0.58 });
    reliable.el.style.transform = `translateY(${(1 - drop) * -140}%)`;
    reliable.wrap.style.transform = `translateX(${out(t, 1) * 1250}px)`;
    shown(reliable.wrap, drop > 0.001);
    frame.draw(ease.inOut(prog(t, hit.frame - 0.22, 0.5)));
    frame.style.transform = `translateX(${out(t, 1) * 1250}px)`;

    // ХЯМД pops from its centre; ТЭЭВЭР rises onto the underline.
    const pop = spring(t - (hit['хямд'] - 0.16), { freq: 2.2, damping: 0.5 });
    cheap.el.style.transformOrigin = '50% 60%';
    cheap.el.style.transform = `scale(${Math.max(0, pop)})`;
    cheap.wrap.style.transform = `translateX(${out(t, 2) * 1250}px)`;
    shown(cheap.wrap, pop > 0.001);
    const rise = ease.out(prog(t, hit['тээвэр'] - 0.2, 0.6));
    transport.el.style.transform = `translateY(${(1 - rise) * 140}%)`;
    transport.wrap.style.transform = `translateX(${out(t, 3) * 1250}px)`;
    under.draw(ease.inOut(prog(t, hit['тээвэр'] - 0.02, 0.45)));
    under.style.transform = `translateX(${out(t, 3) * 1250}px)`;
  });
});
