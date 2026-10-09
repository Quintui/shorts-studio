/**
 * Fonts, loaded from Google Fonts via @remotion/google-fonts (no files to ship).
 * To change typefaces: swap the imports below and keep the exported names.
 *   SANS  — heavy display grotesk for headlines + captions (weights 600–900)
 *   SERIF — italic serif accent words ("a while.", "before")
 *   MONO  — labels, code, numbers
 */
import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";

export const SANS = loadInterTight("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin"] }).fontFamily;
export const SERIF = loadInstrument("italic", { weights: ["400"], subsets: ["latin"] }).fontFamily;
export const MONO = loadMono("normal", { weights: ["400", "500", "700"], subsets: ["latin"] }).fontFamily;

/** Legacy constants used by examples/streaming — new shorts should read colours from the theme. */
export const INK = "#0b0b0b";
export const RED = "#d8231f";
