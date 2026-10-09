"""Turn a short's clip list into everything the Remotion composition needs.

usage: python3 scripts/prep_short.py <name> [--skip-matte]

Reads  src/shorts/<name>/clips.json
  {
    "clips": [[599.72, 602.34, "cold open"], [292.10, 292.54, "The first"], ...],   // source seconds
    "music": {"offset": 1800}            // optional: where to start in the music source (assets.config.json)
  }
Writes public/shorts/<name>/
  speaker.mp4      cut, loudness-normalised (−14 LUFS) speaker clip, source resolution + fps
  words.json       word timings re-transcribed FROM THE CUT (accurate at seams)
  matte.mp4        person matte (Apple Vision, scripts/segment.swift)
  head_alpha.webm  head region with alpha (VP9) for the "head pops out of the card" layer
  shot.json        head position + crop for <Speaker shot=…>
  music.mp3        −20 LUFS music bed for this short (if assets.config.json has a music source)
"""
import json
import statistics
import subprocess
import sys
import tempfile
from pathlib import Path

from _common import PUBLIC, ROOT, probe, sh, source_video, whisper_words, flat_words

name = sys.argv[1]
skip_matte = "--skip-matte" in sys.argv
cfg = json.load(open(ROOT / "src" / "shorts" / name / "clips.json"))
clips = [(float(c[0]), float(c[1])) for c in cfg["clips"]]
src = source_video()
info = probe(src)
fps = info["fps"]
out = PUBLIC / "shorts" / name
out.mkdir(parents=True, exist_ok=True)

# 1. cut: video + audio, 8 ms fades at seams (no clicks), voice chain → −14 LUFS
parts, labels = [], []
for i, (a, b) in enumerate(clips):
    d = b - a
    parts.append(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS,fps={fps}[v{i}];"
                 f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st={d - 0.008:.3f}:d=0.008[a{i}];")
    labels.append(f"[v{i}][a{i}]")
fc = ("".join(parts) + "".join(labels) + f"concat=n={len(clips)}:v=1:a=1[v][ac];"
      "[ac]highpass=f=70,acompressor=threshold=-24dB:ratio=3:attack=5:release=120,"
      "loudnorm=I=-14:TP=-1.5:LRA=7,aresample=48000[a]")
print(f"[1/5] cutting {len(clips)} clips from {src.name}")
sh("ffmpeg", "-v", "error", "-y", "-i", str(src), "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
   "-c:v", "libx264", "-crf", "12", "-preset", "slow", "-pix_fmt", "yuv420p",
   "-c:a", "aac", "-b:a", "256k", "-ac", "2", str(out / "speaker.mp4"))
duration = sum(b - a for a, b in clips)

# 2. words, transcribed from the cut itself
print("[2/5] transcribing the cut")
with tempfile.TemporaryDirectory() as tmp:
    wav = Path(tmp) / "cut.wav"
    sh("ffmpeg", "-v", "error", "-y", "-i", str(out / "speaker.mp4"), "-ac", "1", "-ar", "16000", str(wav))
    words = flat_words(whisper_words(wav))
json.dump({"duration": round(duration, 3), "clips": clips, "words": words}, open(out / "words.json", "w"), indent=1)
print("      " + " ".join(w["text"] for w in words))

W, H = info["width"], info["height"]
if not skip_matte:
    # 3. person matte via Apple Vision
    print("[3/5] person matte (Apple Vision)")
    seg = subprocess.Popen(["swift", str(ROOT / "scripts" / "segment.swift"), str(out / "speaker.mp4")],
                           stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", str(fps),
                    "-i", "-", "-c:v", "libx264", "-crf", "10", "-pix_fmt", "yuv420p", str(out / "matte.mp4")],
                   stdin=seg.stdout, check=True)
    seg.wait()

# 4. head tracking from the matte (median top + centre over the clip)
print("[4/5] tracking the head")
sw, shh = W // 10, H // 10
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(out / "matte.mp4"), "-vf", f"scale={sw}:{shh}",
                      "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True, check=True).stdout
tops, xs = [], []
for f in range(len(raw) // (sw * shh)):
    fr = raw[f * sw * shh:(f + 1) * sw * shh]
    top = next((y for y in range(shh) if sum(1 for v in fr[y * sw:(y + 1) * sw] if v > 128) > 3), None)
    if top is None:
        continue
    cols = [x for y in range(top, min(shh, top + 15)) for x in range(sw) if fr[y * sw + x] > 128]
    tops.append(top * 10)
    xs.append(sum(cols) / len(cols) * 10)
if not tops:
    raise SystemExit("no person found in the matte — is the speaker in frame?")
head = {"x": round(statistics.median(xs)), "y": round(statistics.median(tops))}
cw, ch = round(W * 0.52) // 2 * 2, round(H * 0.426) // 2 * 2
crop = {"x": max(0, min(W - cw, head["x"] - cw // 2)) // 2 * 2, "y": 0, "w": cw, "h": ch}
print(f"      head top-centre {head}, spread x {round(min(xs))}–{round(max(xs))}, y {min(tops)}–{max(tops)}")

# 5. head layer with alpha
print("[5/5] head layer with alpha")
c = f"crop={crop['w']}:{crop['h']}:{crop['x']}:{crop['y']}"
sh("ffmpeg", "-v", "error", "-y", "-i", str(out / "speaker.mp4"), "-i", str(out / "matte.mp4"), "-filter_complex",
   f"[1:v]format=gray,tmix=frames=3:weights='1 2 1',gblur=sigma=1.2,{c}[m];[0:v]{c},format=yuva420p[c];[c][m]alphamerge[o]",
   "-map", "[o]", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "18", "-row-mt", "1",
   "-deadline", "good", "-cpu-used", "4", "-an", str(out / "head_alpha.webm"))

shot = {"src": f"shorts/{name}/speaker.mp4", "headSrc": f"shorts/{name}/head_alpha.webm", "headCrop": crop,
        "head": head, "srcW": W, "srcH": H, "duration": round(duration, 3)}
json.dump(shot, open(out / "shot.json", "w"), indent=1)

# music bed
assets = ROOT / "assets.config.json"
music_src = json.load(open(assets)).get("music") if assets.exists() else None
if not music_src:
    # silent bed so <Audio src=music.mp3> always resolves; add a music source in assets.config.json for a real one
    sh("ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", str(duration + 1),
       "-q:a", "9", str(out / "music.mp3"))
else:
    offset = cfg.get("music", {}).get("offset", 600)
    sh("ffmpeg", "-v", "error", "-y", "-ss", str(offset), "-t", str(duration + 6), "-i", str(Path(music_src).expanduser()),
       "-af", f"loudnorm=I=-20:TP=-2,afade=t=in:d=0.4,afade=t=out:st={duration + 2:.2f}:d=3.5", "-ar", "48000",
       str(out / "music.mp3"))
print(f"done: {name} = {duration:.2f}s → public/shorts/{name}/")
