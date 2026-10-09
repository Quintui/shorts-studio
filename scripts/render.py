"""Render a composition to out/<id>.mp4 — self-healing — then run QA.

usage: python3 scripts/render.py <CompositionId> [--frames 0-120]

Headless Chrome occasionally captures a half-painted frame (a tiled or blank "flash"),
more often when the machine is busy. So instead of rendering straight to MP4:
  1. render a JPEG image sequence + a WAV of the audio
  2. find glitch / blank-speaker frames, re-render just those (up to 3 passes)
     — a frame that comes out identical twice is real content, not a glitch
  3. encode the sequence + audio with ffmpeg, then run scripts/qa.py on the result
"""
import shutil
import subprocess
import sys
from pathlib import Path

from _common import ROOT, _diff, blank_speaker_frames, glitch_frames

comp = sys.argv[1]
frames_arg = sys.argv[sys.argv.index("--frames") + 1] if "--frames" in sys.argv else None
work = ROOT / "out" / f"render-{comp}"
seq = work / "frames"
shutil.rmtree(work, ignore_errors=True)
seq.mkdir(parents=True)


def remotion(*args: str):
    subprocess.run(["npx", "remotion", "render", comp, *args, "--log=error"], check=True, cwd=ROOT)


def render_frames(dst: Path, rng: str | None):
    tmp = dst.parent / "tmp"
    shutil.rmtree(tmp, ignore_errors=True)
    remotion(str(tmp), "--sequence", "--image-format=jpeg", "--jpeg-quality=95", *([f"--frames={rng}"] if rng else []))
    for p in tmp.iterdir():  # element-<n>.jpeg (padding varies) → frame_00000.jpg
        n = int(p.stem.split("-")[-1])
        p.replace(dst / f"frame_{n:05d}.jpg")
    shutil.rmtree(tmp)


print(f"rendering {comp} frames…")
render_frames(seq, frames_arg)
first = int(frames_arg.split("-")[0]) if frames_arg else 0
remotion(str(work / "audio.wav"), "--codec=wav", *([f"--frames={frames_arg}"] if frames_arg else []))

pattern = str(seq / "frame_%05d.jpg")
start = ["-start_number", str(first)]
confirmed: set[int] = set()
for attempt in range(3):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-framerate", "30", *start, "-i", pattern, "-vf",
                          "scale=54:96,format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    fr = [raw[i * 54 * 96:(i + 1) * 54 * 96] for i in range(len(raw) // (54 * 96))]
    bad = sorted((set(glitch_frames(fr)) | set(blank_speaker_frames(fr))) - confirmed)
    if not bad:
        break
    print(f"pass {attempt + 1}: re-rendering {len(bad)} suspect frames {bad[:12]}{'…' if len(bad) > 12 else ''}")
    before = {i: fr[i] for i in bad}
    for i in bad:
        render_frames(seq, f"{first + i}-{first + i}")
    raw = subprocess.run(["ffmpeg", "-v", "error", "-framerate", "30", *start, "-i", pattern, "-vf",
                          "scale=54:96,format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    fr2 = [raw[i * 54 * 96:(i + 1) * 54 * 96] for i in range(len(raw) // (54 * 96))]
    for i in bad:
        if _diff(before[i], fr2[i]) < 1.5:  # identical on re-render → real content (e.g. a legit flash)
            confirmed.add(i)

out = ROOT / "out" / f"{comp}.mp4"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", *start, "-i", pattern, "-i", str(work / "audio.wav"),
                "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", str(out)], check=True)
shutil.rmtree(work)
print(f"rendered {out.relative_to(ROOT)}" + (f" (kept {sorted(confirmed)} as real content)" if confirmed else ""))
sys.exit(subprocess.run([sys.executable, str(ROOT / "scripts" / "qa.py"), str(out)]).returncode)
