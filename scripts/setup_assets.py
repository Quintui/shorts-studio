"""Copy your local sound effects + music source into the project (they are NOT in git).

usage: python3 scripts/setup_assets.py

Reads assets.config.json (copy assets.config.example.json and point it at your files):
  { "sfx": { "whoosh.mp3": "~/Desktop/sounds/whoosh.mp3", ... },  "music": "~/Desktop/music-bed.mp3" }

Shorts reference effects by the left-hand names via <Sfx src="whoosh.mp3" …/>.
Why not commit them: stock SFX licences (e.g. Mixkit) forbid redistributing the files themselves.
"""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
cfg_path = ROOT / "assets.config.json"
if not cfg_path.exists():
    raise SystemExit("create assets.config.json first (see assets.config.example.json)")
cfg = json.load(open(cfg_path))
dst = ROOT / "public" / "sfx"
dst.mkdir(parents=True, exist_ok=True)
missing = []
for name, src in cfg.get("sfx", {}).items():
    p = Path(src).expanduser()
    if p.exists():
        shutil.copy(p, dst / name)
    else:
        missing.append(f"{name} ← {src}")
music = cfg.get("music")
if music and not Path(music).expanduser().exists():
    missing.append(f"music ← {music}")
print(f"copied {len(cfg.get('sfx', {})) - len([m for m in missing if not m.startswith('music')])} effects into public/sfx/")
for m in missing:
    print("  missing:", m)
