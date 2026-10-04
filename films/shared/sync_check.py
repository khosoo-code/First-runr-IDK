"""Sound-sync check from CLAUDE.md: do the rendered sounds land where they were placed?

score.mjs places every sound on the beats.json grid and logs it to out/cues.json.
This measures the rendered audio against that log:
  - sharp hits (mallet, thump, tick, pop): nearest librosa onset in out/mix.wav (2.7 ms hop)
  - whooshes: the loudest 60 ms of out/mix.wav above 500 Hz (so low hits don't count)
    within 300 ms of the placed peak
and lists, for each spoken-word hit in beats.json, the sound that answers it.

    .venv/bin/python films/shared/sync_check.py films/khantugul-q3 [fps, default 60]
"""
import json
import sys
from pathlib import Path

import librosa
import numpy as np

here = Path(sys.argv[1])
beats = json.loads((here / "beats.json").read_text())
cues = json.loads((here / "out" / "cues.json").read_text())
sr = 48000
mix, _ = librosa.load(here / "out" / "mix.wav", sr=sr, mono=True)
sfx = mix
FPS = float(sys.argv[2]) if len(sys.argv) > 2 else 60
FRAME_MS = 1000 / FPS

onsets = librosa.onset.onset_detect(y=mix, sr=sr, hop_length=128, units="time", delta=0.04)

sharp = [c for c in cues if c["kind"] not in ("whoosh", "bend")]
# Sounds placed within 30 ms of each other share one detected onset; check each cluster once.
clusters = []
for c in sharp:
    if clusters and c["t"] - clusters[-1][-1]["t"] < 0.03:
        clusters[-1].append(c)
    else:
        clusters.append([c])
devs, missed = [], []
for group in clusters:
    t = group[0]["t"]
    d = (onsets[np.argmin(np.abs(onsets - t))] - t) * 1000 if len(onsets) else np.inf
    (devs if abs(d) <= 40 else missed).append(d if abs(d) <= 40 else t)

hop = 128
spec = np.abs(librosa.stft(sfx, n_fft=1024, hop_length=hop)) ** 2
air = spec[librosa.fft_frequencies(sr=sr, n_fft=1024) > 500].sum(axis=0)
win = int(0.06 * sr / hop)  # 60 ms: long enough that a swell outweighs a 5 ms tick
env = np.convolve(air, np.ones(win) / win, mode="same")
whoosh_devs = []
for c in (c for c in cues if c["kind"] == "whoosh"):
    a, b = int((c["t"] - 0.3) * sr / hop), int((c["t"] + 0.3) * sr / hop)
    whoosh_devs.append(((max(a, 0) + np.argmax(env[max(a, 0):b])) * hop / sr - c["t"]) * 1000)

devs = np.abs(np.array(devs))
print(f"sharp hits: {len(devs)}/{len(clusters)} detected in the mix, median {np.median(devs):.1f} ms, "
      f"max {devs.max():.1f} ms, {np.mean(devs <= FRAME_MS) * 100:.0f}% within one {FPS:g} fps frame")
if missed:
    print("  not detected (masked by a neighbour):", ", ".join(f"{t:.2f}s" for t in missed))
wd = np.abs(np.array(whoosh_devs))
print(f"whooshes: {len(wd)} swells peak median {np.median(wd):.0f} ms, max {wd.max():.0f} ms from their placed time")

print("spoken-word hits and the sound that answers them:")
for h in beats["hits"]:
    near = min(cues, key=lambda c: abs(c["t"] - h["t"]))
    print(f"  {h['t']:6.2f}s  {h['name']:<18} {near['kind']:<7} {1000 * (near['t'] - h['t']):+5.0f} ms")
