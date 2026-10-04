# Хан Төгөл Хотхон: «Дараагийн асуулт»

Motion graphic for the monthly-costs answer in the reel: 9:16, 1080×1920, 60 fps, 6.68 s, H.264 (CRF 16, BT.709) with AAC audio at -14 LUFS. Sound effects only, no music.

## Placing it in the edit

The clip starts on SRT cue 15, «Дараагийн асуулт», at **00:00:10.030** in `Nested Sequence 01`, and runs to 00:00:16.710, the start of cue 24. That is where the Q3 film (`../khantugul-q3`) begins. Q2 clears to the bare background on its last frame and the background drift carries straight on, so the two cut together without a seam.

## Build

```sh
node films/khantugul-q2/cues.mjs        # ../shared/sequence.srt -> beats.json (the hit grid)
node films/khantugul-q2/score.mjs       # beats.json -> out/mix.wav at -14 LUFS
node render.mjs films/khantugul-q2      # -> out/khantugul-q2.mp4 (about 3.5 min)

node render.mjs films/khantugul-q2 --sheet                         # one frame per beat, for review
.venv/bin/python films/shared/sync_check.py films/khantugul-q2     # measures sound sync in the mix
```

Add `--fps 30` (or 25) to `render.mjs` to match a sequence frame rate.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page skeleton |
| `film.js` | The film: `window.seek(t)` paints frame t |
| `cues.mjs` | Builds `beats.json` from the reel's SRT |
| `score.mjs` | Places the sound effects on the beat grid |

Fonts, styles, helpers and the sound synthesis are shared with the other films in `../shared/`.
