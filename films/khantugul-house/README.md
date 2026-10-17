# Хан Төгөл: «Энэ хаус танд яг тохирно» (luxury text overlay)

A transparent text overlay for the house walk-through clip: 1080×1920, 30 fps, 171 frames (5.7 s), delivered as an RGBA PNG sequence plus a sound-effects WAV at -14 LUFS.

## Placing it in the edit

Import `out/khantugul-house_png/khantugul-house_0000.png …_0170.png` as a 30 fps image sequence. Lay it over the clip from its first frame, which is where the SRT (C3918, `sequence.srt`) starts. The voice ends on «тохирно» 5.1 s in, and the last 0.6 s holds on the finished line.

Two boards build word by word and then hold, rather than cutting phrase by phrase. Each word wipes in on its spoken syllable, settling upward as it lands. Board A wipes off just before board B starts.

| Board | On screen | Lines |
| --- | --- | --- |
| A | 0.2–3.1 s | ТАНД ИЛҮҮ ИХ / **ОРОН ЗАЙ** (gold hairline) / ТАВ ТУХ · ҮНЭ ЦЭНЭ / ХЭРЭГТЭЙ БАЙГАА БОЛ |
| B | 3.0–5.7 s | ЭНЭ **ХАУС** / ТАНД / ЯГ **ТОХИРНО** (gold hairline) |

The type is tracked Montserrat capitals (800). White words carry a soft shadow so they read on the bright footage, without boxes or outlines. Key words and the hairlines are gold.

«Хэрэгтэй байгаа бол» comes in as one line on «хэрэгтэй», because its last words land just as board A has to clear for board B.

Everything sits above her head (y 190–560). Nothing is drawn below y 600, so she and the burned-in subtitles at the bottom stay clear.

## Build

```sh
node films/khantugul-house/cues.mjs        # sequence.srt -> beats.json
node films/khantugul-house/score.mjs       # beats.json -> out/mix.wav at -14 LUFS
node render.mjs films/khantugul-house --png   # -> out/khantugul-house_png/ (RGBA PNGs + wav)

node render.mjs films/khantugul-house --query backdrop --sheet --offset 0.35   # review over the footage
.venv/bin/python films/shared/sync_check.py films/khantugul-house 30
```

Look: tracked Montserrat 800 capitals (`../cargo-shared/fonts`), white with a soft shadow; gold `#f2c14e` (the brand gold made richer so it parts from the beige facade) for key words and hairlines. `backdrop.jpg` is a frame of the clip, for review sheets only.
