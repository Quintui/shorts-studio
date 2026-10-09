"""Tools for placing cut points precisely. Whisper word times drift up to ~0.8 s
near pauses, so never trust them blindly for a seam.

  python3 scripts/probe_audio.py words 291.5 300      # words + times in a range (from work/transcript.json)
  python3 scripts/probe_audio.py env 599.2 600.4      # loudness per 20 ms: find the silent gap between words
  python3 scripts/probe_audio.py try 292.10 292.54 293.20 296.0
        # stitch [a,b] ranges together and transcribe the result — what a listener hears at the seam
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from _common import WORK, envelope, source_wav, whisper_words

cmd, *args = sys.argv[1:]
if cmd == "words":
    t0, t1 = map(float, args)
    d = json.load(open(WORK / "transcript.json"))
    print(" ".join(f"{w['word'].strip()}@{w['start']:.2f}-{w['end']:.2f}"
                   for s in d["segments"] for w in s["words"] if t0 <= w["start"] <= t1))
elif cmd == "env":
    t0, t1 = map(float, args)
    e = envelope(source_wav(), t0, t1)
    print(f"{t0:.2f}s, one digit per 20 ms (0 = silence):")
    for i in range(0, len(e), 50):
        print(f"  {t0 + i * 0.02:8.2f}  {e[i:i + 50]}")
elif cmd == "try":
    pts = list(map(float, args))
    pairs = list(zip(pts[::2], pts[1::2]))
    fc = "".join(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS[a{i}];" for i, (a, b) in enumerate(pairs))
    fc += "".join(f"[a{i}]" for i in range(len(pairs))) + f"concat=n={len(pairs)}:v=0:a=1"
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "try.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(source_wav()), "-filter_complex", fc, str(out)], check=True)
        d = whisper_words(out, words=False)
    print(" ".join(s["text"].strip() for s in d["segments"]))
else:
    raise SystemExit(__doc__)
