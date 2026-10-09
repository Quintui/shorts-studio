# shorts-studio

This repo turns one long-form talking-head video into edited vertical shorts (1080×1920, 30 fps). The edits are code: every short is a **Remotion** composition, which means React components rendered to video frame by frame. Claude does the editing. The user directs.

**One clone per video.** The user drops the long-form video (or a pre-cut clip) into `input/`, opens a chat here, and asks for shorts.

## The workflow: use the skills, in order

1. **`find-shorts`**: transcribe with Whisper and propose ranked short candidates with exact cut points → `work/shorts-plan.md`. Ask the user which to make.
2. **`cut-short`**: lock the clip list (verifying every seam), then cut, normalise the voice, matte the speaker and track the head → `public/shorts/<name>/`.
3. **`edit-short`**: design and build the composition (light reference style or dark worlds style), render, run QA and review the frames, then hand over the MP4.

Read the matching `SKILL.md` before each phase. They hold the craft rules that made the first shorts good.

## What Remotion is (and how it's used here)

- **Remotion 4.0.534** (pinned, all `@remotion/*` packages on the same version). A composition is a React component. `useCurrentFrame()` returns the frame being rendered, and everything is a pure function of that frame. There are no CSS transitions or timers.
- `src/Root.tsx` registers every short in `src/shorts/index.ts` as a `<Composition>` (1080×1920, 30 fps).
- **Preview:** `npm run studio` opens Remotion Studio at http://localhost:3000 with a scrubbable timeline. `.claude/launch.json` has a `remotion-studio` config for the browser preview tool.
- **Render:** `npm run render -- <CompositionId>` runs `npx remotion render` → `out/<id>.mp4` and then `scripts/qa.py`. A single frame: `npx remotion still <id> out/f.jpg --frame=120`.
- **Video in a composition:** `<OffthreadVideo>` (frame-accurate; `transparent` for the alpha head layer). **Audio:** `<Audio>` / `<Sfx>`. **Files:** under `public/`, referenced with `staticFile("shorts/<name>/speaker.mp4")`.
- **This Mac:** Remotion's bundled `chrome-headless-shell` hangs (it never fires requestAnimationFrame), so `remotion.config.ts` renders with system **Google Chrome**. Keep it that way.

## Commands

```bash
python3 scripts/transcribe.py [video]          # → work/transcript.{json,md}, work/source.json, work/audio.wav
python3 scripts/probe_audio.py words|env|try … # seam tools (see cut-short skill)
python3 scripts/new_short.py <name> --theme dark|light   # scaffold src/shorts/<name>/ + register it
python3 scripts/prep_short.py <name>           # cut + voice −14 LUFS + words + matte + head alpha + shot.json + music bed
npm run studio                                 # Remotion Studio
npm run render -- Short<Name>                  # render + QA
python3 scripts/review.py stills|motion …      # contact sheets for checking frames without watching
python3 scripts/setup_assets.py                # copy local SFX into public/sfx (once per clone)
```

## Layout

```
input/             the long-form video (git-ignored)
work/              transcript, source info, shorts-plan.md (per video)
src/theme.ts       light + dark themes: colours, caption pill, speaker card, grade, grain, music level
src/lib/           kit.tsx (reveals, chips, lines, marker circles, motion), Speaker, Captions, world.tsx (3D camera), timing, fonts
src/shorts/<name>/ Short.tsx + clips.json per short; index.ts registers them
public/shorts/<name>/ speaker.mp4, head_alpha.webm, matte.mp4, words.json, shot.json, music.mp3 (generated)
examples/          two finished edits: streaming (light reference style) and agent (dark 3D worlds)
reference/         the reference short + STYLE.md breakdown + frame sheets: the north star for the look
templates/short/   starter Short.tsx used by new_short.py
```

## Hard-won rules

- **Whisper word times drift 0.5–0.8 s near pauses** and miss false starts. Never cut on raw long-form timings: verify every seam with `probe_audio.py env/try`. `prep_short.py` re-transcribes the *cut* for captions and anchors.
- **Anchor every animation to a spoken word** with `A("phrase", nth)`. Never hard-code seconds.
- **Headless Chrome sometimes captures a half-painted frame** (a tiled or blank "flash", worse under load). `scripts/render.py` renders an image sequence, detects these frames, re-renders just them, then encodes, so always render through `npm run render`, never plain `npx remotion render`. Also keep live SVG filters (`feTurbulence` etc.) off full-frame layers (grain is a static PNG). Never ship a render that fails QA.
- **Hooks are unconditional** (`const th = useTheme()` at the top), and frames are pure functions.
- **The user reviews on a phone.** Captions ≥ 58 px, key text ≥ 80 px, nothing important below y ≈ 1150 in split layout (the speaker card + caption live there).
- **Assets:** SFX and the music source are local-only (licences forbid redistributing them). `assets.config.json` points at them, and `setup_assets.py` copies the SFX in.
- **Python tools need:** `ffmpeg`, `whisper` (openai-whisper CLI, model large-v3-turbo) and `swift` (Xcode command-line tools, for Apple Vision matting). Node 20+.
