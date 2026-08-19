import {
  type Cell,
  type Dir,
  type Piece,
  DIRS,
  DELTA,
  OPPOSITE,
  TURN_LEFT,
  TURN_RIGHT,
  cellKey,
} from "./types";
import { mulberry32, pick, randInt } from "./rng";
import {
  canRemove,
  occupancy,
  scoreDifficulty,
  verifySolution,
  walkRay,
} from "./engine";

export type ShapeKind = "dot" | "straight" | "L" | "U" | "S" | "zigzag" | "spiral";

export type GenOpts = {
  w: number;
  h: number;
  count: number;
  seed: number;
  minLen: number;
  maxLen: number;
  shapes: ShapeKind[];
  hardness: number;
};

function inBounds(c: number, r: number, w: number, h: number) {
  return c >= 0 && c < w && r >= 0 && r < h;
}

function step(cell: Cell, dir: Dir): Cell {
  const d = DELTA[dir];
  return { c: cell.c + d.dc, r: cell.r + d.dr };
}

function depthOf(cell: Cell, dir: Dir, w: number, h: number): number {
  switch (dir) {
    case "right":
      return w - 1 - cell.c;
    case "left":
      return cell.c;
    case "down":
      return h - 1 - cell.r;
    case "up":
      return cell.r;
  }
}

function rayClear(cell: Cell, dir: Dir, w: number, h: number, occ: Set<string>) {
  return walkRay(cell, dir, w, h, occ).blocked === null;
}

function growPath(
  head: Cell,
  escape: Dir,
  kind: ShapeKind,
  targetLen: number,
  w: number,
  h: number,
  occ: Set<string>,
  rng: () => number,
): Cell[] {
  const path: Cell[] = [head];
  const used = new Set<string>([cellKey(head.c, head.r)]);
  let grow = OPPOSITE[escape];
  const turnAt = Math.max(1, Math.floor(targetLen * (0.35 + rng() * 0.3)));
  let turned = 0;

  for (let i = 1; i < targetLen; i++) {
    const last = path[path.length - 1]!;
    const tryDir = (d: Dir) => {
      const n = step(last, d);
      const k = cellKey(n.c, n.r);
      if (!inBounds(n.c, n.r, w, h) || occ.has(k) || used.has(k)) return null;
      return n;
    };

    let next: Cell | null = null;
    let nextDir = grow;

    if (kind === "straight") {
      next = tryDir(grow);
    } else if (kind === "L") {
      if (i === turnAt && turned === 0) {
        const side = rng() < 0.5 ? TURN_LEFT[grow] : TURN_RIGHT[grow];
        next = tryDir(side);
        if (next) {
          nextDir = side;
          turned = 1;
        }
      }
      if (!next) next = tryDir(grow);
    } else if (kind === "U") {
      if ((i === turnAt || i === turnAt + Math.max(1, Math.floor(targetLen / 4))) && turned < 2) {
        const side = turned === 0 ? TURN_LEFT[grow] : TURN_LEFT[grow];
        next = tryDir(side);
        if (next) {
          nextDir = side;
          turned++;
        }
      }
      if (!next) next = tryDir(grow);
    } else if (kind === "S" || kind === "zigzag") {
      if (i % Math.max(2, Math.floor(targetLen / 3)) === 0) {
        const side = turned % 2 === 0 ? TURN_LEFT[grow] : TURN_RIGHT[grow];
        next = tryDir(side);
        if (next) {
          nextDir = side;
          turned++;
        }
      }
      if (!next) next = tryDir(grow);
    } else if (kind === "spiral") {
      const prefer = [grow, TURN_RIGHT[grow], TURN_LEFT[grow], OPPOSITE[grow]];
      for (const d of prefer) {
        const n = tryDir(d);
        if (n) {
          next = n;
          nextDir = d;
          if (d !== grow) turned++;
          break;
        }
      }
    } else {
      next = tryDir(grow);
    }

    if (!next) {
      const sides = [TURN_LEFT[grow], TURN_RIGHT[grow], grow, OPPOSITE[escape]];
      for (const d of sides) {
        const n = tryDir(d);
        if (n) {
          next = n;
          nextDir = d;
          break;
        }
      }
    }
    if (!next) break;
    path.push(next);
    used.add(cellKey(next.c, next.r));
    grow = nextDir;
  }
  return path;
}

function blockScoreMap(pieces: Piece[], w: number, h: number, occ: Set<string>) {
  const score = new Map<string, number>();
  for (const p of pieces) {
    if (!canRemove(p, pieces, w, h)) continue;
    const faceCs =
      p.dir === "right"
        ? [Math.max(...p.path.map((c) => c.c))]
        : p.dir === "left"
          ? [Math.min(...p.path.map((c) => c.c))]
          : null;
    const faceRs =
      p.dir === "down"
        ? [Math.max(...p.path.map((c) => c.r))]
        : p.dir === "up"
          ? [Math.min(...p.path.map((c) => c.r))]
          : null;
    const faces = p.path.filter((cell) => {
      if (faceCs) return faceCs.includes(cell.c);
      return faceRs!.includes(cell.r);
    });
    for (const e of faces) {
      const ray = walkRay(e, p.dir, w, h, occ);
      for (const cell of ray.cells) {
        const k = cellKey(cell.c, cell.r);
        score.set(k, (score.get(k) ?? 0) + 1);
      }
    }
  }
  return score;
}

export function generatePuzzle(opts: GenOpts): {
  pieces: Piece[];
  solution: string[];
} | null {
  const rng = mulberry32(opts.seed);
  const { w, h, count } = opts;
  const occ = new Set<string>();
  const pieces: Piece[] = [];

  let guard = 0;
  const maxGuard = count * 40;

  while (pieces.length < count && guard++ < maxGuard) {
    const kind = pick(rng, opts.shapes);
    const dir = pick(rng, DIRS);
    const wantLen =
      kind === "dot" ? 1 : randInt(rng, opts.minLen, opts.maxLen);

    const heads: Cell[] = [];
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (occ.has(cellKey(c, r))) continue;
        if (rayClear({ c, r }, dir, w, h, occ)) heads.push({ c, r });
      }
    }
    if (!heads.length) continue;

    const blockMap = blockScoreMap(pieces, w, h, occ);
    let bestHead = heads[0]!;
    let best = -1;
    const sample = heads.length > 64 ? heads.filter(() => rng() < 64 / heads.length) : heads;
    for (const hd of sample.length ? sample : heads) {
      const block = blockMap.get(cellKey(hd.c, hd.r)) ?? 0;
      const depth = depthOf(hd, dir, w, h);
      const s = block * 12 * opts.hardness + depth * (0.4 + opts.hardness) + rng() * 0.4;
      if (s > best) {
        best = s;
        bestHead = hd;
      }
    }

    const path =
      kind === "dot"
        ? [bestHead]
        : growPath(bestHead, dir, kind, wantLen, w, h, occ, rng);
    if (!path.length) continue;

    const temp: Piece = {
      id: String(pieces.length),
      path,
      dir,
      color: pieces.length % 8,
    };
    if (!canRemove(temp, pieces, w, h)) continue;

    for (const cell of path) occ.add(cellKey(cell.c, cell.r));
    pieces.push(temp);
  }

  if (pieces.length < Math.max(3, Math.floor(count * 0.85))) return null;
  const solution = pieces.map((p) => p.id).reverse();
  if (!verifySolution(pieces, solution, w, h)) return null;
  return { pieces, solution };
}

export function generateWithRetry(
  opts: GenOpts,
  attempts = 10,
): { pieces: Piece[]; solution: string[] } | null {
  for (let i = 0; i < attempts; i++) {
    const got = generatePuzzle({ ...opts, seed: (opts.seed + i * 9973) >>> 0 });
    if (got) return got;
  }
  return null;
}

export function makeLevelFromGen(
  meta: {
    id: number;
    key: string;
    name: string;
    nameFr: string;
    tier: import("./types").Tier;
    hearts: number;
    hints: number;
    undos: number;
  },
  opts: GenOpts,
): import("./types").LevelDef | null {
  const got = generateWithRetry(opts, 12);
  if (!got) return null;
  const difficulty = scoreDifficulty({
    pieces: got.pieces,
    solution: got.solution,
    w: opts.w,
    h: opts.h,
    hearts: meta.hearts,
  });
  const cellCount = got.pieces.reduce((n, p) => n + p.path.length, 0);
  return {
    ...meta,
    w: opts.w,
    h: opts.h,
    pieces: got.pieces,
    solution: got.solution,
    difficulty,
    arrowCount: got.pieces.length,
    cellCount,
    par: got.pieces.length,
  };
}

export function dailySeed(date = new Date()): { key: string; seed: number } {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const key = `${y}-${m}-${d}`;
  let seed = 2166136261;
  for (let i = 0; i < key.length; i++) {
    seed ^= key.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return { key, seed: seed >>> 0 };
}

export function generateDaily(date = new Date()) {
  const { key, seed } = dailySeed(date);
  const level = makeLevelFromGen(
    {
      id: 0,
      key: `daily-${key}`,
      name: `Daily ${key}`,
      nameFr: `Défi du jour ${key}`,
      tier: "defi",
      hearts: 2,
      hints: 1,
      undos: 1,
    },
    {
      w: 12,
      h: 12,
      count: 72,
      seed,
      minLen: 1,
      maxLen: 4,
      shapes: ["dot", "straight", "L", "zigzag"],
      hardness: 0.92,
    },
  );
  return { key, level };
}

export function generateEndless(wave: number, seed: number) {
  const size = Math.min(18, 6 + Math.floor(wave / 3));
  const count = Math.min(size * size - 4, 8 + wave * 4 + Math.floor(wave * wave * 0.35));
  const hardness = Math.min(1, 0.35 + wave * 0.05);
  const hearts = wave < 4 ? 5 : wave < 8 ? 3 : wave < 14 ? 2 : 1;
  return makeLevelFromGen(
    {
      id: wave,
      key: `endless-${wave}`,
      name: `Wave ${wave}`,
      nameFr: `Vague ${wave}`,
      tier: wave < 5 ? "normal" : wave < 10 ? "hard" : wave < 16 ? "expert" : "defi",
      hearts,
      hints: wave < 8 ? 2 : 1,
      undos: wave < 10 ? 2 : 0,
    },
    {
      w: size,
      h: size,
      count,
      seed: (seed + wave * 7919) >>> 0,
      minLen: 1,
      maxLen: wave < 6 ? 3 : 5,
      shapes:
        wave < 3
          ? ["dot", "straight"]
          : wave < 8
            ? ["dot", "straight", "L"]
            : ["dot", "straight", "L", "S", "zigzag"],
      hardness,
    },
  );
}
