// Converted level geometry: Copyright (c) 2026 Umang, MIT.
// See THIRD_PARTY_NOTICES.md and public/licenses/arrow-escape-MIT.txt.
import imported from "./complex-shapes.generated.json";
import { scoreDifficulty, solveGreedy } from "./engine";
import type { LevelDef, Piece, Tier } from "./types";

const order = [1, 3, 12, 4, 2, 13, 6, 18, 14, 7, 9, 8, 17, 10, 20, 11, 15, 16, 19, 21, 5];
const names = [
  ["Premier ruban", "First ribbon"],
  ["Lacets", "Switchbacks"],
  ["La boucle", "The loop"],
  ["Méandres", "Meanders"],
  ["Tissage", "Weave"],
  ["Contre-courant", "Counterflow"],
  ["Arabesques", "Arabesques"],
  ["Le grand détour", "The long way"],
  ["Entrelacs", "Interlace"],
  ["Courbes croisées", "Crossing curves"],
  ["La traversée", "The crossing"],
  ["Rubans libres", "Free ribbons"],
  ["Le dédale", "The maze"],
  ["Nœuds de lumière", "Knots of light"],
  ["Le passage", "The passage"],
  ["Échos", "Echoes"],
  ["La constellation", "Constellation"],
  ["L'envol", "Taking flight"],
  ["Le labyrinthe", "Labyrinth"],
  ["Cascade", "Cascade"],
  ["Deux grands serpents", "Two great snakes"],
];

export const COMPLEX_LEVELS: LevelDef[] = order.map((source, i) => {
  const raw = imported.find((l) => l.source === source)!;
  const pieces = raw.pieces as Piece[];
  const id = i === 20 ? 63 : i + 1;
  const tier: Tier = id === 63 ? "defi" : id <= 4 ? "initiate" : id <= 8 ? "easy" : "normal";
  const hearts = id <= 4 ? 5 : id <= 8 ? 4 : 3;
  const solution = solveGreedy(pieces, raw.w, raw.h);
  if (!solution) throw new Error(`Invalid imported level ${source}`);
  return {
    id,
    key: `lvl-${id}`,
    nameFr: names[i]![0]!,
    name: names[i]![1]!,
    tier,
    w: raw.w,
    h: raw.h,
    hearts,
    hints: id <= 8 ? 3 : 2,
    undos: id <= 8 ? 3 : 2,
    pieces,
    solution,
    arrowCount: pieces.length,
    cellCount: pieces.reduce((n, p) => n + p.path.length, 0),
    par: pieces.length,
    difficulty: scoreDifficulty({ pieces, solution, w: raw.w, h: raw.h, hearts }),
  };
});
