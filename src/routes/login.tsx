import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Shell } from "@/components/game/Shell";
import { useProgress } from "@/game/progress-store";
import { t } from "@/game/i18n";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const lang = useProgress((s) => s.progress.lang);

  return (
    <Shell>
      <div className="mx-auto max-w-sm pt-10">
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">{t(lang, "signIn")}</p>
        <h1 className="font-display mt-2 text-3xl font-semibold">{t(lang, "loginTitle")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t(lang, "loginLead")}</p>
        <p className="mt-2 text-xs text-faint">{t(lang, "syncHint")}</p>

        <div className="mt-8 flex flex-col gap-3">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-fg hover:border-accent/40"
              >
                {p.providerId.includes("google") ? t(lang, "continueGoogle") : t(lang, "continueX")}
              </button>
            ))
          ) : (
            <p className="text-sm text-muted">{t(lang, "authOff")}</p>
          )}
        </div>

        <Link to="/" className="mt-8 inline-block text-sm text-muted hover:text-fg">
          {t(lang, "back")}
        </Link>
      </div>
    </Shell>
  );
}
