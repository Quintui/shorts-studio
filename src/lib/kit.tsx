import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MONO, SANS, SERIF } from "./fonts";
import { useTheme } from "../theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ---------------------------------------------------------------- backgrounds */

/** Static pre-rendered grain — a live feTurbulence filter is too slow to rasterise per frame. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.09 }) => (
  <AbsoluteFill
    style={{
      opacity: opacity * 0.9,
      backgroundImage: `url(${staticFile("grain.png")})`,
      backgroundSize: "1080px 1920px",
      filter: "contrast(1.4)",
    }}
  />
);

/** Light grey paper with a fine grid (reference: typographic scenes). */
export const GreyGrid: React.FC = () => {
  const th = useTheme();
  return (
  <AbsoluteFill style={{ background: "#e5e5e4" }}>
    <AbsoluteFill
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.055) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        backgroundPosition: "-1px -1px",
      }}
    />
    <AbsoluteFill
      style={{ background: "radial-gradient(ellipse 70% 45% at 50% 30%, rgba(255,255,255,0.6), rgba(255,255,255,0))" }}
    />
    <Grain opacity={th.grain} />
  </AbsoluteFill>
  );
};

/** Warm cream with a wide grid and + marks (reference: product/UI scenes). */
export const CreamGrid: React.FC = () => {
  const th = useTheme();
  return (
  <AbsoluteFill style={{ background: "#f4f2ec" }}>
    <svg width="1080" height="1920" style={{ position: "absolute" }}>
      <defs>
        <pattern id="cg" width="90" height="90" patternUnits="userSpaceOnUse" x="-45" y="-45">
          <path d="M90 0 V90 M0 90 H90" stroke="rgba(0,0,0,0.055)" strokeWidth="1.2" />
        </pattern>
        <pattern id="cp" width="180" height="180" patternUnits="userSpaceOnUse" x="-90" y="-90">
          <path d="M90 80 V100 M80 90 H100" stroke="rgba(0,0,0,0.22)" strokeWidth="1.6" />
        </pattern>
      </defs>
      <rect width="1080" height="1920" fill="url(#cg)" />
      <rect width="1080" height="1920" fill="url(#cp)" />
    </svg>
    <Grain opacity={th.grain * 0.66} />
  </AbsoluteFill>
  );
};

/** Near-black studio with a soft top light (worlds look). */
export const BlackStage: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 55% at 50% 30%, #0e0e10 0%, #000 70%)" }} />
);

/** The split-layout backdrop the theme asks for. Put it first, under everything. */
export const Backdrop: React.FC<{ variant?: "grey-grid" | "cream-grid" | "black" }> = ({ variant }) => {
  const th = useTheme();
  const v = variant ?? th.background;
  return v === "black" ? <BlackStage /> : v === "cream-grid" ? <CreamGrid /> : <GreyGrid />;
};

/* ---------------------------------------------------------------- motion */

export type Pose = { x?: number; y?: number; s?: number; r?: number; rx?: number; ry?: number; o?: number };
const DEF: Required<Pose> = { x: 0, y: 0, s: 1, r: 0, rx: 0, ry: 0, o: 1 };
const SNAP = Easing.bezier(0.7, 0, 0.18, 1);

const poseAt = (a: Pose, b: Pose, p: number) => {
  const o = {} as Required<Pose>;
  (Object.keys(DEF) as (keyof Pose)[]).forEach((k) => {
    const va = a[k] ?? DEF[k];
    const vb = b[k] ?? DEF[k];
    o[k] = va + (vb - va) * p;
  });
  return o;
};

/**
 * Move between two poses with blur derived from on-screen velocity —
 * the reference's whip moves are all motion-blurred, never clean slides.
 */
export const fly = (frame: number, start: number, dur: number, a: Pose, b: Pose, ease = SNAP): React.CSSProperties => {
  const prog = (fr: number) => ease(Math.min(1, Math.max(0, (fr - start) / dur)));
  const P = poseAt(a, b, prog(frame));
  const Q = poseAt(a, b, prog(frame - 1));
  const v =
    Math.hypot(P.x - Q.x, P.y - Q.y) +
    (Math.abs(P.r - Q.r) + Math.abs(P.rx - Q.rx) + Math.abs(P.ry - Q.ry)) * 9 +
    Math.abs(P.s - Q.s) * 700;
  const blur = Math.min(26, v * 0.16);
  return {
    transform: `perspective(1600px) translate(${P.x}px, ${P.y}px) rotateX(${P.rx}deg) rotateY(${P.ry}deg) rotate(${P.r}deg) scale(${P.s})`,
    opacity: P.o,
    filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined,
  };
};

/** Enter -> rest -> exit in one call. */
export const flyIO = (
  frame: number,
  enter: [number, number, Pose] | null,
  exit: [number, number, Pose] | null,
  rest: Pose = {},
): React.CSSProperties => {
  if (exit && frame >= exit[0]) return fly(frame, exit[0], exit[1], rest, exit[2], Easing.bezier(0.6, 0, 0.9, 0.4));
  if (enter) return fly(frame, enter[0], enter[1], enter[2], rest);
  return fly(frame, 0, 1, rest, rest);
};

/* ---------------------------------------------------------------- type */

/** A word that blurs in grey and settles to ink (reference word reveal). */
export const W: React.FC<{
  at: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  ink?: string;
  /** Colour the word appears in before settling to `ink` (defaults from theme). */
  from?: string;
}> = ({ at, children, style, ink: inkProp, from: fromProp }) => {
  const frame = useCurrentFrame();
  const th = useTheme();
  const ink = inkProp ?? th.ink;
  const from = fromProp ?? th.revealFrom;
  const t = frame - at;
  const p = interpolate(t, [0, 7], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const c = interpolate(t, [3, 13], [0, 1], clamp);
  return (
    <span
      style={{
        display: "inline-block",
        whiteSpace: "pre",
        opacity: p,
        filter: p < 1 ? `blur(${((1 - p) * 12).toFixed(1)}px)` : undefined,
        transform: `translateY(${(1 - p) * 16}px)`,
        color: interpolateColors(c, [0, 1], [from, ink]),
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export const heavy = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: SANS,
  fontWeight: 900,
  fontSize: size,
  letterSpacing: "-0.055em",
  lineHeight: 0.88,
  ...extra,
});

export const serif = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: SERIF,
  fontStyle: "italic",
  fontWeight: 400,
  fontSize: size,
  letterSpacing: "-0.035em",
  lineHeight: 0.9,
  ...extra,
});

/* ---------------------------------------------------------------- chips & boxes */

/** Black label that wipes open left-to-right (reference "brushing" chips). */
export const Chip: React.FC<{
  at: number;
  children: React.ReactNode;
  size?: number;
  mono?: boolean;
  style?: React.CSSProperties;
}> = ({ at, children, size = 40, mono, style }) => {
  const frame = useCurrentFrame();
  const th = useTheme();
  const t = frame - at;
  const wipe = interpolate(t, [0, 7], [100, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        display: "inline-block",
        background: th.chip.bg,
        color: th.chip.fg,
        border: th.name === "light" ? undefined : `1.5px solid ${th.hairline}`,
        padding: mono ? "10px 18px" : "6px 16px 8px",
        borderRadius: 4,
        fontFamily: mono ? MONO : SANS,
        fontWeight: mono ? 500 : 800,
        fontSize: size,
        letterSpacing: mono ? "-0.02em" : "-0.035em",
        lineHeight: 1,
        whiteSpace: "nowrap",
        clipPath: `inset(-2px ${wipe}% -2px -2px)`,
        opacity: t < 0 ? 0 : 1,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Outlined node box whose label settles grey -> ink (reference "Niche" box). */
export const NodeBox: React.FC<{ at: number; children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({
  at,
  children,
  size = 64,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - at;
  const s = spring({ frame: t, fps, config: { damping: 14, stiffness: 180, mass: 0.7 } });
  const th = useTheme();
  const c = interpolate(t, [2, 12], [0, 1], clamp);
  const col = interpolateColors(c, [0, 1], [th.revealFrom, th.node.border]);
  const txt = interpolateColors(c, [0, 1], [th.revealFrom, th.ink]);
  return (
    <div
      style={{
        display: "inline-block",
        border: `4px solid ${col}`,
        borderRadius: 10,
        padding: "10px 34px 14px",
        color: txt,
        ...heavy(size, { lineHeight: 1 }),
        transform: `scale(${0.85 + 0.15 * s})`,
        opacity: interpolate(t, [0, 4], [0, 1], clamp),
        filter: t < 6 ? `blur(${interpolate(t, [0, 6], [8, 0], clamp)}px)` : undefined,
        background: th.node.bg,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* ---------------------------------------------------------------- drawing */

/** Stroke that draws itself on. Use inside an <svg>. */
export const Draw: React.FC<{
  d: string;
  from: number;
  dur?: number;
  stroke?: string;
  width?: number;
  dash?: boolean;
}> = ({ d, from, dur = 10, stroke: strokeProp, width = 4 }) => {
  const frame = useCurrentFrame();
  const th = useTheme();
  const stroke = strokeProp ?? th.ink;
  const p = interpolate(frame, [from, from + dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  if (p <= 0) return null;
  return (
    <path
      d={d}
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - p}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
};

/** Hand-drawn marker loop that overshoots its start (reference red circles). */
export const RedCircle: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  from: number;
  dur?: number;
  rot?: number;
  width?: number;
  color?: string;
}> = ({ cx, cy, rx, ry, from, dur = 13, rot = -7, width = 7, color }) => {
  const th = useTheme();
  const marker = color ?? th.marker;
  const pts: string[] = [];
  const N = 120;
  const turns = 1.16;
  for (let i = 0; i <= N; i++) {
    const k = i / N;
    const th = -2.1 + k * turns * Math.PI * 2;
    const wob = 1 + 0.03 * Math.sin(th * 2.2 + 0.7) + k * 0.07;
    pts.push(`${(cx + rx * wob * Math.cos(th)).toFixed(1)} ${(cy + ry * wob * Math.sin(th)).toFixed(1)}`);
  }
  return (
    <svg width="1080" height="1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g transform={`rotate(${rot} ${cx} ${cy})`} opacity={0.92}>
        <Draw d={`M${pts.join(" L")}`} from={from} dur={dur} stroke={marker} width={width} />
      </g>
    </svg>
  );
};

export const Spinner: React.FC<{ size?: number; stroke?: number; color?: string; speed?: number }> = ({
  size = 160,
  stroke = 14,
  color: colorProp,
  speed = 11,
}) => {
  const frame = useCurrentFrame();
  const th = useTheme();
  const color = colorProp ?? th.ink;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const sweep = 0.22 + 0.12 * Math.sin(frame / 7);
  return (
    <svg width={size} height={size} style={{ transform: `rotate(${frame * speed}deg)` }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={th.hairline} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circ * sweep} ${circ}`}
      />
    </svg>
  );
};

/* ---------------------------------------------------------------- sound */

export const Sfx: React.FC<{ src: string; at: number; volume?: number; dur?: number }> = ({ src, at, volume = 0.4, dur }) => (
  <Sequence from={at} durationInFrames={dur} layout="none">
    <Audio src={staticFile(`sfx/${src}`)} volume={volume} />
  </Sequence>
);
