import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Shell } from "@/components/game/Shell";
import { PlayView } from "@/components/game/PlayView";
import { getLevel } from "@/game/catalog";
import { useProgress } from "@/game/progress-store";

export const Route = createFileRoute("/play/$levelId")({
  component: PlayPage,
});

export function PlayPage() {
  const { levelId } = useParams({ from: "/play/$levelId" });
  const id = Number(levelId);
  const level = getLevel(id);
  const navigate = useNavigate();
  const progress = useProgress((s) => s.progress);
  const setProgress = useProgress((s) => s.setProgress);

  if (!level || Number.isNaN(id)) {
    return (
      <Shell>
        <p className="text-muted">Unknown level.</p>
      </Shell>
    );
  }

  return (
    <Shell wide game>
      <PlayView
        key={level.key}
        level={level}
        onExit={() => navigate({ to: "/levels" })}
        onWin={(stars, moves, ms) => {
          const key = String(level.id);
          const completed = progress.completed.includes(level.id)
            ? progress.completed
            : [...progress.completed, level.id];
          setProgress({
            ...progress,
            completed,
            stars: { ...progress.stars, [key]: Math.max(progress.stars[key] ?? 0, stars) },
            bestMoves: {
              ...progress.bestMoves,
              [key]:
                progress.bestMoves[key] == null ? moves : Math.min(progress.bestMoves[key]!, moves),
            },
            bestTime: {
              ...progress.bestTime,
              [key]: progress.bestTime[key] == null ? ms : Math.min(progress.bestTime[key]!, ms),
            },
          });
        }}
      />
    </Shell>
  );
}
