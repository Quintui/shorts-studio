import type { SpeakerShot } from "./Speaker";
import type { Word } from "./timing";

/** Shape of the files scripts/prep_short.py writes to public/shorts/<name>/. */
export type ShortData = {
  words: { duration: number; clips: [number, number][]; words: Word[] };
  shot: SpeakerShot;
};
