import { type Cell, type Dir, type Piece, DELTA, cellKey } from "./types";

export function occupancy(pieces: Piece[], exceptId?: string): Set<string> {
  const occ = new Set<string>();
  for (const p of pieces) {
    if (p.id === exceptId) continue;
    for (const cell of p.path) occ.add(cellKey(cell.c, cell.r));
  }
  return occ;
}

/** All paths use a canonical head-to-tail order, including curved arrows. */
export function exitFace(piece: Piece): Cell[] {
  return piece.path.length ? [piece.path[0]!] : [];
}

export function headCell(piece: Piece): Cell {
  return piece.path[0]!;
}

export function tailCell(piece: Piece): Cell {
  return piece.path[piece.path.length - 1]!;
}

export function walkRay(
  start: Cell,
  dir: Dir,
  w: number,
  h: number,
  occ: Set<string>,
): { cells: Cell[]; blocked: Cell | null } {
  const { dc, dr } = DELTA[dir];
  const cells: Cell[] = [];
  let c = start.c + dc;
  let r = start.r + dr;
  while (c >= 0 && c < w && r >= 0 && r < h) {
    if (occ.has(cellKey(c, r))) return { cells, blocked: { c, r } };
    cells.push({ c, r });
    c += dc;
    r += dr;
  }
  return { cells, blocked: null };
}

export function canRemove(piece: Piece, all: Piece[], w: number, h: number): boolean {
  const occ = occupancy(all);
  const face = exitFace(piece);
  if (face.length === 0) return false;
  for (const e of face) {
    const ray = walkRay(e, piece.dir, w, h, occ);
    if (ray.blocked) return false;
  }
  return true;
}

export function pathPreview(piece: Piece, all: Piece[], w: number, h: number) {
  const occ = occupancy(all);
  const face = exitFace(piece);
  const rays: { from: Cell; cells: Cell[]; blocked: Cell | null }[] = [];
  let clear = true;
  for (const e of face) {
    const ray = walkRay(e, piece.dir, w, h, occ);
    rays.push({ from: e, cells: ray.cells, blocked: ray.blocked });
    if (ray.blocked) clear = false;
  }
  return { clear, rays };
}

export function freePieces(all: Piece[], w: number, h: number): Piece[] {
  return all.filter((p) => canRemove(p, all, w, h));
}

export function pieceAt(pieces: Piece[], c: number, r: number): Piece | undefined {
  const k = cellKey(c, r);
  return pieces.find((p) => p.path.some((cell) => cellKey(cell.c, cell.r) === k));
}

export function verifySolution(pieces: Piece[], solution: string[], w: number, h: number): boolean {
  const remaining = pieces.map((p) => p);
  for (const id of solution) {
    const p = remaining.find((x) => x.id === id);
    if (!p || !canRemove(p, remaining, w, h)) return false;
    const i = remaining.findIndex((x) => x.id === id);
    remaining.splice(i, 1);
  }
  return remaining.length === 0;
}

export function solveGreedy(pieces: Piece[], w: number, h: number): string[] | null {
  const remaining = pieces.slice();
  const order: string[] = [];
  while (remaining.length) {
    const free = remaining.filter((p) => canRemove(p, remaining, w, h));
    if (!free.length) return null;
    free.sort((a, b) => a.id.localeCompare(b.id));
    const pick = free[0]!;
    order.push(pick.id);
    remaining.splice(
      remaining.findIndex((p) => p.id === pick.id),
      1,
    );
  }
  return order;
}

/** Full backtracking solver — used for small handcrafted boards. */
export function solveAny(pieces: Piece[], w: number, h: number): string[] | null {
  const remaining = pieces.slice();
  const order: string[] = [];
  const dfs = (): boolean => {
    if (!remaining.length) return true;
    const free = remaining.filter((p) => canRemove(p, remaining, w, h));
    if (!free.length) return false;
    for (const pick of free) {
      const i = remaining.findIndex((p) => p.id === pick.id);
      remaining.splice(i, 1);
      order.push(pick.id);
      if (dfs()) return true;
      order.pop();
      remaining.splice(i, 0, pick);
    }
    return false;
  };
  return dfs() ? order : null;
}

export function countTurns(path: Cell[]): number {
  if (path.length < 3) return 0;
  let turns = 0;
  for (let i = 2; i < path.length; i++) {
    const a = path[i - 2]!;
    const b = path[i - 1]!;
    const c = path[i]!;
    const d1c = b.c - a.c;
    const d1r = b.r - a.r;
    const d2c = c.c - b.c;
    const d2r = c.r - b.r;
    if (d1c !== d2c || d1r !== d2r) turns++;
  }
  return turns;
}

export function scoreDifficulty(input: {
  pieces: Piece[];
  solution: string[];
  w: number;
  h: number;
  hearts: number;
}): number {
  const { pieces, solution, w, h, hearts } = input;
  let remaining = pieces.slice();
  let forced = 0;
  let startFree = 0;
  let minBranch = 99;
  let branchSum = 0;
  let steps = 0;
  for (let i = 0; i < solution.length; i++) {
    const free = remaining.filter((p) => canRemove(p, remaining, w, h));
    if (i === 0) startFree = free.length;
    minBranch = Math.min(minBranch, free.length || 99);
    branchSum += free.length;
    steps++;
    if (free.length === 1) forced++;
    remaining = remaining.filter((p) => p.id !== solution[i]);
  }
  const cells = pieces.reduce((n, p) => n + p.path.length, 0);
  const density = cells / (w * h);
  const avgTurns = pieces.reduce((n, p) => n + countTurns(p.path), 0) / Math.max(1, pieces.length);
  const avgLen = cells / Math.max(1, pieces.length);
  const avgBranch = branchSum / Math.max(1, steps);

  let score = 0;
  score += Math.min(pieces.length, 180) * 0.16;
  score += density * 16;
  score += forced * 0.32;
  score += Math.max(0, 4 - startFree) * 2.5;
  score += Math.max(0, 2 - (minBranch === 99 ? 2 : minBranch)) * 4;
  score += Math.max(0, 2.4 - avgBranch) * 3;
  score += avgTurns * 1.8;
  score += Math.min(avgLen, 6) * 0.7;
  score += (5 - hearts) * 4.5;
  if (w * h >= 196) score += 6;
  if (pieces.length >= 80) score += 6;
  if (pieces.length >= 100) score += 10;
  if (pieces.length >= 150) score += 8;
  return Math.max(4, Math.min(99, Math.round(score)));
}
