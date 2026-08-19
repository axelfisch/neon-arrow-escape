import { useMemo } from "react";
import type { Dir, Piece } from "@/game/types";
import { PIECE_COLORS } from "@/game/types";
import { canRemove, pathPreview, pieceAt } from "@/game/engine";
import { cn } from "@/lib/cn";

function arrowHead(x: number, y: number, dir: Dir, s: number) {
  switch (dir) {
    case "right":
      return `${x + s},${y} ${x - s * 0.7},${y - s * 0.82} ${x - s * 0.7},${y + s * 0.82}`;
    case "left":
      return `${x - s},${y} ${x + s * 0.7},${y - s * 0.82} ${x + s * 0.7},${y + s * 0.82}`;
    case "down":
      return `${x},${y + s} ${x - s * 0.82},${y - s * 0.7} ${x + s * 0.82},${y - s * 0.7}`;
    case "up":
      return `${x},${y - s} ${x - s * 0.82},${y + s * 0.7} ${x + s * 0.82},${y + s * 0.7}`;
  }
}

export function Board({
  pieces,
  w,
  h,
  hoverId,
  selectedId,
  hintId,
  removingId,
  invalidId,
  shaking,
  onHover,
  onActivate,
}: {
  pieces: Piece[];
  w: number;
  h: number;
  hoverId: string | null;
  selectedId: string | null;
  hintId: string | null;
  removingId: string | null;
  invalidId: string | null;
  shaking: boolean;
  onHover: (id: string | null) => void;
  onActivate: (id: string) => void;
}) {
  const focus = selectedId ?? hoverId;
  const focusPiece = pieces.find((p) => p.id === focus) ?? null;
  const preview = useMemo(
    () => (focusPiece ? pathPreview(focusPiece, pieces, w, h) : null),
    [focusPiece, pieces, w, h],
  );

  const maxSide = Math.min(w, h);
  const dense = pieces.length >= 80;

  return (
    <div className={cn("relative w-full", shaking && "board-shake")}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full touch-none select-none"
        role="img"
        aria-label="arrow board"
        onPointerLeave={() => onHover(null)}
        onPointerMove={(e) => {
          const svg = e.currentTarget;
          const rect = svg.getBoundingClientRect();
          const c = Math.floor(((e.clientX - rect.left) / rect.width) * w);
          const r = Math.floor(((e.clientY - rect.top) / rect.height) * h);
          const p = pieceAt(pieces, c, r);
          onHover(p?.id ?? null);
        }}
        onPointerUp={(e) => {
          const svg = e.currentTarget;
          const rect = svg.getBoundingClientRect();
          const c = Math.floor(((e.clientX - rect.left) / rect.width) * w);
          const r = Math.floor(((e.clientY - rect.top) / rect.height) * h);
          const p = pieceAt(pieces, c, r);
          if (p) onActivate(p.id);
        }}
      >
        <rect x={0} y={0} width={w} height={h} rx={0.18} fill="#0d1426" stroke="rgba(232,238,248,0.08)" strokeWidth={0.03} />
        {Array.from({ length: w - 1 }, (_, i) => (
          <line key={`v${i}`} x1={i + 1} y1={0} x2={i + 1} y2={h} stroke="rgba(255,255,255,0.035)" strokeWidth={0.015} />
        ))}
        {Array.from({ length: h - 1 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i + 1} x2={w} y2={i + 1} stroke="rgba(255,255,255,0.035)" strokeWidth={0.015} />
        ))}

        {preview &&
          preview.rays.map((ray, i) => {
            const col = preview.clear ? "#00d4ff" : "#ff3d6b";
            const pts = [ray.from, ...ray.cells, ray.blocked].filter(Boolean) as { c: number; r: number }[];
            if (pts.length < 2) {
              const d = focusPiece!.dir;
              const end =
                d === "right"
                  ? { c: w, r: ray.from.r }
                  : d === "left"
                    ? { c: -1, r: ray.from.r }
                    : d === "down"
                      ? { c: ray.from.c, r: h }
                      : { c: ray.from.c, r: -1 };
              pts.push(end);
            }
            return (
              <polyline
                key={`ray-${i}`}
                points={pts.map((p) => `${p.c + 0.5},${p.r + 0.5}`).join(" ")}
                fill="none"
                stroke={col}
                strokeWidth={dense ? 0.06 : 0.08}
                strokeDasharray="0.16 0.12"
                opacity={0.55}
              />
            );
          })}

        {pieces.map((p) => {
          const free = canRemove(p, pieces, w, h);
          const col = PIECE_COLORS[p.color % PIECE_COLORS.length]!;
          const head = p.path[p.path.length - 1]!;
          const tail = p.path[0]!;
          const hx = head.c + 0.5;
          const hy = head.r + 0.5;
          const multi = p.path.length > 1;
          const pts = p.path.map((c) => `${c.c + 0.5},${c.r + 0.5}`).join(" ");
          const as = dense ? 0.22 : maxSide >= 14 ? 0.26 : 0.3;
          const lw = dense ? 0.14 : 0.2;
          const isFocus = focus === p.id;
          const isHint = hintId === p.id;
          const isRm = removingId === p.id;
          const isInv = invalidId === p.id;
          const anim = isRm ? `slide-${p.dir}` : isInv ? "piece-invalid" : "";

          return (
            <g
              key={p.id}
              className={anim}
              opacity={isRm ? 0.85 : 1}
              style={{ transformOrigin: `${hx}px ${hy}px` }}
            >
              {isHint && (
                <circle cx={hx} cy={hy} r={0.46} fill="none" stroke={col} strokeWidth={0.045} opacity={0.8}>
                  <animate attributeName="r" values="0.38;0.52;0.38" dur="1.1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.35;0.9;0.35" dur="1.1s" repeatCount="indefinite" />
                </circle>
              )}
              {multi && (
                <polyline
                  points={pts}
                  fill="none"
                  stroke={col}
                  strokeWidth={lw + 0.16}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={free ? 0.22 : 0.07}
                />
              )}
              {multi ? (
                <polyline
                  points={pts}
                  fill="none"
                  stroke={col}
                  strokeWidth={lw}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isFocus ? 1 : 0.92}
                />
              ) : (
                <circle cx={hx} cy={hy} r={lw * 0.55} fill={col} opacity={free ? 0.95 : 0.72} />
              )}
              <circle cx={tail.c + 0.5} cy={tail.r + 0.5} r={0.07} fill={col} opacity={0.55} />
              <polygon
                points={arrowHead(hx, hy, p.dir, as)}
                fill={col}
                opacity={free ? 1 : 0.72}
                style={free ? { filter: `drop-shadow(0 0 0.08px ${col})` } : undefined}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
