/**
 * Themes — the one place to change how every short looks.
 *
 * A short picks a theme by wrapping its tree in <ThemeProvider value={dark}>.
 * Copy a preset, tweak it, and pass your own object. Fonts live in lib/fonts.ts.
 */
import type React from "react";
import { createContext, useContext } from "react";

export type Theme = {
  name: string;
  /** Split-layout backdrop. "grey-grid"/"cream-grid" = reference paper look, "black" = worlds look. */
  background: "grey-grid" | "cream-grid" | "black";
  /** Settled text colour. */
  ink: string;
  /** Secondary text (labels, mono captions). */
  muted: string;
  /** Colour a word starts from before it settles to `ink` (the grey→ink reveal). */
  revealFrom: string;
  /** 1px borders, grid lines. */
  hairline: string;
  /** Hand-drawn marker circles / strike-throughs. */
  marker: string;
  /** Named accents. Rule of thumb: one accent per scene/world. */
  accents: { violet: string; red: string; cyan: string; green: string; blue: string; amber: string };
  /** Black label chips ("brushing" chips in the reference). */
  chip: { bg: string; fg: string };
  /** Outlined node boxes. */
  node: { border: string; bg: string };
  caption: {
    /** Split-layout caption pill. */
    pill: React.CSSProperties;
    /** Full-screen caption text (white over the face). */
    full: React.CSSProperties;
    /** Vertical centre of captions in px (frame is 1080×1920). */
    y: number;
  };
  /** Extra style on the speaker card in split layout. */
  card: React.CSSProperties;
  /** CSS filter applied to the speaker footage. */
  grade?: string;
  /** Static film grain opacity (0 disables). */
  grain: number;
  /** Music bed volume (bed is pre-normalised to −20 LUFS; voice to −14 LUFS). */
  musicVolume: number;
};

const FULL_CAPTION: React.CSSProperties = {
  color: "#fff",
  textShadow: "0 3px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.5)",
};

/** Kallaway-style reference: light grid paper, black type, grey pill captions. */
export const light: Theme = {
  name: "light",
  background: "grey-grid",
  ink: "#0b0b0b",
  muted: "#5a5a5a",
  revealFrom: "#a9a9a9",
  hairline: "rgba(0,0,0,0.12)",
  marker: "#d8231f",
  accents: { violet: "#7c3aed", red: "#d8231f", cyan: "#0891b2", green: "#16a34a", blue: "#2563eb", amber: "#d97706" },
  chip: { bg: "#0b0b0b", fg: "#ffffff" },
  node: { border: "#0b0b0b", bg: "rgba(255,255,255,0.35)" },
  caption: {
    pill: {
      color: "#fff",
      background: "rgba(122,122,122,0.82)",
      padding: "10px 20px 14px",
      borderRadius: 14,
      boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
    },
    full: FULL_CAPTION,
    y: 1205,
  },
  card: {},
  grain: 0.09,
  musicVolume: 0.2,
};

/** Vercel-style dark worlds: black, hairlines, white type, one glowing accent per world. */
export const dark: Theme = {
  name: "dark",
  background: "black",
  ink: "#ededed",
  muted: "#8f8f8f",
  revealFrom: "#3a3a3a",
  hairline: "rgba(255,255,255,0.14)",
  marker: "#ff4d4d",
  accents: { violet: "#8b5cf6", red: "#ff4d4d", cyan: "#22d3ee", green: "#4ade80", blue: "#3b82f6", amber: "#fbbf24" },
  chip: { bg: "#0a0a0a", fg: "#d4d4d4" },
  node: { border: "rgba(255,255,255,0.5)", bg: "#0a0a0a" },
  caption: {
    pill: {
      color: "#fff",
      background: "rgba(24,24,24,0.92)",
      border: "1px solid rgba(255,255,255,0.14)",
      padding: "10px 20px 14px",
      borderRadius: 14,
      boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
    },
    full: FULL_CAPTION,
    y: 1205,
  },
  card: { boxShadow: "0 0 0 1.5px rgba(255,255,255,0.16), 0 -30px 80px rgba(0,0,0,0.6)" },
  grade: "brightness(0.94) contrast(1.06) saturate(0.88)",
  grain: 0.05,
  musicVolume: 0.17,
};

const ThemeContext = createContext<Theme>(light);
export const ThemeProvider = ThemeContext.Provider;
export const useTheme = () => useContext(ThemeContext);
