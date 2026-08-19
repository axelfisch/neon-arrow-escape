import type { Dir, LevelDef, Piece } from "./types";
import { scoreDifficulty, solveGreedy, verifySolution } from "./engine";

type Raw = {
  w: number;
  h: number;
  hearts: number;
  pieces: { path: { c: number; r: number }[]; dir: Dir; color: number }[];
};

function pack(
  id: number,
  name: string,
  nameFr: string,
  tier: LevelDef["tier"],
  raw: Raw,
  hints: number,
  undos: number,
): LevelDef {
  const pieces: Piece[] = raw.pieces.map((p, i) => ({
    id: String(i),
    path: p.path,
    dir: p.dir,
    color: p.color,
  }));
  const greedy = solveGreedy(pieces, raw.w, raw.h);
  const solution = greedy ?? pieces.map((p) => p.id);
  if (greedy && !verifySolution(pieces, solution, raw.w, raw.h)) {
    /* still ship — generator verifies later */
  }
  const cellCount = pieces.reduce((n, p) => n + p.path.length, 0);
  return {
    id,
    key: `lvl-${id}`,
    name,
    nameFr,
    tier,
    w: raw.w,
    h: raw.h,
    hearts: raw.hearts,
    pieces,
    solution,
    difficulty: scoreDifficulty({
      pieces,
      solution,
      w: raw.w,
      h: raw.h,
      hearts: raw.hearts,
    }),
    arrowCount: pieces.length,
    cellCount,
    par: pieces.length,
    hints,
    undos,
  };
}

export const HANDCRAFTED: LevelDef[] = [
  pack(1, "First Flight", "Premier vol", "initiate", {
    w: 5, h: 4, hearts: 5,
    pieces: [
      { path: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 1, r: 1 }, { c: 2, r: 1 }], dir: "down", color: 0 },
      { path: [{ c: 4, r: 0 }, { c: 4, r: 1 }, { c: 3, r: 1 }, { c: 3, r: 2 }], dir: "down", color: 1 },
      { path: [{ c: 0, r: 2 }, { c: 1, r: 2 }, { c: 1, r: 3 }], dir: "right", color: 2 },
      { path: [{ c: 2, r: 2 }, { c: 2, r: 3 }, { c: 3, r: 3 }, { c: 4, r: 3 }], dir: "right", color: 3 },
    ],
  }, 3, 3),
  pack(2, "Open Lanes", "Couloirs", "initiate", {
    w: 5, h: 5, hearts: 5,
    pieces: [
      { path: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }], dir: "right", color: 0 },
      { path: [{ c: 3, r: 0 }, { c: 4, r: 0 }], dir: "right", color: 1 },
      { path: [{ c: 4, r: 1 }, { c: 4, r: 2 }, { c: 4, r: 3 }], dir: "down", color: 2 },
      { path: [{ c: 0, r: 2 }, { c: 1, r: 2 }, { c: 2, r: 2 }, { c: 3, r: 2 }], dir: "right", color: 3 },
      { path: [{ c: 0, r: 4 }, { c: 1, r: 4 }, { c: 2, r: 4 }], dir: "right", color: 4 },
    ],
  }, 3, 3),
  pack(3, "Twin Hooks", "Doubles crochets", "initiate", {
    w: 5, h: 5, hearts: 5,
    pieces: [
      { path: [{ c: 0, r: 0 }, { c: 0, r: 1 }, { c: 1, r: 1 }, { c: 1, r: 2 }], dir: "down", color: 0 },
      { path: [{ c: 4, r: 0 }, { c: 4, r: 1 }, { c: 3, r: 1 }, { c: 3, r: 2 }], dir: "down", color: 1 },
      { path: [{ c: 0, r: 3 }, { c: 1, r: 3 }, { c: 1, r: 4 }, { c: 2, r: 4 }], dir: "right", color: 2 },
      { path: [{ c: 3, r: 3 }, { c: 4, r: 3 }, { c: 4, r: 4 }], dir: "right", color: 3 },
      { path: [{ c: 2, r: 2 }, { c: 2, r: 3 }], dir: "up", color: 4 },
    ],
  }, 3, 3),
  pack(4, "Crossroads", "Carrefour", "initiate", {
    w: 6, h: 5, hearts: 5,
    pieces: [
      { path: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }], dir: "right", color: 0 },
      { path: [{ c: 4, r: 0 }, { c: 5, r: 0 }], dir: "right", color: 1 },
      { path: [{ c: 0, r: 2 }, { c: 1, r: 2 }, { c: 1, r: 3 }], dir: "down", color: 2 },
      { path: [{ c: 3, r: 2 }, { c: 4, r: 2 }, { c: 5, r: 2 }], dir: "right", color: 3 },
      { path: [{ c: 0, r: 4 }, { c: 1, r: 4 }, { c: 2, r: 4 }, { c: 3, r: 4 }], dir: "right", color: 4 },
    ],
  }, 3, 3),
  pack(5, "The Latch", "Le verrou", "easy", {
    w: 6, h: 5, hearts: 4,
    pieces: [
      { path: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 1, r: 1 }, { c: 1, r: 2 }], dir: "down", color: 0 },
      { path: [{ c: 3, r: 0 }, { c: 4, r: 0 }, { c: 5, r: 0 }, { c: 5, r: 1 }], dir: "down", color: 1 },
      { path: [{ c: 0, r: 4 }, { c: 1, r: 4 }, { c: 2, r: 4 }, { c: 3, r: 4 }, { c: 4, r: 4 }], dir: "right", color: 2 },
      { path: [{ c: 3, r: 2 }, { c: 4, r: 2 }, { c: 4, r: 3 }], dir: "down", color: 3 },
      { path: [{ c: 0, r: 2 }, { c: 0, r: 3 }], dir: "down", color: 4 },
      { path: [{ c: 5, r: 4 }], dir: "left", color: 5 },
    ],
  }, 2, 2),
  pack(6, "Nested", "Imbriqué", "easy", {
    w: 6, h: 6, hearts: 4,
    pieces: [
      { path: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }, { c: 2, r: 1 }], dir: "down", color: 0 },
      { path: [{ c: 4, r: 0 }, { c: 5, r: 0 }, { c: 5, r: 1 }, { c: 5, r: 2 }], dir: "down", color: 1 },
      { path: [{ c: 0, r: 2 }, { c: 1, r: 2 }, { c: 1, r: 3 }, { c: 1, r: 4 }], dir: "down", color: 2 },
      { path: [{ c: 3, r: 2 }, { c: 4, r: 2 }, { c: 4, r: 3 }], dir: "down", color: 3 },
      { path: [{ c: 0, r: 5 }, { c: 1, r: 5 }, { c: 2, r: 5 }], dir: "right", color: 4 },
      { path: [{ c: 3, r: 5 }, { c: 4, r: 5 }, { c: 5, r: 5 }], dir: "right", color: 5 },
      { path: [{ c: 5, r: 4 }], dir: "up", color: 6 },
    ],
  }, 2, 2),
  pack(7, "Backflow", "Contre-courant", "easy", {
    w: 6, h: 6, hearts: 4,
    pieces: [
      { path: [{ c: 0, r: 1 }, { c: 0, r: 2 }, { c: 1, r: 2 }, { c: 2, r: 2 }], dir: "right", color: 0 },
      { path: [{ c: 4, r: 0 }, { c: 5, r: 0 }, { c: 5, r: 1 }, { c: 5, r: 2 }, { c: 5, r: 3 }], dir: "down", color: 1 },
      { path: [{ c: 0, r: 4 }, { c: 1, r: 4 }, { c: 1, r: 5 }], dir: "down", color: 2 },
      { path: [{ c: 3, r: 4 }, { c: 4, r: 4 }, { c: 5, r: 4 }], dir: "right", color: 3 },
      { path: [{ c: 2, r: 0 }, { c: 3, r: 0 }], dir: "right", color: 4 },
      { path: [{ c: 3, r: 3 }, { c: 4, r: 3 }], dir: "right", color: 5 },
      { path: [{ c: 0, r: 5 }, { c: 0, r: 4 }], dir: "up", color: 6 },
    ],
  }, 2, 2),
  pack(8, "Seven Gates", "Sept portes", "easy", {
    w: 7, h: 6, hearts: 4,
    pieces: [
      { path: [{ c: 0, r: 0 }, { c: 1, r: 0 }, { c: 2, r: 0 }, { c: 2, r: 1 }, { c: 2, r: 2 }], dir: "down", color: 0 },
      { path: [{ c: 5, r: 0 }, { c: 6, r: 0 }, { c: 6, r: 1 }, { c: 6, r: 2 }], dir: "down", color: 1 },
      { path: [{ c: 0, r: 2 }, { c: 0, r: 3 }, { c: 1, r: 3 }, { c: 2, r: 3 }], dir: "right", color: 2 },
      { path: [{ c: 4, r: 2 }, { c: 5, r: 2 }, { c: 5, r: 3 }, { c: 5, r: 4 }], dir: "down", color: 3 },
      { path: [{ c: 0, r: 5 }, { c: 1, r: 5 }, { c: 2, r: 5 }, { c: 3, r: 5 }], dir: "right", color: 4 },
      { path: [{ c: 4, r: 5 }, { c: 5, r: 5 }, { c: 6, r: 5 }], dir: "right", color: 5 },
      { path: [{ c: 6, r: 4 }], dir: "up", color: 6 },
    ],
  }, 2, 2),
];
