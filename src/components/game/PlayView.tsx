import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Heart,
  Lightbulb,
  ArrowLeft,
  Pause,
  SlidersHorizontal,
  Share2,
  Star,
  Undo2,
  ZoomIn,
  ZoomOut,
  Scan,
  Maximize,
  Minimize,
} from "lucide-react";
import type { LevelDef } from "@/game/types";
import { canRemove, freePieces } from "@/game/engine";
import { createSession, moveSession, undoSession, type Session } from "@/game/session";
import { impact, isNative, shareResult } from "@/game/device";
import { restoreCheckpoint, saveCheckpoint, clearCheckpoint } from "@/game/checkpoint";
import { useSettings } from "@/game/settings";
import { SettingsPanel, useReducedMotion } from "./SettingsPanel";
import { Sheet } from "./Sheet";
import { sfx, unlockAudio, suspendAudio, setSoundEnabled } from "@/game/audio";
import { t } from "@/game/i18n";
import { starsFor } from "@/game/save";
import { useProgress } from "@/game/progress-store";
import { TIER_META } from "@/game/catalog";
import { Board, type Departure } from "./Board";
import { useGameFullscreen } from "./useGameFullscreen";
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
  const fullscreen = useGameFullscreen();
  const lang = useProgress((s) => s.progress.lang),
    inspectPref = useProgress((s) => s.progress.inspect);
  const sound = useProgress((s) => s.progress.sound),
    patch = useProgress((s) => s.patch);
  const [restored] = useState(() => restoreCheckpoint(level));
  const [session, setSession] = useState(() => restored?.session ?? createSession(level));
  const [paused, setPaused] = useState(false),
    [settings, setSettings] = useState(false);
  const [notice, setNotice] = useState("");
  const reduced = useReducedMotion(),
    concentration = useSettings((s) => s.focus);
  const pauseFrom = useRef<number | null>(null),
    pausedTime = useRef(0);
  const elapsed = () =>
    Math.max(0, (pauseFrom.current ?? Date.now()) - started.current - pausedTime.current);
  function pause() {
    pauseFrom.current ??= Date.now();
    setPaused(true);
    setDepartures([]);
    suspendAudio();
    saveCheckpoint(level, current.current, elapsed());
  }
  function resume() {
    if (pauseFrom.current !== null) pausedTime.current += Date.now() - pauseFrom.current;
    pauseFrom.current = null;
    setPaused(false);
    unlockAudio();
  }
  const current = useRef(session);
  const { pieces, hearts, moves, mistakes, hintsLeft, undosLeft, hintsUsed } = session;
  const [hoverId, setHoverId] = useState<string | null>(null),
    [selectedId, setSelectedId] = useState<string | null>(null);
  const [hintId, setHintId] = useState<string | null>(null),
    [invalidId, setInvalidId] = useState<string | null>(null);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [zoom, setZoom] = useState(1),
    [round, setRound] = useState(0);
  const [ended, setEnded] = useState<null | "win" | "lose">(session.hearts <= 0 ? "lose" : null);
  const token = useRef(0),
    reported = useRef(false),
    started = useRef(Date.now() - (restored?.elapsed ?? 0));
  const invalidTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callback = useRef(onWin);
  callback.current = onWin;
  const commit = (next: Session) => {
    current.current = next;
    setSession(next);
    saveCheckpoint(level, next, elapsed());
  };
  const clearInvalid = () => {
    if (invalidTimer.current != null) clearTimeout(invalidTimer.current);
    invalidTimer.current = null;
    setInvalidId(null);
  };
  function restart() {
    clearCheckpoint(level.key);
    started.current = Date.now();
    pausedTime.current = 0;
    pauseFrom.current = null;
    setPaused(false);
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
  useEffect(() => {
    setSoundEnabled(sound);
  }, [sound]);
  const pauseCallback = useRef(pause);
  pauseCallback.current = pause;
  useEffect(() => {
    const inactive = () => pauseCallback.current();
    const visibility = () => {
      if (document.hidden) inactive();
    };
    const saveError = () =>
      setNotice(
        lang === "fr"
          ? "Sauvegarde indisponible : garde l’app ouverte et réessaie."
          : "Save unavailable: keep the app open and try again.",
      );
    window.addEventListener("neon:inactive", inactive);
    window.addEventListener("neon:save-error", saveError);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("neon:inactive", inactive);
      window.removeEventListener("neon:save-error", saveError);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [lang]);
  useEffect(() => {
    saveCheckpoint(level, current.current, elapsed());
  }, []);
  useEffect(
    () => () => {
      if (invalidTimer.current != null) clearTimeout(invalidTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (paused || pieces.length || departures.length || hearts <= 0 || reported.current) return;
    reported.current = true;
    if (sound) sfx.win();
    impact("win");
    clearCheckpoint(level.key);
    setEnded("win");
    callback.current(starsFor(mistakes, hintsUsed), moves, elapsed());
  }, [pieces.length, departures.length, hearts, mistakes, hintsUsed, moves, sound, paused]);
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
      impact("start");
      setDepartures((all) => [...all, { piece, token: ++token.current }]);
    } else {
      if (sound) sfx.blocked();
      impact("blocked");
      setInvalidId(id);
      invalidTimer.current = setTimeout(() => setInvalidId(null), 360);
      if (next.hearts <= 0) {
        if (sound) sfx.lose();
        setEnded("lose");
      }
    }
  }
  function activate(id: string) {
    if (paused || settings || ended || current.current.hearts <= 0) return;
    if (inspectOn && selectedId !== id) {
      unlockAudio();
      if (sound) sfx.tap();
      impact("select");
      setSelectedId(id);
      return;
    }
    fire(id);
  }
  function inspect(id: string) {
    if (paused || settings || ended || current.current.hearts <= 0) return;
    setSelectedId(id);
    impact("select");
  }
  function hint() {
    const state = current.current;
    if (state.hintsLeft <= 0 || !state.pieces.length || state.hearts <= 0 || ended) return;
    const target = freePieces(state.pieces, level.w, level.h)[0];
    if (!target) return;
    unlockAudio();
    if (sound) sfx.hint();
    impact("select");
    setHintId(target.id);
    setSelectedId(target.id);
    commit({ ...state, hintsLeft: state.hintsLeft - 1, hintsUsed: state.hintsUsed + 1 });
  }
  function undo() {
    if (reported.current) return;
    const next = undoSession(current.current);
    if (next === current.current) return;
    clearInvalid();
    impact("undo");
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

  const fr = lang === "fr";
  async function share() {
    try {
      const result = await shareResult(
        `Neon Arrow · ${title} · ${starsFor(mistakes, hintsUsed)} ★ · ${moves} ${t(lang, "moves")} · AiXel Studio`,
      );
      if (result === "unsupported")
        setNotice(
          fr
            ? "Le partage est disponible dans l’app iPhone."
            : "Sharing is available in the iPhone app.",
        );
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        setNotice(fr ? "Partage indisponible pour le moment." : "Sharing unavailable right now.");
    }
  }
  const status = invalidId
    ? fr
      ? "✕ Bloquée"
      : "✕ Blocked"
    : focusClear != null
      ? focusClear
        ? t(lang, "clearPath")
        : t(lang, "blocked")
      : level.id === 1 && moves === 0
        ? fr
          ? "Touche une flèche pour la lancer"
          : "Tap an arrow to launch"
        : "";
  return (
    <div
      ref={fullscreen.root}
      className={cn(
        "game-play",
        fullscreen.immersive && "is-immersive",
        reduced && "motion-reduced",
        concentration && "concentration",
      )}
    >
      <div
        className="play-content"
        inert={paused || settings || !!ended}
        aria-hidden={paused || settings || !!ended}
      >
        <header className="play-header">
          <IconBtn label={t(lang, "back")} onClick={pause}>
            <ArrowLeft size={22} />
          </IconBtn>
          <div className="play-heading">
            <p>
              {level.id > 0 ? `${fr ? "Niveau" : "Level"} ${level.id}` : subtitle} ·{" "}
              {fr ? tier.fr : tier.en}
            </p>
            <h1 title={title}>{title}</h1>
          </div>
          <IconBtn label="Pause" onClick={pause}>
            <Pause size={19} />
          </IconBtn>
        </header>
        <div className="play-stats">
          <div
            className="play-hearts"
            aria-label={`${hearts} ${fr ? "vies restantes" : "lives remaining"}`}
          >
            {Array.from({ length: level.hearts }, (_, i) => (
              <Heart
                key={i}
                size={20}
                className={i < hearts ? "fill-danger text-danger" : "text-faint"}
              />
            ))}
          </div>
          <div className="play-meter" aria-hidden="true">
            <span
              style={{ width: `${(100 * (level.arrowCount - remaining)) / level.arrowCount}%` }}
            />
          </div>
          <p aria-live="polite" aria-atomic="true">
            {remaining} / {level.arrowCount}
            <span>
              {moves} {t(lang, "moves")}
            </span>
          </p>
        </div>
        <div className="play-board-area">
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
            shaking={false}
            reduced={reduced}
            zoom={zoom}
            onZoom={setZoom}
            lang={lang}
            onHover={setHoverId}
            onInspect={inspect}
            onActivate={activate}
            onDepartureDone={finishDeparture}
          />
          {status && (
            <p
              className={cn(
                "board-status",
                (invalidId || focusClear === false) && "status-blocked",
              )}
              role="status"
            >
              {status}
            </p>
          )}
        </div>
        <nav className="play-dock" aria-label={fr ? "Commandes du jeu" : "Game controls"}>
          <IconBtn
            disabled={undosLeft <= 0 || !session.history.length}
            onClick={undo}
            label={t(lang, "undo")}
          >
            <Undo2 size={20} />
            <span>{undosLeft}</span>
          </IconBtn>
          <IconBtn
            disabled={hintsLeft <= 0 || !remaining || hearts <= 0}
            onClick={hint}
            label={t(lang, "hint")}
          >
            <Lightbulb size={20} />
            <span>{hintsLeft}</span>
          </IconBtn>
          <div className="dock-spacer" />
          <div className="dock-zoom">
            <IconBtn
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.35).toFixed(2)))}
              label={t(lang, "zoomOut")}
            >
              <ZoomOut size={18} />
            </IconBtn>
            <IconBtn
              onClick={() => setZoom((z) => Math.min(4, +(z + 0.35).toFixed(2)))}
              label={t(lang, "zoomIn")}
            >
              <ZoomIn size={18} />
            </IconBtn>
          </div>
          <IconBtn onClick={() => setZoom(1)} label={t(lang, "resetView")}>
            <Scan size={18} />
          </IconBtn>
          {!isNative() && (
            <span className="desktop-fullscreen">
              <IconBtn
                onClick={() => void fullscreen.toggle()}
                label={t(lang, fullscreen.immersive ? "exitFullscreen" : "fullscreen")}
                pressed={fullscreen.immersive}
              >
                {fullscreen.immersive ? <Minimize size={18} /> : <Maximize size={18} />}
              </IconBtn>
            </span>
          )}
        </nav>
        <p className="play-help">{inspectPref ? t(lang, "inspectHint") : t(lang, "gestureHint")}</p>
      </div>
      {notice && (
        <div className="save-notice" role="alert">
          <p>{notice}</p>
          <button onClick={() => setNotice("")}>OK</button>
        </div>
      )}
      {settings ? (
        <SettingsPanel onClose={() => setSettings(false)} />
      ) : paused && !ended ? (
        <Sheet title="Pause" onClose={resume}>
          <p className="sheet-note">
            {title} · {remaining} {t(lang, "arrows")}
          </p>
          <button className="sheet-primary" onClick={resume}>
            {fr ? "Reprendre" : "Resume"}
          </button>
          <button className="sheet-secondary" onClick={restart}>
            {fr ? "Recommencer" : "Restart"}
          </button>
          <button className="sheet-secondary" onClick={() => setSettings(true)}>
            <SlidersHorizontal size={18} />
            {fr ? "Réglages" : "Settings"}
          </button>
          <button className="sheet-quiet" onClick={onExit}>
            {fr ? "Quitter vers le menu" : "Exit to menu"}
          </button>
        </Sheet>
      ) : null}
      {ended && !settings && (
        <Sheet title={t(lang, ended === "win" ? "won" : "lost")}>
          <p className="sheet-note">{t(lang, ended === "win" ? "allClear" : "lostHint")}</p>
          {ended === "win" && (
            <>
              <div
                className="win-stars"
                aria-label={`${starsFor(mistakes, hintsUsed)} ${t(lang, "stars")}`}
              >
                {[0, 1, 2].map((i) => (
                  <Star
                    key={i}
                    size={36}
                    style={{ animationDelay: `${i * 140}ms` }}
                    className={
                      i < starsFor(mistakes, hintsUsed) ? "fill-accent text-accent" : "text-faint"
                    }
                  />
                ))}
              </div>
              <p className="sheet-note">
                {moves} {t(lang, "moves")}
              </p>
            </>
          )}
          {ended === "win" && level.id > 0 && level.id < 80 && (
            <button
              className="sheet-primary"
              onClick={() =>
                navigate({ to: "/play/$levelId", params: { levelId: String(level.id + 1) } })
              }
            >
              {t(lang, "next")}
            </button>
          )}
          {ended === "lose" && undosLeft > 0 && session.history.length > 0 && (
            <button
              className="sheet-primary"
              onClick={() => {
                resume();
                undo();
              }}
            >
              {t(lang, "undo")}
            </button>
          )}
          <button className="sheet-secondary" onClick={restart}>
            {t(lang, "retry")}
          </button>
          {ended === "win" && (
            <button className="sheet-secondary" onClick={() => void share()}>
              <Share2 size={18} />
              {fr ? "Partager" : "Share"}
            </button>
          )}
          <button className="sheet-quiet" onClick={onExit}>
            {t(lang, "menu")}
          </button>
        </Sheet>
      )}
    </div>
  );
}
function IconBtn({
  children,
  onClick,
  disabled,
  label,
  pressed,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className="game-control"
    >
      {children}
    </button>
  );
}
