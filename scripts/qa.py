"""Automated checks on a rendered short. Exit code 1 if anything fails.

usage: python3 scripts/qa.py out/<id>.mp4

  glitch frames   1–3-frame runs that differ sharply from both neighbours while the
                  neighbours agree (Chrome capture glitches — they read as "flashing")
  blank speaker   frames where the speaker area (bottom card / face) is empty
  loudness        integrated LUFS (target −14 ±1.5 for shorts)
"""
import re
import subprocess
import sys

from _common import blank_speaker_frames, glitch_frames, gray_frames

video = sys.argv[1]
fr = gray_frames(video)
glitches = glitch_frames(fr)
blank = blank_speaker_frames(fr)
err = subprocess.run(["ffmpeg", "-hide_banner", "-i", video, "-af", "ebur128", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1])
ok = not glitches and not blank and -15.5 <= lufs <= -12.5
print(f"{len(fr)} frames | glitch frames: {glitches or 'none'} | blank speaker: {blank[:20] or 'none'} | loudness {lufs} LUFS")
print("QA PASS" if ok else "QA FAIL")
sys.exit(0 if ok else 1)
