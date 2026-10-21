import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  RouterProvider,
  useParams,
  useSearch,
  type AnyRouter,
} from "@tanstack/react-router";

import { DemoBar } from "./components/DemoBar";
import {
  Loading,
  markNavigationStart,
  NotAvailableContent,
  NotFoundContent,
  ReadyMarker,
  RouteError,
  ScreenBoundary,
} from "./components/system";
import { Placeholder } from "./components/Placeholder";
import { demoStore, useDemo } from "./demo-store";
import { activeDirection, applyLook } from "./look";
import {
  KickoffContext,
  parseSearch,
  ScreenContext,
  setRuntime,
  stringifySearch,
  type KickoffRuntime,
} from "./runtime";
import { AppShell } from "./shells/AppShell";
import { SiteShell } from "./shells/SiteShell";
import { createKickoffHistory } from "./history";
import { kitStrings } from "./strings";
import type { KickoffConfig, RoleDef, Scenario, ScreenDef, ScreenModules } from "./types";
import { moduleId, validateKickoff } from "./validate";

export interface CreateKickoffAppOptions {
  config: KickoffConfig;
  screens: ScreenDef[];
  scenarios?: Scenario[];
  /** import.meta.glob("./screens/*.tsx") — lazy, keyed by file; the file name is the screen id. */
  screenModules: ScreenModules;
}

export interface KickoffApp {
  router: AnyRouter;
  /** Renders the router (shells, screens, demo bar). */
  App: ComponentType;
  runtime: KickoffRuntime;
}

function storageWorks(): boolean {
  try {
    const storage = window.sessionStorage;
    storage.setItem("kickoff:probe", "1");
    storage.removeItem("kickoff:probe");
    return true;
  } catch {
    return false;
  }
}

function applyHtml(lang: string, theme: string, density: string, scope: string) {
  const root = document.documentElement;
  root.lang = lang;
  root.dataset.theme = theme;
  root.dataset.density = density;
  root.dataset.scope = scope;
}

export function createKickoffApp({
  config,
  screens,
  scenarios = [],
  screenModules,
}: CreateKickoffAppOptions): KickoffApp {
  const problems = validateKickoff({ config, screens, scenarios, screenModules });
  if (problems.length) console.warn(`[kickoff] registry problems:\n- ${problems.join("\n- ")}`);

  const components = new Map<string, LazyExoticComponent<ComponentType>>();
  for (const [path, load] of Object.entries(screenModules)) {
    components.set(
      moduleId(path),
      lazy(async () => {
        const mod = (await load()) as { default?: ComponentType };
        if (!mod.default) throw new Error(`${path} has no default export`);
        return { default: mod.default };
      }),
    );
  }

  const rolesById = new Map(config.roles.map((role) => [role.id, role]));
  const defaultRole: RoleDef = rolesById.get(config.defaultRole) ??
    config.roles[0] ?? { id: "guest", name: "Guest", shell: "app", home: screens[0]?.id ?? "" };

  const runtime: KickoffRuntime = {
    config,
    screens,
    scenarios,
    strings: kitStrings(config.lang),
    screensById: new Map(screens.map((screen) => [screen.id, screen])),
    rolesById,
    components,
    defaultRole,
  };

  // Apply ?demo / ?theme / ... before the first paint.
  if (typeof window !== "undefined") {
    const query = window.location.hash.split("?")[1];
    if (query) demoStore.applyParams(parseSearch(query));
    const state = demoStore.get();
    applyHtml(config.lang, state.theme, state.density ?? defaultRole.density ?? "comfortable", state.scope);
    applyLook(activeDirection(config, state.direction), state.tweak);
  }

  function Frame({ role, current, children }: { role: RoleDef; current?: string | null; children: ReactNode }) {
    const Shell = role.shell === "site" ? SiteShell : AppShell;
    return <Shell current={current}>{children}</Shell>;
  }

  function Root() {
    const params = useParams({ strict: false }) as { role?: string };
    const search = useSearch({ strict: false }) as Record<string, unknown>;
    const role = (params.role && rolesById.get(params.role)) || defaultRole;
    const theme = useDemo((s) => s.theme);
    const density = useDemo((s) => s.density) ?? role.density ?? "comfortable";
    const scope = useDemo((s) => s.scope);
    const direction = activeDirection(config, useDemo((s) => s.direction));
    const tweak = useDemo((s) => s.tweak);

    useEffect(() => demoStore.applyParams(search), [search]);
    useLayoutEffect(() => applyHtml(config.lang, theme, density, scope), [theme, density, scope]);
    useLayoutEffect(() => applyLook(direction, tweak), [direction, tweak]);

    return (
      <KickoffContext.Provider value={runtime}>
        <DemoBar />
        <Outlet />
      </KickoffContext.Provider>
    );
  }

  function NotFoundPage() {
    useLayoutEffect(() => markNavigationStart(), []);
    return (
      <ScreenContext.Provider value={{ role: defaultRole, screen: null }}>
        <Frame role={defaultRole}>
          <NotFoundContent />
          <ReadyMarker id="404" title={runtime.strings.notFound} />
        </Frame>
      </ScreenContext.Provider>
    );
  }

  function ScreenPage() {
    const params = useParams({ strict: false }) as { role?: string; screen?: string };
    const roleId = params.role ?? "";
    const screenId = params.screen ?? "";
    useLayoutEffect(() => markNavigationStart(), [roleId, screenId]);

    const role = rolesById.get(roleId);
    if (!role) return <NotFoundPage />;
    const screen = runtime.screensById.get(screenId) ?? null;

    let content: ReactNode;
    let readyId = screenId;
    let title = screen?.name ?? runtime.strings.notFound;
    if (!screen) {
      content = <NotFoundContent />;
      readyId = "404";
    } else if (!screen.roles.includes(role.id)) {
      content = <NotAvailableContent screen={`${screen.code} ${screen.name}`} />;
      readyId = "not-available";
      title = runtime.strings.notAvailable;
    } else {
      const Screen = components.get(screen.id);
      content = Screen ? <Screen /> : <Placeholder />;
    }

    return (
      <ScreenContext.Provider value={{ role, screen }}>
        <Frame role={role} current={screen?.id}>
          <ScreenBoundary key={`${role.id}/${screenId}`} strings={runtime.strings}>
            <Suspense fallback={<Loading />}>
              {content}
              <ReadyMarker id={readyId} title={title} />
            </Suspense>
          </ScreenBoundary>
        </Frame>
      </ScreenContext.Provider>
    );
  }

  const rootRoute = createRootRoute({
    component: Root,
    notFoundComponent: NotFoundPage,
    errorComponent: RouteError,
  });

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    beforeLoad: () => {
      throw redirect({
        to: "/$role/$screen",
        params: { role: defaultRole.id, screen: defaultRole.home },
        replace: true,
      } as never);
    },
  });

  const roleRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/$role",
    beforeLoad: ({ params }) => {
      const role = rolesById.get((params as { role: string }).role) ?? defaultRole;
      throw redirect({
        to: "/$role/$screen",
        params: { role: role.id, screen: role.home },
        replace: true,
      } as never);
    },
  });

  const screenRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/$role/$screen",
    component: ScreenPage,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, roleRoute, screenRoute]),
    history: createKickoffHistory(),
    parseSearch,
    stringifySearch,
    scrollRestoration: typeof window !== "undefined" && storageWorks(),
    defaultNotFoundComponent: NotFoundPage,
  });

  setRuntime(runtime, router as unknown as AnyRouter);

  function App() {
    return <RouterProvider router={router} />;
  }

  return { router: router as unknown as AnyRouter, App, runtime };
}
