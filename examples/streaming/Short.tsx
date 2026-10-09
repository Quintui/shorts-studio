import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import data from "../../../public/shorts/streaming/words.json";
import shot from "../../../public/shorts/streaming/shot.json";
import { ThemeProvider, light } from "../../theme";
import { INK, MONO, RED, SANS } from "../../lib/fonts";
import { FPS, makeTimeline } from "../../lib/timing";
import { Speaker } from "../../lib/Speaker";
import { Captions, Emphasis } from "../../lib/Captions";
import {
  Chip,
  CreamGrid,
  Draw,
  GreyGrid,
  NodeBox,
  RedCircle,
  Sfx,
  Spinner,
  W,
  clamp,
  fly,
  flyIO,
  heavy,
  serif,
} from "../../lib/kit";

export const DURATION = 31.8;

const T = makeTimeline(data.words);
/** Frame of a spoken phrase. */
const A = (phrase: string, nth = 0) => T.f(T.at(phrase, nth));

/* ------------------------------------------------------------------ edit plan */

const FULL_1: [number, number] = [A("the part"), A("each step")];
const FULL_2: [number, number] = [A("by implementing"), A("because you")];
const S2 = A("so don't");
const S5 = A("and we're");
const END = Math.round(DURATION * FPS);

const isFull = (f: number) => [FULL_1, FULL_2].some(([a, b]) => f >= a && f < b);

/* ------------------------------------------------------------------ 1 · hook */

const SceneWait: React.FC = () => {
  const frame = useCurrentFrame();
  const out = S2 - 4;
  const block = flyIO(frame, null, [out, 8, { y: -300, rx: 60, r: -5, s: 0.9, o: 0 }]);
  const L0 = A("results");
  const card = flyIO(frame, [L0 - 2, 11, { y: 260, rx: -50, s: 0.9, o: 0 }], [out, 8, { y: -160, rx: 50, s: 0.9, o: 0 }]);
  const secs = Math.floor(Math.max(0, frame - L0) * 0.8);
  const pct = interpolate(frame, [L0 + 4, out], [2, 9], clamp);

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 230, display: "flex", justifyContent: "center", ...block }}>
        <div style={{ display: "flex", flexDirection: "column", width: 800 }}>
          <div style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
            <W at={A("with")} style={heavy(78)}>With</W>
            <W at={A("ai")} style={heavy(78)}>AI,</W>
            <W at={A("most")} style={heavy(78)}>most</W>
          </div>
          <W at={A("results")} style={heavy(214, { marginTop: 4, marginLeft: -10 })}>results</W>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 6 }}>
            <W at={A("take")} style={heavy(78)}>take</W>
            <div style={{ display: "flex", gap: 22, alignItems: "baseline", marginRight: 6 }}>
              <W at={A("a while")} style={serif(132)}>a</W>
              <W at={A("while")} style={serif(132)}>while.</W>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 150, width: 780, top: 800, ...card }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Spinner size={42} stroke={6} speed={14} />
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 38, color: "#5a5a5a", letterSpacing: "-0.03em" }}>
              generating lesson…
            </span>
          </div>
          <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 42, color: INK }}>
            0:{String(secs).padStart(2, "0")}
          </span>
        </div>
        <div style={{ height: 40, border: `4px solid ${INK}`, borderRadius: 999, padding: 5 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: INK, borderRadius: 999 }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ 2 · the spinner */

const QUESTIONS: { text: string; at: number; x: number; y: number; line: string }[] = [
  { text: "is it stuck?", at: A("wondering"), x: 70, y: 196, line: "M200 262 C200 320 330 304 330 360" },
  { text: "what's happening?", at: A("what's happening"), x: 548, y: 140, line: "M772 206 C772 290 748 284 748 360" },
  { text: "did it crash?", at: A("under there"), x: 64, y: 958, line: "M202 954 C202 890 330 904 330 842" },
  { text: "refresh?", at: A("looking"), x: 700, y: 1000, line: "M808 996 C808 920 760 926 760 842" },
];

const SceneSpinner: React.FC = () => {
  const frame = useCurrentFrame();
  const Z = A("spinning");
  const zoom = interpolate(frame, [Z, Z + 14], [1, 1.55], { ...clamp, easing: Easing.bezier(0.65, 0, 0.2, 1) });
  const card = fly(frame, S2 - 3, 12, { y: 520, r: 9, rx: -35, s: 0.75, o: 0 }, {});
  const chipFade = interpolate(frame, [Z, Z + 10], [1, 0.25], clamp);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "540px 555px" }}>
        <svg width="1080" height="1920" style={{ position: "absolute", opacity: chipFade }}>
          {QUESTIONS.map((q) => (
            <Draw key={q.text} d={q.line} from={q.at - 5} dur={9} width={4} />
          ))}
        </svg>
        <div
          style={{
            position: "absolute",
            left: 240,
            top: 360,
            width: 600,
            height: 480,
            background: "#fff",
            border: `4px solid ${INK}`,
            borderRadius: 34,
            boxShadow: "0 40px 80px rgba(0,0,0,0.12)",
            overflow: "hidden",
            ...card,
          }}
        >
          <div style={{ height: 62, borderBottom: "2px solid #e4e4e4", display: "flex", alignItems: "center", gap: 12, paddingLeft: 26 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 16, height: 16, borderRadius: 99, background: "#d6d6d6" }} />
            ))}
          </div>
          <div style={{ position: "absolute", left: 215, top: 110 }}>
            <Spinner size={170} stroke={15} />
          </div>
          <div style={{ position: "absolute", top: 318, width: "100%", textAlign: "center" }}>
            <div style={{ ...heavy(42, { lineHeight: 1, letterSpacing: "-0.04em" }), color: "#222" }}>Generating your course</div>
            <div style={{ ...serif(46), color: "#8a8a8a", marginTop: 14 }}>this might take a while…</div>
          </div>
        </div>
        {QUESTIONS.map((q) => (
          <div key={q.text} style={{ position: "absolute", left: q.x, top: q.y, opacity: chipFade }}>
            <Chip at={q.at} size={50}>{q.text}</Chip>
          </div>
        ))}
      </AbsoluteFill>
      <RedCircle cx={540} cy={555} rx={178} ry={168} from={Z + 9} dur={13} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ 4 · typed updates */

const STEPS = [
  { label: "plan", x: 205 },
  { label: "narrate", x: 540 },
  { label: "animate", x: 870 },
];

type Tok = { s: string; c: string };
const KEY = "#8c8c8c";
const PUN = "#5f5f5f";
const VAL = "#ffffff";
const CODE: Tok[][] = [
  [{ s: "{", c: PUN }],
  [{ s: "  type", c: KEY }, { s: ": ", c: PUN }, { s: '"data-scene"', c: VAL }, { s: ",", c: PUN }],
  [{ s: "  scene", c: KEY }, { s: ": ", c: PUN }, { s: "3", c: VAL }, { s: ",", c: PUN }],
  [{ s: "  status", c: KEY }, { s: ": ", c: PUN }, { s: '"animating"', c: VAL }],
  [{ s: "}", c: PUN }],
];
const lineLen = CODE.map((l) => l.reduce((n, t) => n + t.s.length, 0) + 1);
const cum = lineLen.map((_, i) => lineLen.slice(0, i + 1).reduce((a, b) => a + b, 0));

const CODE_X = 110;
const CODE_Y = 360;
const CODE_PAD = 54;
const CODE_FS = 52;
const CODE_LH = 76;
const CHAR_W = CODE_FS * 0.6;

const SceneUpdates: React.FC = () => {
  const frame = useCurrentFrame();
  const B = A("something like") - 4;

  const header = flyIO(frame, null, [B, 9, { y: -340, rx: 55, r: -4, s: 0.9, o: 0 }]);
  const steps = flyIO(frame, null, [B + 1, 9, { y: -420, rx: 45, r: 3, s: 0.85, o: 0 }]);
  const codeCard = fly(frame, B + 3, 12, { y: 560, rx: -50, s: 0.8, o: 0 }, {});

  const typed = Math.floor(
    interpolate(frame, [A("something like"), A("scene") - 2, A("three") + 1, A("animating") + 6, A("animating") + 9], [0, cum[1], cum[2], cum[3], cum[4]], clamp),
  );
  let left = typed;
  const caretOn = Math.floor(frame / 8) % 2 === 0 || typed < cum[4];

  const things = A("things");
  const ghost = (i: number) => fly(frame, things + i * 3, 9, { y: 0, o: 0 }, { y: -44 * (i + 1), s: 1 - 0.05 * (i + 1), o: 0.75 - 0.25 * i });

  return (
    <AbsoluteFill>
      {frame < B + 12 && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center", ...header }}>
            <div style={{ display: "flex", flexDirection: "column", width: 820 }}>
              <div style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
                <W at={A("each")} style={heavy(84)}>each</W>
                <W at={A("step")} style={heavy(84)}>step</W>
                <W at={A("writes")} style={heavy(84)}>writes</W>
              </div>
              <div style={{ display: "flex", gap: 24, alignItems: "baseline", marginTop: 10 }}>
                <W at={A("a small")} style={serif(150)}>a</W>
                <W at={A("small")} style={serif(150)}>small</W>
              </div>
              <div style={{ display: "flex", gap: 26, alignItems: "baseline", marginTop: 4 }}>
                <W at={A("typed")} style={heavy(150)}>typed</W>
                <W at={A("update")} style={heavy(150)}>update</W>
              </div>
            </div>
          </div>

          <AbsoluteFill style={steps}>
            <svg width="1080" height="1920" style={{ position: "absolute" }}>
              <Draw d="M300 782 L398 782" from={A("step") + 2} dur={6} width={4} />
              <Draw d="M682 782 L758 782" from={A("step") + 5} dur={6} width={4} />
              <Draw d="M388 772 L400 782 L388 792" from={A("step") + 7} dur={3} width={4} />
              <Draw d="M748 772 L760 782 L748 792" from={A("step") + 10} dur={3} width={4} />
              {STEPS.map((s, i) => (
                <Draw key={s.label} d={`M${s.x} 826 L${s.x} 900`} from={A("writes") + i * 4 - 3} dur={6} width={3} />
              ))}
            </svg>
            {STEPS.map((s, i) => (
              <div key={s.label} style={{ position: "absolute", left: s.x, top: 742, transform: "translateX(-50%)" }}>
                <NodeBox at={A("each") + i * 4} size={44} style={{ padding: "8px 24px 12px" }}>{s.label}</NodeBox>
              </div>
            ))}
            {STEPS.map((s, i) => (
              <div key={s.label} style={{ position: "absolute", left: s.x, top: 904, transform: "translateX(-50%)" }}>
                <Chip at={A("writes") + i * 4 + 3} mono size={34}>{"{ … }"}</Chip>
              </div>
            ))}
          </AbsoluteFill>
        </>
      )}

      {frame >= B && (
        <>
          {[1, 0].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: CODE_X,
                top: CODE_Y,
                width: 860,
                height: CODE_PAD * 2 + CODE_LH * CODE.length,
                background: i === 0 ? "#2a2a2a" : "#4a4a4a",
                borderRadius: 30,
                ...ghost(i),
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: CODE_X,
              top: CODE_Y,
              width: 860,
              padding: CODE_PAD,
              background: INK,
              borderRadius: 30,
              boxShadow: "0 40px 90px rgba(0,0,0,0.25)",
              fontFamily: MONO,
              fontWeight: 500,
              fontSize: CODE_FS,
              lineHeight: `${CODE_LH}px`,
              whiteSpace: "pre",
              ...codeCard,
            }}
          >
            {CODE.map((line, li) => {
              const chars: React.ReactNode[] = [];
              for (const tok of line) {
                const take = Math.max(0, Math.min(tok.s.length, left));
                if (take > 0) chars.push(<span key={chars.length} style={{ color: tok.c }}>{tok.s.slice(0, take)}</span>);
                left -= tok.s.length;
              }
              const lineStart = li === 0 ? 0 : cum[li - 1];
              const caretHere = typed >= lineStart && (typed < cum[li] || li === CODE.length - 1);
              left -= 1;
              return (
                <div key={li} style={{ height: CODE_LH }}>
                  {chars}
                  {caretHere && caretOn && (
                    <span style={{ display: "inline-block", width: CHAR_W * 0.9, height: CODE_FS * 0.95, background: "#fff", verticalAlign: "-8%" }} />
                  )}
                </div>
              );
            })}
          </div>
          <RedCircle cx={CODE_X + CODE_PAD + 9.5 * CHAR_W} cy={CODE_Y + CODE_PAD + 2.5 * CODE_LH} rx={56} ry={50} from={A("three") + 3} dur={11} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 930, display: "flex", justifyContent: "center" }}>
            <Chip at={A("animating") + 4} mono size={40} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 24px" }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 99,
                  background: RED,
                  opacity: 0.55 + 0.45 * Math.sin(frame / 3),
                  display: "inline-block",
                }}
              />
              scene 3 · animating
            </Chip>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ 5 · data parts */

type P = [number, number];
const bez = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};
const PATH_A: [P, P, P, P] = [[540, 268], [540, 380], [300, 360], [300, 470]];
const PATH_B: [P, P, P, P] = [[300, 470], [300, 580], [540, 560], [540, 668]];
const PATH_D = "M540 268 C540 380 300 360 300 470 C300 580 540 560 540 668";
const along = (t: number): P => (t < 0.5 ? bez(...PATH_A, t * 2) : bez(...PATH_B, (t - 0.5) * 2));

const PACKETS = [
  { label: "plan ✓", at: A("sending") },
  { label: "voice ✓", at: A("data chunks") - 3 },
  { label: "scene 1 ✓", at: A("chunks") + 6 },
  { label: "scene 2 ✓", at: A("parts") },
  { label: "scene 3 …", at: A("back") + 4 },
];
const TRAVEL = 22;

const ROWS = [
  { label: "Plan & storyboard", done: true },
  { label: "Scene 1 · narrated", done: true },
  { label: "Scene 2 · animated", done: true },
  { label: "Scene 3 · animating", done: false },
];

const SceneDataParts: React.FC = () => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [S5, FULL_2[0]], [1, 1.04], clamp);
  const FE = A("front end");
  const R = A("renders");
  const feBox = flyIO(frame, null, [FE - 2, 7, { y: 30, s: 1.5, o: 0 }]);
  const ui = fly(frame, FE, 11, { y: -30, s: 0.45, o: 0 }, {});
  const chunksOut = flyIO(frame, null, [A("parts") - 3, 6, { y: -50, o: 0, s: 0.9 }]);
  const partsIn = fly(frame, A("parts"), 7, { y: 60, o: 0, s: 1.1 }, {});

  return (
    <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "540px 600px" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 168, display: "flex", justifyContent: "center" }}>
        <NodeBox at={S5 + 1} size={60}>workflow</NodeBox>
      </div>

      <svg width="1080" height="1920" style={{ position: "absolute" }}>
        <Draw d={PATH_D} from={A("sending") - 4} dur={13} width={4} />
      </svg>

      <div style={{ position: "absolute", left: 560, top: 380 }}>
        <W at={A("data chunks")} style={heavy(104)}>data</W>
        <div style={{ position: "relative", height: 130 }}>
          {frame < A("parts") + 2 && (
            <div style={{ position: "absolute", left: 4, top: 0, ...chunksOut }}>
              <W at={A("chunks")} style={serif(132)}>chunks</W>
            </div>
          )}
          {frame >= A("parts") && (
            <div style={{ position: "absolute", left: 4, top: 0, ...partsIn }}>
              <span style={{ ...serif(132), color: INK }}>parts</span>
            </div>
          )}
        </div>
      </div>

      {frame < FE + 6 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 676, display: "flex", justifyContent: "center", ...feBox }}>
          <NodeBox at={A("sending") + 8} size={52}>frontend</NodeBox>
        </div>
      )}

      {PACKETS.map((p) => {
        const t = frame - p.at;
        if (t < 0 || t > TRAVEL + 6) return null;
        const k = Easing.inOut(Easing.cubic)(Math.min(1, t / TRAVEL));
        const [x, y] = along(k);
        const [px, py] = along(Easing.inOut(Easing.cubic)(Math.min(1, Math.max(0, (t - 1) / TRAVEL))));
        const v = Math.hypot(x - px, y - py);
        const land = interpolate(t, [TRAVEL, TRAVEL + 6], [1, 0], clamp);
        return (
          <div
            key={p.label}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${0.7 + 0.3 * land})`,
              opacity: land,
              filter: v > 3 ? `blur(${Math.min(6, v * 0.12).toFixed(1)}px)` : undefined,
            }}
          >
            <Chip at={p.at} mono size={34}>{p.label}</Chip>
          </div>
        );
      })}

      {frame >= FE && (
        <div
          style={{
            position: "absolute",
            left: 150,
            top: 676,
            width: 780,
            background: "#fff",
            border: `4px solid ${INK}`,
            borderRadius: 30,
            boxShadow: "0 40px 80px rgba(0,0,0,0.12)",
            overflow: "hidden",
            transformOrigin: "50% 0%",
            ...ui,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 34px", borderBottom: "2px solid #e6e6e6" }}>
            <span style={heavy(42, { lineHeight: 1, letterSpacing: "-0.04em" })}>Your lesson</span>
            <span style={{ fontFamily: MONO, fontSize: 28, color: "#9a9a9a" }}>live</span>
          </div>
          {ROWS.map((r, i) => {
            const at = R + i * 3;
            const shown = frame >= at;
            const p = interpolate(frame - at, [0, 6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
            return (
              <div key={r.label} style={{ height: 84, display: "flex", alignItems: "center", gap: 22, padding: "0 34px", borderBottom: i < 3 ? "2px solid #f0f0f0" : undefined }}>
                {!shown ? (
                  <>
                    <div style={{ width: 40, height: 40, borderRadius: 99, background: "#ececec" }} />
                    <div style={{ width: 260 + ((i * 97) % 140), height: 26, borderRadius: 8, background: "#ececec", opacity: 0.6 + 0.4 * Math.sin(frame / 5 + i) }} />
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 22, opacity: p, filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined, transform: `translateY(${(1 - p) * 10}px)` }}>
                    {r.done ? (
                      <div style={{ width: 40, height: 40, borderRadius: 99, background: INK, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 900, fontSize: 26 }}>✓</div>
                    ) : (
                      <Spinner size={40} stroke={6} speed={16} />
                    )}
                    <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 38, letterSpacing: "-0.03em", color: r.done ? INK : "#777" }}>{r.label}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ 7 · progress */

const ScenePayoff: React.FC = () => {
  const frame = useCurrentFrame();
  const s7 = FULL_2[1];
  const H = A("happening and");
  const P = A("progress");
  const left = fly(frame, s7 + 1, 11, { x: -500, r: -10, o: 0 }, {});
  const right = fly(frame, s7 + 4, 11, { x: 560, r: 10, o: 0 }, {});
  const dim = interpolate(frame, [H - 4, H + 6], [1, 0.4], clamp);
  const pct = Math.round(interpolate(frame, [s7, H, P + 6, END - 22], [22, 48, 86, 100], clamp));
  const items = ["plan", "voice", "scene 1", "scene 2"];

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 860 }}>
          <div style={{ display: "flex", gap: 22, alignItems: "baseline" }}>
            <W at={A("you actually see")} style={serif(128)}>you</W>
            <W at={A("see what's")} style={serif(128)}>see</W>
            <W at={A("what's happening and")} style={heavy(96)}>what's</W>
          </div>
          <div style={{ display: "flex", gap: 22, alignItems: "baseline", justifyContent: "flex-end", marginTop: -6 }}>
            <W at={H} style={heavy(96)}>happening</W>
          </div>
          <div style={{ display: "flex", gap: 22, alignItems: "baseline", marginTop: 10 }}>
            <W at={A("the progress")} style={serif(128)}>the</W>
            <W at={P} style={heavy(168)}>progress</W>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 80, top: 640, ...left }}>
        <Chip at={s7 + 6} size={38}>spinner</Chip>
        <div
          style={{
            marginTop: 14,
            width: 330,
            height: 380,
            background: "#fff",
            border: "3px solid #c9c9c9",
            borderRadius: 28,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 30,
            opacity: dim,
            filter: `grayscale(1) blur(${(1 - dim) * 2.5}px)`,
          }}
        >
          <Spinner size={120} stroke={12} color="#9a9a9a" />
          <span style={{ fontFamily: MONO, fontSize: 40, color: "#a5a5a5" }}>???</span>
        </div>
      </div>

      <div style={{ position: "absolute", left: 450, top: 640, ...right }}>
        <Chip at={s7 + 9} size={38}>streaming</Chip>
        <div
          style={{
            marginTop: 14,
            width: 550,
            height: 380,
            background: "#fff",
            border: `4px solid ${INK}`,
            borderRadius: 28,
            boxShadow: "0 30px 70px rgba(0,0,0,0.12)",
            padding: "26px 34px",
            boxSizing: "border-box",
          }}
        >
          {items.map((it, i) => {
            const at = A("what's happening and") + i * 4;
            const p = interpolate(frame - at, [0, 6], [0, 1], clamp);
            return (
              <div key={it} style={{ display: "flex", alignItems: "center", gap: 18, height: 54, opacity: 0.25 + 0.75 * p }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 99,
                    background: p > 0.5 ? INK : "#e2e2e2",
                    color: "#fff",
                    fontFamily: SANS,
                    fontWeight: 900,
                    fontSize: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${0.8 + 0.2 * p})`,
                  }}
                >
                  {p > 0.5 ? "✓" : ""}
                </div>
                <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: "-0.03em", color: INK }}>{it}</span>
              </div>
            );
          })}
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 22 }}>
            <div style={{ flex: 1, height: 30, border: `4px solid ${INK}`, borderRadius: 99, padding: 4 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: INK, borderRadius: 99 }} />
            </div>
            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 36, width: 96, textAlign: "right" }}>{pct}%</span>
          </div>
        </div>
      </div>

      <RedCircle cx={725} cy={1004} rx={300} ry={64} rot={-3} from={P + 4} dur={13} width={7} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ composition */

export const ShortStreaming: React.FC = () => {
  const frame = useCurrentFrame();
  const full = isFull(frame);
  const cream = frame >= S5;

  let scene: React.ReactNode = null;
  if (frame < S2) scene = <SceneWait />;
  else if (frame < FULL_1[0]) scene = <SceneSpinner />;
  else if (frame >= FULL_1[1] && frame < S5) scene = <SceneUpdates />;
  else if (frame >= S5 && frame < FULL_2[0]) scene = <SceneDataParts />;
  else if (frame >= FULL_2[1]) scene = <ScenePayoff />;

  const cuts = [FULL_1[0], FULL_1[1], S5, FULL_2[0], FULL_2[1]];

  return (
    <ThemeProvider value={light}>
    <AbsoluteFill style={{ background: "#000" }}>
      {!full && (cream ? <CreamGrid /> : <GreyGrid />)}
      {!full && scene}

      <Speaker shot={shot} fps={FPS} full={[FULL_1, FULL_2]} />

      <Captions
        words={data.words}
        isFull={isFull}
        hidden={[
          [A("so fast"), A("is actually")],
          [A("streaming"), FULL_1[1]],
          [A("feels different"), FULL_2[1]],
        ]}
      />
      <Emphasis from={A("so fast")} to={A("is actually")} lines={["SO FAST"]} />
      <Emphasis from={A("streaming")} to={FULL_1[1]} lines={["STREAMING"]} />
      <Emphasis from={A("feels different")} to={FULL_2[1]} lines={["FEELS", "DIFFERENT"]} />

      {/* sound */}
      <Audio src={staticFile("shorts/streaming/music.mp3")} volume={light.musicVolume} />
      <Sfx src="whoosh-fast.mp3" at={A("results") - 3} volume={0.18} />
      <Sfx src="whoosh.mp3" at={S2 - 5} volume={0.35} />
      {QUESTIONS.map((q) => (
        <Sfx key={q.text} src="pop-light.mp3" at={q.at} volume={0.35} />
      ))}
      <Sfx src="whoosh-air.mp3" at={A("spinning") - 2} volume={0.25} dur={30} />
      <Sfx src="click.mp3" at={A("spinning") + 9} volume={0.45} />
      {cuts.map((c) => (
        <Sfx key={c} src="whoosh.mp3" at={c - 3} volume={0.28} />
      ))}
      {STEPS.map((s, i) => (
        <Sfx key={s.label} src="pop-light.mp3" at={A("writes") + i * 4 + 3} volume={0.3} />
      ))}
      <Sfx src="whoosh-fast.mp3" at={A("something like") - 6} volume={0.18} />
      <Sfx src="typing.mp3" at={A("something like")} volume={0.32} dur={A("animating") + 9 - A("something like")} />
      <Sfx src="click.mp3" at={A("three") + 3} volume={0.4} />
      <Sfx src="pop.mp3" at={A("animating") + 4} volume={0.3} />
      {PACKETS.map((p) => (
        <Sfx key={p.label} src="pop-light.mp3" at={p.at + TRAVEL} volume={0.25} />
      ))}
      <Sfx src="whoosh-air.mp3" at={A("front end") - 3} volume={0.2} dur={25} />
      <Sfx src="pop.mp3" at={A("renders")} volume={0.25} />
      <Sfx src="click.mp3" at={A("progress") + 4} volume={0.45} />
      <Sfx src="pop.mp3" at={END - 22} volume={0.3} />
    </AbsoluteFill>
    </ThemeProvider>
  );
};
