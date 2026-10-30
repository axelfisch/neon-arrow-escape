import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/game/Shell";
import { PlayView } from "@/components/game/PlayView";
import { generateEndless } from "@/game/generator";
import { useProgress } from "@/game/progress-store";
import { t } from "@/game/i18n";
import { hashString } from "@/game/rng";

export const Route = createFileRoute("/endless")({ component: EndlessPage });

export function EndlessPage() {
  const navigate = useNavigate();
  const progress = useProgress((s) => s.progress);
  const setProgress = useProgress((s) => s.setProgress);
  const lang = progress.lang;
  const seed = useMemo(() => hashString("endless-run"), []);
  const [wave, setWave] = useState(1);
  const [tick, setTick] = useState(0);
  const level = useMemo(() => generateEndless(wave, seed + tick), [wave, seed, tick]);

  if (!level) {
    return (
      <Shell>
        <p className="text-muted">Could not build this wave.</p>
      </Shell>
    );
  }

  return (
    <Shell wide game>
      <PlayView
        key={`${wave}-${tick}`}
        level={level}
        subtitle={`${t(lang, "wave")} ${wave}`}
        onExit={() => navigate({ to: "/" })}
        onWin={() => {
          const next = wave + 1;
          setProgress({
            ...progress,
            endlessBest: Math.max(progress.endlessBest, next - 1),
          });
          setWave(next);
          setTick((n) => n + 1);
        }}
      />
    </Shell>
  );
}
