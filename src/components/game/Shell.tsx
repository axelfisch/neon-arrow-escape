import { useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Volume2, VolumeX } from "lucide-react";
import { AuthSlot } from "./AuthSlot";
import { useProgress } from "@/game/progress-store";
import { setSoundEnabled, unlockAudio } from "@/game/audio";
import { t } from "@/game/i18n";
import { cn } from "@/lib/cn";

export function Shell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const lang = useProgress((s) => s.progress.lang);
  const sound = useProgress((s) => s.progress.sound);
  const patch = useProgress((s) => s.patch);
  const hydrate = useProgress((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="neon-grid min-h-dvh bg-bg text-fg">
      <div
        className={cn(
          "mx-auto flex min-h-dvh flex-col px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6",
          wide ? "max-w-5xl" : "max-w-lg",
        )}
      >
        <header className="mb-6 flex flex-nowrap items-center justify-between gap-3">
          <Link
            to="/"
            className="font-display shrink-0 text-sm font-semibold tracking-[0.16em] text-accent"
          >
            NEON ARROW
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label={t(lang, "sound")}
              onClick={() => {
                unlockAudio();
                const next = !sound;
                setSoundEnabled(next);
                patch({ sound: next });
              }}
              className="grid size-8 place-items-center rounded-full border border-border text-muted hover:text-fg"
            >
              {sound ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => patch({ lang: lang === "fr" ? "en" : "fr" })}
              className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] tracking-wider text-muted hover:text-fg"
            >
              {lang.toUpperCase()}
            </button>
            <AuthSlot compact />
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="mt-8 border-t border-border pt-4 text-xs text-muted">
          <p>Neon Arrow · AiXel Studio</p>
          <details className="mt-2">
            <summary className="cursor-pointer py-2">
              {lang === "fr" ? "Crédits" : "Credits"}
            </summary>
            <p className="mt-1 leading-relaxed">
              {lang === "fr"
                ? "Formes et mouvement adaptés de Arrow Escape par Umang."
                : "Shapes and movement adapted from Arrow Escape by Umang."}{" "}
              Copyright (c) 2026 Umang ·{" "}
              <a
                className="text-accent underline"
                href="/licenses/arrow-escape-MIT.txt"
                target="_blank"
                rel="noreferrer"
              >
                MIT License
              </a>{" "}
              ·{" "}
              <a
                className="text-accent underline"
                href="https://github.com/crudeGithub/Arrow-Escape-Game-Source-Code"
                target="_blank"
                rel="noreferrer"
              >
                Source
              </a>
            </p>
          </details>
        </footer>
      </div>
    </div>
  );
}
