import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { Cell, Dir, Piece } from "@/game/types";
import { DELTA, PIECE_COLORS } from "@/game/types";
import { canRemove, pathPreview, pieceAt } from "@/game/engine";
import { escapeDistance, escapeFrame, ribbonPath } from "@/game/escape";
import { clampCamera, LONG_PRESS_MS, TAP_SLOP, zoomAt, type Camera } from "@/game/viewport";
import { DepartureEffects } from "./DepartureEffects";
import { cn } from "@/lib/cn";

export type Departure = { piece: Piece; token: number };
type Point = { x: number; y: number };
type Press = Point & {
  camera: Camera;
  units: number;
  id: string | null;
  moved: boolean;
  held: boolean;
};
type Pinch = { distance: number; middle: Point; camera: Camera; anchor: Cell; units: number };

function arrowHead(head: Cell, dir: Dir, size: number) {
  const d = DELTA[dir],
    x = head.c + 0.5,
    y = head.r + 0.5;
  return `${x + d.dc * size},${y + d.dr * size} ${x - d.dc * size * 0.65 - d.dr * size * 0.7},${y - d.dr * size * 0.65 + d.dc * size * 0.7} ${x - d.dc * size * 0.65 + d.dr * size * 0.7},${y - d.dr * size * 0.65 - d.dc * size * 0.7}`;
}

const Glyph = memo(function Glyph({
  piece,
  path = piece.path,
  focus = false,
  hint = false,
  invalid = false,
  free = false,
  dense = false,
}: {
  piece: Piece;
  path?: Cell[];
  focus?: boolean;
  hint?: boolean;
  invalid?: boolean;
  free?: boolean;
  dense?: boolean;
}) {
  const col = invalid ? "#ff3d6b" : PIECE_COLORS[piece.color % PIECE_COLORS.length]!;
  const head = path[0]!,
    tail = path[path.length - 1]!;
  if (!head) return null;
  const shape = ribbonPath(path),
    width = dense ? 0.13 : 0.18;
  return (
    <g className={invalid ? "piece-invalid" : undefined}>
      <path
        d={shape}
        fill="none"
        stroke={col}
        strokeWidth={width + 0.07}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={focus || hint ? 0.24 : free ? 0.12 : 0.05}
      />
      <path
        d={shape}
        fill="none"
        stroke={col}
        strokeWidth={focus || hint ? width + 0.04 : width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={tail.c + 0.5} cy={tail.r + 0.5} r={0.055} fill={col} opacity={0.5} />
      <polygon points={arrowHead(head, piece.dir, dense ? 0.23 : 0.29)} fill={col} />
    </g>
  );
});

function FlyingArrow({
  departure,
  w,
  h,
  onDone,
  unit,
  effects,
  dense,
  reduced,
}: {
  departure: Departure;
  w: number;
  h: number;
  onDone: (token: number) => void;
  unit: number;
  effects: boolean;
  dense: boolean;
  reduced: boolean;
}) {
  const [{ distance, age }, setFrame] = useState({ distance: 0, age: 0 }),
    done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    let frame = 0,
      start: number | null = null;
    const total = escapeDistance(departure.piece, w, h);
    const duration = reduced ? 80 : Math.min(1800, Math.max(400, total * 30));
    const tick = (now: number) => {
      start ??= now;
      const progress = Math.min(1, (now - start) / duration);
      setFrame({ distance: total * progress, age: now - start });
      if (progress < 1) frame = requestAnimationFrame(tick);
      else done.current(departure.token);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [departure, w, h, reduced]);
  return (
    <g
      pointerEvents="none"
      data-departure={departure.token}
      opacity={reduced ? Math.max(0, 1 - age / 80) : 1}
    >
      <Glyph
        piece={departure.piece}
        path={reduced ? departure.piece.path : escapeFrame(departure.piece, distance)}
        dense={dense}
      />
      {effects && !reduced && (
        <DepartureEffects piece={departure.piece} distance={distance} age={age} unit={unit} />
      )}
    </g>
  );
}

export function Board({
  pieces,
  w,
  h,
  hoverId,
  selectedId,
  hintId,
  departures,
  invalidId,
  shaking,
  reduced = false,
  zoom,
  onZoom,
  onHover,
  onInspect,
  onActivate,
  onDepartureDone,
  lang,
}: {
  pieces: Piece[];
  w: number;
  h: number;
  hoverId: string | null;
  selectedId: string | null;
  hintId: string | null;
  departures: Departure[];
  invalidId: string | null;
  shaking: boolean;
  reduced?: boolean;
  zoom: number;
  lang: "fr" | "en";
  onZoom: (zoom: number) => void;
  onHover: (id: string | null) => void;
  onInspect: (id: string) => void;
  onActivate: (id: string) => void;
  onDepartureDone: (token: number) => void;
}) {
  const svg = useRef<SVGSVGElement>(null),
    [center, setCenter] = useState({ x: w / 2, y: h / 2 });
  const [viewport, setViewport] = useState({ width: 500, height: 500 });
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const camera = clampCamera({ ...center, zoom }, w, h),
    cameraRef = useRef(camera);
  cameraRef.current = camera;
  const callbacks = useRef({ onInspect });
  callbacks.current = { onInspect };
  const pointers = useRef(new Map<number, Point>()),
    press = useRef<Press | null>(null),
    pinch = useRef<Pinch | null>(null);
  const suppressed = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearHold = () => {
    if (timer.current != null) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(
    () => () => {
      if (timer.current != null) clearTimeout(timer.current);
    },
    [],
  );
  const toBoard = (x: number, y: number): Cell => {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return { c: -1, r: -1 };
    const point = new DOMPoint(x, y).matrixTransform(matrix.inverse());
    return { c: point.x, r: point.y };
  };
  const hit = (x: number, y: number) => {
    const p = toBoard(x, y);
    return pieceAt(pieces, Math.floor(p.c), Math.floor(p.r));
  };
  const updateCamera = (next: Camera) => {
    const clamped = clampCamera(next, w, h);
    cameraRef.current = clamped;
    setCenter({ x: clamped.x, y: clamped.y });
    onZoom(clamped.zoom);
  };
  const cancel = (id: number) => {
    clearHold();
    pointers.current.delete(id);
    press.current = null;
    pinch.current = null;
    suppressed.current = pointers.current.size > 0;
    onHover(null);
  };
  const focus = selectedId ?? hoverId,
    focusPiece = pieces.find((p) => p.id === focus);
  const preview = useMemo(
    () => (focusPiece ? pathPreview(focusPiece, pieces, w, h) : null),
    [focusPiece, pieces, w, h],
  );
  const free = useMemo(
    () => new Set(pieces.filter((p) => canRemove(p, pieces, w, h)).map((p) => p.id)),
    [pieces, w, h],
  );
  const dense = pieces.length + departures.length >= 60;
  const effectUnit =
    1 / Math.max(1, Math.min(viewport.width / w, viewport.height / h) * camera.zoom);

  return (
    <div className={cn("board-viewport", shaking && "board-shake")}>
      <svg
        ref={svg}
        viewBox={`${camera.x - w / (2 * camera.zoom)} ${camera.y - h / (2 * camera.zoom)} ${w / camera.zoom} ${h / camera.zoom}`}
        className="game-board"
        role="group"
        aria-label={lang === "fr" ? "Plateau de flèches" : "Arrow board"}
        data-zoom={camera.zoom.toFixed(2)}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          svg.current?.setPointerCapture(e.pointerId);
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          clearHold();
          if (pointers.current.size >= 2) {
            suppressed.current = true;
            press.current = null;
            onHover(null);
            const [a, b] = [...pointers.current.values()],
              middle = { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 };
            pinch.current = {
              distance: Math.max(1, Math.hypot(a!.x - b!.x, a!.y - b!.y)),
              middle,
              camera: cameraRef.current,
              anchor: toBoard(middle.x, middle.y),
              units: 1 / (svg.current?.getScreenCTM()?.a ?? 1),
            };
            return;
          }
          const id = hit(e.clientX, e.clientY)?.id ?? null;
          press.current = {
            x: e.clientX,
            y: e.clientY,
            camera: cameraRef.current,
            units: 1 / (svg.current?.getScreenCTM()?.a ?? 1),
            id,
            moved: false,
            held: false,
          };
          if (id)
            timer.current = setTimeout(() => {
              const p = press.current;
              if (!p || p.moved || pointers.current.size !== 1 || suppressed.current) return;
              p.held = true;
              callbacks.current.onInspect(id);
            }, LONG_PRESS_MS);
        }}
        onPointerMove={(e) => {
          if (!pointers.current.has(e.pointerId)) {
            if (e.pointerType === "mouse") onHover(hit(e.clientX, e.clientY)?.id ?? null);
            return;
          }
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.current.size >= 2 && pinch.current) {
            const [a, b] = [...pointers.current.values()],
              start = pinch.current;
            const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y),
              middle = { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 };
            const next = zoomAt(
                start.camera,
                (start.camera.zoom * distance) / start.distance,
                start.anchor,
                w,
                h,
              ),
              scale = (start.units * start.camera.zoom) / next.zoom;
            updateCamera({
              ...next,
              x: next.x - (middle.x - start.middle.x) * scale,
              y: next.y - (middle.y - start.middle.y) * scale,
            });
            return;
          }
          const p = press.current;
          if (!p || suppressed.current) return;
          const dx = e.clientX - p.x,
            dy = e.clientY - p.y;
          if (Math.hypot(dx, dy) > TAP_SLOP) {
            p.moved = true;
            clearHold();
            onHover(null);
          }
          if (p.moved)
            updateCamera({
              ...p.camera,
              x: p.camera.x - dx * p.units,
              y: p.camera.y - dy * p.units,
            });
        }}
        onPointerUp={(e) => {
          clearHold();
          const p = press.current;
          if (
            p &&
            !p.moved &&
            !p.held &&
            !suppressed.current &&
            pointers.current.size === 1 &&
            p.id &&
            hit(e.clientX, e.clientY)?.id === p.id
          )
            onActivate(p.id);
          pointers.current.delete(e.pointerId);
          if (!pointers.current.size) {
            press.current = null;
            pinch.current = null;
            suppressed.current = false;
          }
          onHover(null);
        }}
        onPointerCancel={(e) => cancel(e.pointerId)}
        onLostPointerCapture={(e) => {
          if (pointers.current.has(e.pointerId)) cancel(e.pointerId);
        }}
        onPointerLeave={() => {
          if (!pointers.current.size) onHover(null);
        }}
        onWheel={(e) => {
          if (!e.ctrlKey && !e.metaKey) return;
          e.preventDefault();
          updateCamera(
            zoomAt(
              cameraRef.current,
              cameraRef.current.zoom * Math.exp(-e.deltaY * 0.005),
              toBoard(e.clientX, e.clientY),
              w,
              h,
            ),
          );
        }}
      >
        <rect
          width={w}
          height={h}
          rx={0.2}
          fill="#0d1426"
          stroke="rgba(232,238,248,0.1)"
          strokeWidth={0.03}
        />
        {Array.from({ length: w - 1 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={i + 1}
            y1={0}
            x2={i + 1}
            y2={h}
            stroke="rgba(255,255,255,0.035)"
            strokeWidth={0.015}
          />
        ))}
        {Array.from({ length: h - 1 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={i + 1}
            x2={w}
            y2={i + 1}
            stroke="rgba(255,255,255,0.035)"
            strokeWidth={0.015}
          />
        ))}
        {preview &&
          focusPiece &&
          preview.rays.map((ray, i) => {
            const d = DELTA[focusPiece.dir],
              end = ray.blocked ?? {
                c: ray.from.c + d.dc * (w + h),
                r: ray.from.r + d.dr * (w + h),
              };
            return (
              <line
                key={i}
                x1={ray.from.c + 0.5}
                y1={ray.from.r + 0.5}
                x2={end.c + 0.5}
                y2={end.r + 0.5}
                stroke={preview.clear ? "#00d4ff" : "#ff3d6b"}
                strokeWidth={0.055}
                strokeDasharray="0.16 0.12"
                opacity={0.7}
              />
            );
          })}
        {pieces.map((p, index) => (
          <g
            key={p.id}
            role="button"
            tabIndex={0}
            data-piece={p.id}
            aria-label={`${lang === "fr" ? "Flèche" : "Arrow"} ${index + 1} ${p.dir}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onActivate(p.id);
              } else if (e.key.toLowerCase() === "i") {
                e.preventDefault();
                onInspect(p.id);
              }
            }}
            onFocus={() => onHover(p.id)}
            onBlur={() => onHover(null)}
          >
            <Glyph
              piece={p}
              free={free.has(p.id)}
              focus={focus === p.id}
              hint={hintId === p.id}
              invalid={invalidId === p.id}
              dense={dense}
            />
          </g>
        ))}
        {departures.map((departure, index) => (
          <FlyingArrow
            key={departure.token}
            departure={departure}
            w={w}
            h={h}
            unit={effectUnit}
            effects={index >= departures.length - 8}
            dense={dense}
            reduced={reduced}
            onDone={onDepartureDone}
          />
        ))}
      </svg>
    </div>
  );
}
