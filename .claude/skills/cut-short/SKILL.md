---
name: cut-short
description: Lock a short's clip list with verified seams, then generate its media (cut speaker clip, -14 LUFS voice, word timings from the cut, Apple Vision person matte, head-alpha layer, shot.json, music bed). Use after a short has been chosen from work/shorts-plan.md, or when the user gives in/out times to cut.
---

# Cut a short

The cut decides whether the short feels professional. A clipped consonant or a half-heard "because" at a seam is the first thing viewers notice. **Verify every seam by audio, never by Whisper timings alone.**

## 1. Scaffold

```bash
python3 scripts/new_short.py <name> --theme dark      # or light; name = lowercase-dashes
```

This creates `src/shorts/<name>/{Short.tsx, clips.json}`, registers the composition as `Short<PascalName>`, and writes placeholder data so the project still bundles.

## 2. Find exact seams

Whisper's long-form word times drift **0.5–0.8 s around pauses**, can attach a word to silence, and silently skip false starts. For every in/out point:

```bash
python3 scripts/probe_audio.py words 291.5 300     # what Whisper thinks is there
python3 scripts/probe_audio.py env 291.6 293.4      # 20 ms loudness digits: 0 = silence, 5+ = speech
python3 scripts/probe_audio.py try 292.10 292.54 293.20 296.0   # stitch & transcribe: what a listener hears
```

How to use these:
- **In-points** go in the silent gap just before the first word (`env` shows a run of `0`s). Out-points go after the word's tail decays (the `…3210` run), and before the next breath.
- If Whisper says a word starts where `env` shows silence, believe `env`.
- Run `try` with 2–3 candidate times for any ambiguous seam, and pick the one that transcribes cleanly. In the agent short, `599.64` read as "As in most…" and `599.72` read as "In most…".
- **Inside a clip, look for long pauses (>0.5 s) and stumbles.** A gap between words in `words`, or a long word like `animator@611.30` after a pause, often hides a false start ("anima-"). `try` the region on its own: if it transcribes as something else, cut it out as its own seam.
- Cutting a filler word mid-sentence ("first, like, instant instinct" → "first instinct") is fine when `try` comes out clean.

Write the result to `src/shorts/<name>/clips.json`:

```json
{
  "clips": [
    [599.72, 602.34, "cold open: In most of the cases, you actually don't need an agent."],
    [292.10, 292.54, "The first (drops: like, instant)"]
  ],
  "music": { "offset": 1800 }
}
```

`music.offset` is the point (in seconds) in the music source to start the bed from. Vary it per short.

## 3. Generate media

```bash
python3 scripts/prep_short.py <name>
```

It prints the cut's transcript. **Read it.** It must read as clean sentences with no doubled or clipped words. If a seam is off, fix `clips.json` and re-run (`--skip-matte` skips the slow matte step while you iterate on seams, but run the full thing once at the end).

It writes to `public/shorts/<name>/`:

| file | what |
|---|---|
| `speaker.mp4` | cut clip at source resolution/fps; voice high-passed, compressed, −14 LUFS |
| `words.json` | `{duration, clips, words[]}`, re-transcribed **from the cut**, so timings line up with the edit |
| `matte.mp4` | Apple Vision person segmentation (`scripts/segment.swift`, ~1 s per 25 frames) |
| `head_alpha.webm` | VP9 + alpha crop of the head region, for the head-pops-out-of-the-card layer |
| `shot.json` | head top-centre (median), crop and size, read by `<Speaker shot={shot} …/>` |
| `music.mp3` | −20 LUFS bed from the music source (silent if none is configured) |

It also prints the head tracking spread. If the x spread is large (>150 px), the speaker moves a lot. The fixed framing still works, but check stills of the split layout for the head drifting out of the card.

## 4. Hand over to editing

Tell the user the final length and the cut transcript, then continue with the **edit-short** skill.
