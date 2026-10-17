# Хан Төгөл: «Энэ хаус танд яг тохирно» (luxury text overlay)

A transparent text overlay for the house walk-through clip: 1080×1920, 30 fps, 171 frames (5.7 s), delivered as an RGBA PNG sequence plus a sound-effects WAV at -14 LUFS.

## Placing it in the edit

Import `out/khantugul-house_png/khantugul-house_0000.png …_0170.png` as a 30 fps image sequence. Lay it over the clip from its first frame, which is where the SRT (C3918, `sequence.srt`) starts. The voice ends on «тохирно» 5.1 s in, and the last 0.6 s holds on the finished line.

The frame is bright almost everywhere (sky, cream facade), so the type sits on deep-green ribbons that bleed in from the left edge above her head (y 168–530). That keeps it clear of her and of the burned-in subtitles at the bottom; nothing is drawn below y 570. Three ribbons stay up and their words swap, each ribbon easing its width to the words it holds:

| Ribbon | Words |
| --- | --- |
| Eyebrow | ◆ ТАНД → ◆ ХЭРЭГТЭЙ БАЙГАА БОЛ (wipes out before «Энэ хаус») |
| Line 1, cream serif | Илүү их → Тав тух, → Энэ хаус танд |
| Line 2, gold italic | орон зай (its letters spread apart on «зай») → үнэ цэнэ → яг тохирно. (a gold rule draws under «тохирно.») |

## Build

```sh
node films/khantugul-house/cues.mjs        # sequence.srt -> beats.json
node films/khantugul-house/score.mjs       # beats.json -> out/mix.wav at -14 LUFS
node render.mjs films/khantugul-house --png   # -> out/khantugul-house_png/ (RGBA PNGs + wav)

node render.mjs films/khantugul-house --query backdrop --sheet --offset 0.35   # review over the footage
.venv/bin/python films/shared/sync_check.py films/khantugul-house 30
```

Look: the Хан Төгөл palette from `../shared` (green `#1e4e3e`, cream `#f7f6ed`, gold `#ac905f`), Noto Serif Display for the display lines and Manrope for the eyebrow. `backdrop.jpg` is a frame of the clip, for review sheets only.
