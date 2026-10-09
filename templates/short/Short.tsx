/**
 * Short: __NAME__
 *
 * Built by scripts/new_short.py. Media + timings come from public/shorts/__NAME__/
 * (written by scripts/prep_short.py). Read .claude/skills/edit-short/SKILL.md before editing,
 * and look at examples/ for two complete edits (light reference style + dark worlds style).
 */
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import words from "../../../public/shorts/__NAME__/words.json";
import shot from "../../../public/shorts/__NAME__/shot.json";
import { FPS, makeTimeline } from "../../lib/timing";
import { Speaker } from "../../lib/Speaker";
import { Captions, Emphasis } from "../../lib/Captions";
import { Backdrop, Sfx, W, heavy, serif } from "../../lib/kit";
import { ThemeProvider, __THEME__ } from "../../theme";

const THEME = __THEME__;
/** Speech length + a short tail to land the last beat. */
export const DURATION = Math.round((words.duration + 0.8) * 10) / 10;
const END = Math.round(DURATION * FPS);

const T = makeTimeline(words.words);
/** Frame of a spoken phrase: A("spinning wheel"), A("workflow", 2) for the 3rd occurrence. */
const A = (phrase: string, nth = 0) => T.f(T.at(phrase, nth));

/* -------------------------------------------------------------- edit plan
 * Full-screen face windows [start, end) in frames. Put layout cuts on clip
 * seams (they hide the jump cut) and on emphasis lines. Everything else is the
 * split layout: graphics on top, speaker card at the bottom.
 *   e.g. const FULL_1: [number, number] = [A("the part"), A("each step")];
 */
const FULL: [number, number][] = [];
const isFull = (f: number) => FULL.some(([a, b]) => f >= a && f < b);

/* -------------------------------------------------------------- scenes
 * One component per beat. Anchor every motion to a spoken word with A(...).
 */
const SceneOne: React.FC = () => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: 0, right: 0, top: 260, display: "flex", justifyContent: "center", gap: 24, alignItems: "baseline" }}>
      <W at={0} style={serif(120)}>replace</W>
      <W at={8} style={heavy(170)}>me</W>
    </div>
  </AbsoluteFill>
);

export const ShortTemplate: React.FC = () => {
  const frame = useCurrentFrame();
  const full = isFull(frame);
  return (
    <ThemeProvider value={THEME}>
      <AbsoluteFill style={{ background: "#000" }}>
        {!full && <Backdrop />}
        {!full && <SceneOne />}

        <Speaker shot={shot} fps={FPS} full={FULL} />
        <Captions words={words.words} isFull={isFull} />
        {/* <Emphasis from={A("wrong shape")} to={FULL_1[1]} lines={["WRONG", "SHAPE"]} /> */}

        <Audio src={staticFile("shorts/__NAME__/music.mp3")} volume={THEME.musicVolume} />
        {/* <Sfx src="whoosh.mp3" at={A("…") - 3} volume={0.3} /> */}
      </AbsoluteFill>
    </ThemeProvider>
  );
};

// Keep linters quiet until these are used.
void Emphasis;
void Sfx;
void A;
void END;
