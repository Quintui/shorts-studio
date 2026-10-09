# Kit reference

Everything here is imported from `src/lib/*` and `src/theme.ts`. Frames are 1080×1920 @ 30 fps. Coordinates are in px of that frame.

## Timing (`lib/timing.ts`)

```ts
const T = makeTimeline(words.words);       // from public/shorts/<name>/words.json
const A = (p: string, nth = 0) => T.f(T.at(p, nth));   // frame where the phrase starts
T.end("phrase")                            // seconds where the phrase ends
FPS                                        // 30
```

## Theme (`theme.ts`)

`light` (reference look) and `dark` (worlds look). Wrap the short in `<ThemeProvider value={THEME}>` and read it with `useTheme()`:
- `ink`, `muted`, `revealFrom`, `hairline`, `marker`
- `accents.{violet, red, cyan, green, blue, amber}`
- `chip`, `node`, `caption.{pill, full, y}`, `card`, `grade`, `grain`, `musicVolume`

## Layout pieces

| | |
|---|---|
| `<Backdrop variant?/>` | split-layout background from the theme: `GreyGrid`, `CreamGrid` or `BlackStage` (render it only when `!isFull(frame)`) |
| `<Speaker shot fps full=[[a,b],…]/>` | speaker card + head cut-out in split mode, punched-in face in the `full` windows, a 5-frame punch on each cut, and a freeze after the clip ends. `shot` comes from `public/shorts/<name>/shot.json` |
| `<Captions words isFull hidden=[[a,b]]/>` | one word / glued phrase at a time: theme pill in split, white text in full. `hidden` = windows where an Emphasis replaces it |
| `<Emphasis from to lines={["WRONG","SHAPE"]}/>` | big white ALL-CAPS title over the face (full windows only) |
| `<Grain opacity/>` | static grain overlay (`public/grain.png`) |

## Type

| | |
|---|---|
| `heavy(size, extra?)` | style object: Inter Tight 900, −0.055em, lh 0.88 |
| `serif(size, extra?)` | style object: Instrument Serif italic |
| `<W at={frame} style ink? from?>word</W>` | word reveal: blur + rise + colour settles `from → ink` (theme defaults). Use one per spoken word so lines build as they're said |
| `SANS`, `SERIF`, `MONO` | font families (`lib/fonts.ts`) |

## Graphics (`lib/kit.tsx`)

| | |
|---|---|
| `<Chip at size mono?>text</Chip>` | label chip with a left→right wipe |
| `<NodeBox at size>text</NodeBox>` | outlined box, border/text settle grey→ink with a spring |
| `<svg><Draw d from dur stroke width/></svg>` | path that draws itself on (connectors, arrows, underlines) |
| `<RedCircle cx cy rx ry from dur rot width color?/>` | hand-drawn marker loop (theme `marker` colour) |
| `<Spinner size stroke color speed/>` | loading ring |
| `fly(frame, start, dur, fromPose, toPose, ease?)` | style object. Pose = `{x,y,s,r,rx,ry,o}`; blur derived from on-screen velocity |
| `flyIO(frame, [inStart,dur,fromPose] \| null, [outStart,dur,toPose] \| null, rest?)` | enter → rest → exit in one call |
| `<Sfx src="whoosh.mp3" at={frame} volume dur?/>` | sound effect from `public/sfx/` |
| `clamp` | `{extrapolateLeft/Right: "clamp"}` for `interpolate` |

Typical exit: `flyIO(frame, null, [out, 8, { y: -300, rx: 60, r: -5, s: 0.9, o: 0 }])`.
Typical card entrance: `fly(frame, t, 12, { y: 520, r: 9, rx: -35, s: 0.75, o: 0 }, {})`.

## SFX names (`public/sfx/`, filled by `scripts/setup_assets.py`)

`whoosh`, `whoosh-fast`, `whoosh-air`, `whoosh-cinematic`, `laser-swoosh`, `pop`, `pop-light`, `click`, `typing`, `impact-cinematic`, `riser-short`, `sparkle-whoosh` (all `.mp3`). Add more via `assets.config.json`.

## 3D worlds (`lib/world.tsx`)

See `worlds.md`.
