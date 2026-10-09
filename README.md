# shorts-studio

Turn one long-form talking-head video into edited vertical shorts with Claude Code. The edits are written as code with [Remotion](https://www.remotion.dev) (React → video): word-synced kinetic type, a speaker card with the head cut out, full-screen punch-ins, captions, 3D camera "worlds", sound design.

| light reference style | dark worlds style |
|---|---|
| `examples/streaming/preview.mp4` | `examples/agent/preview.mp4` |

The look is modelled on `reference/reference.mp4` (breakdown in `reference/STYLE.md`).

## Use it for a new video

```bash
git clone <this repo> my-video-shorts && cd my-video-shorts
npm install
cp assets.config.example.json assets.config.json   # point at your SFX + music (local only)
python3 scripts/setup_assets.py
cp ~/Videos/my-long-video.mov input/
claude                                             # or open the folder in the Claude desktop app
```

Then paste the prompt from [`START-HERE.md`](START-HERE.md). Claude transcribes the video, proposes shorts, and after you pick one, cuts it, builds the edit, renders and QA-checks it, and hands you `out/Short<Name>.mp4`.

## How it works

1. **find-shorts** (`.claude/skills/find-shorts`): runs Whisper (large-v3-turbo) for word-level timings, then proposes ranked shorts with cut points in `work/shorts-plan.md`.
2. **cut-short** (`.claude/skills/cut-short`): verifies every seam by audio (Whisper timings drift near pauses), cuts the clip, normalises the voice to −14 LUFS, re-transcribes the cut, mattes the speaker with Apple Vision, and tracks the head.
3. **edit-short** (`.claude/skills/edit-short`): storyboards beats onto spoken words, builds `src/shorts/<name>/Short.tsx` in Remotion, renders it, and runs QA (glitch frames, blank speaker, loudness) plus frame-sheet review.

`CLAUDE.md` loads automatically in every Claude Code chat in this folder, so a fresh chat already knows the pipeline and the rules.

## Remotion in 60 seconds

- A video is a React component. `useCurrentFrame()` tells it which frame is being drawn, and everything on screen is computed from that number.
- `npm run studio` opens **Remotion Studio** (http://localhost:3000): pick a composition, scrub the timeline, see changes live.
- `npm run render -- ShortMyName` renders `out/ShortMyName.mp4` with headless Chrome, then runs `scripts/qa.py`.
- Versions are pinned (`remotion@4.0.534`). `remotion.config.ts` renders with system Google Chrome, because Remotion's bundled headless shell hangs on this Mac.

## Customise

| want to change | edit |
|---|---|
| colours, caption pill, speaker card, footage grade, grain, music level | `src/theme.ts` (presets `light` and `dark`; add your own) |
| fonts | `src/lib/fonts.ts` |
| speaker card position, head pop-out height, face framing | `src/lib/Speaker.tsx` |
| caption grouping/size | `src/lib/Captions.tsx` |
| reusable graphics (chips, reveals, marker circles, motion) | `src/lib/kit.tsx` |
| 3D camera / worlds | `src/lib/world.tsx` |
| editing rules Claude follows | `.claude/skills/*/SKILL.md` |

## Requirements

- macOS with Xcode command-line tools (`swift`, for Apple Vision person segmentation)
- Node 20+, Google Chrome
- `ffmpeg`
- `whisper` CLI: `pipx install openai-whisper`. The first run downloads large-v3-turbo (~1.6 GB).

## Licensing notes

- `public/sfx/` and the music source are **not** committed. Stock SFX licences (e.g. Mixkit) forbid redistributing the files. `assets.config.json` points at your local copies.
- `reference/reference.mp4` is a third-party short kept as a style reference. Keep this repo **private**.
