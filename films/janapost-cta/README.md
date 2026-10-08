# Jana Post overlay: «Хятадаас хурдан, найдвартай … татаад аваарай»

A transparent overlay for the testimonial's close: 1080×1920, 30 fps, 180 frames (6 s), delivered as an RGBA PNG sequence plus a sound-effects WAV at -14 LUFS. It sits in the empty wall above her head (y 170–480), like `../janapost-shops`.

## Placing it in the edit

Import `out/janapost-cta_png/janapost-cta_0000.png …_0179.png` as a 30 fps image sequence and lay it over the footage at **00;00;28;15**. That's SRT cue 44 «Хятадаас хурдан». The voice ends on «аваарай» 5.23 s in, and the last 0.77 s holds on the finished download button. Trim the tail if the reel ends sooner.

1. **Benefits (0–2.8 s):** three stickers stack up, one per word. ⚡ «Хятадаас хурдан» slides in on speed lines, which rush again on «хурдан». 🛡 «Найдвартай» stamps on. 🙂 «Толгой өвдөхгүй» bounces up. Each sticker widens as its second word arrives.
2. **Download (2.8–6 s):** «Захиалъя гэвэл» pops in, then the Jana Post app icon on «Jana Post-ыг». On «татаад» the icon steps aside and the «⬇ Татаад аваарай» button slides out from behind it. A progress ring runs round the icon on «аваарай» and it checks off.

## Build

```sh
node films/janapost-cta/cues.mjs        # ../janapost-shared/sequence.srt -> beats.json
node films/janapost-cta/score.mjs       # beats.json -> out/mix.wav at -14 LUFS
node render.mjs films/janapost-cta --png   # -> out/janapost-cta_png/ (RGBA PNGs + wav)

node render.mjs films/janapost-cta --query backdrop --sheet --offset 0.3   # review over the footage
.venv/bin/python films/shared/sync_check.py films/janapost-cta 30
```

Brand tokens, fonts, the Jana Post logo, line icons, boot and the review backdrop are shared in `../janapost-shared/`.
