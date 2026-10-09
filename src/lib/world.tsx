/**
 * A tiny 3D camera for SVG/DOM "worlds": project 3D points to the 1080x1920
 * frame, draw crisp vector lines, and place HTML billboards with depth-of-field.
 * World units ≈ pixels at distance FOCAL. y is up.
 */
import React from "react";
import { Easing } from "remotion";

export type V3 = [number, number, number];
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3): V3 => mul(a, 1 / (len(a) || 1));
export const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Deterministic pseudo-random in [0,1). */
export const rand = (i: number, salt = 0) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ----------------------------------------------------------------- camera */

export type Cam = { pos: V3; target: V3; fov: number; roll: number };
export type CamKey = { at: number; pos: V3; target: V3; fov?: number; roll?: number; ease?: (t: number) => number };

const SMOOTH = Easing.bezier(0.65, 0, 0.35, 1);

/** Keyframed camera with a subtle handheld drift. Keys must be sorted by `at`. */
export const cameraAt = (keys: CamKey[], frame: number, drift = 1): Cam => {
  let i = 0;
  while (i < keys.length - 1 && frame >= keys[i + 1].at) i++;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const span = Math.max(1, b.at - a.at);
  const t = frame <= a.at ? 0 : frame >= b.at ? 1 : (b.ease ?? SMOOTH)((frame - a.at) / span);
  const wob: V3 = [Math.sin(frame / 41) * 9 * drift, Math.sin(frame / 57 + 1) * 6 * drift, Math.sin(frame / 67) * 5 * drift];
  return {
    pos: add(lerp3(a.pos, b.pos, t), wob),
    target: add(lerp3(a.target, b.target, t), mul(wob, 0.4)),
    fov: lerp(a.fov ?? 52, b.fov ?? a.fov ?? 52, t),
    roll: lerp(a.roll ?? 0, b.roll ?? a.roll ?? 0, t),
  };
};

/** Camera speed → blur px, so whip moves smear like a real lens. */
export const cameraBlur = (keys: CamKey[], frame: number, gain = 0.055, max = 14) => {
  const c0 = cameraAt(keys, frame - 1, 0);
  const c1 = cameraAt(keys, frame, 0);
  const v = len(sub(c1.pos, c0.pos)) + len(sub(c1.target, c0.target)) * 0.35 + Math.abs(c1.fov - c0.fov) * 25;
  const b = Math.min(max, v * gain);
  return b < 0.5 ? 0 : b;
};

/* ----------------------------------------------------------------- view */

export const NEAR = 40;

export class View {
  readonly r: V3;
  readonly u: V3;
  readonly f: V3;
  readonly focal: number;
  readonly focus: number;
  constructor(readonly cam: Cam, readonly cx = 540, readonly cy = 620) {
    this.f = norm(sub(cam.target, cam.pos));
    const r0 = norm(cross([0, 1, 0], this.f));
    const u0 = cross(this.f, r0);
    const c = Math.cos((cam.roll * Math.PI) / 180);
    const s = Math.sin((cam.roll * Math.PI) / 180);
    this.r = add(mul(r0, c), mul(u0, s));
    this.u = sub(mul(u0, c), mul(r0, s));
    this.focal = 540 / Math.tan((cam.fov * Math.PI) / 360);
    this.focus = len(sub(cam.target, cam.pos));
  }
  /** Camera-space coordinates. */
  cs(p: V3): V3 {
    const d = sub(p, this.cam.pos);
    return [dot(d, this.r), dot(d, this.u), dot(d, this.f)];
  }
  screen(c: V3) {
    const k = this.focal / c[2];
    return { x: this.cx + c[0] * k, y: this.cy - c[1] * k, k, z: c[2] };
  }
  point(p: V3) {
    const c = this.cs(p);
    return { ...this.screen([c[0], c[1], Math.max(c[2], 1)]), vis: c[2] > NEAR };
  }
  /** Segment clipped to the near plane, or null if fully behind the camera. */
  seg(a: V3, b: V3) {
    let ca = this.cs(a);
    let cb = this.cs(b);
    if (ca[2] < NEAR && cb[2] < NEAR) return null;
    if (ca[2] < NEAR) ca = lerp3(ca, cb, (NEAR - ca[2]) / (cb[2] - ca[2]));
    if (cb[2] < NEAR) cb = lerp3(cb, ca, (NEAR - cb[2]) / (ca[2] - cb[2]));
    const A = this.screen(ca);
    const B = this.screen(cb);
    return { x1: A.x, y1: A.y, x2: B.x, y2: B.y, k: (A.k + B.k) / 2, z: (A.z + B.z) / 2 };
  }
  /** Depth fade: in from the near plane, out into fog. */
  fog(z: number, far = 4200, band = 2200) {
    return clamp01((z - NEAR) / 160) * clamp01(1 - (z - far) / band);
  }
}

/* ----------------------------------------------------------------- drawing */

export type Seg3 = { a: V3; b: V3; color?: string; w?: number; o?: number; dash?: string };

/** Many 3D segments in one SVG, stroke scales with depth. */
export const Lines: React.FC<{ view: View; segs: Seg3[]; style?: React.CSSProperties }> = ({ view, segs, style }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", ...style }}>
    {segs.map((s, i) => {
      const p = view.seg(s.a, s.b);
      if (!p) return null;
      const o = (s.o ?? 1) * view.fog(p.z);
      if (o < 0.01) return null;
      return (
        <line
          key={i}
          x1={p.x1}
          y1={p.y1}
          x2={p.x2}
          y2={p.y2}
          stroke={s.color ?? "#fff"}
          strokeWidth={Math.max(0.6, (s.w ?? 2) * p.k)}
          strokeOpacity={o}
          strokeLinecap="round"
          strokeDasharray={s.dash}
        />
      );
    })}
  </svg>
);

/** A polyline through 3D points (e.g. rings, curves), drawn on by `progress`. */
export const Path3: React.FC<{
  view: View;
  pts: V3[];
  color?: string;
  w?: number;
  o?: number;
  progress?: number;
  closed?: boolean;
  glow?: boolean;
  dash?: string;
}> = ({ view, pts, color = "#fff", w = 2, o = 1, progress = 1, closed, glow, dash }) => {
  const all = closed ? [...pts, pts[0]] : pts;
  const n = Math.max(0, Math.floor((all.length - 1) * clamp01(progress)));
  const out: string[] = [];
  let zs = 0;
  let m = 0;
  let pen = false;
  for (let i = 0; i <= n; i++) {
    const c = view.cs(all[i]);
    if (c[2] < NEAR) {
      pen = false;
      continue;
    }
    const s = view.screen(c);
    out.push(`${pen ? "L" : "M"}${s.x.toFixed(1)} ${s.y.toFixed(1)}`);
    pen = true;
    zs += s.z;
    m++;
  }
  if (m < 2) return null;
  const z = zs / m;
  const k = view.focal / z;
  const op = o * view.fog(z);
  const d = out.join(" ");
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {glow && <path d={d} fill="none" stroke={color} strokeWidth={w * k * 5} strokeOpacity={op * 0.12} strokeLinecap="round" strokeLinejoin="round" />}
      <path d={d} fill="none" stroke={color} strokeWidth={Math.max(0.7, w * k)} strokeOpacity={op} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
    </svg>
  );
};

/** Filled 3D polygons, painter-sorted far → near. */
export type Face = { pts: V3[]; fill: string; stroke?: string; w?: number; o?: number };
export const Faces: React.FC<{ view: View; faces: Face[]; cull?: boolean }> = ({ view, faces, cull = true }) => {
  const drawn = faces
    .map((f) => {
      const cs = f.pts.map((p) => view.cs(p));
      if (cs.some((c) => c[2] < NEAR)) return null;
      const sp = cs.map((c) => view.screen(c));
      if (cull) {
        let area = 0;
        for (let i = 0; i < sp.length; i++) {
          const a = sp[i];
          const b = sp[(i + 1) % sp.length];
          area += a.x * b.y - b.x * a.y;
        }
        // Outward faces wind clockwise on screen (y down) when facing the camera.
        if (area < 0) return null;
      }
      const z = cs.reduce((n, c) => n + c[2], 0) / cs.length;
      return { f, sp, z };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => b.z - a.z);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {drawn.map(({ f, sp, z }, i) => {
        const k = view.focal / z;
        const o = (f.o ?? 1) * view.fog(z);
        return (
          <polygon
            key={i}
            points={sp.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
            fill={f.fill}
            fillOpacity={o}
            stroke={f.stroke}
            strokeOpacity={o}
            strokeWidth={Math.max(0.6, (f.w ?? 1.5) * k)}
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
};

/** HTML anchored at a 3D point, scaled by depth, blurred off the focal plane. */
export const Billboard: React.FC<{
  view: View;
  p: V3;
  children: React.ReactNode;
  o?: number;
  dof?: number;
  anchor?: "center" | "left" | "bottom";
  style?: React.CSSProperties;
}> = ({ view, p, children, o = 1, dof = 1, anchor = "center", style }) => {
  const s = view.point(p);
  if (!s.vis) return null;
  const op = o * view.fog(s.z);
  if (op < 0.01) return null;
  const blur = Math.min(14, Math.abs(s.z - view.focus) * 0.0055 * dof);
  const tr = anchor === "left" ? "translate(0,-50%)" : anchor === "bottom" ? "translate(-50%,-100%)" : "translate(-50%,-50%)";
  return (
    <div
      style={{
        position: "absolute",
        left: s.x,
        top: s.y,
        transform: `${tr} scale(${s.k})`,
        transformOrigin: anchor === "left" ? "0 50%" : anchor === "bottom" ? "50% 100%" : "50% 50%",
        opacity: op,
        filter: blur > 0.6 ? `blur(${blur.toFixed(1)}px)` : undefined,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Points of a circle in 3D: centre, radius, tilt about X then Y (degrees). */
export const ring = (c: V3, r: number, tiltX = 0, tiltY = 0, n = 96, phase = 0): V3[] => {
  const ax = (tiltX * Math.PI) / 180;
  const ay = (tiltY * Math.PI) / 180;
  const out: V3[] = [];
  for (let i = 0; i < n; i++) {
    const t = phase + (i / n) * Math.PI * 2;
    let x = Math.cos(t) * r;
    let y = 0;
    let z = Math.sin(t) * r;
    // tilt about X
    [y, z] = [y * Math.cos(ax) - z * Math.sin(ax), y * Math.sin(ax) + z * Math.cos(ax)];
    // tilt about Y
    [x, z] = [x * Math.cos(ay) + z * Math.sin(ay), -x * Math.sin(ay) + z * Math.cos(ay)];
    out.push([c[0] + x, c[1] + y, c[2] + z]);
  }
  return out;
};

/** Point on a tilted ring at angle t (radians). */
export const onRing = (c: V3, r: number, tiltX: number, tiltY: number, t: number): V3 => ring(c, r, tiltX, tiltY, 1, t)[0];

/** Axis-aligned box faces (outward winding for culling). */
export const boxFaces = (c: V3, size: V3, fill: string, stroke: string, top?: string): Face[] => {
  const [x, y, z] = c;
  const [w, h, d] = [size[0] / 2, size[1] / 2, size[2] / 2];
  const P = (sx: number, sy: number, sz: number): V3 => [x + sx * w, y + sy * h, z + sz * d];
  return [
    { pts: [P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1), P(1, -1, -1)], fill, stroke }, // front (-z)
    { pts: [P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1), P(-1, -1, 1)], fill, stroke }, // back
    { pts: [P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1), P(-1, -1, -1)], fill, stroke }, // left
    { pts: [P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1)], fill, stroke }, // right
    { pts: [P(-1, 1, -1), P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1)], fill: top ?? fill, stroke }, // top
    { pts: [P(-1, -1, 1), P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1)], fill, stroke }, // bottom
  ];
};
