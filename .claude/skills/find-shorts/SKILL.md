---
name: find-shorts
description: Transcribe a long-form talking-head video with Whisper and propose ranked vertical-short candidates with exact source cut points. Use when the user drops a video into input/ (or points at one) and asks for shorts, clips, highlights, or "what can we cut from this".
---

# Find shorts

Goal: a ranked list of shorts the user can say yes/no to, each with **exact in/out points** and a reason it will work, saved to `work/shorts-plan.md`.

## 1. Transcribe (skip if `work/transcript.json` exists for this video)

```bash
python3 scripts/transcribe.py              # the single video in input/
python3 scripts/transcribe.py path/to.mov  # or a specific file
```

Large-v3-turbo on an M-series Mac runs at about 3–4 min per 10 min of video. Run it in the background and look at the footage meanwhile:

```bash
ffmpeg -i <video> -vf "fps=1/20,scale=480:-1,tile=6x6" -frames:v 1 work/contact.jpg
```

Note whether it's a single talking-head shot (the template assumes landscape talking head and builds the 9:16 frame itself), where the speaker sits, and whether there are screen recordings you could use as B-roll.

Then read `work/transcript.md` end to end. Read the whole thing, not just a skim, because good shorts hide in asides.

## 2. What makes a good short here

The best candidates:
- **Stand alone.** No "as I showed earlier", no dangling "this" or "that app" without a visual to carry it.
- **Open on a hook in the first 2 s:** a claim, a number, a contrarian take, a question, or a problem the viewer has ("most results take a while"). A strong line from later can be a **cold open**, with the build-up after it.
- **Have one idea and a payoff.** The last line should land (a takeaway, a reveal, a number).
- **Run 25–45 s** (max ~60).
- **Can be visualised.** Mechanisms, comparisons, numbers, before/after, lists and processes give the edit something to build. Pure opinion with nothing to draw makes a weaker short.

Rank by hook strength × standalone-ness × visual potential. Flag shorts that need B-roll the user may not have (screen recordings of their product).

**Stitching is allowed and often better.** Pull a cold open from one place, the body from another, and the payoff from the takeaways section. Trim stumbles, false starts, "like/I don't know" filler and redundant sentences. Check that the stitched text reads naturally.

## 3. Write `work/shorts-plan.md`

For each candidate:
- **Title.** The hook as a line of text.
- **Length.**
- **Why it works.** One line.
- **A table of segments:** `In → Out` (mm:ss.ss of the source) plus the exact words.
- **Notes:** what to trim, what visual the beat wants, and any B-roll needed.
- **A visual idea per beat.** A sentence or two, so the user can picture the edit.

The `In → Out` points in the plan are *proposals* from Whisper timings. Say so. They get verified in `cut-short`.

## 4. Hand over

Summarise the top picks in chat (title, length, one-line why), link `work/shorts-plan.md`, and ask:
- which short(s) to make first
- light reference style or dark worlds style (see `reference/STYLE.md` and `examples/`)
- whether they have B-roll for the ones that need it

Then continue with the **cut-short** skill.
