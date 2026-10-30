import type { Piece } from "@/game/types";
import { PIECE_COLORS } from "@/game/types";
import { escapeFrame } from "@/game/escape";

// Sizes are CSS pixels, converted once by the board: zoom never makes a giant halo.
export function DepartureEffects({
  piece,
  distance,
  age,
  unit,
}: {
  piece: Piece;
  distance: number;
  age: number;
  unit: number;
}) {
  const color = PIECE_COLORS[piece.color % PIECE_COLORS.length]!;
  const tones = [color, "#00d4ff", "#ff4d8d", "#3dff9a", "#7aa2ff"];
  const head = piece.path[0]!;
  const burst = Math.min(1, age / 440);
  const frame = escapeFrame(piece, distance);
  const tail = frame[frame.length - 1]!;
  return (
    <g aria-hidden="true" className="departure-fx">
      {burst < 1 && (
        <g
          transform={`translate(${head.c + 0.5} ${head.r + 0.5}) scale(${unit})`}
          opacity={(1 - burst) * 0.85}
        >
          {Array.from({ length: 9 }, (_, i) => {
            const angle = (i * Math.PI * 2) / 9 + piece.color * 0.4;
            const radius = (8 + (i % 3) * 6) * (1 - Math.pow(1 - burst, 2));
            const x = Math.cos(angle) * radius,
              y = Math.sin(angle) * radius;
            const tone = tones[i % tones.length]!;
            return (
              <g key={i} transform={`translate(${x} ${y}) rotate(${i * 37 + burst * 60})`}>
                {i % 3 === 0 ? (
                  <path d="M0 -3 L.9 -.9 L3 0 L.9 .9 L0 3 L-.9 .9 L-3 0 L-.9 -.9 Z" fill={tone} />
                ) : i % 3 === 1 ? (
                  <circle r={1.8} fill="none" stroke={tone} strokeWidth={1} />
                ) : (
                  <path d="M-2 0 H2" stroke={tone} strokeWidth={1.4} strokeLinecap="round" />
                )}
              </g>
            );
          })}
        </g>
      )}
      {/* A 26 px comet wake follows the unwinding tail, along the actual bends. */}
      {Array.from({ length: 7 }, (_, i) => {
        const lag = (i + 1) * 3.7 * unit;
        if (distance < lag) return null;
        const previous = escapeFrame(piece, distance - lag);
        const point = previous[previous.length - 1]!;
        return (
          <circle
            key={i}
            cx={point.c + 0.5}
            cy={point.r + 0.5}
            r={(1.7 - i * 0.18) * unit}
            fill={tones[i % tones.length]}
            opacity={(1 - i / 7) * 0.65}
          />
        );
      })}
      <circle cx={tail.c + 0.5} cy={tail.r + 0.5} r={2 * unit} fill={color} opacity={0.85} />
    </g>
  );
}
