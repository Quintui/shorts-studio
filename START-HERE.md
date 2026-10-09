# Start here

1. Put the long-form video in `input/` (exactly one file).
2. Open a new Claude Code chat in this folder.
3. Paste:

```
New video is in input/. Use the find-shorts skill: transcribe it and propose the best shorts.
After I pick, use cut-short and edit-short to make them. Style: dark worlds (examples/agent),
unless I say "light", which means the reference style (examples/streaming, reference/).
```

## Useful follow-ups

- "Make #2 and #4." / "Make the one about X, ~35 seconds."
- "Use the light reference style for this one."
- "New theme: warmer, cream background, orange accent. Save it as a preset in src/theme.ts."
- "The pipeline beat is too fast; give each node a beat longer."
- "Re-render and send me the file."
- "Promote the <thing> animation into src/lib so future shorts can use it."

## Already have a cut?

If the video in `input/` is already the short (no long-form to search), say:

```
input/ is already cut. Skip find-shorts: make it one short covering the whole clip
(clips.json = [[0, <duration>]]), then edit-short.
```
