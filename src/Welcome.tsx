import { AbsoluteFill } from "remotion";
import { SANS, SERIF } from "./lib/fonts";

/** Shown in Remotion Studio until the first short is registered in src/shorts/index.ts. */
export const Welcome = () => (
  <AbsoluteFill style={{ background: "#000", color: "#ededed", alignItems: "center", justifyContent: "center", gap: 24 }}>
    <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 90 }}>no shorts yet</div>
    <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: "#8f8f8f" }}>python3 scripts/new_short.py my-short</div>
  </AbsoluteFill>
);
