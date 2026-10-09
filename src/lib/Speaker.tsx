import React from "react";
import { Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { useTheme } from "../theme";

/** Bottom card the speaker sits in during split scenes (reference layout). */
export const BOX = { x: 72, y: 1410, w: 936, h: 560, r: 30 };

/** Written by scripts/prep_short.py into public/shorts/<name>/shot.json. */
export type SpeakerShot = {
  /** Speaker clip (source-sized, landscape). Path relative to public/. */
  src: string;
  /** Same clip with alpha, cropped to `headCrop` of the source. */
  headSrc: string;
  headCrop: { x: number; y: number; w: number; h: number };
  /** Top-centre of the head in source pixels (median over the clip). */
  head: { x: number; y: number };
  srcW: number;
  srcH: number;
  /** Clip length in seconds. */
  duration: number;
};

/** Where the top of the head lands in split mode — ~120px above the card. */
const SPLIT_HEAD_Y = 1292;

const splitPose = (s: SpeakerShot) => {
  // 0.75 was tuned on 1080p footage: chest-up framing with the head popping out.
  const scale = 0.75 * (1080 / s.srcH);
  return { scale, x: 540 - s.head.x * scale, y: SPLIT_HEAD_Y - s.head.y * scale };
};

const fullPose = (s: SpeakerShot, push: number) => {
  const k = 1080 / s.srcH;
  const scale = (2.0 + 0.12 * push) * k;
  // Keep the face (≈1/6 of frame height below the head top) at y=640 while pushing in.
  const face = s.head.y + s.srcH / 6;
  return { scale, x: 540 - s.head.x * scale, y: 640 - face * scale };
};

/**
 * One persistent video element (so audio never restarts) whose clip rect
 * switches between the bottom card and full frame. In split windows a
 * second, alpha-matted copy of the head is drawn above the card edge.
 */
export const Speaker: React.FC<{
  shot: SpeakerShot;
  fps: number;
  /** [startFrame, endFrame) ranges in full-screen mode. Everything else is split. */
  full: [number, number][];
  /** Override the theme's split-mode card style. */
  cardStyle?: React.CSSProperties;
  /** Override the theme's footage grade (CSS filter). */
  grade?: string;
}> = ({ shot, fps, full, cardStyle, grade }) => {
  const frame = useCurrentFrame();
  const th = useTheme();
  const card = cardStyle ?? th.card;
  const filter = grade ?? th.grade;
  const lastFrame = Math.floor(shot.duration * fps) - 1;

  const fullWin = full.find(([a, b]) => frame >= a && frame < b);
  const isFull = Boolean(fullWin);

  // Punch on every layout cut: 5 frames of overshoot.
  const lastCut = Math.max(0, ...full.flatMap(([a, b]) => [a, b]).filter((c) => c <= frame));
  const punch = 1 + 0.045 * Math.max(0, 1 - (frame - lastCut) / 5);

  const pose = isFull ? fullPose(shot, (frame - fullWin![0]) / Math.max(1, fullWin![1] - fullWin![0])) : splitPose(shot);
  const clip = isFull ? { x: 0, y: 0, w: 1080, h: 1920, r: 0 } : BOX;

  const splitWins: [number, number][] = [];
  let cur = 0;
  for (const [a, b] of [...full].sort((p, q) => p[0] - q[0])) {
    if (a > cur) splitWins.push([cur, a]);
    cur = b;
  }
  splitWins.push([cur, 100000]);

  const sp = splitPose(shot);
  const frozen = frame >= lastFrame;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: clip.x,
          top: clip.y,
          width: clip.w,
          height: clip.h,
          borderRadius: clip.r,
          overflow: "hidden",
          transform: `scale(${punch})`,
          transformOrigin: isFull ? "50% 35%" : "50% 0%",
          background: "#000",
          ...(isFull ? {} : card),
        }}
      >
        <Freeze frame={lastFrame} active={frozen}>
          <OffthreadVideo
            src={staticFile(shot.src)}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: shot.srcW,
              height: shot.srcH,
              transformOrigin: "0 0",
              transform: `translate(${pose.x - clip.x}px, ${pose.y - clip.y}px) scale(${pose.scale})`,
              filter,
            }}
          />
        </Freeze>
      </div>

      {splitWins.map(([a, b]) => (
        <Sequence key={a} from={a} durationInFrames={b - a} layout="none">
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 1080,
              height: BOX.y + 1,
              overflow: "hidden",
              transform: `scale(${punch})`,
              transformOrigin: `50% ${BOX.y}px`,
            }}
          >
            <Freeze frame={lastFrame - a} active={frozen}>
              <OffthreadVideo
                src={staticFile(shot.headSrc)}
                transparent
                muted
                trimBefore={a}
                style={{
                  position: "absolute",
                  left: sp.x + shot.headCrop.x * sp.scale,
                  top: sp.y + shot.headCrop.y * sp.scale,
                  width: shot.headCrop.w * sp.scale,
                  height: shot.headCrop.h * sp.scale,
                  filter,
                }}
              />
            </Freeze>
          </div>
        </Sequence>
      ))}
    </>
  );
};
