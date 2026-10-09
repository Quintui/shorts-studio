import React, { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { SANS } from "./fonts";
import { FPS, Word } from "./timing";
import { clamp } from "./kit";
import { useTheme } from "../theme";

const GLUE = new Set([
  "a", "an", "the", "of", "to", "in", "on", "at", "is", "as", "by", "so", "and", "or", "but",
  "we", "i", "it", "you", "your", "my", "this", "that", "with", "for", "be", "are", "was", "we're",
]);

type Chunk = { text: string; start: number; end: number };

/**
 * One word at a time, but short function words ride with the next word
 * ("the page.", "six of") the way the reference groups them.
 */
const chunk = (words: Word[]): Chunk[] => {
  const out: Chunk[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const bare = w.text.replace(/[^a-zA-Z0-9']/g, "").toLowerCase();
    const next = words[i + 1];
    const ends = /[.,!?]$/.test(w.text);
    if (next && !ends && GLUE.has(bare) && next.start - w.end < 0.25 && next.text.length <= 9) {
      out.push({ text: `${w.text} ${next.text}`, start: w.start, end: next.end });
      i++;
    } else {
      out.push({ text: w.text, start: w.start, end: w.end });
    }
  }
  return out;
};

export const Captions: React.FC<{
  words: Word[];
  isFull: (frame: number) => boolean;
  /** Frames where a big emphasis title replaces the caption. */
  hidden?: [number, number][];
  y?: number;
  /** @deprecated the theme decides the pill now. */
  dark?: boolean;
}> = ({ words, isFull, hidden = [], y: yProp }) => {
  const frame = useCurrentFrame();
  const th = useTheme();
  const y = yProp ?? th.caption.y;
  const chunks = useMemo(() => chunk(words), [words]);
  const t = frame / FPS;
  if (hidden.some(([a, b]) => frame >= a && frame < b)) return null;

  let idx = -1;
  for (let i = 0; i < chunks.length; i++) if (chunks[i].start <= t + 0.02) idx = i;
  if (idx < 0) return null;
  const c = chunks[idx];
  const next = chunks[idx + 1];
  const until = next ? next.start : c.end + 0.5;
  if (t > until) return null;

  const local = frame - Math.round(c.start * FPS);
  const pop = interpolate(local, [0, 3], [0.9, 1], clamp);
  const full = isFull(frame);
  const text = c.text.replace(/[,]$/, ",");

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(-50%) scale(${pop})`,
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: full ? 64 : 58,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          whiteSpace: "nowrap",
          ...(full ? th.caption.full : th.caption.pill),
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Big white all-caps title in full-screen shots ("CONTRARIAN PERSPECTIVES"). */
export const Emphasis: React.FC<{ from: number; to: number; lines: string[]; y?: number }> = ({
  from,
  to,
  lines,
  y = 1180,
}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  const t = frame - from;
  const p = interpolate(t, [0, 5], [0, 1], { ...clamp });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        transform: `translateY(-50%) scale(${1.18 - 0.18 * p})`,
        opacity: p,
        filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
        textAlign: "center",
        fontFamily: SANS,
        fontWeight: 900,
        fontSize: 118,
        letterSpacing: "-0.05em",
        lineHeight: 0.86,
        color: "#fff",
        textShadow: "0 4px 26px rgba(0,0,0,0.55)",
      }}
    >
      {lines.map((l) => (
        <div key={l}>{l}</div>
      ))}
    </div>
  );
};
