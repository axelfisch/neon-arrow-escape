import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Heart,
  Lightbulb,
  RotateCcw,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { LevelDef, Piece } from "@/game/types";
import { canRemove, freePieces } from "@/game/engine";
import { sfx, unlockAudio } from "@/game/audio";
import { t } from "@/game/i18n";
import { starsFor } from "@/game/save";
import { useProgress } from "@/game/progress-store";
import { TIER_META } from "@/game/catalog";
import { Board } from "./Board";
import { cn } from "@/lib/cn";

export function PlayView({
  level,
  onWin,
  onExit,
  subtitle,
}: {
  level: LevelDef;
  onWin: (stars: number, moves: number, ms: number) => void;
  onExit: () => void;
  subtitle?: string;
}) {
  const navigate = useNavigate();
  const lang = useProgress((s) => s.progress.lang);
  const inspectPref = useProgress((s) => s.progress.inspect);
  const sound = useProgress((s) => s.progress.sound);
  const patch = useProgress((s) => s.patch);

  const [pieces, setPieces] = useState<Piece[]>(() => level.pieces.map((p) => ({ ...p, path: p.path.map((c) => ({ ...c })) })));
  const [hearts, setHearts] = useState(level.hearts);
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(level.hints);
  const [undosLeft, setUndosLeft] = useState(level.undos);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hintId, setHintId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [invalidId, setInvalidId] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [ended, setEnded] = useState<null | "win" | "lose">(null);
  const [busy, setBusy] = useState(false);
  const history = useRef<Piece[][]>([]);
  const started = useRef(Date.now());
  const inspectOn = inspectPref || level.arrowCount >= 60;

  useEffect(() => {
    setPieces(level.pieces.map((p) => ({ ...p, path: p.path.map((c) => ({ ...c })) })));
    setHearts(level.hearts);
    setMoves(0);
    setMistakes(0);
    setHintsLeft(level.hints);
    setUndosLeft(level.undos);
    setHintsUsed(0);
    setHoverId(null);
    setSelectedId(null);
    setHintId(null);
    setRemovingId(null);
    setInvalidId(null);
    setEnded(null);
    setBusy(false);
    history.current = [];
    started.current = Date.now();
  }, [level]);

  const remaining = pieces.length;
  const focus = selectedId ?? hoverId;
  const focusPiece = pieces.find((p) => p.id === focus);
  const focusClear = focusPiece ? canRemove(focusPiece, pieces, level.w, level.h) : null;

  const fire = useCallback(
    (id: string) => {
      if (busy || ended) return;
      unlockAudio();
      const p = pieces.find((x) => x.id === id);
      if (!p) return;
      if (canRemove(p, pieces, level.w, level.h)) {
        if (sound) sfx.slide();
        setBusy(true);
        setRemovingId(id);
        setHintId(null);
        setSelectedId(null);
        history.current.push(pieces);
        window.setTimeout(() => {
          const next = pieces.filter((x) => x.id !== id);
          setPieces(next);
          setMoves((m) => m + 1);
          setRemovingId(null);
          setBusy(false);
          if (next.length === 0) {
            const ms = Date.now() - started.current;
            const stars = starsFor(mistakes, hintsUsed);
            if (sound) sfx.win();
            setEnded("win");
            onWin(stars, moves + 1, ms);
          }
        }, 260);
      } else {
        if (sound) sfx.blocked();
        setInvalidId(id);
        setShaking(true);
        setMoves((m) => m + 1);
        setMistakes((m) => m + 1);
        const nextHearts = hearts - 1;
        setHearts(nextHearts);
        if (nextHearts <= 0) {
          if (sound) sfx.lose();
          setEnded("lose");
        }
        window.setTimeout(() => {
          setInvalidId(null);
          setShaking(false);
        }, 360);
      }
    },
    [busy, ended, pieces, level, sound, hearts, mistakes, hintsUsed, moves, onWin],
  );

  function activate(id: string) {
    if (ended || busy) return;
    if (inspectOn && selectedId !== id) {
      if (sound) sfx.tap();
      setSelectedId(id);
      return;
    }
    fire(id);
  }

  function hint() {
    if (hintsLeft <= 0 || ended || busy) return;
    const remainingIds = new Set(pieces.map((p) => p.id));
    let target: string | null = null;
    for (const id of level.solution) {
      if (!remainingIds.has(id)) continue;
      const p = pieces.find((x) => x.id === id);
      if (p && canRemove(p, pieces, level.w, level.h)) {
        target = id;
        break;
      }
    }
    if (!target) {
      target = freePieces(pieces, level.w, level.h)[0]?.id ?? null;
    }
    if (!target) return;
    if (sound) sfx.hint();
    setHintId(target);
    setSelectedId(target);
    setHintsLeft((n) => n - 1);
    setHintsUsed((n) => n + 1);
  }

  function undo() {
    if (undosLeft <= 0 || ended || busy) return;
    const prev = history.current.pop();
    if (!prev) return;
    setPieces(prev);
    setUndosLeft((n) => n - 1);
    setSelectedId(null);
    setHintId(null);
  }

  const title = lang === "fr" ? level.nameFr : level.name;
  const tier = TIER_META[level.tier];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">
            {level.id > 0 ? `${lang === "fr" ? "Niveau" : "Level"} ${level.id}` : subtitle} · {lang === "fr" ? tier.fr : tier.en}
          </p>
          <h1 className="font-display mt-1 truncate text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-0.5 font-mono text-[11px] text-faint">
            {level.arrowCount} {t(lang, "arrows")} · {level.w}×{level.h} · {t(lang, "diff")} {level.difficulty}
          </p>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:text-fg"
        >
          {t(lang, "quit")}
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2">
        <div className="flex items-center gap-1.5" aria-label="lives">
          {Array.from({ length: level.hearts }, (_, i) => (
            <Heart
              key={i}
              className={cn("size-4", i < hearts ? "fill-danger text-danger" : "text-fg/15")}
              strokeWidth={1.75}
            />
          ))}
        </div>
        <div className="font-mono text-xs tabular-nums text-muted">
          {t(lang, "moves")} {moves}
          <span className="mx-2 text-fg/15">/</span>
          {remaining}
        </div>
        <div className="flex items-center gap-1">
          <IconBtn disabled={undosLeft <= 0} onClick={undo} label={t(lang, "undo")}>
            <Undo2 className="size-3.5" />
            <span className="font-mono text-[10px]">{undosLeft}</span>
          </IconBtn>
          <IconBtn disabled={hintsLeft <= 0} onClick={hint} label={t(lang, "hint")}>
            <Lightbulb className="size-3.5" />
            <span className="font-mono text-[10px]">{hintsLeft}</span>
          </IconBtn>
        </div>
      </div>

      <div className="overflow-auto rounded-[22px] border border-border bg-surface p-2 sm:p-3">
        <div style={{ minWidth: `${Math.max(280, level.w * 22 * zoom)}px` }}>
          <Board
            pieces={pieces}
            w={level.w}
            h={level.h}
            hoverId={hoverId}
            selectedId={selectedId}
            hintId={hintId}
            removingId={removingId}
            invalidId={invalidId}
            shaking={shaking}
            onHover={setHoverId}
            onActivate={activate}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
        <p>
          {inspectOn ? t(lang, "inspectHint") : t(lang, "rule2")}
          {focusClear != null && (
            <span className={cn("ml-2 font-medium", focusClear ? "text-ok" : "text-danger")}>
              {focusClear ? t(lang, "clearPath") : t(lang, "blocked")}
            </span>
          )}
        </p>
        <div className="flex items-center gap-1">
          <IconBtn onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))} label={t(lang, "zoom")}>
            <ZoomOut className="size-3.5" />
          </IconBtn>
          <IconBtn onClick={() => setZoom((z) => Math.min(2.2, +(z + 0.15).toFixed(2)))} label={t(lang, "zoom")}>
            <ZoomIn className="size-3.5" />
          </IconBtn>
          <button
            type="button"
            onClick={() => patch({ inspect: !inspectPref })}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] tracking-wide uppercase",
              inspectPref ? "border-accent/40 text-accent" : "border-border text-muted",
            )}
          >
            {t(lang, "inspect")}
          </button>
        </div>
      </div>

      {ended && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-bg/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] border border-border bg-surface p-6 shadow-[0_20px_80px_rgb(0_0_0/0.45)]">
            <p className={cn("font-display text-2xl font-semibold", ended === "win" ? "text-ok" : "text-danger")}>
              {ended === "win" ? t(lang, "won") : t(lang, "lost")}
            </p>
            <p className="mt-2 text-sm text-muted">
              {ended === "win" ? t(lang, "allClear") : t(lang, "lostHint")}
            </p>
            {ended === "win" && (
              <p className="mt-3 font-mono text-xs text-faint">
                {moves} {t(lang, "moves")} · {starsFor(mistakes, hintsUsed)} {t(lang, "stars")}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setPieces(level.pieces.map((p) => ({ ...p, path: p.path.map((c) => ({ ...c })) })));
                  setHearts(level.hearts);
                  setMoves(0);
                  setMistakes(0);
                  setHintsLeft(level.hints);
                  setUndosLeft(level.undos);
                  setHintsUsed(0);
                  setEnded(null);
                  setSelectedId(null);
                  history.current = [];
                  started.current = Date.now();
                }}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm text-fg"
              >
                <RotateCcw className="size-3.5" />
                {t(lang, "retry")}
              </button>
              {ended === "win" && level.id > 0 && level.id < 80 && (
                <button
                  type="button"
                  onClick={() => navigate({ to: "/play/$levelId", params: { levelId: String(level.id + 1) } })}
                  className="w-full rounded-full bg-fg px-4 py-2.5 text-sm font-medium text-bg"
                >
                  {t(lang, "next")}
                </button>
              )}
              <Link
                to={level.id > 0 ? "/levels" : "/"}
                className="w-full rounded-full px-4 py-2.5 text-center text-sm text-muted"
              >
                {t(lang, "menu")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-muted hover:text-fg disabled:opacity-30"
    >
      {children}
    </button>
  );
}
