export const FPS = 30;

export type Word = { text: string; start: number; end: number };

const NUMBERS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
  eleven: "11", twelve: "12", thirteen: "13", fourteen: "14", fifteen: "15", twenty: "20", thirty: "30", hundred: "100",
};
/** Case/punctuation-insensitive; number words and digits match ("three" == "3"), since Whisper writes either. */
const norm = (s: string) => {
  const w = s.toLowerCase().replace(/[^a-z0-9']/g, "");
  return NUMBERS[w] ?? w;
};

/**
 * Word-anchored timing: at("spinning wheel") -> seconds of "spinning".
 * Matching joins letters across words, so "front end" also finds "frontend" and
 * "data scene" finds "data-scene" — Whisper splits/joins compounds unpredictably.
 */
export const makeTimeline = (words: Word[]) => {
  const keys = words.map((w) => norm(w.text).replace(/'/g, ""));
  /** [first, last] word index of the nth occurrence. */
  const find = (phrase: string, nth = 0): [number, number] => {
    const target = phrase.split(/\s+/).map((p) => norm(p).replace(/'/g, "")).join("");
    let seen = 0;
    for (let i = 0; i < keys.length; i++) {
      let acc = "";
      for (let j = i; j < keys.length && acc.length < target.length; j++) {
        acc += keys[j];
        if (acc === target) {
          if (seen === nth) return [i, j];
          seen++;
          break;
        }
        if (!target.startsWith(acc)) break;
      }
    }
    throw new Error(`phrase not found: "${phrase}" #${nth}`);
  };
  const at = (phrase: string, nth = 0) => words[find(phrase, nth)[0]].start;
  const end = (phrase: string, nth = 0) => words[find(phrase, nth)[1]].end;
  const f = (sec: number) => Math.round(sec * FPS);
  return { at, end, f, words };
};
