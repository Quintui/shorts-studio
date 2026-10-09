---
name: edit-short
description: Design, build, render and QA the Remotion edit for a prepared short (src/shorts/<name>/Short.tsx) in the light reference style or the dark 3D "worlds" style, anchoring every animation to spoken words. Use after cut-short has produced public/shorts/<name>/, or when the user asks to change, restyle or re-render a short.
---

# Edit a short

You are the editor. The bar is **"doesn't look AI-generated"**: every beat has a deliberate visual idea tied to what is being said, motion has weight and blur, and the type is bold and composed. Not cards fading in on a flat page.

Before building, read:
- `reference/STYLE.md`, and look at 2–3 sheets in `reference/frames/`
- the example closest to the requested style:
  - `examples/streaming/Short.tsx`: **light reference style** (grid paper, black type, chips, diagrams, UI mockups, red marker circles)
  - `examples/agent/Short.tsx`: **dark worlds style** (one continuous 3D camera through SVG worlds, one accent per world)
- `references/api.md`: what the kit gives you
- for the dark style, also `references/worlds.md`

## 1. Storyboard first (write it in chat, short)

Print the cut's words with times:

```bash
python3 -c "import json;d=json.load(open('public/shorts/<name>/words.json'));print(' '.join(f\"{w['text']}@{w['start']:.2f}\" for w in d['words']))"
```

Then plan:
- **Beats:** one visual idea per 1.5–4 s of speech. Name the visual metaphor for each: what does this sentence *look like*? (spinner + "is it stuck?" chips; a tangle of tools snapping into a straight line; stairs rising for "predefined steps").
- **Full-screen windows (2–3 per short):**
  - Put them on emotional/contrarian lines and on **clip seams**, because the layout cut hides the jump cut.
  - Each gets 1–2 **Emphasis** titles in ALL CAPS ("WRONG SHAPE", "FEELS DIFFERENT").
  - Keep each 2–5 s.
- **Hook:** frames 0–60 must be visually busy and on-message. No slow fades in.
- **Ending:** land the payoff line with the biggest type of the short, and hold ~0.8 s after speech.

## 2. Build

Edit `src/shorts/<name>/Short.tsx` (scaffolded from `templates/short/`). Rules:

- **Anchor everything to words:** `A("spinning wheel")`, `A("workflow", 2)` for the 3rd occurrence. Phrases are case- and punctuation-insensitive. `A()` throws if a phrase isn't found, so typos fail loudly. Offsets like `A("tools") + 6` are fine.
- **Reveal headline words on their spoken frame** with `<W at={A("word")}>` (grey/dark → ink). Stack lines at contrasting sizes, mixing `heavy()` and `serif()`.
- **Motion has blur.** Use `fly()`/`flyIO()` (velocity-based blur) for entrances and exits, `Draw` for lines that draw on, and `RedCircle` for callouts. In worlds, the camera blur comes from `cameraBlur`.
- **Never leave a beat static for >1.5 s.** Something should drift, pulse, type, travel along a path, or the camera should move. If the stills review shows an empty frame during speech, fill it (a serif title of the current phrase works well, e.g. "for example,").
- **Keep important content in y 120–1150** in split layout. The caption sits at ~1205, and the speaker card plus head take y ≥ 1290.
- **One accent per scene/world.** Colours come from the theme (`useTheme()` / `THEME.accents`). Don't hard-code new palettes into a short. Extend `src/theme.ts` instead.
- **Sound:**
  - a whoosh (`whoosh.mp3`, ~0.28) 3 frames before every layout cut
  - `whoosh-fast` / `whoosh-cinematic` on camera flights
  - `pop-light` on chips and reveals (0.2–0.35)
  - `click` on marker circles
  - `typing` under typed code
  - `impact-cinematic` (trimmed with `dur`) for one big moment at most
  - music via `<Audio src=staticFile("shorts/<name>/music.mp3") volume={THEME.musicVolume}/>`
- **Hooks at the top of components**, unconditional. Everything is a pure function of `useCurrentFrame()`.
- **No live SVG filters** (feTurbulence, displacement) and no CSS `mix-blend-mode` on full-frame layers. They cause half-painted "flashing" frames. Gaussian `filter: blur()` on elements is fine.

## 3. Review loop (you can't watch video, so look at frames)

```bash
npm run typecheck
python3 scripts/review.py stills Short<Name> 40 150 300 450 600 750 900   # one frame per beat
```

Read the sheet: hierarchy, collisions with the caption/head, empty or dark frames, text too small for a phone. Fix, then:

```bash
npm run render -- Short<Name>                                   # render + QA (glitches, blank speaker, LUFS)
python3 scripts/review.py motion out/Short<Name>.mp4 2.0:1.2 7.0:1.6 12.5:1.2   # 10 fps strips around transitions
```

Look at the motion strips for: transitions that pop instead of move, dead stretches, elements arriving late versus their word, and blur that's too strong to read. Iterate. **Never hand over a render whose QA failed.** If QA flags glitch frames, re-render. If they persist, find the heavy layer (the usual cause is a full-frame filter).

## 4. Hand over

Send the MP4 (`out/Short<Name>.mp4`) with a short breakdown of beats → visuals, what you fixed during review, and 1–2 things you want the user's eyes on (pace, brightness, a judgement call). Then iterate on their notes. They usually react to the overall feel; translate that into concrete changes.

## Changing the look (user asks for new colours, fonts, style)

- **Colours, caption pill, speaker card, grade, grain, music level:** edit or extend `src/theme.ts` (add a new preset, then switch a short with `const THEME = myTheme`).
- **Fonts:** `src/lib/fonts.ts` (Google Fonts via `@remotion/google-fonts`; keep the exported names).
- **Layout geometry** (card position, head pop height, full-screen framing): `src/lib/Speaker.tsx` (`BOX`, `SPLIT_HEAD_Y`, `splitPose`, `fullPose`).
- **Caption grouping / size:** `src/lib/Captions.tsx`.
- If the user likes a new pattern, **promote it into `src/lib/`** and note it in `references/api.md`, so the next short gets it for free.
