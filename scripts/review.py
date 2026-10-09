"""Contact sheets for reviewing an edit without watching it.

  python3 scripts/review.py stills <CompositionId> 40 150 300 …   → out/review/<id>-stills.jpg (rendered frames)
  python3 scripts/review.py motion out/<id>.mp4 2.0:1.2 6.9:1.6 …  → out/review/<id>-motion.jpg
        one row per start:length window, 10 fps, top 1300 px (the graphics area)
"""
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REV = ROOT / "out" / "review"
REV.mkdir(parents=True, exist_ok=True)
cmd, target, *rest = sys.argv[1:]

if cmd == "stills":
    with tempfile.TemporaryDirectory() as tmp:
        files = []
        for f in rest:
            p = Path(tmp) / f"f{int(f):05d}.jpg"
            subprocess.run(["npx", "remotion", "still", target, str(p), f"--frame={f}", "--log=error"], check=True, cwd=ROOT)
            files.append(p)
        inputs = sum((["-i", str(p)] for p in files), [])
        out = REV / f"{target}-stills.jpg"
        subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex",
                        "".join(f"[{i}]" for i in range(len(files))) + f"hstack={len(files)},scale={min(3000, 400 * len(files))}:-1",
                        str(out)], check=True)
elif cmd == "motion":
    with tempfile.TemporaryDirectory() as tmp:
        rows = []
        for i, w in enumerate(rest):
            start, length = w.split(":")
            p = Path(tmp) / f"r{i}.jpg"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", start, "-t", length, "-i", target, "-vf",
                            "fps=10,crop=1080:1300:0:0,scale=150:-1,tile=16x1", "-frames:v", "1", str(p)], check=True)
            rows.append(p)
        inputs = sum((["-i", str(p)] for p in rows), [])
        out = REV / f"{Path(target).stem}-motion.jpg"
        subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex",
                        "".join(f"[{i}]" for i in range(len(rows))) + f"vstack={len(rows)}", str(out)], check=True)
else:
    raise SystemExit(__doc__)
print(f"wrote {out.relative_to(ROOT)}")
