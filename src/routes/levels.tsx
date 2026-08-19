import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Star } from "lucide-react";
import { Shell } from "@/components/game/Shell";
import { getLevels, TIER_META } from "@/game/catalog";
import { useProgress } from "@/game/progress-store";
import { t } from "@/game/i18n";
import { isUnlocked } from "@/game/save";
import { TIER_ORDER } from "@/game/types";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/levels")({ component: LevelsPage });

export function LevelsPage() {
  const progress = useProgress((s) => s.progress);
  const lang = progress.lang;
  const levels = useMemo(() => getLevels(), []);

  return (
    <Shell wide>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">{t(lang, "campaign")}</p>
          <h1 className="font-display mt-1 text-3xl font-semibold">{t(lang, "select")}</h1>
        </div>
        <Link to="/" className="text-sm text-muted hover:text-fg">
          {t(lang, "back")}
        </Link>
      </div>

      {TIER_ORDER.map((tier) => {
        const group = levels.filter((l) => l.tier === tier);
        if (!group.length) return null;
        const meta = TIER_META[tier];
        return (
          <section key={tier} className="mb-8">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-sm font-semibold tracking-wide" style={{ color: meta.accent }}>
                {lang === "fr" ? meta.fr : meta.en}
              </h2>
              <span className="font-mono text-[10px] text-faint">
                {group[0]!.arrowCount}–{group[group.length - 1]!.arrowCount} {t(lang, "arrows")}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
              {group.map((lv) => {
                const open = isUnlocked(lv.id, progress.completed);
                const done = progress.completed.includes(lv.id);
                const stars = progress.stars[String(lv.id)] ?? 0;
                return open ? (
                  <Link
                    key={lv.id}
                    to="/play/$levelId"
                    params={{ levelId: String(lv.id) }}
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-medium transition-colors",
                      done && "border-accent/30 bg-accent/8 text-accent",
                      !done && "border-border bg-surface text-fg hover:border-accent/40",
                    )}
                  >
                    <span className="font-mono text-sm tabular-nums">{lv.id}</span>
                    {done && (
                      <span className="mt-0.5 flex gap-0.5">
                        {Array.from({ length: 3 }, (_, i) => (
                          <Star
                            key={i}
                            className={cn("size-2", i < stars ? "fill-accent text-accent" : "text-fg/20")}
                          />
                        ))}
                      </span>
                    )}
                    {lv.arrowCount >= 100 && (
                      <span className="absolute top-1 right-1 size-1.5 rounded-full bg-danger" />
                    )}
                  </Link>
                ) : (
                  <div
                    key={lv.id}
                    className="relative flex aspect-square flex-col items-center justify-center rounded-xl border border-border/60 bg-surface/40 text-faint"
                    aria-label={t(lang, "locked")}
                  >
                    <Lock className="size-3.5" />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </Shell>
  );
}
