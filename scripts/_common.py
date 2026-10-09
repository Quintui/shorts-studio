"""Shared helpers for the shorts pipeline. Paths are relative to the repo root."""
from __future__ import annotations

import json
import math
import struct
import subprocess
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / "work"
PUBLIC = ROOT / "public"
WHISPER_MODEL = "large-v3-turbo"
VIDEO_EXT = {".mov", ".mp4", ".m4v", ".mkv", ".webm"}


def sh(*args: str, capture=False) -> str:
    r = subprocess.run(list(args), check=True, capture_output=capture, text=capture)
    return r.stdout if capture else ""


def probe(path: Path) -> dict:
    out = sh("ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
             "stream=width,height,r_frame_rate:format=duration", "-of", "json", str(path), capture=True)
    d = json.loads(out)
    st = d["streams"][0]
    num, den = st["r_frame_rate"].split("/")
    return {"width": st["width"], "height": st["height"], "fps": round(int(num) / int(den), 3),
            "duration": float(d["format"]["duration"])}


def source_video() -> Path:
    """The long-form video: work/source.json if set, else the single video in input/."""
    meta = WORK / "source.json"
    if meta.exists():
        return ROOT / json.load(open(meta))["path"]
    vids = [p for p in (ROOT / "input").iterdir() if p.suffix.lower() in VIDEO_EXT]
    if len(vids) != 1:
        raise SystemExit(f"Put exactly one video in input/ (found {len(vids)}), or run scripts/transcribe.py <video>.")
    return vids[0]


def source_wav() -> Path:
    """16 kHz mono WAV of the source, cached in work/audio.wav."""
    wav = WORK / "audio.wav"
    if not wav.exists():
        sh("ffmpeg", "-v", "error", "-y", "-i", str(source_video()), "-vn", "-ac", "1", "-ar", "16000", str(wav))
    return wav


def whisper_words(audio: Path, words=True) -> dict:
    """Run OpenAI Whisper CLI; returns its JSON (segments with word timings)."""
    with tempfile.TemporaryDirectory() as tmp:
        sh("whisper", str(audio), "--model", WHISPER_MODEL, "--language", "en", "--word_timestamps", str(words),
           "--output_format", "json", "--output_dir", tmp, "--fp16", "False", capture=True)
        return json.load(open(Path(tmp) / (audio.stem + ".json")))


def flat_words(d: dict) -> list[dict]:
    return [{"text": w["word"].strip(), "start": round(w["start"], 3), "end": round(w["end"], 3)}
            for s in d["segments"] for w in s.get("words", [])]


def envelope(wav: Path, t0: float, t1: float, step=0.02) -> str:
    """Loudness per 20 ms as digits 0–9 (0 ≈ silence below −55 dBFS, each step 5 dB)."""
    w = wave.open(str(wav))
    sr = w.getframerate()
    w.setpos(int(t0 * sr))
    n = int((t1 - t0) * sr)
    a = struct.unpack("<%dh" % n, w.readframes(n))
    per = int(step * sr)
    out = []
    for i in range(0, n - per + 1, per):
        seg = a[i:i + per]
        r = math.sqrt(sum(x * x for x in seg) / len(seg))
        out.append(str(max(0, min(9, int((20 * math.log10(r / 32768 + 1e-9) + 60) / 5)))))
    return "".join(out)


def fmt(t: float) -> str:
    return f"{int(t // 60):02d}:{t % 60:05.2f}"


# ---------------------------------------------------------------- render QA

QA_W, QA_H = 54, 96


def gray_frames(source: str, pattern=False) -> list[bytes]:
    """Frames of a video (or an image-sequence pattern) as tiny 54×96 grayscale buffers."""
    args = ["ffmpeg", "-v", "error"] + (["-framerate", "30"] if pattern else []) + ["-i", source,
            "-vf", f"scale={QA_W}:{QA_H},format=gray", "-f", "rawvideo", "-"]
    raw = subprocess.run(args, capture_output=True, check=True).stdout
    n = len(raw) // (QA_W * QA_H)
    return [raw[i * QA_W * QA_H:(i + 1) * QA_W * QA_H] for i in range(n)]


def _diff(a: bytes, b: bytes) -> float:
    return sum(abs(x - y) for x, y in zip(a, b)) / len(a)


def glitch_frames(fr: list[bytes], max_run=3) -> list[int]:
    """Runs of 1–3 frames that differ sharply from both sides while the two sides agree —
    Chrome capturing a half-painted frame (shows as a tiled/blank "flash")."""
    bad: set[int] = set()
    n = len(fr)
    for run in range(1, max_run + 1):
        for i in range(1, n - run):
            before, after = fr[i - 1], fr[i + run]
            outside = _diff(before, after)
            inside = [min(_diff(fr[k], before), _diff(fr[k], after)) for k in range(i, i + run)]
            if all(d > 8 for d in inside) and outside < min(inside) * 0.5:
                bad.update(range(i, i + run))
    return sorted(bad)


def blank_speaker_frames(fr: list[bytes]) -> list[int]:
    """Frames whose speaker area (bottom card / face, x 200–880 y 1500–1900) is empty."""
    out = []
    for i, f in enumerate(fr):
        vals = [f[y * QA_W + x] for y in range(75, 95) for x in range(10, 44)]
        m = sum(vals) / len(vals)
        if m < 6 or m > 200:
            out.append(i)
    return out
