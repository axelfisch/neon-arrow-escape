import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Infinity as InfinityIcon, LayoutGrid, Sun } from "lucide-react";
import { Shell } from "@/components/game/Shell";
import { useProgress } from "@/game/progress-store";
import { t, type Lang } from "@/game/i18n";
import { getLevels } from "@/game/catalog";
import { dailySeed } from "@/game/generator";
import { unlockAudio } from "@/game/audio";

export const Route = createFileRoute("/")({ component: Home });

export function Home() {
  const progress = useProgress((s) => s.progress);
  const lang = progress.lang;
  const levels = useMemo(() => getLevels(), []);
  const nextId =
    levels.find((l) => l.id <= 62 && !progress.completed.includes(l.id))?.id ??
    (progress.completed.length ? 80 : 1);
  const cleared = progress.completed.length;
  const stars = Object.values(progress.stars).reduce((n, s) => n + s, 0);
  const today = dailySeed().key;

  return (
    <Shell>
      <section className="flex flex-col items-start pt-4">
        <p className="font-mono text-[11px] tracking-[0.32em] text-muted uppercase">{t(lang, "tag")}</p>
        <h1 className="font-display glow-cyan mt-3 text-5xl leading-none font-semibold tracking-tight text-accent sm:text-6xl">
          NEON
          <br />
          ARROW
        </h1>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
          {lang === "fr"
            ? "Puzzle d'évasion. 80 niveaux, génération inverse, défis à 100 et 150 flèches. Une seule erreur peut tout fermer."
            : "Escape puzzle. 80 levels, reverse generation, 100- and 150-arrow gauntlets. One blocked tap can end it."}
        </p>

        <div className="mt-6 flex flex-wrap gap-2 font-mono text-[11px] text-faint">
          <span className="rounded-full border border-border px-2.5 py-1">{cleared}/80</span>
          <span className="rounded-full border border-border px-2.5 py-1">
            {stars} {t(lang, "stars")}
          </span>
          <span className="rounded-full border border-border px-2.5 py-1">
            {t(lang, "best")} ∞ {progress.endlessBest}
          </span>
        </div>

        <div className="mt-8 flex w-full flex-col gap-3">
          <Link
            to="/play/$levelId"
            params={{ levelId: String(nextId) }}
            onClick={() => unlockAudio()}
            className="flex items-center justify-between rounded-2xl bg-fg px-5 py-4 text-bg transition-transform active:scale-[0.99]"
          >
            <span className="font-display text-lg font-semibold">
              {cleared === 0 ? t(lang, "play") : t(lang, "continue")}
            </span>
            <ArrowRight className="size-5" />
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/levels"
              className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-4 text-sm hover:border-accent/30"
            >
              <LayoutGrid className="size-4 text-accent" />
              {t(lang, "levels")}
            </Link>
            <Link
              to="/daily"
              className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-4 text-sm hover:border-accent/30"
            >
              <Sun className="size-4 text-accent" />
              {t(lang, "daily")}
            </Link>
            <Link
              to="/endless"
              className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-4 text-sm hover:border-accent/30"
            >
              <InfinityIcon className="size-4 text-accent" />
              {t(lang, "endless")}
            </Link>
            <a
              href="#rules"
              className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-4 text-sm hover:border-accent/30"
            >
              <span className="grid size-4 place-items-center rounded-sm border border-accent/40 font-mono text-[10px] text-accent">
                ?
              </span>
              {t(lang, "how")}
            </a>
          </div>
        </div>

        <div className="mt-4 grid w-full grid-cols-3 gap-2">
          {[
            { id: 67, label: lang === "fr" ? "Centurie" : "Century" },
            { id: 73, label: lang === "fr" ? "Hécatombe" : "Hecatomb" },
            { id: 80, label: "Néant" },
          ].map((g) => {
            const n = levels.find((l) => l.id === g.id)?.arrowCount ?? g.id;
            return (
            <Link
              key={g.id}
              to="/play/$levelId"
              params={{ levelId: String(g.id) }}
              className="rounded-2xl border border-danger/30 bg-danger/6 px-3 py-3 text-center hover:border-danger/55"
            >
              <p className="font-mono text-[10px] tracking-wider text-danger">{n}</p>
              <p className="mt-1 font-display text-xs font-semibold">{g.label}</p>
            </Link>
            );
          })}
        </div>

        <HowToPanel lang={lang} />

        {progress.dailyKey === today && progress.dailyWon && (
          <p className="mt-6 text-xs text-ok">{t(lang, "dailyDone")}</p>
        )}
      </section>
    </Shell>
  );
}

function HowToPanel({ lang }: { lang: Lang }) {
  return (
    <section id="rules" className="mt-12 border-t border-border pt-8">
      <h2 className="font-display text-lg font-semibold">{t(lang, "how")}</h2>
      <ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
        <li>{t(lang, "rule1")}</li>
        <li>{t(lang, "rule2")}</li>
        <li>{t(lang, "rule3")}</li>
        <li>{t(lang, "rule4")}</li>
        <li>{t(lang, "rule5")}</li>
      </ol>
    </section>
  );
}
