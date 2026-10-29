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
import { mulberry32, pick, shuffle } from "./rng";
import { scoreDifficulty, verifySolution, walkRay, countTurns } from "./engine";

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

const SHAPE_WEIGHT: Record<ShapeKind, number> = {
  dot: 0.05,
  straight: 0.24,
  L: 0.32,
  zigzag: 0.18,
  S: 0.11,
  U: 0.06,
  spiral: 0.04,
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

/** Body must sit strictly behind the head so the exit face stays a single cell. */
function behindHead(cell: Cell, head: Cell, dir: Dir): boolean {
  switch (dir) {
    case "right":
      return cell.c < head.c;
    case "left":
      return cell.c > head.c;
    case "down":
      return cell.r < head.r;
    case "up":
      return cell.r > head.r;
  }
}

function rayClear(cell: Cell, dir: Dir, w: number, h: number, occ: Set<string>) {
  return walkRay(cell, dir, w, h, occ).blocked === null;
}

function neighborCount(cell: Cell, occ: Set<string>, used: Set<string>): number {
  let n = 0;
  for (const d of DIRS) {
    const s = step(cell, d);
    const k = cellKey(s.c, s.r);
    if (occ.has(k) || used.has(k)) n++;
  }
  return n;
}

function pickKind(rng: () => number, shapes: ShapeKind[], allowDot: boolean): ShapeKind {
  const pool = (allowDot ? shapes : shapes.filter((s) => s !== "dot")).filter(Boolean);
  const use = pool.length ? pool : shapes;
  const weighted = use.map((s) => ({ s, w: SHAPE_WEIGHT[s] ?? 0.1 }));
  const sum = weighted.reduce((a, x) => a + x.w, 0);
  let r = rng() * sum;
  for (const x of weighted) {
    r -= x.w;
    if (r <= 0) return x.s;
  }
  return use[0]!;
}

function pickBalancedDir(rng: () => number, counts: Record<Dir, number>): Dir {
  const min = Math.min(...DIRS.map((d) => counts[d]));
  const under = DIRS.filter((d) => counts[d] <= min + 1);
  if (rng() < 0.85) return pick(rng, under);
  return pick(rng, DIRS);
}

/**
 * Grow a 1-cell-wide snake from the head into empty space.
 * Never steps past the head in the escape direction — unique exit face.
 * Prefers tight packing (cells hugging occupied neighbors) like Unity levels.
 */
function growSnake(
  head: Cell,
  escape: Dir,
  kind: ShapeKind,
  targetLen: number,
  w: number,
  h: number,
  occ: Set<string>,
  rng: () => number,
): Cell[] {
  if (kind === "dot" || targetLen <= 1) return [head];

  const path: Cell[] = [head];
  const used = new Set<string>([cellKey(head.c, head.r)]);
  let grow = OPPOSITE[escape];
  const turnAt = Math.max(2, Math.floor(targetLen * (0.38 + rng() * 0.32)));
  let turned = 0;

  const tryCell = (from: Cell, d: Dir): Cell | null => {
    const n = step(from, d);
    const k = cellKey(n.c, n.r);
    if (!inBounds(n.c, n.r, w, h) || occ.has(k) || used.has(k)) return null;
    if (!behindHead(n, head, escape)) return null;
    return n;
  };

  const orderFor = (i: number): Dir[] => {
    const left = TURN_LEFT[grow];
    const right = TURN_RIGHT[grow];
    if (i === 1) return [OPPOSITE[escape], left, right];
    if (kind === "straight") return [grow, left, right];
    if (kind === "L") {
      if (i === turnAt && turned === 0) return rng() < 0.5 ? [left, grow, right] : [right, grow, left];
      return [grow, left, right];
    }
    if (kind === "U") {
      if (turned < 2 && (i === turnAt || i === turnAt + Math.max(1, Math.floor(targetLen / 4)))) {
        return [left, grow, right];
      }
      return [grow, left, right];
    }
    if (kind === "S" || kind === "zigzag") {
      const period = Math.max(2, Math.floor(targetLen / 3));
      if (i % period === 0) {
        const side = turned % 2 === 0 ? left : right;
        return [side, grow, side === left ? right : left];
      }
      return [grow, left, right];
    }
    if (kind === "spiral") {
      return [TURN_RIGHT[grow], grow, TURN_LEFT[grow]];
    }
    return [grow, left, right];
  };

  for (let i = 1; i < targetLen; i++) {
    const last = path[path.length - 1]!;
    const dirs = orderFor(i);
    const candidates: { cell: Cell; dir: Dir; tight: number }[] = [];
    for (const d of dirs) {
      const n = tryCell(last, d);
      if (!n) continue;
      let tight = neighborCount(n, occ, used);
      // Prefer cells that can still continue (space-filling, fewer dead ends).
      const canGo = DIRS.some((nd) => tryCell(n, nd));
      if (canGo) tight += 0.35;
      candidates.push({ cell: n, dir: d, tight });
    }
    if (!candidates.length) break;
    candidates.sort((a, b) => b.tight - a.tight + (rng() - 0.5) * 0.12);
    const chosen = candidates[0]!;
    if (chosen.dir !== grow) turned++;
    path.push(chosen.cell);
    used.add(cellKey(chosen.cell.c, chosen.cell.r));
    grow = chosen.dir;
  }
  return path;
}

function blockScoreMap(pieces: Piece[], w: number, h: number, occ: Set<string>) {
  const score = new Map<string, number>();
  for (const p of pieces) {
    const head = p.path[0];
    if (!head) continue;
    const ray = walkRay(head, p.dir, w, h, occ);
    if (ray.blocked) continue;
    for (const cell of ray.cells) {
      const k = cellKey(cell.c, cell.r);
      score.set(k, (score.get(k) ?? 0) + 1);
    }
  }
  return score;
}

function absorbPockets(
  path: Cell[],
  head: Cell,
  escape: Dir,
  occ: Set<string>,
  w: number,
  h: number,
) {
  const used = new Set(path.map((c) => cellKey(c.c, c.r)));
  let guard = 0;
  while (guard++ < w * h) {
    const tail = path[path.length - 1]!;
    const occ2 = new Set(occ);
    for (const k of used) occ2.add(k);
    let found: Cell | null = null;
    for (const d of DIRS) {
      const n = step(tail, d);
      const k = cellKey(n.c, n.r);
      if (!inBounds(n.c, n.r, w, h) || occ2.has(k)) continue;
      if (!behindHead(n, head, escape)) continue;
      const canBePiece = DIRS.some((ed) => rayClear(n, ed, w, h, occ2));
      if (canBePiece) continue;
      found = n;
      break;
    }
    if (!found) break;
    path.push(found);
    used.add(cellKey(found.c, found.r));
  }
}

function uniqueFace(path: Cell[], dir: Dir): boolean {
  if (!path.length) return false;
  return path.slice(1).every(cell => behindHead(cell, path[0]!, dir));
}

function collectHeads(
  dir: Dir,
  w: number,
  h: number,
  occ: Set<string>,
  needNeck: boolean,
): Cell[] {
  const heads: Cell[] = [];
  const back = OPPOSITE[dir];
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (occ.has(cellKey(c, r))) continue;
      const head = { c, r };
      if (!rayClear(head, dir, w, h, occ)) continue;
      if (needNeck) {
        const neck = step(head, back);
        const k = cellKey(neck.c, neck.r);
        if (!inBounds(neck.c, neck.r, w, h) || occ.has(k) || !behindHead(neck, head, dir)) continue;
      }
      heads.push(head);
    }
  }
  return heads;
}

function scoreHead(
  hd: Cell,
  dir: Dir,
  w: number,
  h: number,
  occ: Set<string>,
  blockMap: Map<string, number>,
  hardness: number,
  rng: () => number,
): number {
  const block = blockMap.get(cellKey(hd.c, hd.r)) ?? 0;
  const depth = depthOf(hd, dir, w, h);
  const hug = neighborCount(hd, occ, new Set());
  return block * 16 * hardness + depth * (0.4 + hardness) + hug * 2.1 + rng() * 0.45;
}

function onEscapeRay(cell: Cell, head: Cell, dir: Dir): boolean {
  switch (dir) {
    case "right":
      return cell.r === head.r && cell.c > head.c;
    case "left":
      return cell.r === head.r && cell.c < head.c;
    case "down":
      return cell.c === head.c && cell.r > head.r;
    case "up":
      return cell.c === head.c && cell.r < head.r;
  }
}

/** Grow tails into empty crevices without blocking pieces that must leave first. */
function densifyGrow(
  pieces: Piece[],
  occ: Set<string>,
  w: number,
  h: number,
  rng: () => number,
) {
  let guard = 0;
  const max = w * h;
  while (guard++ < max) {
    let grew = false;
    const order = shuffle(rng, pieces);
    for (const p of order) {
      const head = p.path[0];
      if (!head) continue;
      const tail = p.path[p.path.length - 1]!;
      const pid = Number(p.id);
      const dirs = shuffle(rng, DIRS);
      for (const d of dirs) {
        const n = step(tail, d);
        const k = cellKey(n.c, n.r);
        if (!inBounds(n.c, n.r, w, h) || occ.has(k)) continue;
        if (!behindHead(n, head, p.dir)) continue;
        let blocksLater = false;
        for (const q of pieces) {
          if (Number(q.id) <= pid) continue;
          const qh = q.path[0];
          if (qh && onEscapeRay(n, qh, q.dir)) {
            blocksLater = true;
            break;
          }
        }
        if (blocksLater) continue;
        p.path.push(n);
        occ.add(k);
        grew = true;
        break;
      }
    }
    if (!grew) break;
  }
}

function tryPlaceFromHeads(
  dir: Dir,
  kind: ShapeKind,
  wantLen: number,
  w: number,
  h: number,
  occ: Set<string>,
  pieces: Piece[],
  hardness: number,
  rng: () => number,
  needNeck: boolean,
): Cell[] | null {
  const heads = collectHeads(dir, w, h, occ, needNeck);
  if (!heads.length) return null;

  const blockMap = pieces.length && hardness > 0.3 ? blockScoreMap(pieces, w, h, occ) : new Map();
  const priority = blockMap.size
    ? heads.filter((hd) => (blockMap.get(cellKey(hd.c, hd.r)) ?? 0) > 0)
    : [];
  const pool = priority.length >= 6 ? priority : heads;
  const cap = 56;
  const sample = pool.length > cap ? pool.filter(() => rng() < cap / pool.length) : pool;
  const use = sample.length ? sample : pool;

  let bestHead = use[0]!;
  let best = -Infinity;
  for (const hd of use) {
    const s = scoreHead(hd, dir, w, h, occ, blockMap, hardness, rng);
    if (s > best) {
      best = s;
      bestHead = hd;
    }
  }
  const path = growSnake(bestHead, dir, kind, wantLen, w, h, occ, rng);
  return path.length ? path : null;
}

export function generatePuzzle(opts: GenOpts): {
  pieces: Piece[];
  solution: string[];
} | null {
  const rng = mulberry32(opts.seed);
  const { w, h, count } = opts;
  const occ = new Set<string>();
  const pieces: Piece[] = [];
  const area = w * h;
  const dirCounts: Record<Dir, number> = { up: 0, down: 0, left: 0, right: 0 };

  let guard = 0;
  const maxGuard = count * 50 + 40;
  const longN = Math.max(3, Math.floor(count * 0.18));
  const longCellBudget = Math.floor(area * 0.38);

  const place = (path: Cell[], dir: Dir): boolean => {
    if (!path.length || !uniqueFace(path, dir)) return false;
    const temp: Piece = {
      id: String(pieces.length),
      path,
      dir,
      color: pieces.length % 8,
    };
    for (const cell of path) occ.add(cellKey(cell.c, cell.r));
    pieces.push(temp);
    dirCounts[dir]++;
    return true;
  };

  while (pieces.length < count && guard++ < maxGuard) {
    const remaining = count - pieces.length;
    const empty = area - occ.size;
    if (empty <= 0) break;
    const budget = empty / remaining;
    const reserve = Math.ceil((remaining - 1) * 1.08);
    const maxNow = Math.max(1, empty - reserve);

    const dir = pickBalancedDir(rng, dirCounts);
    const longPhase =
      pieces.length < longN && occ.size < longCellBudget && budget >= 1.95 && maxNow >= 3;
    const allowDot = !longPhase && (budget < 1.65 || maxNow === 1);
    const kind = pickKind(rng, opts.shapes, allowDot);

    let wantLen: number;
    if (longPhase) {
      wantLen = Math.min(opts.maxLen, maxNow, Math.max(3, Math.round(3 + rng() * 3)));
    } else if (maxNow >= 2 && budget >= 1.7) {
      wantLen = rng() < 0.18 && maxNow >= 3 && budget >= 2.1 ? 3 : 2;
    } else {
      wantLen = 1;
    }
    wantLen = Math.min(wantLen, maxNow, opts.maxLen);
    if (remaining >= empty) wantLen = 1;
    else if (remaining * 1.55 >= empty) wantLen = Math.min(wantLen, 2);
    if (kind === "dot") wantLen = 1;

    const needNeck = wantLen >= 2;
    let path = tryPlaceFromHeads(dir, kind, wantLen, w, h, occ, pieces, opts.hardness, rng, needNeck);
    let usedDir = dir;
    if (!path) {
      for (const d of shuffle(rng, DIRS.filter((x) => x !== dir))) {
        path = tryPlaceFromHeads(d, kind, wantLen, w, h, occ, pieces, opts.hardness, rng, needNeck);
        if (path) {
          usedDir = d;
          break;
        }
      }
    }
    if (!path && wantLen >= 2) {
      path = tryPlaceFromHeads(dir, "L", 2, w, h, occ, pieces, opts.hardness, rng, true);
      usedDir = dir;
    }
    if (!path) {
      for (const d of shuffle(rng, DIRS)) {
        path = tryPlaceFromHeads(d, "dot", 1, w, h, occ, pieces, opts.hardness, rng, false);
        if (path) {
          usedDir = d;
          break;
        }
      }
    }
    if (!path) continue;
    absorbPockets(path, path[0]!, usedDir, occ, w, h);
    place(path, usedDir);
  }

  if (pieces.length < count) {
    const cells: Cell[] = [];
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (!occ.has(cellKey(c, r))) cells.push({ c, r });
      }
    }
    const shuffledCells = shuffle(rng, cells);
    const need = count - pieces.length;
    const leftoverWant = need * 2 > shuffledCells.length ? 2 : 3;
    for (const head of shuffledCells) {
      if (pieces.length >= count) break;
      if (occ.has(cellKey(head.c, head.r))) continue;
      const dirs = shuffle(rng, DIRS);
      let placed = false;
      for (const dir of dirs) {
        if (!rayClear(head, dir, w, h, occ)) continue;
        const knd = pickKind(
          rng,
          opts.shapes.filter((s) => s !== "dot"),
          false,
        );
        const path = growSnake(head, dir, knd || "L", leftoverWant, w, h, occ, rng);
        if (path.length >= 1 && uniqueFace(path, dir)) {
          place(path, dir);
          placed = true;
          break;
        }
      }
      if (placed) continue;
      for (const dir of dirs) {
        if (pieces.length >= count) break;
        if (!rayClear(head, dir, w, h, occ)) continue;
        place([head], dir);
        break;
      }
    }
  }

  densifyGrow(pieces, occ, w, h, rng);

  if (pieces.length < Math.max(3, Math.floor(count * 0.85))) return null;
  const solution = pieces.map((p) => p.id).reverse();
  if (!verifySolution(pieces, solution, w, h)) return null;
  return { pieces, solution };
}

export function puzzleQuality(
  pieces: Piece[],
  opts: Pick<GenOpts, "count" | "w" | "h">,
): number {
  const st = pieceStats(pieces);
  const dirVals = Object.values(st.dirs);
  const bias = Math.max(...dirVals) / Math.max(1, st.count);
  const countScore = Math.min(1, st.count / Math.max(1, opts.count));
  const curveScore = st.curved / Math.max(1, st.count);
  const lenScore = Math.min(1, st.avgLen / 2.3);
  const dirScore = 1 - bias;
  const dens = st.cells / Math.max(1, opts.w * opts.h);
  return countScore * 5 + curveScore * 2.4 + dirScore * 1.6 + lenScore * 1.8 + dens * 1.2;
}

export function generateWithRetry(
  opts: GenOpts,
  attempts?: number,
): { pieces: Piece[]; solution: string[] } | null {
  const att = attempts ?? (opts.count >= 120 ? 3 : opts.count >= 50 ? 5 : 8);
  let best: { pieces: Piece[]; solution: string[] } | null = null;
  let bestQ = -Infinity;
  for (let i = 0; i < att; i++) {
    const got = generatePuzzle({ ...opts, seed: (opts.seed + i * 9973) >>> 0 });
    if (!got) continue;
    const st = pieceStats(got.pieces);
    const dirVals = Object.values(st.dirs);
    const bias = Math.max(...dirVals) / Math.max(1, st.count);
    const goodEnough =
      got.pieces.length >= opts.count * 0.9 &&
      st.avgLen >= 1.32 &&
      bias < 0.55 &&
      (st.curved >= st.count * 0.1 || st.count < 14);
    if (goodEnough) return got;
    const q = puzzleQuality(got.pieces, opts);
    if (q > bestQ) {
      bestQ = q;
      best = got;
    }
  }
  return best;
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
  attempts?: number,
): import("./types").LevelDef | null {
  const got = generateWithRetry(opts, attempts);
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

/** Gold-standard daily recipe — 12×12, ~72 mixed L/zigzag/straight, tight pack. */
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
      shapes: ["straight", "L", "zigzag", "S", "dot"],
      hardness: 0.92,
    },
    12,
  );
  return { key, level };
}

export function generateEndless(wave: number, seed: number) {
  const size = Math.min(18, 6 + Math.floor(wave / 3));
  const count = Math.min(size * size - 6, 8 + wave * 3 + Math.floor(wave * wave * 0.28));
  const hardness = Math.min(1, 0.35 + wave * 0.05);
  const hearts = wave < 4 ? 5 : wave < 8 ? 3 : wave < 14 ? 2 : 2;
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
      maxLen: wave < 6 ? 4 : 7,
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

export function pieceStats(pieces: Piece[]) {
  const dirs: Record<string, number> = { up: 0, down: 0, left: 0, right: 0 };
  let turns = 0;
  let cells = 0;
  let curved = 0;
  let dots = 0;
  for (const p of pieces) {
    dirs[p.dir]++;
    cells += p.path.length;
    const t = countTurns(p.path);
    turns += t;
    if (p.path.length >= 3 && t > 0) curved++;
    if (p.path.length === 1) dots++;
  }
  return {
    count: pieces.length,
    cells,
    avgLen: cells / Math.max(1, pieces.length),
    curved,
    turns,
    dots,
    dirs,
  };
}
