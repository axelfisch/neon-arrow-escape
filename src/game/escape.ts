// Adapted from ArrowUnit.cs by Umang (2026), MIT. See THIRD_PARTY_NOTICES.md.
import { DELTA, type Cell, type Piece } from "./types";

/** Paths are ordered head to tail. The tail follows the original bends. */
export function escapeDistance(piece: Piece, w: number, h: number): number {
  const head = piece.path[0];
  if (!head) return 0;
  const toEdge =
    piece.dir === "right"
      ? w - head.c
      : piece.dir === "left"
        ? head.c + 1
        : piece.dir === "down"
          ? h - head.r
          : head.r + 1;
  return piece.path.length - 1 + toEdge + 1;
}

export function escapeFrame(piece: Piece, distance: number): Cell[] {
  if (!piece.path.length) return [];
  const route = [...piece.path].reverse();
  const length = route.length - 1;
  const head = piece.path[0]!;
  const d = DELTA[piece.dir];
  const sample = (at: number): Cell => {
    if (at >= length) return { c: head.c + d.dc * (at - length), r: head.r + d.dr * (at - length) };
    const i = Math.floor(at),
      f = at - i;
    const a = route[i]!,
      b = route[i + 1]!;
    return { c: a.c + (b.c - a.c) * f, r: a.r + (b.r - a.r) * f };
  };
  const travel = Math.max(0, distance);
  if (!length) return [sample(travel)];
  const points: Cell[] = [sample(travel)];
  for (let i = Math.floor(travel) + 1; i < travel + length && i <= length; i++)
    points.push(route[i]!);
  points.push(sample(travel + length));
  return points.reverse();
}

/** Rounded SVG corners without cutting across adjacent cells. */
export function ribbonPath(points: Cell[]): string {
  if (!points.length) return "";
  const p = points.map(({ c, r }) => ({ x: c + 0.5, y: r + 0.5 }));
  let out = `M ${p[0]!.x} ${p[0]!.y}`;
  for (let i = 1; i < p.length - 1; i++) {
    const a = p[i - 1]!,
      b = p[i]!,
      c = p[i + 1]!;
    const ab = Math.hypot(b.x - a.x, b.y - a.y),
      bc = Math.hypot(c.x - b.x, c.y - b.y);
    const radius = Math.min(0.18, ab / 2, bc / 2);
    if (!ab || !bc) continue;
    const x = b.x + ((a.x - b.x) * radius) / ab,
      y = b.y + ((a.y - b.y) * radius) / ab;
    const xx = b.x + ((c.x - b.x) * radius) / bc,
      yy = b.y + ((c.y - b.y) * radius) / bc;
    out += ` L ${x} ${y} Q ${b.x} ${b.y} ${xx} ${yy}`;
  }
  const end = p[p.length - 1]!;
  return `${out} L ${end.x} ${end.y}`;
}
