import { useEffect, useRef } from "react";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { fetchCloudProgress, pushCloudProgress } from "@/lib/progress";
import { applyRemote, useProgress } from "@/game/progress-store";

export function CloudSync() {
  const { user, isPending } = useCurrentUserState();
  const progress = useProgress((s) => s.progress);
  const ready = useProgress((s) => s.ready);
  const hydrate = useProgress((s) => s.hydrate);
  const pushed = useRef("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!authEnabled || isPending || !user || user.isDevFallback || !ready) return;
    let cancelled = false;
    fetchCloudProgress()
      .then((remote) => {
        if (cancelled) return;
        applyRemote(remote);
      })
      .catch(() => {
        /* guest / unauthorized */
      });
    return () => {
      cancelled = true;
    };
  }, [user, isPending, ready]);

  useEffect(() => {
    if (!authEnabled || !user || user.isDevFallback || !ready) return;
    const blob = JSON.stringify(progress);
    if (blob === pushed.current) return;
    const t = window.setTimeout(() => {
      pushed.current = blob;
      pushCloudProgress({ data: progress }).catch(() => {});
    }, 600);
    return () => window.clearTimeout(t);
  }, [progress, user, ready]);

  return null;
}