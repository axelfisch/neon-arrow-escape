import type { LevelDef } from "./types";
import type { Session } from "./session";
import { readStored, writeStored } from "./storage";
const KEY = "neon-arrow-checkpoint-v1";
type SavedSnapshot = { ids: string[]; hearts: number; moves: number; mistakes: number };
export type Checkpoint = {
  version: 1;
  key: string;
  levelId: number;
  elapsed: number;
  state: SavedSnapshot &
    Pick<Session, "hintsLeft" | "hintsUsed" | "undosLeft"> & { history: SavedSnapshot[] };
};
const compact = (s: Pick<Session, "pieces" | "hearts" | "moves" | "mistakes">): SavedSnapshot => ({
  ids: s.pieces.map((p) => p.id),
  hearts: s.hearts,
  moves: s.moves,
  mistakes: s.mistakes,
});
export function readCheckpoint(): Checkpoint | null {
  try {
    const p = JSON.parse(readStored(KEY) ?? "null");
    return p?.version === 1 &&
      Number.isInteger(p.levelId) &&
      p.levelId > 0 &&
      p.levelId <= 80 &&
      typeof p.key === "string" &&
      p.state &&
      Array.isArray(p.state.ids)
      ? p
      : null;
  } catch {
    return null;
  }
}
export function saveCheckpoint(level: LevelDef, s: Session, elapsed: number) {
  if (level.id <= 0) return;
  if (!s.pieces.length) {
    clearCheckpoint(level.key);
    return;
  }
  const p: Checkpoint = {
    version: 1,
    key: level.key,
    levelId: level.id,
    elapsed: Math.max(0, elapsed),
    state: {
      ...compact(s),
      hintsLeft: s.hintsLeft,
      hintsUsed: s.hintsUsed,
      undosLeft: s.undosLeft,
      history: s.history.map(compact),
    },
  };
  writeStored(KEY, JSON.stringify(p));
}
export function clearCheckpoint(key?: string) {
  if (!key || readCheckpoint()?.key === key) writeStored(KEY, null);
}
export function restoreCheckpoint(level: LevelDef): { session: Session; elapsed: number } | null {
  const p = readCheckpoint();
  if (
    !p ||
    p.key !== level.key ||
    p.levelId !== level.id ||
    !Number.isFinite(p.elapsed) ||
    p.elapsed < 0
  )
    return null;
  const s = p.state,
    byId = new Map(level.pieces.map((p) => [p.id, p]));
  const integer = (n: number, max: number) => Number.isInteger(n) && n >= 0 && n <= max;
  const valid = (v: SavedSnapshot) =>
    v &&
    Array.isArray(v.ids) &&
    new Set(v.ids).size === v.ids.length &&
    v.ids.every((id) => byId.has(id)) &&
    integer(v.hearts, level.hearts) &&
    integer(v.mistakes, level.hearts) &&
    integer(v.moves, level.arrowCount + level.hearts) &&
    v.hearts === level.hearts - v.mistakes &&
    v.moves === level.arrowCount - v.ids.length + v.mistakes;
  if (
    !valid(s) ||
    !s.ids.length ||
    !Array.isArray(s.history) ||
    s.history.length > level.arrowCount + level.hearts ||
    !s.history.every(valid) ||
    !integer(s.hintsLeft, level.hints) ||
    !integer(s.hintsUsed, level.hints) ||
    s.hintsLeft + s.hintsUsed !== level.hints ||
    !integer(s.undosLeft, level.undos)
  )
    return null;
  const expand = (v: SavedSnapshot) => ({
    pieces: v.ids.map((id) => byId.get(id)!),
    hearts: v.hearts,
    moves: v.moves,
    mistakes: v.mistakes,
  });
  return {
    session: {
      ...expand(s),
      hintsLeft: s.hintsLeft,
      hintsUsed: s.hintsUsed,
      undosLeft: s.undosLeft,
      history: s.history.map(expand),
    },
    elapsed: p.elapsed,
  };
}
