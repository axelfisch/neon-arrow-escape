import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Lightbulb, RotateCcw, Undo2, ZoomIn, ZoomOut, Scan } from "lucide-react";
import type { LevelDef } from "@/game/types";
import { canRemove, freePieces } from "@/game/engine";
import { createSession, moveSession, undoSession, type Session } from "@/game/session";
import { sfx, unlockAudio } from "@/game/audio";
import { t } from "@/game/i18n";
import { starsFor } from "@/game/save";
import { useProgress } from "@/game/progress-store";
import { TIER_META } from "@/game/catalog";
import { Board, type Departure } from "./Board";
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
  const lang = useProgress((s) => s.progress.lang),
    inspectPref = useProgress((s) => s.progress.inspect);
  const sound = useProgress((s) => s.progress.sound),
    patch = useProgress((s) => s.patch);
  const [session, setSession] = useState(() => createSession(level));
  const current = useRef(session);
  const { pieces, hearts, moves, mistakes, hintsLeft, undosLeft, hintsUsed } = session;
  const [hoverId, setHoverId] = useState<string | null>(null),
    [selectedId, setSelectedId] = useState<string | null>(null);
  const [hintId, setHintId] = useState<string | null>(null),
    [invalidId, setInvalidId] = useState<string | null>(null);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [zoom, setZoom] = useState(1),
    [round, setRound] = useState(0);
  const [ended, setEnded] = useState<null | "win" | "lose">(null);
  const token = useRef(0),
    reported = useRef(false),
    started = useRef(Date.now());
  const invalidTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callback = useRef(onWin);
  callback.current = onWin;
  const commit = (next: Session) => {
    current.current = next;
    setSession(next);
  };
  const clearInvalid = () => {
    if (invalidTimer.current != null) clearTimeout(invalidTimer.current);
    invalidTimer.current = null;
    setInvalidId(null);
  };
  function restart() {
    clearInvalid();
    commit(createSession(level));
    setDepartures([]);
    setEnded(null);
    setSelectedId(null);
    setHoverId(null);
    setHintId(null);
    setZoom(1);
    setRound((n) => n + 1);
    reported.current = false;
    started.current = Date.now();
  }
  useEffect(
    () => () => {
      if (invalidTimer.current != null) clearTimeout(invalidTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (pieces.length || departures.length || hearts <= 0 || reported.current) return;
    reported.current = true;
    if (sound) sfx.win();
    setEnded("win");
    callback.current(starsFor(mistakes, hintsUsed), moves, Date.now() - started.current);
  }, [pieces.length, departures.length, hearts, mistakes, hintsUsed, moves, sound]);
  const finishDeparture = useCallback(
    (id: number) => setDepartures((all) => all.filter((d) => d.token !== id)),
    [],
  );
  const remaining = pieces.length,
    inspectOn = inspectPref,
    shaking = invalidId !== null;
  const focus = selectedId ?? hoverId,
    focusPiece = pieces.find((p) => p.id === focus);
  const focusClear = focusPiece ? canRemove(focusPiece, pieces, level.w, level.h) : null;

  function fire(id: string) {
    const previous = current.current,
      piece = previous.pieces.find((p) => p.id === id);
    const next = moveSession(previous, id, level);
    if (!piece || next === previous || reported.current) return;
    unlockAudio();
    clearInvalid();
    commit(next);
    setHintId(null);
    setSelectedId(null);
    setHoverId(null);
    if (next.pieces !== previous.pieces) {
      if (sound) sfx.slide();
      setDepartures((all) => [...all, { piece, token: ++token.current }]);
    } else {
      if (sound) sfx.blocked();
      setInvalidId(id);
      invalidTimer.current = setTimeout(() => setInvalidId(null), 360);
      if (next.hearts <= 0) {
        if (sound) sfx.lose();
        setEnded("lose");
      }
    }
  }
  function activate(id: string) {
    if (ended || current.current.hearts <= 0) return;
    if (inspectOn && selectedId !== id) {
      unlockAudio();
      if (sound) sfx.tap();
      setSelectedId(id);
      return;
    }
    fire(id);
  }
  function inspect(id: string) {
    if (ended || current.current.hearts <= 0) return;
    setSelectedId(id);
  }
  function hint() {
    const state = current.current;
    if (state.hintsLeft <= 0 || !state.pieces.length || state.hearts <= 0 || ended) return;
    const target = freePieces(state.pieces, level.w, level.h)[0];
    if (!target) return;
    unlockAudio();
    if (sound) sfx.hint();
    setHintId(target.id);
    setSelectedId(target.id);
    commit({ ...state, hintsLeft: state.hintsLeft - 1, hintsUsed: state.hintsUsed + 1 });
  }
  function undo() {
    if (reported.current) return;
    const next = undoSession(current.current);
    if (next === current.current) return;
    clearInvalid();
    commit(next);
    setDepartures([]);
    setEnded(null);
    setSelectedId(null);
    setHintId(null);
    setHoverId(null);
    setRound((n) => n + 1);
  }

  const title = lang === "fr" ? level.nameFr : level.name;
  const tier = TIER_META[level.tier];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">
            {level.id > 0 ? `${lang === "fr" ? "Niveau" : "Level"} ${level.id}` : subtitle} ·{" "}
            {lang === "fr" ? tier.fr : tier.en}
          </p>
          <h1 className="font-display mt-1 truncate text-xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-0.5 font-mono text-[11px] text-faint">
            {level.arrowCount} {t(lang, "arrows")} · {level.w}×{level.h} · {t(lang, "diff")}{" "}
            {level.difficulty}
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
          <IconBtn
            disabled={undosLeft <= 0 || !session.history.length || ended === "win"}
            onClick={undo}
            label={t(lang, "undo")}
          >
            <Undo2 className="size-3.5" />
            <span className="font-mono text-[10px]">{undosLeft}</span>
          </IconBtn>
          <IconBtn
            disabled={hintsLeft <= 0 || !remaining || hearts <= 0}
            onClick={hint}
            label={t(lang, "hint")}
          >
            <Lightbulb className="size-3.5" />
            <span className="font-mono text-[10px]">{hintsLeft}</span>
          </IconBtn>
        </div>
      </div>

      <Board
        key={`${level.key}-${round}`}
        pieces={pieces}
        w={level.w}
        h={level.h}
        hoverId={hoverId}
        selectedId={selectedId}
        hintId={hintId}
        departures={departures}
        invalidId={invalidId}
        shaking={shaking}
        zoom={zoom}
        onZoom={setZoom}
        lang={lang}
        onHover={setHoverId}
        onInspect={inspect}
        onActivate={activate}
        onDepartureDone={finishDeparture}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
        <p>
          {inspectOn ? t(lang, "inspectHint") : t(lang, "gestureHint")}
          {focusClear != null && (
            <span className={cn("ml-2 font-medium", focusClear ? "text-ok" : "text-danger")}>
              {focusClear ? t(lang, "clearPath") : t(lang, "blocked")}
            </span>
          )}
        </p>
        <div className="flex items-center gap-1">
          <IconBtn
            onClick={() => setZoom((z) => Math.max(1, +(z - 0.35).toFixed(2)))}
            label={t(lang, "zoomOut")}
          >
            <ZoomOut className="size-3.5" />
          </IconBtn>
          <IconBtn
            onClick={() => setZoom((z) => Math.min(4, +(z + 0.35).toFixed(2)))}
            label={t(lang, "zoomIn")}
          >
            <ZoomIn className="size-3.5" />
          </IconBtn>
          <IconBtn onClick={() => setZoom(1)} label={t(lang, "resetView")}>
            <Scan className="size-3.5" />
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
            <p
              className={cn(
                "font-display text-2xl font-semibold",
                ended === "win" ? "text-ok" : "text-danger",
              )}
            >
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
                onClick={restart}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm text-fg"
              >
                <RotateCcw className="size-3.5" />
                {t(lang, "retry")}
              </button>
              {ended === "lose" && undosLeft > 0 && session.history.length > 0 && (
                <button
                  type="button"
                  onClick={undo}
                  className="w-full rounded-full bg-accent px-4 py-2.5 text-sm text-bg"
                >
                  {t(lang, "undo")}
                </button>
              )}
              {ended === "win" && level.id > 0 && level.id < 80 && (
                <button
                  type="button"
                  onClick={() =>
                    navigate({ to: "/play/$levelId", params: { levelId: String(level.id + 1) } })
                  }
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
      className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-full border border-border px-2 py-1 text-muted hover:text-fg disabled:opacity-30"
    >
      {children}
    </button>
  );
}
