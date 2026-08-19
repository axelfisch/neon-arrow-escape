import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useProgress } from "@/game/progress-store";
import { t } from "@/game/i18n";

export function AuthSlot({ compact = false }: { compact?: boolean }) {
  const { user, isPending } = useCurrentUserState();
  const lang = useProgress((s) => s.progress.lang);

  if (!authEnabled || user?.isDevFallback) return null;

  if (isPending) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-fg/8" />;
  }

  if (user) {
    return (
      <div className="[&_button]:text-muted [&_span]:text-fg/90 max-w-[36vw] truncate text-xs">
        <UserButton />
      </div>
    );
  }

  return (
    <Link
      to="/login"
      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-fg"
    >
      {compact ? (lang === "fr" ? "Compte" : "Account") : t(lang, "signIn")}
    </Link>
  );
}