import { StrictMode } from "react";
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

createRoot(el).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
