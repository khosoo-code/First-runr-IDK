# Jana Post: «Апп дээрээсээ хянаад … салбарт ирсэн»

Kinetic text and graphic insert for the Jana Post testimonial reel: 9:16, 1080×1920, 29.97 fps, 281 frames (9.376 s), H.264 (CRF 16, BT.709) with AAC audio at -14 LUFS.

## Placing it in the edit

Drop it on the sequence at **00;00;16;20**. It ends at 00;00;26;01. The clip covers SRT cues 25 «Би болохлоор» to 38 «ирсэн.», and cue 39 «Тэгээд л би бүх» begins 0.3 s before the end.

1. **App (0–4.6 s):** «Захиалгаа / апп дээрээсээ / хянаад л → хүлээсэн.» runs over the Jana Post app's «Захиалгууд» screen, rebuilt from a screenshot of the real app: wallet card, the eight order statuses, «Эзэнгүй бараа хайх» and the tab bar. The «Захиалгууд» tab lights up on «апп». A highlight lands on «Хүлээгдэж байна» on «хаана» while a «Хаана явна?» bubble points at it. It steps to «Агуулахад байна» on «явааг» and to «Замд яваа» on «хянаад», and each passed status checks off. The parcel chip on «Замд яваа» then waits with a ticking clock while the later statuses dim.
2. **«Харин Jana Post» (4.6–5.5 s):** brand green floods out of the parcel dot and the logo rises glyph by glyph.
3. **Route (5.5–9.4 s):** the logo lands on a parcel at the China warehouse («Өөрсдөө / аваад»). The parcel rides the route while a radar from home finds the nearest branch («Хамгийн ойр салбар»). It lands there on «Салбарт / ирсэн.».

The audio is sound effects only (whooshes, low hits, ticks, clicks, pops, pencil), with no music. It's `out/mix.wav` at -14 LUFS, so turn it down under the voice-over.

## Build

```sh
node films/janapost-track/cues.mjs        # sequence.srt -> beats.json (the hit grid)
node films/janapost-track/score.mjs       # beats.json -> out/mix.wav at -14 LUFS
node render.mjs films/janapost-track      # -> out/janapost-track.mp4 (about 1 min)

node render.mjs films/janapost-track --sheet --offset 0.25   # one frame per beat, for review
.venv/bin/python films/shared/sync_check.py films/janapost-track 29.97
```

## Files

| File | What it does |
| --- | --- |
| `index.html`, `style.css` | Page skeleton and the Jana Post look |
| `film.js` | The film: `window.seek(t)` paints frame t |
| `cues.mjs` | Builds `beats.json` from `sequence.srt` (the reel's SRT, C6751.srt) and the timecode in-point |
| `score.mjs` | Places the sound effects on the beat grid (`../shared/sfx.mjs`) |
| `logo.svg` | The supplied logo. `film.js` inlines its glyphs so they can rise one by one |

Look: brand green `#1b8918` (from the logo) is the only accent, apart from the app's own blue wallet card (`#3757d9`), which the app screen keeps. Surfaces are white and mist `#f2f5f1`, ink is `#10140f`. Montserrat 800/900 is the display face and Manrope 600/700 the UI face, both from the repo's font folders. The Jana Post site (janapost.mn) couldn't be reached from the build environment, so the look comes from the logo.
