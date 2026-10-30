import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/game/Shell";
import { PlayView } from "@/components/game/PlayView";
import { generateDaily } from "@/game/generator";
import { useProgress } from "@/game/progress-store";
import { t } from "@/game/i18n";

export const Route = createFileRoute("/daily")({ component: DailyPage });

export function DailyPage() {
  const navigate = useNavigate();
  const progress = useProgress((s) => s.progress);
  const setProgress = useProgress((s) => s.setProgress);
  const lang = progress.lang;
  const pack = useMemo(() => generateDaily(), []);

  if (!pack.level) {
    return (
      <Shell>
        <p className="text-muted">{t(lang, "emptyDaily")}</p>
        <Link to="/" className="mt-4 inline-block text-sm text-accent">
          {t(lang, "back")}
        </Link>
      </Shell>
    );
  }

  return (
    <Shell wide game>
      <PlayView
        level={pack.level}
        subtitle={t(lang, "daily")}
        onExit={() => navigate({ to: "/" })}
        onWin={(stars) => {
          setProgress({
            ...progress,
            dailyKey: pack.key,
            dailyWon: true,
            dailyStars: Math.max(progress.dailyStars, stars),
          });
        }}
      />
    </Shell>
  );
}
