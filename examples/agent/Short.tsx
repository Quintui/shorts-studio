import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, interpolateColors, staticFile, useCurrentFrame } from "remotion";
import data from "../../../public/shorts/agent/words.json";
import shot from "../../../public/shorts/agent/shot.json";
import { ThemeProvider, dark } from "../../theme";
import { MONO, SANS } from "../../lib/fonts";
import { FPS, makeTimeline } from "../../lib/timing";
import { Speaker } from "../../lib/Speaker";
import { Captions, Emphasis } from "../../lib/Captions";
import { BlackStage, Grain, Sfx, W, clamp, heavy, serif } from "../../lib/kit";
import {
  Billboard,
  CamKey,
  Faces,
  Face,
  Lines,
  Path3,
  Seg3,
  V3,
  View,
  add,
  boxFaces,
  cameraAt,
  cameraBlur,
  clamp01,
  lerp3,
  onRing,
  rand,
  ring,
} from "../../lib/world";

export const DURATION = Math.round((data.duration + 1.0) * 10) / 10;

const T = makeTimeline(data.words);
const A = (phrase: string, nth = 0) => T.f(T.at(phrase, nth));
const END = Math.round(DURATION * FPS);

/* ------------------------------------------------------------------ palette */

const INK = "#ededed";
const MUTED = "#8f8f8f";
const DIM = "#3a3a3a";
const HAIR = "rgba(255,255,255,0.14)";
const VIOLET = "#8b5cf6";
const RED = "#ff4d4d";
const CYAN = "#22d3ee";
const GREEN = "#4ade80";
const BLUE = "#3b82f6";

/** White type that blurs in dark-grey and settles to ink. */
const Wd: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = (p) => (
  <W {...p} from={DIM} ink={INK} />
);

/* ------------------------------------------------------------------ edit plan */

const FULL_1: [number, number] = [A("but in my opinion"), A("because we already")];
const FULL_2: [number, number] = [A("so that's why"), A("you just need a workflow because")];
const isFull = (f: number) => [FULL_1, FULL_2].some(([a, b]) => f >= a && f < b);

const O1: V3 = [0, 0, 2600];
const O3: V3 = [0, 0, 9000];
const O4: V3 = [0, 420, 11200];
const at = (o: V3, d: V3) => add(o, d);

const SNAP = Easing.bezier(0.75, 0, 0.25, 1);
const GLIDE = Easing.bezier(0.45, 0, 0.25, 1);

const CAM: CamKey[] = [
  { at: 0, pos: [0, 70, -1420], target: [0, 70, 0], fov: 50 },
  { at: A("agent") + 6, pos: [0, 40, -1130], target: [0, 40, 0], fov: 50, ease: Easing.out(Easing.quad) },
  { at: A("the first") + 13, pos: at(O1, [0, 80, -1300]), target: at(O1, [0, 80, 0]), fov: 52, ease: SNAP },
  { at: A("build") - 2, pos: at(O1, [90, 50, -1120]), target: at(O1, [0, 40, 0]), ease: GLIDE },
  { at: A("with a lot"), pos: at(O1, [190, 80, -1040]), target: at(O1, [0, 20, 0]) },
  { at: A("tools") + 18, pos: at(O1, [440, 220, -1600]), target: at(O1, [0, -10, 0]), ease: Easing.bezier(0.3, 0, 0.2, 1) },
  { at: A("because we already"), pos: at(O1, [520, 240, -1660]), target: at(O1, [0, -10, 0]) },
  { at: A("all the steps") + 8, pos: at(O1, [-840, 280, -760]), target: at(O1, [240, -10, 140]), ease: SNAP },
  { at: A("narration") - 2, pos: at(O1, [-560, 170, -1020]), target: at(O1, [-220, 40, 0]), ease: GLIDE },
  { at: A("animation") + 6, pos: at(O1, [120, 70, -1020]), target: at(O1, [300, 0, 0]), ease: GLIDE },
  { at: A("small things") + 18, pos: at(O1, [0, 420, -2350]), target: at(O1, [0, -40, 0]), ease: Easing.bezier(0.3, 0, 0.2, 1) },
  { at: FULL_2[0] + 2, pos: at(O1, [0, 430, -2420]), target: at(O1, [0, -40, 0]) },
  { at: FULL_2[0] + 3, pos: at(O3, [0, 80, -1550]), target: at(O3, [0, 150, 400]), ease: () => 1 },
  { at: FULL_2[1], pos: at(O3, [0, 60, -1380]), target: at(O3, [0, 140, 400]) },
  { at: A("predefined"), pos: at(O3, [-170, 40, -1040]), target: at(O3, [0, 90, 600]), ease: GLIDE },
  { at: A("build", 1) + 8, pos: at(O3, [-480, 560, -380]), target: at(O3, [60, 320, 1300]), ease: GLIDE },
  { at: A("planner") - 4, pos: at(O4, [-780, 40, -960]), target: at(O4, [-780, 0, 0]), ease: SNAP },
  { at: A("voice generator") + 2, pos: at(O4, [-260, 30, -930]), target: at(O4, [-260, 0, 0]), ease: SNAP },
  { at: A("animator") + 2, pos: at(O4, [260, 20, -930]), target: at(O4, [260, 0, 0]), ease: SNAP },
  { at: A("narrator") + 4, pos: at(O4, [780, 10, -960]), target: at(O4, [780, 0, 0]), ease: SNAP },
  { at: A("all this stuff") + 24, pos: at(O4, [160, 640, -3300]), target: at(O4, [0, -40, 0]), ease: Easing.bezier(0.3, 0, 0.2, 1) },
  { at: END, pos: at(O4, [0, 520, -3560]), target: at(O4, [0, 40, 0]), ease: Easing.out(Easing.quad) },
];

/* ------------------------------------------------------------------ shared bits */

const Glow: React.FC<{ view: View; p: V3; color: string; size?: number; o?: number }> = ({ view, p, color, size = 900, o = 1 }) => (
  <Billboard view={view} p={p} o={o} dof={0}>
    <div style={{ width: size, height: size, borderRadius: "50%", opacity: 0.38, background: `radial-gradient(circle, ${color} 0%, transparent 62%)` }} />
  </Billboard>
);

const Dust: React.FC<{ view: View; frame: number }> = ({ view, frame }) => (
  <svg width={1080} height={1920} style={{ position: "absolute" }}>
    {Array.from({ length: 280 }, (_, i) => {
      const p: V3 = [(rand(i, 1) - 0.5) * 5200, (rand(i, 2) - 0.5) * 3400, -1600 + rand(i, 3) * 15500];
      const s = view.point(p);
      if (!s.vis) return null;
      const o = 0.5 * view.fog(s.z, 3600, 2400) * (0.35 + 0.65 * rand(i, 4)) * (0.75 + 0.25 * Math.sin(frame / 9 + i));
      if (o < 0.02) return null;
      return <circle key={i} cx={s.x} cy={s.y} r={Math.max(0.6, 2.4 * s.k)} fill="#fff" opacity={o} />;
    })}
  </svg>
);

const chipStyle = (accent: string, o = 1): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontFamily: MONO,
  fontWeight: 500,
  fontSize: 28,
  color: "#d4d4d4",
  background: "#0a0a0a",
  border: `1.5px solid ${HAIR}`,
  borderRadius: 8,
  padding: "8px 14px",
  opacity: o,
  boxShadow: `0 0 26px -10px ${accent}`,
});

const Dot: React.FC<{ color: string; size?: number }> = ({ color, size = 10 }) => (
  <span style={{ width: size, height: size, borderRadius: 99, background: color, boxShadow: `0 0 12px ${color}`, display: "inline-block" }} />
);

/* ------------------------------------------------------------------ W0 · title */

const strikePts: V3[] = Array.from({ length: 30 }, (_, i) => {
  const t = i / 29;
  return [-300 + t * 790, -18 + Math.sin(t * 7) * 5 + t * 14, -2];
});

const World0: React.FC<{ view: View; frame: number }> = ({ view, frame }) => {
  const grid: Seg3[] = [];
  for (let x = -1500; x <= 1500; x += 150) grid.push({ a: [x, -1100, 500], b: [x, 1100, 500], w: 1.2, o: 0.07 });
  for (let y = -1050; y <= 1050; y += 150) grid.push({ a: [-1500, y, 500], b: [1500, y, 500], w: 1.2, o: 0.07 });
  const strike = interpolate(frame, [A("agent") + 7, A("agent") + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <>
      <Lines view={view} segs={grid} />
      <Glow view={view} p={[0, 0, 700]} color="#ffffff" size={1400} o={0.25} />
      <Billboard view={view} p={[0, 330, 0]}>
        <div style={{ display: "flex", gap: 22, alignItems: "baseline" }}>
          <Wd at={A("in most")} style={serif(96)}>In</Wd>
          <Wd at={A("most")} style={serif(96)}>most</Wd>
          <Wd at={A("of the cases")} style={serif(96)}>of the</Wd>
          <Wd at={A("cases")} style={serif(96)}>cases,</Wd>
        </div>
      </Billboard>
      <Billboard view={view} p={[0, 190, 0]}>
        <div style={{ display: "flex", gap: 22, alignItems: "baseline" }}>
          <Wd at={A("you actually")} style={heavy(98)}>you</Wd>
          <Wd at={A("actually")} style={heavy(98)}>actually</Wd>
          <Wd at={A("don't")} style={heavy(98)}>don't</Wd>
          <Wd at={A("need an")} style={heavy(98)}>need</Wd>
        </div>
      </Billboard>
      <Billboard view={view} p={[0, -20, 0]}>
        <div style={{ display: "flex", gap: 26, alignItems: "baseline" }}>
          <Wd at={A("an agent")} style={serif(176)}>an</Wd>
          <Wd at={A("agent")} style={heavy(250)}>agent.</Wd>
        </div>
      </Billboard>
      <Path3 view={view} pts={strikePts} color={RED} w={9} progress={strike} glow />
    </>
  );
};

/* ------------------------------------------------------------------ W1 · one big agent */

const TOOLS = [
  "web_search", "tts", "render", "db.query", "fs.write", "browser", "gsap", "ffmpeg",
  "email", "vision", "code_exec", "http", "memory", "rag", "calendar", "slack",
  "s3.put", "scrape", "pdf", "image_gen", "retry", "eval", "notes", "quiz",
];
const RINGS = [
  { r: 320, tx: 72, ty: 14, sp: 0.011 },
  { r: 430, tx: 78, ty: -30, sp: -0.008 },
  { r: 540, tx: 63, ty: 40, sp: 0.006 },
];
const STEP_OF = [0, 4, 8, 12, 16, 20, 2, 6]; // tool index -> becomes step i
const STEPS = ["plan", "script", "narrate", "timestamps", "animate", "render", "notes", "quiz"];
const linePos = (i: number): V3 => at(O1, [-840 + i * 240, 0, 0]);
const orbit = (i: number, frame: number): V3 => {
  const R = RINGS[i % 3];
  const t = (Math.floor(i / 3) / 8) * Math.PI * 2 + (i % 3) * 0.7 + frame * R.sp;
  return onRing(O1, R.r, R.tx, R.ty, t);
};
const backOut = Easing.bezier(0.34, 1.56, 0.64, 1);

const World1: React.FC<{ view: View; frame: number }> = ({ view, frame }) => {
  const build = A("build");
  const burst = A("with a lot");
  const snapAt = A("already");
  const W2 = A("and we");

  const accent =
    frame < snapAt + 8
      ? interpolateColors(frame, [FULL_1[0], FULL_1[1] - 8], [VIOLET, RED])
      : interpolateColors(frame, [snapAt + 8, snapAt + 20], [RED, "#ffffff"]);
  const jitter = frame >= FULL_1[0] && frame < snapAt + 4 ? 9 : 0;

  // core sphere
  const coreIn = (i: number) => interpolate(frame, [build + i * 2, build + i * 2 + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const big = interpolate(frame, [A("big"), A("big") + 10], [1, 1.32], { ...clamp, easing: backOut });
  const coreOut = interpolate(frame, [snapAt, snapAt + 14], [1, 0], clamp);
  const R = 150 * big * (0.4 + 0.6 * coreOut);
  const spin = frame * 0.6;
  const lats = [-60, -30, 0, 30, 60].map((lat) => ring(at(O1, [0, R * Math.sin((lat * Math.PI) / 180), 0]), R * Math.cos((lat * Math.PI) / 180), 0, 0, 64));
  const mers = [0, 30, 60, 90, 120, 150].map((ph) => ring(O1, R, 90, ph + spin, 64));

  const titleOut = interpolate(frame, [build - 4, build + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const ringP = interpolate(frame, [burst - 2, burst + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) * coreOut;
  const fadeToW2 = interpolate(frame, [W2, W2 + 14], [1, 0], clamp);

  const toolPos = (i: number): { p: V3; o: number; isStep: boolean; s: number } => {
    const tb = burst + i * 0.9;
    const bp = backOut(clamp01((frame - tb) / 12));
    let p = lerp3(O1, orbit(i, frame), bp);
    if (jitter) p = add(p, [(rand(i + frame, 1) - 0.5) * jitter, (rand(i + frame, 2) - 0.5) * jitter, 0]);
    const step = STEP_OF.indexOf(i);
    if (step >= 0) {
      const sp = SNAP(clamp01((frame - (snapAt + step * 1.5)) / 16));
      return { p: lerp3(p, linePos(step), sp), o: frame < tb ? 0 : 1, isStep: true, s: 1 };
    }
    const out = clamp01((frame - (snapAt + (i % 6))) / 10);
    return { p: lerp3(p, O1, out * 0.6), o: frame < tb ? 0 : 1 - out, isStep: false, s: 1 - out * 0.5 };
  };
  const tools = TOOLS.map((_, i) => toolPos(i));

  const links: Seg3[] = [];
  tools.forEach((t, i) => {
    if (t.o > 0 && frame < snapAt + 10) links.push({ a: O1, b: t.p, color: accent, w: 1.4, o: 0.38 * t.o * coreOut });
  });
  if (frame >= A("tools")) {
    const k = interpolate(frame, [A("tools"), A("tools") + 8], [0, 1], clamp) * coreOut;
    for (let i = 0; i < 16; i++) {
      const j = (i * 7 + 5) % 24;
      links.push({ a: tools[i].p, b: tools[j].p, color: accent, w: 1, o: 0.16 * k });
    }
  }
  // the clean line the tangle collapses into
  const lineP = interpolate(frame, [snapAt + 6, A("all the steps") + 6], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

  return (
    <>
      <Glow view={view} p={at(O1, [0, 0, 120])} color={accent} size={1300} o={0.55 * Math.max(coreIn(0), 0.25) * fadeToW2} />

      {/* "the first instinct" */}
      <Billboard view={view} p={at(O1, [0, 360 + titleOut * 160, 0])} o={1 - titleOut}>
        <div style={{ display: "flex", gap: 24, alignItems: "baseline" }}>
          <Wd at={A("the first")} style={serif(120)}>the first</Wd>
          <Wd at={A("instinct")} style={heavy(176)}>instinct</Wd>
        </div>
      </Billboard>
      {frame < build + 4 && frame >= A("instinct") && (
        <Billboard view={view} p={O1}>
          <div style={{ width: 26, height: 26, borderRadius: 99, background: "#fff", boxShadow: `0 0 ${30 + 20 * Math.sin(frame / 4)}px ${VIOLET}, 0 0 80px ${VIOLET}` }} />
        </Billboard>
      )}

      {/* core */}
      {lats.map((pts, i) => (
        <Path3 key={`la${i}`} view={view} pts={pts} closed color={accent} w={1.6} o={0.8 * coreOut} progress={coreIn(i)} />
      ))}
      {mers.map((pts, i) => (
        <Path3 key={`me${i}`} view={view} pts={pts} closed color="#ffffff" w={1.2} o={0.45 * coreOut} progress={coreIn(i + 2)} />
      ))}

      {/* orbits + links */}
      {RINGS.map((r, i) => (
        <Path3 key={`r${i}`} view={view} pts={ring(O1, r.r, r.tx, r.ty, 128)} closed color="#ffffff" w={1.2} o={0.16} progress={ringP} dash="6 10" />
      ))}
      <Lines view={view} segs={links} />
      <Path3 view={view} pts={[linePos(0), linePos(7)]} color="#ffffff" w={2.4} o={0.85 * fadeToW2} progress={lineP} glow />

      {/* "one big agent" */}
      <Billboard view={view} p={at(O1, [0, -330, 0])} o={coreOut}>
        <div style={{ display: "flex", gap: 22, alignItems: "baseline" }}>
          <Wd at={A("one big agent")} style={heavy(110)}>one</Wd>
          <Wd at={A("big")} style={heavy(150)}>big</Wd>
          <Wd at={A("agent", 1)} style={heavy(110)}>agent</Wd>
        </div>
      </Billboard>

      {/* tools → steps */}
      {tools.map((t, i) => {
        if (t.o <= 0.01) return null;
        const step = STEP_OF.indexOf(i);
        const asStep = step >= 0 ? clamp01((frame - (snapAt + 8 + step * 1.5)) / 6) : 0;
        const o = t.o * (t.isStep ? fadeToW2 : 1);
        return (
          <Billboard key={i} view={view} p={t.p} o={o} dof={0.7}>
            <div style={{ position: "relative", transform: `scale(${t.s})` }}>
              <div style={{ ...chipStyle(accent), opacity: 1 - asStep }}>
                <Dot color={accent} size={9} />
                {TOOLS[i]}
              </div>
              {step >= 0 && asStep > 0 && (
                <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", textAlign: "center", opacity: asStep }}>
                  <div style={{ fontFamily: MONO, fontSize: 22, color: MUTED, marginBottom: 8 }}>{String(step + 1).padStart(2, "0")}</div>
                  <div style={{ ...chipStyle("#ffffff"), border: "1.5px solid rgba(255,255,255,0.5)", color: "#fff" }}>{STEPS[step]}</div>
                </div>
              )}
            </div>
          </Billboard>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------------ W2 · narration before animation */

const rect = (x1: number, y1: number, x2: number, y2: number, z: number): V3[] => [
  at(O1, [x1, y1, z]),
  at(O1, [x1, y2, z]),
  at(O1, [x2, y2, z]),
  at(O1, [x2, y1, z]),
];
const CUES = [
  { from: -610, to: 130 },
  { from: -390, to: 330 },
  { from: -170, to: 560 },
];
const MINI = [
  { a: "plan", b: "script", y: -330 },
  { a: "assets", b: "render", y: -470 },
  { a: "voice", b: "captions", y: 400 },
  { a: "render", b: "notes", y: 540 },
];

const World2: React.FC<{ view: View; frame: number }> = ({ view, frame }) => {
  const s = A("and we");
  const nar = A("narration");
  const bef = A("before");
  const ani = A("animation");
  const small = A("small things");
  const lanes = interpolate(frame, [s, s + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const narGrow = interpolate(frame, [nar, nar + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const aniGrow = interpolate(frame, [ani, ani + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  const faces: Face[] = [
    { pts: rect(-900, 72, -900 + 1800 * lanes, 168, 4), fill: "#0d0d0d", stroke: "rgba(255,255,255,0.28)", w: 1.4 },
    { pts: rect(-900, -108, -900 + 1800 * lanes, -12, 4), fill: "#0d0d0d", stroke: "rgba(255,255,255,0.28)", w: 1.4 },
  ];
  if (narGrow > 0) faces.push({ pts: rect(-770, 80, -770 + 700 * narGrow, 160, 2), fill: `${CYAN}22`, stroke: CYAN, w: 2 });
  if (aniGrow > 0) faces.push({ pts: rect(40, -100, 40 + 780 * aniGrow, -20, 2), fill: "rgba(255,255,255,0.06)", stroke: "#ffffff", w: 2 });

  // live waveform inside the narration clip
  const wave: Seg3[] = [];
  for (let x = -760; x < -770 + 700 * narGrow - 8; x += 13) {
    const env = 0.35 + 0.65 * Math.abs(Math.sin(x / 70));
    const h = 8 + 30 * env * (0.55 + 0.45 * Math.sin(frame / 2.3 + x * 0.21));
    wave.push({ a: at(O1, [x, 120 - h, 0]), b: at(O1, [x, 120 + h, 0]), color: CYAN, w: 3, o: 0.9 });
  }
  const playX = frame < bef ? interpolate(frame, [nar, bef], [-770, -70], clamp) : interpolate(frame, [ani, small], [40, 820], clamp);
  const playY = frame < bef ? 120 : -60;
  const showPlay = (frame >= nar && frame < bef + 4) || frame >= ani;

  const cueSegs = (i: number) => {
    const t = interpolate(frame, [ani + 4 + i * 3, ani + 18 + i * 3], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    const c = CUES[i];
    const pts: V3[] = Array.from({ length: 24 }, (_, k) => {
      const u = k / 23;
      return at(O1, [c.from + (c.to - c.from) * u, 120 - 180 * u + Math.sin(u * Math.PI) * 40, -6 - Math.sin(u * Math.PI) * 60]);
    });
    return { pts, t };
  };

  const arrow: V3[] = Array.from({ length: 30 }, (_, k) => {
    const u = k / 29;
    return at(O1, [-60 + 120 * u, 120 - 180 * u + Math.sin(u * Math.PI) * 70, -20 - Math.sin(u * Math.PI) * 140]);
  });
  const arrowP = interpolate(frame, [bef - 2, bef + 10], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

  return (
    <>
      <Glow view={view} p={at(O1, [-300, 60, 200])} color={CYAN} size={1500} o={0.45 * lanes} />
      <Faces view={view} faces={faces} cull={false} />
      <Lines view={view} segs={wave} />
      <Billboard view={view} p={at(O1, [-900, 205, 0])} anchor="left" o={lanes}>
        <div style={{ fontFamily: MONO, fontSize: 26, color: MUTED, letterSpacing: "0.08em" }}>01 · NARRATION</div>
      </Billboard>
      <Billboard view={view} p={at(O1, [-900, -150, 0])} anchor="left" o={lanes}>
        <div style={{ fontFamily: MONO, fontSize: 26, color: MUTED, letterSpacing: "0.08em" }}>02 · ANIMATION</div>
      </Billboard>

      {CUES.map((c, i) => {
        const { pts, t } = cueSegs(i);
        const on = frame >= nar + 6 + i * 4;
        return (
          <React.Fragment key={i}>
            {on && (
              <Billboard view={view} p={at(O1, [c.from, 172, 0])} dof={0.5}>
                <div style={{ width: 16, height: 16, background: CYAN, transform: "rotate(45deg)", boxShadow: `0 0 16px ${CYAN}` }} />
              </Billboard>
            )}
            <Path3 view={view} pts={pts} color={CYAN} w={1.6} o={0.75} progress={t} dash="5 7" />
            {t >= 1 && (
              <Billboard view={view} p={at(O1, [c.to, -60, 0])} dof={0.5}>
                <div style={{ width: 22, height: 22, background: "#fff", transform: "rotate(45deg)", boxShadow: "0 0 18px #fff" }} />
              </Billboard>
            )}
          </React.Fragment>
        );
      })}

      <Billboard view={view} p={at(O1, [-260, 330, -60])} o={interpolate(frame, [bef - 8, bef], [1, 0], clamp)}>
        <div style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
          <Wd at={A("for example")} style={serif(130)}>for example,</Wd>
        </div>
      </Billboard>
      <Path3 view={view} pts={arrow} color="#fff" w={2.4} progress={arrowP} glow />
      <Billboard view={view} p={at(O1, [0, 300, -120])}>
        <Wd at={bef} style={serif(150)}>before</Wd>
      </Billboard>

      {showPlay && (
        <Path3 view={view} pts={[at(O1, [playX, playY - 70, -1]), at(O1, [playX, playY + 70, -1])]} color={frame < bef ? CYAN : "#fff"} w={3} glow />
      )}

      {MINI.map((m, i) => {
        const t0 = small + i * 3;
        const p = interpolate(frame, [t0, t0 + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        if (p <= 0) return null;
        const y = m.y;
        return (
          <React.Fragment key={i}>
            <Path3 view={view} pts={[at(O1, [-150, y, 0]), at(O1, [130, y, 0])]} color="#fff" w={1.4} o={0.5 * p} progress={p} />
            <Billboard view={view} p={at(O1, [-260, y, 0])} o={p}>
              <div style={chipStyle("#fff")}>{m.a}</div>
            </Billboard>
            <Billboard view={view} p={at(O1, [250, y, 0])} o={p}>
              <div style={chipStyle("#fff")}>{m.b}</div>
            </Billboard>
          </React.Fragment>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------------ W3 · predefined steps */

const FLOOR = -260;
const stair = (i: number) => ({ c: at(O3, [-330 + i * 220, 0, 500 + i * 260]), h: 120 * (i + 1) });

const World3: React.FC<{ view: View; frame: number }> = ({ view, frame }) => {
  const pre = A("predefined");
  const bld = A("build", 1);
  const grid: Seg3[] = [];
  for (let x = -2400; x <= 2400; x += 160) grid.push({ a: at(O3, [x, FLOOR, -1400]), b: at(O3, [x, FLOOR, 4200]), w: 1.2, o: 0.12 });
  for (let z = -1400; z <= 4200; z += 160) grid.push({ a: at(O3, [-2400, FLOOR, z]), b: at(O3, [2400, FLOOR, z]), w: 1.2, o: 0.12 });

  const faces: Face[] = [];
  const tops: V3[] = [];
  for (let i = 0; i < 4; i++) {
    const { c, h } = stair(i);
    const g = backOut(clamp01((frame - (pre + i * 5)) / 14));
    if (g <= 0) continue;
    const hh = Math.max(2, h * g);
    faces.push(...boxFaces([c[0], O3[1] + FLOOR + hh / 2, c[2]], [200, hh, 230], "#0a0a0a", "rgba(255,255,255,0.4)", `${GREEN}26`));
    tops.push([c[0], O3[1] + FLOOR + hh + 2, c[2]]);
  }
  const pathP = interpolate(frame, [A("steps", 1), A("steps", 1) + 16], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

  const bpC: V3 = at(O3, [440, 340, 1400]);
  const bpIn = interpolate(frame, [A("trying to build") - 4, A("trying to build") + 10], [0, 1], clamp);
  const solid = interpolate(frame, [bld, bld + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const bpFaces = boxFaces(bpC, [240, 240, 240], `rgba(74,222,128,${0.22 * solid})`, GREEN, `rgba(74,222,128,${0.35 * solid})`).map((f) => ({ ...f, o: bpIn }));
  const head = interpolate(frame, [pre - 6, pre + 8], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });

  return (
    <>
      <Glow view={view} p={at(O3, [0, 0, 1500])} color={GREEN} size={2400} o={0.35} />
      <Lines view={view} segs={grid} />
      <Faces view={view} faces={faces} />
      {tops.length > 1 && <Path3 view={view} pts={tops} color={GREEN} w={3} progress={pathP} glow />}
      {tops.map((p, i) => (
        <Billboard key={i} view={view} p={add(p, [0, 60, 0])} dof={0.6}>
          <div style={{ fontFamily: MONO, fontSize: 34, color: GREEN, textShadow: `0 0 14px ${GREEN}` }}>{String(i + 1).padStart(2, "0")}</div>
        </Billboard>
      ))}
      {bpIn > 0 && <Faces view={view} faces={bpFaces} />}
      {bpIn > 0 && (
        <Billboard view={view} p={add(bpC, [0, 210, 0])} o={bpIn}>
          <div style={{ ...chipStyle(GREEN), color: "#fff" }}>
            <Dot color={GREEN} />
            your app
          </div>
        </Billboard>
      )}

      {/* headline floats up and away when the steps rise */}
      <Billboard view={view} p={at(O3, [0, 470 + head * 220, 380])} o={1 - head}>
        <div style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
          <Wd at={A("you just need a workflow because")} style={serif(110)}>you</Wd>
          <Wd at={A("just need a workflow because")} style={serif(110)}>just need a</Wd>
        </div>
      </Billboard>
      <Billboard view={view} p={at(O3, [0, 320 + head * 220, 380])} o={1 - head}>
        <Wd at={A("workflow", 1)} style={heavy(210)}>workflow</Wd>
      </Billboard>
      <Billboard view={view} p={at(O3, [-80, 650, 1100])} o={interpolate(frame, [pre, pre + 8], [0, 1], clamp)}>
        <div style={{ display: "flex", gap: 22, alignItems: "baseline" }}>
          <Wd at={pre} style={serif(150)}>predefined</Wd>
          <Wd at={A("steps", 1)} style={heavy(170)}>steps</Wd>
        </div>
      </Billboard>
    </>
  );
};

/* ------------------------------------------------------------------ W4 · my pipeline */

const NODE_X = [-780, -260, 260, 780];

const IconPlanner: React.FC<{ t: number }> = ({ t }) => (
  <svg width={150} height={150} viewBox="0 0 150 150">
    {[0, 1, 2].map((i) => {
      const p = clamp01((t - i * 5) / 10);
      return (
        <g key={i} transform={`translate(18 ${30 + i * 40})`}>
          <rect width={22} height={22} rx={5} fill={p >= 1 ? BLUE : "none"} stroke={p > 0 ? BLUE : "#444"} strokeWidth={2.5} />
          {p >= 1 && <path d="M5 11 L10 16 L18 6" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" />}
          <rect x={36} y={7} width={80 * p} height={8} rx={4} fill="#d4d4d4" />
        </g>
      );
    })}
  </svg>
);

const IconVoice: React.FC<{ t: number }> = ({ t }) => (
  <svg width={150} height={150} viewBox="0 0 150 150">
    {Array.from({ length: 11 }, (_, i) => {
      const h = 14 + 46 * Math.abs(Math.sin(t / 3 + i * 0.9)) * (0.5 + 0.5 * Math.sin(i / 1.7));
      return <rect key={i} x={14 + i * 11.5} y={75 - h / 2} width={6} height={h} rx={3} fill={BLUE} opacity={0.6 + 0.4 * Math.sin(t / 4 + i)} />;
    })}
  </svg>
);

const IconAnimator: React.FC<{ t: number }> = ({ t }) => {
  const u = (Math.sin(t / 9) + 1) / 2;
  const P = (k: number) => {
    const a = [18, 120], b = [40, 10], c = [110, 140], d = [132, 30];
    const m = 1 - k;
    return [
      m * m * m * a[0] + 3 * m * m * k * b[0] + 3 * m * k * k * c[0] + k * k * k * d[0],
      m * m * m * a[1] + 3 * m * m * k * b[1] + 3 * m * k * k * c[1] + k * k * k * d[1],
    ];
  };
  const [x, y] = P(u);
  return (
    <svg width={150} height={150} viewBox="0 0 150 150">
      <path d="M18 120 C40 10 110 140 132 30" stroke="#555" strokeWidth={2.5} fill="none" strokeDasharray="4 6" />
      <rect x={x - 12} y={y - 12} width={24} height={24} rx={5} fill={BLUE} transform={`rotate(${t * 6} ${x} ${y})`} style={{ filter: `drop-shadow(0 0 8px ${BLUE})` }} />
    </svg>
  );
};

const IconNarrator: React.FC<{ t: number }> = ({ t }) => (
  <svg width={150} height={150} viewBox="0 0 150 150">
    <path d="M20 30 H130 a10 10 0 0 1 10 10 V96 a10 10 0 0 1 -10 10 H64 L40 126 V106 H20 a10 10 0 0 1 -10 -10 V40 a10 10 0 0 1 10 -10 Z" fill="none" stroke="#d4d4d4" strokeWidth={3} />
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={52 + i * 24} cy={68 - 8 * Math.max(0, Math.sin(t / 3 - i * 0.9))} r={7} fill={BLUE} />
    ))}
  </svg>
);

const NODES = [
  { label: "planner", Icon: IconPlanner, word: () => A("planner") },
  { label: "voice generator", Icon: IconVoice, word: () => A("voice generator") },
  { label: "animator", Icon: IconAnimator, word: () => A("animator") },
  { label: "narrator", Icon: IconNarrator, word: () => A("narrator") },
];

const GRAPH = Array.from({ length: 46 }, (_, i) => {
  const cluster = i % 3;
  const cx = [-1300, 0, 1300][cluster];
  return { p: at(O4, [cx + (rand(i, 7) - 0.5) * 1000, -700 + rand(i, 8) * 1300 - (cluster === 1 ? 300 : 0), (rand(i, 9) - 0.3) * 900]), cluster };
}).filter((n) => Math.abs(n.p[1] - O4[1]) > 140 || Math.abs(n.p[0]) > 1100);

const World4: React.FC<{ view: View; frame: number }> = ({ view, frame }) => {
  const stuff = A("all this stuff");
  const wf = A("workflow", 2);
  const reveal = (i: number) => interpolate(frame, [stuff + i * 0.7, stuff + i * 0.7 + 10], [0, 1], clamp);
  const links: Seg3[] = [];
  GRAPH.forEach((n, i) => {
    const m = GRAPH[(i * 5 + 3) % GRAPH.length];
    if (m.cluster === n.cluster) links.push({ a: n.p, b: m.p, color: "#fff", w: 1.2, o: 0.18 * reveal(i) });
  });
  const hl = interpolate(frame, [wf, wf + 18], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

  return (
    <>
      <Glow view={view} p={at(O4, [0, 0, 300])} color={BLUE} size={2600} o={0.4} />
      <Lines view={view} segs={links} />
      {GRAPH.map((n, i) =>
        reveal(i) > 0 ? (
          <Billboard key={i} view={view} p={n.p} o={reveal(i) * 0.8} dof={0.4}>
            <div style={{ width: 70, height: 70, borderRadius: 16, border: `2px solid ${HAIR}`, background: "#0a0a0a" }} />
          </Billboard>
        ) : null,
      )}

      {[0, 1, 2].map((i) => (
        <Path3
          key={`g${i}`}
          view={view}
          pts={[at(O4, [NODE_X[i] + 150, 0, 0]), at(O4, [NODE_X[i + 1] - 150, 0, 0])]}
          color="#ffffff"
          w={1.4}
          o={0.12}
          dash="6 10"
        />
      ))}
      <Billboard view={view} p={at(O4, [-700, 330, 0])} o={interpolate(frame, [A("voice generator") - 6, A("voice generator") + 4], [1, 0], clamp)}>
        <div style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
          <Wd at={A("in my case")} style={serif(120)}>in my</Wd>
          <Wd at={A("case")} style={heavy(130)}>case</Wd>
        </div>
      </Billboard>
      {NODES.map((n, i) => {
        if (i === 0) return null;
        const t0 = n.word() - 6;
        const p = interpolate(frame, [t0, t0 + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const a = at(O4, [NODE_X[i - 1] + 150, 0, 0]);
        const b = at(O4, [NODE_X[i] - 150, 0, 0]);
        const pulse = ((frame - t0) % 24) / 24;
        return (
          <React.Fragment key={i}>
            <Path3 view={view} pts={[a, b]} color="#ffffff" w={2} o={0.35} progress={p} />
            {p >= 1 && (
              <Billboard view={view} p={lerp3(a, b, pulse)} dof={0}>
                <div style={{ width: 14, height: 14, borderRadius: 99, background: BLUE, boxShadow: `0 0 18px ${BLUE}, 0 0 40px ${BLUE}` }} />
              </Billboard>
            )}
          </React.Fragment>
        );
      })}
      <Path3 view={view} pts={[at(O4, [NODE_X[0], -2, -2]), at(O4, [NODE_X[3], -2, -2])]} color={BLUE} w={6} progress={hl} glow />

      {NODES.map((n, i) => {
        const t0 = n.word() - 6;
        const t = frame - t0;
        if (t < 0) {
          return (
            <Billboard key={n.label} view={view} p={at(O4, [NODE_X[i], 0, 0])} o={0.3}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
                <div style={{ width: 260, height: 260, borderRadius: 36, border: "2px dashed rgba(255,255,255,0.35)" }} />
                <div style={{ ...heavy(46, { letterSpacing: "-0.04em", lineHeight: 1 }), color: "#555" }}>{n.label}</div>
              </div>
            </Billboard>
          );
        }
        const p = interpolate(t, [0, 9], [0, 1], { ...clamp, easing: backOut });
        return (
          <Billboard key={n.label} view={view} p={at(O4, [NODE_X[i], 0, 0])}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, transform: `scale(${0.6 + 0.4 * p})`, opacity: clamp01(t / 4), filter: t < 6 ? `blur(${(6 - t) * 1.6}px)` : undefined }}>
              <div
                style={{
                  width: 260,
                  height: 260,
                  borderRadius: 36,
                  background: "linear-gradient(180deg, #111 0%, #070707 100%)",
                  border: `1.5px solid ${HAIR}`,
                  boxShadow: `0 0 0 1px #000, 0 30px 80px rgba(0,0,0,0.6), 0 0 60px ${BLUE}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 30, right: 30, height: 2, background: `linear-gradient(90deg, transparent, ${BLUE}, transparent)` }} />
                <n.Icon t={t} />
              </div>
              <div style={{ ...heavy(46, { letterSpacing: "-0.04em", lineHeight: 1 }), color: INK }}>{n.label}</div>
            </div>
          </Billboard>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------------ W5 · payoff (screen space) */

const Payoff: React.FC<{ frame: number }> = ({ frame }) => {
  const s = A("so most of the cases");
  const o = interpolate(frame, [s, s + 8], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 760, background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ fontFamily: MONO, fontSize: 30, color: MUTED, letterSpacing: "0.1em", marginBottom: 16 }}>
          <Wd at={A("most of the cases", 1)} style={{ fontFamily: MONO, fontSize: 30, letterSpacing: "0.1em" }}>MOST OF THE CASES</Wd>
        </div>
        <div style={{ display: "flex", gap: 22, alignItems: "baseline" }}>
          <Wd at={A("you just need a workflow", 1)} style={serif(124)}>you just</Wd>
          <Wd at={A("need a workflow", 1)} style={serif(124)}>need a</Wd>
        </div>
        <Wd at={A("workflow", 2)} style={heavy(236)}>workflow.</Wd>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ composition */

export const ShortAgent: React.FC = () => {
  const frame = useCurrentFrame();
  const full = isFull(frame);
  const cam = cameraAt(CAM, frame);
  const view = new View(cam);
  const blur = cameraBlur(CAM, frame);
  const inRange = (a: number, b: number) => frame >= a && frame < b;

  return (
    <ThemeProvider value={dark}>
    <AbsoluteFill style={{ background: "#000" }}>
      {!full && (
        <AbsoluteFill>
          <BlackStage />
          <AbsoluteFill style={{ filter: blur ? `blur(${blur.toFixed(1)}px)` : undefined }}>
            <Dust view={view} frame={frame} />
            {inRange(0, A("the first") + 16) && <World0 view={view} frame={frame} />}
            {inRange(A("the first") - 2, FULL_2[0]) && <World1 view={view} frame={frame} />}
            {inRange(A("and we"), FULL_2[0]) && <World2 view={view} frame={frame} />}
            {inRange(FULL_2[1], A("planner") + 12) && <World3 view={view} frame={frame} />}
            {inRange(A("in my case"), END) && <World4 view={view} frame={frame} />}
          </AbsoluteFill>
          {frame >= A("so most of the cases") && <Payoff frame={frame} />}
          <Grain opacity={dark.grain} />
        </AbsoluteFill>
      )}

      <Speaker shot={shot} fps={FPS} full={[FULL_1, FULL_2]} />

      <Captions
        words={data.words}
        isFull={isFull}
        hidden={[
          [A("wrong shape"), FULL_1[1]],
          [A("a workflow and"), FULL_2[1]],
        ]}
      />
      <Emphasis from={A("wrong shape")} to={FULL_1[1]} lines={["WRONG", "SHAPE"]} />
      <Emphasis from={A("a workflow and")} to={A("not just one")} lines={["A WORKFLOW"]} />
      <Emphasis from={A("not just one")} to={FULL_2[1]} lines={["NOT ONE", "BIG AGENT"]} />

      {/* sound */}
      <Audio src={staticFile("shorts/agent/music.mp3")} volume={dark.musicVolume} />
      <Sfx src="whoosh-cinematic.mp3" at={A("agent") + 4} volume={0.3} />
      <Sfx src="pop-light.mp3" at={A("instinct")} volume={0.25} />
      <Sfx src="sparkle-whoosh.mp3" at={A("build") - 2} volume={0.12} dur={40} />
      <Sfx src="impact-cinematic.mp3" at={A("with a lot") - 1} volume={0.22} dur={60} />
      {[0, 4, 8, 12, 16].map((d) => (
        <Sfx key={d} src="pop-light.mp3" at={A("with a lot") + d} volume={0.16} />
      ))}
      {[FULL_1[0], FULL_1[1], FULL_2[0], FULL_2[1]].map((c) => (
        <Sfx key={c} src="whoosh.mp3" at={c - 3} volume={0.28} />
      ))}
      <Sfx src="laser-swoosh.mp3" at={A("already")} volume={0.2} />
      {[0, 2, 4, 6].map((d) => (
        <Sfx key={d} src="click.mp3" at={A("all the steps") + 8 + d * 1.5} volume={0.22} />
      ))}
      <Sfx src="whoosh-air.mp3" at={A("narration") - 6} volume={0.16} dur={30} />
      <Sfx src="whoosh-fast.mp3" at={A("before") - 2} volume={0.18} />
      {[0, 3, 6].map((d) => (
        <Sfx key={d} src="pop-light.mp3" at={A("animation") + 18 + d} volume={0.2} />
      ))}
      <Sfx src="whoosh-air.mp3" at={A("small things")} volume={0.15} dur={30} />
      {[0, 5, 10, 15].map((d) => (
        <Sfx key={d} src="pop.mp3" at={A("predefined") + d} volume={0.16} />
      ))}
      <Sfx src="sparkle-whoosh.mp3" at={A("build", 1) - 2} volume={0.14} dur={45} />
      <Sfx src="whoosh-cinematic.mp3" at={A("in my case")} volume={0.22} />
      {NODES.map((n) => (
        <Sfx key={n.label} src="whoosh-fast.mp3" at={n.word() - 7} volume={0.12} />
      ))}
      {NODES.map((n) => (
        <Sfx key={n.label} src="pop-light.mp3" at={n.word() - 4} volume={0.22} />
      ))}
      <Sfx src="whoosh-air.mp3" at={A("all this stuff")} volume={0.2} dur={36} />
      <Sfx src="pop.mp3" at={A("workflow", 2)} volume={0.28} />
    </AbsoluteFill>
    </ThemeProvider>
  );
};
