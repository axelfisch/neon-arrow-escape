import { canRemove } from "./engine";
import type { LevelDef, Piece } from "./types";

type Snapshot = { pieces: Piece[]; hearts: number; moves: number; mistakes: number };
export type Session = Snapshot & {
  hintsLeft: number;
  hintsUsed: number;
  undosLeft: number;
  history: Snapshot[];
};
export function createSession(level: LevelDef): Session {
  return {
    pieces: level.pieces,
    hearts: level.hearts,
    moves: 0,
    mistakes: 0,
    hintsLeft: level.hints,
    hintsUsed: 0,
    undosLeft: level.undos,
    history: [],
  };
}
export function moveSession(state: Session, id: string, level: LevelDef): Session {
  if (state.hearts <= 0 || !state.pieces.length) return state;
  const piece = state.pieces.find((p) => p.id === id);
  if (!piece) return state;
  const clear = canRemove(piece, state.pieces, level.w, level.h);
  const { pieces, hearts, moves, mistakes } = state;
  return {
    ...state,
    history: [...state.history, { pieces, hearts, moves, mistakes }],
    moves: moves + 1,
    pieces: clear ? pieces.filter((p) => p.id !== id) : pieces,
    hearts: clear ? hearts : hearts - 1,
    mistakes: clear ? mistakes : mistakes + 1,
  };
}
export function undoSession(state: Session): Session {
  const snapshot = state.history[state.history.length - 1];
  if (!snapshot || state.undosLeft <= 0) return state;
  return {
    ...state,
    ...snapshot,
    undosLeft: state.undosLeft - 1,
    history: state.history.slice(0, -1),
  };
}
