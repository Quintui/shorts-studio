"""Scaffold a new short and register it.

usage: python3 scripts/new_short.py <name> [--theme light|dark]

Creates src/shorts/<name>/{Short.tsx, clips.json} from templates/short/ and adds it
to src/shorts/index.ts. Composition id = "Short" + PascalCase(name).
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
name = sys.argv[1]
theme = sys.argv[sys.argv.index("--theme") + 1] if "--theme" in sys.argv else "dark"
if not re.fullmatch(r"[a-z][a-z0-9-]*", name):
    raise SystemExit("name: lowercase letters, digits, dashes (e.g. slow-apps-feel-fast)")
pascal = "".join(p.capitalize() for p in name.split("-"))
comp_id = f"Short{pascal}"
d = ROOT / "src" / "shorts" / name
if d.exists():
    raise SystemExit(f"{d} already exists")
d.mkdir(parents=True)
tpl = (ROOT / "templates" / "short" / "Short.tsx").read_text()
(d / "Short.tsx").write_text(tpl.replace("__NAME__", name).replace("__THEME__", theme).replace("ShortTemplate", comp_id))
(d / "clips.json").write_text('{\n  "clips": [\n    [0.0, 5.0, "replace with real source in/out seconds"]\n  ],\n  "music": {"offset": 600}\n}\n')
# placeholders so the project bundles before prep_short.py has run (prep overwrites them)
pub = ROOT / "public" / "shorts" / name
pub.mkdir(parents=True, exist_ok=True)
(pub / "words.json").write_text('{"duration": 5, "clips": [], "words": [{"text": "placeholder", "start": 0, "end": 1}]}\n')
(pub / "shot.json").write_text('{"src": "shorts/%s/speaker.mp4", "headSrc": "shorts/%s/head_alpha.webm", '
                               '"headCrop": {"x": 0, "y": 0, "w": 1000, "h": 460}, "head": {"x": 960, "y": 200}, '
                               '"srcW": 1920, "srcH": 1080, "duration": 5}\n' % (name, name))
idx = ROOT / "src" / "shorts" / "index.ts"
s = idx.read_text()
imp = f'import {{ {comp_id}, DURATION as {comp_id}Duration }} from "./{name}/Short";\n'
s = s.replace('import type React from "react";\n', 'import type React from "react";\n' + imp)
s = s.replace("  // @new-short-entries", f'  {{ id: "{comp_id}", component: {comp_id}, duration: {comp_id}Duration }},\n  // @new-short-entries')
idx.write_text(s)
print(f"created src/shorts/{name}/ (theme: {theme}), registered as {comp_id}")
print(f"next: edit src/shorts/{name}/clips.json, then python3 scripts/prep_short.py {name}")
