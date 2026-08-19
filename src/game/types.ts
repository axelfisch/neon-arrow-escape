export type Dir = "up" | "down" | "left" | "right";

export type Tier =
  | "initiate"
  | "easy"
  | "normal"
  | "hard"
  | "expert"
  | "master"
  | "defi";

export type Cell = { c: number; r: number };

export type Piece = {
  id: string;
  path: Cell[];
  dir: Dir;
  color: number;
};

export type LevelDef = {
  id: number;
  key: string;
  name: string;
  nameFr: string;
  tier: Tier;
  w: number;
  h: number;
  hearts: number;
  pieces: Piece[];
  solution: string[];
  difficulty: number;
  arrowCount: number;
  cellCount: number;
  par: number;
  hints: number;
  undos: number;
};

export type Progress = {
  version: number;
  completed: number[];
  stars: Record<string, number>;
  bestMoves: Record<string, number>;
  bestTime: Record<string, number>;
  dailyKey: string | null;
  dailyWon: boolean;
  dailyStars: number;
  endlessBest: number;
  lang: "fr" | "en";
  sound: boolean;
  inspect: boolean;
};

export const DIRS: Dir[] = ["up", "down", "left", "right"];

export const DELTA: Record<Dir, { dc: number; dr: number }> = {
  up: { dc: 0, dr: -1 },
  down: { dc: 0, dr: 1 },
  left: { dc: -1, dr: 0 },
  right: { dc: 1, dr: 0 },
};

export const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export const TURN_LEFT: Record<Dir, Dir> = {
  up: "left",
  left: "down",
  down: "right",
  right: "up",
};

export const TURN_RIGHT: Record<Dir, Dir> = {
  up: "right",
  right: "down",
  down: "left",
  left: "up",
};

export const PIECE_COLORS = [
  "#00d4ff",
  "#ffb020",
  "#ff4d8d",
  "#3dff9a",
  "#ff7a3d",
  "#7aa2ff",
  "#2ee6c7",
  "#ff5c5c",
] as const;

export const TIER_ORDER: Tier[] = [
  "initiate",
  "easy",
  "normal",
  "hard",
  "expert",
  "master",
  "defi",
];

export const DEFAULT_PROGRESS: Progress = {
  version: 1,
  completed: [],
  stars: {},
  bestMoves: {},
  bestTime: {},
  dailyKey: null,
  dailyWon: false,
  dailyStars: 0,
  endlessBest: 0,
  lang: "fr",
  sound: true,
  inspect: false,
};

export function cellKey(c: number, r: number): string {
  return `${c},${r}`;
}
