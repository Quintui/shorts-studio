# Examples

Two finished shorts, cut from the same long-form video about building an AI education app with Mastra. Each folder has:

- `Short.tsx`: the full composition, written as if it lived at `src/shorts/<name>/Short.tsx`. Import paths assume that location; this folder isn't compiled.
- `clips.json`: the verified source cut points, with notes on what each seam removes.
- `words.json`: word timings of the cut.
- `preview.mp4`: the final render.

| | style | what to learn from it |
|---|---|---|
| `streaming/` | **light reference** (`theme.light`) | grid-paper backdrops, stacked heavy+serif type built word by word, chips + hand-drawn connectors, UI mockups (spinner card, code card typing in sync, scene list), red marker circles, packets travelling along a path, a split/full rhythm with emphasis titles |
| `agent/` | **dark worlds** (`theme.dark`) | one continuous 3D camera through six SVG worlds: title fly-through, wireframe "agent" sphere + tool burst, chaos → straight line, narration/animation timeline, grid floor with rising steps, pipeline whip-pans, pull-back reveal |

To re-run one, copy its folder into `src/shorts/<name>/`, register it in `src/shorts/index.ts` (or scaffold with `new_short.py` and paste over `Short.tsx`), put the source video in `input/`, and run `python3 scripts/prep_short.py <name>`.
