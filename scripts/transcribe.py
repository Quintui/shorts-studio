"""Transcribe the long-form video with word-level timings.

usage: python3 scripts/transcribe.py [path/to/video]   (default: the one video in input/)

Writes
  work/source.json      — which video, its size/fps/duration
  work/audio.wav        — 16 kHz mono copy used by every audio tool
  work/transcript.json  — Whisper output (segments + words)
  work/transcript.md    — readable transcript, timestamped every ~40 s
"""
import json
import sys
from pathlib import Path

from _common import ROOT, WORK, fmt, probe, sh, source_video, whisper_words

WORK.mkdir(exist_ok=True)
video = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else source_video()
meta = {"path": str(video.relative_to(ROOT)) if video.is_relative_to(ROOT) else str(video), **probe(video)}
json.dump(meta, open(WORK / "source.json", "w"), indent=1)
wav = WORK / "audio.wav"
sh("ffmpeg", "-v", "error", "-y", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", str(wav))
print(f"transcribing {video.name} ({meta['duration'] / 60:.1f} min) — Whisper large-v3-turbo, takes a few minutes…")
d = whisper_words(wav)
json.dump(d, open(WORK / "transcript.json", "w"))

lines = [f"# Transcript: {video.name}\n", f"*Whisper large-v3-turbo, word timings in transcript.json. Duration {fmt(meta['duration'])}.*\n"]
block, block_start = [], None
for s in d["segments"]:
    if block_start is None:
        block_start = s["start"]
    block.append(s["text"].strip())
    if s["end"] - block_start > 40:
        lines.append(f"**[{fmt(block_start)}]** {' '.join(block)}\n")
        block, block_start = [], None
if block:
    lines.append(f"**[{fmt(block_start)}]** {' '.join(block)}\n")
(WORK / "transcript.md").write_text("\n".join(lines))
print(f"wrote work/transcript.md ({sum(len(s.get('words', [])) for s in d['segments'])} words)")
