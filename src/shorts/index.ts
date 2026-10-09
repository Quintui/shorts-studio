import type React from "react";

export type ShortDef = { id: string; component: React.FC; duration: number };

/**
 * Every short registered here shows up in Remotion Studio and can be rendered
 * with `npm run render -- <id>`. scripts/new_short.py appends to this list.
 */
export const shorts: ShortDef[] = [
  // @new-short-entries
];
