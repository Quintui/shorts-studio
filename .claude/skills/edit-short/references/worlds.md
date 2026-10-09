# Dark "worlds" style: the 3D camera kit (`src/lib/world.tsx`)

The idea: the split-layout graphics area is a **window onto one continuous 3D space**. Each beat is a *world* placed somewhere in that space. A keyframed camera travels between worlds (dolly, orbit, crane, whip-pan, fly-through), and full-screen face windows hide any teleports. Everything is drawn as crisp SVG/HTML from a tiny projection engine. There's no WebGL, so it renders fast and stays sharp.

See `examples/agent/Short.tsx` for a complete short built this way (6 worlds, ~35 s).

## Coordinates

- World units ≈ px at distance `focal` (~1100 at fov 52). **y is up**, z goes into the screen. The camera usually sits at z ≈ −1100 from what it looks at.
- Give each world an **origin**, e.g. `O1 = [0,0,2600]`, `O3 = [0,0,9000]`, and build its contents relative to it (`at(O1,[x,y,z])`).
- Worlds that follow each other without a full-screen cut should be close (the camera *flies* between them). Ones separated by a full-screen window can be anywhere.
- The projection centre is (540, 620), in the middle of the graphics area above the speaker card.

## Camera

```ts
const CAM: CamKey[] = [
  { at: 0, pos: [0, 70, -1420], target: [0, 70, 0], fov: 50 },
  { at: A("agent") + 6, pos: [0, 40, -1130], target: [0, 40, 0], ease: Easing.out(Easing.quad) }, // slow push
  { at: A("the first") + 13, pos: at(O1,[0,80,-1300]), target: at(O1,[0,80,0]), ease: SNAP },   // fly through the title into world 1
  { at: FULL_2[0] + 3, pos: at(O3,[0,80,-1550]), target: at(O3,[0,150,400]), ease: () => 1 },  // teleport while the face is full-screen
  …
];
const view = new View(cameraAt(CAM, frame));     // cameraAt adds a subtle handheld drift
const blur = cameraBlur(CAM, frame);             // apply as filter: blur() on the world container
```

Each key's `ease` shapes the move *into* that key. `SNAP = bezier(.75,0,.25,1)` gives whips, and `GLIDE = bezier(.45,0,.25,1)` gives drifts. Moves that pass *through* an element (the camera's z crosses it) make it scale up past the lens with blur. That's the "fly through the title" transition.

## Drawing

| | |
|---|---|
| `<Lines view segs=[{a,b,color,w,o,dash}]/>` | many 3D segments in one SVG. Width scales with depth, and fog fades far lines |
| `<Path3 view pts progress closed glow dash/>` | polyline through 3D points that draws on with `progress` (0–1). `glow` adds a soft halo |
| `<Faces view faces cull?/>` | filled polygons, painter-sorted. `boxFaces(center, size, fill, stroke, top?)` for blocks (backface-culled) |
| `<Billboard view p o dof anchor>…html…</Billboard>` | any HTML (type, chips, cards) at a 3D point, scaled by depth and blurred off the focal plane (`dof` = strength) |
| `ring(c, r, tiltX, tiltY, n)` / `onRing(…, t)` | circles/orbits in 3D |
| `rand(i, salt)` | deterministic pseudo-random (never `Math.random()`, frames must be pure) |
| `view.point(p)` / `view.seg(a,b)` / `view.fog(z)` | raw projection, if you need it |

Use `Billboard` for type, so the headline lives *in* the world and parallaxes. A full-width headline is ~900 px at k≈1. For text that must stay rock-steady (the final payoff), use a screen-space overlay instead.

## Recipes that worked

- **Title fly-through:** title words as billboards at z=0. The camera pushes slowly, then whips forward through them into the next world.
- **Thing assembling:** a wireframe sphere of latitude/meridian `ring`s drawing on with staggered `progress`, spinning via the ring phase.
- **Burst / chaos:** N chips `lerp3` from the centre to orbit positions with a back-out ease, staggered ~1 frame each. Lines centre→chip plus random cross-links, with the camera pulling back at the same time.
- **Chaos → order:** jitter positions, shift the accent to red, then `SNAP`-lerp the chosen items onto a straight line while the rest shrink and fade. The camera swings to a 3/4 view down the line.
- **Process / timeline:** lanes as `Faces` rectangles on a plane, a live waveform as `Lines`, cue lines as dashed `Path3` arcs bulging toward the camera, and a playhead.
- **Grid floor world:** a `Lines` grid on y = const that fades into fog, with `boxFaces` rising out of it (back-out ease on the height) for steps or bars.
- **Pipeline:** cards as billboards along x with animated SVG icons inside, and the camera `SNAP`-ing from card to card on each spoken name. Ghost (dashed, 30%) cards wait before their word, so a flight never lands on an empty world. Finally, pull back to reveal a bigger graph.
- **Dust:** ~280 tiny points spread through the whole space give constant parallax for free.
- **Glow:** `Glow` billboard (a radial gradient, ~1300–2600 px) in the world's accent behind the subject.

## Gotchas

- Colours from `interpolateColors` are `rgba(...)` strings. Don't append hex alpha to them (`${c}55`). Use opacity instead.
- Keep per-frame element counts sane (a few hundred SVG nodes is fine).
- A world that's not on screen should not render (gate it with frame ranges). It saves render time and avoids stray far-away geometry.
