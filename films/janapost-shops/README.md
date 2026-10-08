# Jana Post overlay: «Poizon-оос гутал, Pinduoduo-гоос хувцас, Taobao-гоос гэр ахуй»

A transparent explainer overlay for the testimonial: 1080×1920, 30 fps, 257 frames (8.567 s), delivered as an RGBA PNG sequence plus a sound-effects WAV at -14 LUFS. It sits in the empty wall above her head (y 170–466), between the shelf and her hair. Nothing is drawn below y 620.

## Placing it in the edit

Import `out/janapost-shops_png/janapost-shops_0000.png …_0256.png` as a 30 fps image sequence. Lay it over the footage at **00;00;08;03**, the first frame of SRT cue 12 «Харин». It ends just before the Jana Post tracking insert (`../janapost-track`) at 00;00;16;20.

1. **«Жанапостоор захиалахад / шал өөр байсан!» (0.4–2.8 s):** the Jana Post logo sticker rises on «Жана пост», the «-оор захиалахад» pill slides out of it on «захиалсан», and the green «шал өөр байсан!» pill pops on «шал өөр».
2. **Shops → products (2.9–7.4 s):** one card per shop lands on its name: Poizon, Pinduoduo, Taobao. Each card's product (Гутал, Хувцас, Гэр ахуй) draws in on its word, and all three hop on «бүтээгдэхүүн».
3. **«амархан захиалчихсан» (7.4–8.6 s):** a check stamps on each card, then the cards fly off and «✓ Амархан захиалсан» lands.

## Build

```sh
node films/janapost-shops/cues.mjs        # ../janapost-shared/sequence.srt -> beats.json
node films/janapost-shops/score.mjs       # beats.json -> out/mix.wav at -14 LUFS
node render.mjs films/janapost-shops --png   # -> out/janapost-shops_png/ (RGBA PNGs + wav)

node render.mjs films/janapost-shops --query backdrop --sheet --offset 0.3   # review over the footage
.venv/bin/python films/shared/sync_check.py films/janapost-shops 30
```

`node render.mjs films/janapost-shops` without `--png` writes ProRes 4444 with alpha (`.mov`) instead.

## Files

| File | What it does |
| --- | --- |
| `index.html`, `style.css` | Page skeleton and the sticker look (transparent background) |
| `film.js` | The overlay: `window.seek(t)` paints frame t; `?backdrop` shows a frame of the footage behind it for review |
| `cues.mjs`, `score.mjs` | Beat grid from the reel's SRT, and the sound effects on it |
| `logos/` | The supplied Poizon, Pinduoduo and Taobao logos |
| `../janapost-shared/backdrop.jpg` | A frame of the footage, for review sheets only |

Brand tokens, fonts, the Jana Post logo, line icons and boot are shared with `../janapost-track` in `../janapost-shared/brand.js`.
