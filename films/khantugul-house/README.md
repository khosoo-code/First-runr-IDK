# Хан Төгөл: «Энэ хаус танд яг тохирно» (viral word pops, luxury look)

A transparent text overlay for the house walk-through clip: 1080×1920, 30 fps, 171 frames (5.7 s), delivered as an RGBA PNG sequence plus a sound-effects WAV at -14 LUFS.

## Placing it in the edit

Import `out/khantugul-house_png/khantugul-house_0000.png …_0170.png` as a 30 fps image sequence. Lay it over the clip from its first frame, which is where the SRT (C3918, `sequence.srt`) starts. The voice ends on «тохирно» 5.1 s in, and the last 0.6 s holds on the finished line.

The timing is viral-caption style: every word pops in on its spoken syllable, and each phrase cuts in with a soft zoom punch. The look is Хан Төгөл luxury, with no outlines:

- **Type:** cream Noto Serif Display on deep-green plates, with key words in gold italic. Each plate widens word by word as the words arrive. The bright footage needs a backing, and the plate stands in for an outline.
- **«хаус»:** a gold-line house medallion pops on the word.
- **Finale:** «тохирно» lands on a cream plate in green italic, with a check medallion.
- **«орон зай»:** «зай» comes only 0.15 s before the next phrase cuts in, so «орон зай» pops as one word on «орон».

| Phrase | Lines |
| --- | --- |
| 1 | танд илүү их / *орон зай* |
| 2 | тав тух, / *үнэ цэнэ* |
| 3 | *хэрэгтэй* / байгаа бол |
| 4 | энэ *хаус* 🏠 / танд |
| 5 | яг / **тохирно** ✓ |

Everything sits above her head (y 210–550), clear of her and of the burned-in subtitles at the bottom. Only the plates' soft shadows reach below y 565.

## Build

```sh
node films/khantugul-house/cues.mjs        # sequence.srt -> beats.json
node films/khantugul-house/score.mjs       # beats.json -> out/mix.wav at -14 LUFS
node render.mjs films/khantugul-house --png   # -> out/khantugul-house_png/ (RGBA PNGs + wav)

node render.mjs films/khantugul-house --query backdrop --sheet --offset 0.35   # review over the footage
.venv/bin/python films/shared/sync_check.py films/khantugul-house 30
```

Look: the Хан Төгөл palette (green `#1e4e3e`, cream `#f7f6ed`, gold `#ac905f`, lifted to `#c4a46c` for the gold words so they read on the green) and Noto Serif Display from `../shared/fonts`. `backdrop.jpg` is a frame of the clip, for review sheets only.
