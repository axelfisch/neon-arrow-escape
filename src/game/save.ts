import { DEFAULT_PROGRESS, type Progress } from "./types";

const KEY = "neon-arrow-escape-v1";

/** Featured gauntlets — always playable so the 100/150/180 défis are reachable. */
export const FEATURED_UNLOCK = new Set([67, 68, 73, 74, 80]);

function migrate(raw: Partial<Progress> | null): Progress {
  const base = { ...DEFAULT_PROGRESS };
  if (!raw || typeof raw !== "object") return base;
  return {
    ...base,
    ...raw,
    version: 1,
    completed: Array.isArray(raw.completed) ? raw.completed.map(Number) : [],
    stars: raw.stars && typeof raw.stars === "object" ? raw.stars : {},
    bestMoves: raw.bestMoves && typeof raw.bestMoves === "object" ? raw.bestMoves : {},
    bestTime: raw.bestTime && typeof raw.bestTime === "object" ? raw.bestTime : {},
    lang: raw.lang === "en" ? "en" : "fr",
    sound: raw.sound !== false,
    inspect: raw.inspect !== false,
  };
}

export function loadProgress(): Progress {
  if (typeof window === "undefined") return { ...DEFAULT_PROGRESS };
  try {
    const raw = localStorage.getItem(KEY);
    return migrate(raw ? (JSON.parse(raw) as Partial<Progress>) : null);
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(p: Progress) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private mode */
  }
}

export function mergeProgress(a: Progress, b: Progress): Progress {
  const completed = Array.from(new Set([...a.completed, ...b.completed])).sort((x, y) => x - y);
  const stars = { ...a.stars };
  for (const [k, v] of Object.entries(b.stars)) {
    stars[k] = Math.max(stars[k] ?? 0, v);
  }
  const bestMoves = { ...a.bestMoves };
  for (const [k, v] of Object.entries(b.bestMoves)) {
    bestMoves[k] = bestMoves[k] == null ? v : Math.min(bestMoves[k]!, v);
  }
  const bestTime = { ...a.bestTime };
  for (const [k, v] of Object.entries(b.bestTime)) {
    bestTime[k] = bestTime[k] == null ? v : Math.min(bestTime[k]!, v);
  }
  return {
    ...a,
    completed,
    stars,
    bestMoves,
    bestTime,
    endlessBest: Math.max(a.endlessBest, b.endlessBest),
    dailyKey: b.dailyKey ?? a.dailyKey,
    dailyWon: a.dailyWon || b.dailyWon,
    dailyStars: Math.max(a.dailyStars, b.dailyStars),
  };
}

export function isUnlocked(id: number, completed: number[]): boolean {
  if (id <= 8) return true;
  if (FEATURED_UNLOCK.has(id)) return true;
  return completed.includes(id) || completed.includes(id - 1);
}

export function starsFor(mistakes: number, hintsUsed: number): number {
  if (mistakes === 0 && hintsUsed === 0) return 3;
  if (mistakes <= 1 && hintsUsed <= 1) return 2;
  return 1;
}
