# Хан Төгөл Хотхон: «Эхний асуулт»

Motion graphic for the location answer in the reel: 9:16, 1080×1920, **30 fps**, 6.17 s, H.264 (CRF 16, BT.709) with AAC audio at -14 LUFS. Sound effects only, no music.

## Placing it in the edit

The clip starts on SRT cue 7, «Эхний асуулт», at **00:00:03.860** in `Nested Sequence 01`, and runs to 00:00:10.030, the start of cue 15, which is where the Q2 film (`../khantugul-q2`) begins. Q1 clears to the bare background on its last frame and the background drift carries on, so Q1, Q2 and Q3 cut together without a seam.

## Build

```sh
node films/khantugul-q1/cues.mjs        # ../shared/sequence.srt -> beats.json (the hit grid)
node films/khantugul-q1/score.mjs       # beats.json -> out/mix.wav at -14 LUFS
node render.mjs films/khantugul-q1      # -> out/khantugul-q1.mp4 (about 1.5 min)

node render.mjs films/khantugul-q1 --sheet                           # one frame per beat, for review
.venv/bin/python films/shared/sync_check.py films/khantugul-q1 30    # measures sound sync in the mix
```

The film renders at 30 fps by default (set in `film.js`); pass `--fps` to `render.mjs` for another rate.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page skeleton |
| `film.js` | The film: `window.seek(t)` paints frame t |
| `cues.mjs` | Builds `beats.json` from the reel's SRT |
| `score.mjs` | Places the sound effects on the beat grid |

Fonts, styles, helpers and the sound synthesis are shared with the other films in `../shared/`.
