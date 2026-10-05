# Cargo kinetic type 1: «Хурдан, Найдвартай, Хямд тээвэр»

3.4 s, 1080×1920, 30 fps, transparent background. Green #008c00, white strokes, Montserrat 900.

ХУРДАН whips in from the left on speed lines, НАЙДВАРТАЙ drops out of a mask and a rounded
white frame draws around it, ХЯМД pops on a spring, ТЭЭВЭР rises onto an underline. Everything
whips out to the right and the clip ends on an empty frame.

    node films/cargo-1/score.mjs   # SFX -> out/mix.wav (-14 LUFS)
    node render.mjs films/cargo-1  # -> out/cargo-1.mov (ProRes 4444 + alpha, PCM audio)
