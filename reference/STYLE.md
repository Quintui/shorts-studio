# Reference style breakdown

`reference.mp4` is the short this whole template imitates: an 83 s, 720×1280 talking-head short with graphics-heavy editing in the style of Kallaway's marketing shorts. **Study the frame sheets in `frames/` before designing an edit.** They show far more than prose can. `reference-transcript.json` has its word timings, so you can line motion up against speech.

The "light" theme (`src/theme.ts → light`) and `examples/streaming` copy this look directly. The "dark" worlds style keeps its grammar (layouts, type, reveals, captions) and swaps the palette and the motion density.

## Two layouts, hard cuts between them

**Split** (about 70% of runtime):
- Graphics fill the top ~68% of the frame on a backdrop:
  - **grey grid paper:** `#e5e5e4` with a 22 px hairline grid, soft white radial light, film grain.
  - **cream grid:** `#f4f2ec` with a 90 px grid and `+` marks every 180 px, used for product/UI scenes.
- The speaker sits in a rounded card at the bottom (x 72–1008, top y 1410, radius 30, runs off the bottom edge), chest-up.
- **The head is cut out and pokes ~120 px above the card's top edge**, in front of the graphics. This one detail sells the whole look.

**Full-screen face** (about 30%):
- A hard cut to a punched-in face (~2× crop), slowly pushing in.
- Used for emotional/contrarian lines and to hide jump cuts.
- Captions turn into white text over the chest.
- Key phrases become **big white ALL-CAPS titles** ("CONTRARIAN PERSPECTIVES", "CONTENT SYSTEM", "6 topics"), which replace the caption while on screen.

Every layout change gets a tiny 4–5 frame scale punch plus a whoosh.

## Captions

- One word at a time, or a function word glued to the next ("the page.", "six of", "come up").
- Centred at y ≈ 1205 (62% down), heavy sans ~58 px.
- **Split:** a grey pill (`rgba(122,122,122,0.82)`, radius 14) with white text.
- **Full:** plain white with a soft shadow.
- Captions appear instantly, with only a 3-frame 0.9→1 pop. No karaoke colouring.

## Typography

- **Heavy grotesk** (Inter Tight 900, tracking −0.055em, line-height 0.88): headlines, numbers.
- **Italic serif** (Instrument Serif): the soft accent words, set *next to* heavy words at a different size: "it shows you the / **best performing** / videos in your niche", "*your* / **competitors** / *have already had* / **success**".
- Lines are stacked at **wildly different sizes**: "Here's how to / **PLAN** / your next", "**30** days of / content".
- **Word reveal:** each word appears *as it is spoken*. It blurs in (~7 frames, translateY 16 px), starts light grey, and settles to ink over ~10 frames. A line therefore builds word by word, with the newest word grey.

## Graphic vocabulary

- **Black label chips** with white bold text, revealed by a left-to-right wipe ("brushing", "flossing").
- **Outlined node boxes** (4 px ink border, radius 10) that fade grey→ink ("Niche", "dentistry").
- **Hand-drawn connector lines**: thin black curves that draw on, tree/diagram style.
- **Red marker loops** around the thing being talked about, drawn in ~13 frames and overshooting their start.
- **Chapter arc:** a huge black arc sweeps in from the left with a dot on it, and a **gradient italic numeral** ("1", "2") slides along it with motion blur, followed by the chapter title ("Find **Winning Topics**").
- **Countdowns / numbers** pop grey→black ("3 · 2 · 1 · GO").
- **Phone mockups** of the product, thumbnail grids flying in with heavy motion blur, calendars whose numbers scatter into place.

## Motion

- **Everything moves with motion blur.** Elements whip in and out with 3D rotation (rotateX/rotate), scale and big Gaussian blur proportional to speed. Nothing slides in cleanly.
- Exits: a fast fly-up with rotateX ~55°, blur, fade, over ~8 frames.
- Transitions between graphics usually happen *inside* the split layout. The speaker card never moves.
- Pace: a new visual idea every 1.5–3 s, each one anchored to the exact spoken word.

## Sound

- **Music bed:** about −27 to −30 dB in the speech gaps (voice at −14 LUFS integrated).
- **Whooshes** on every layout cut and whip. **Light pops** on chips and number reveals. **Clicks** on marker circles. **Typing** under code.

## End

The video dims to a dark overlay with the creator's Instagram logo and handle for ~3 s. Our shorts skip this unless the user gives a handle/CTA.

## The dark "worlds" variant (examples/agent)

The user's direction for shorts after the first one:
- **Palette:** Vercel-style black (`#000` with a soft `#0e0e10` top light), hairline borders, white type, **one glowing accent per world** (violet/red/cyan/green/blue).
- **Motion:** every beat is its own 3D *world* the camera travels through (dolly, orbit, crane, fly-through, whip-pans), built from crisp SVG line art (`src/lib/world.tsx`), not cards popping on a flat page.

Same type system, same captions/emphasis grammar, same speaker card with the head cut-out.
