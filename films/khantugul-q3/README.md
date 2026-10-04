# Хан Төгөл Хотхон: «Сүүлийн асуулт»

Motion graphic for the payment-terms answer in the reel: 9:16, 1080×1920, 60 fps, 21 s, H.264 (CRF 16, BT.709) with AAC audio at -14 LUFS.

## Placing it in the edit

The clip starts on SRT cue 24, «Сүүлийн асуулт.», at **00:00:16.710** in `Nested Sequence 01`. Drop it on the timeline at that point and every move lands on its word. The voice ends on «боломжтой.» at 37.600, which is 20.89 s into the clip. The last 0.11 s is a hold.

The audio is sound effects only (whooshes, low hits, ticks, a switch click, pops, pencil), with no music or tuned notes. It's `out/mix.wav` at -14 LUFS, so turn it down under the voice-over.

## Build

```sh
node films/khantugul-q3/cues.mjs        # sequence.srt -> beats.json (the hit grid)
node films/khantugul-q3/score.mjs       # beats.json -> out/mix.wav at -14 LUFS
node render.mjs films/khantugul-q3      # -> out/khantugul-q3.mp4 (about 10 min)

node render.mjs films/khantugul-q3 --sheet          # one frame per beat, for review
.venv/bin/python films/shared/sync_check.py films/khantugul-q3   # measures sound sync in the mix
```

Add `--fps 30` (or 25) to `render.mjs` to match a sequence frame rate. Everything is a function of time, so any rate works.

## Retiming

If the voice-over edit changes, export the SRT again, replace `../shared/sequence.srt` and rerun the three build steps. The picture and the sound both read their timing from `beats.json`. Each hit there is a word in the SRT (see `HITS` in `cues.mjs`).

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page skeleton |
| `film.js` | The film: `window.seek(t)` paints frame t |
| `cues.mjs` | Builds `beats.json` from the reel's SRT |
| `score.mjs` | Places the sound effects on the beat grid |

Shared with the other Хан Төгөл films, in `../shared/`:

| File | What it does |
| --- | --- |
| `kit.js`, `style.css` | Fonts, tokens, type styles, text slots, line icons, background, the series hook |
| `motion.js` | Easing, spring and seeded noise shared by the picture and the sound |
| `srt.mjs`, `sequence.srt` | The reel's SRT and the beat-grid builder |
| `sfx.mjs` | Sound-effect synthesis and the -14 LUFS master |
| `sync_check.py` | Checks that rendered sounds land on their beats |
| `fonts/` | Noto Serif Display and Manrope (SIL Open Font License) |

Palette: cream `#f7f6ed`, white `#ffffff`, ink `#1b1e23`, green `#1e4e3e` (primary accent), gold `#ac905f` (secondary accent), gray `#9499a3` at 50% and 12% only.
