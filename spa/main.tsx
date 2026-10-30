import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Home } from "@/routes/index";
import { LevelsPage } from "@/routes/levels";
import { PlayPage } from "@/routes/play.$levelId";
import { DailyPage } from "@/routes/daily";
import { EndlessPage } from "@/routes/endless";
import { Shell } from "@/components/game/Shell";
import "@/styles.css";
import { useReducedMotion } from "@/components/game/SettingsPanel";
import { initializeDevice } from "@/game/device";
import { useSettings } from "@/game/settings";
import { useProgress } from "@/game/progress-store";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const levelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/levels",
  component: LevelsPage,
});

const playRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/play/$levelId",
  component: PlayPage,
});

const dailyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/daily",
  component: DailyPage,
});

const endlessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/endless",
  component: EndlessPage,
});

function NotFoundPage() {
  return (
    <Shell>
      <p className="text-muted">Page introuvable.</p>
      <Link to="/" className="mt-4 inline-block text-sm text-accent">
        Retour
      </Link>
    </Shell>
  );
}

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$",
  component: NotFoundPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  levelsRoute,
  playRoute,
  dailyRoute,
  endlessRoute,
  notFoundRoute,
]);

const router = createRouter({ routeTree });

const el = document.getElementById("app");
if (!el) throw new Error("Missing #app");

function PreferencesEffects() {
  const reduced = useReducedMotion();
  useEffect(() => {
    document.documentElement.classList.toggle("reduced-motion", reduced);
  }, [reduced]);
  return null;
}
async function boot() {
  try {
    await initializeDevice();
    useSettings.getState().hydrate();
    useProgress.getState().hydrate();
    createRoot(el!).render(
      <StrictMode>
        <PreferencesEffects />
        <RouterProvider router={router} />
      </StrictMode>,
    );
  } catch {
    // Preserve the native file if it cannot be read; never silently overwrite it.
    el!.replaceChildren();
    const message = document.createElement("p");
    message.textContent =
      "Impossible de lire la sauvegarde. Ferme puis rouvre l’app. Tes données n’ont pas été remplacées.";
    message.style.cssText = "padding:32px;color:#e8eef8;background:#070b16";
    el!.append(message);
  }
}
void boot();
