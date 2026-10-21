import { createContext, useContext, useMemo, type ComponentType, type LazyExoticComponent } from "react";
import { useSearch, type AnyRouter } from "@tanstack/react-router";

import { RESERVED_PARAMS } from "./demo-store";
import type { KitStrings } from "./strings";
import type {
  KickoffConfig,
  ParamInput,
  RoleDef,
  Scenario,
  ScreenDef,
  ScreenParams,
} from "./types";

export interface KickoffRuntime {
  config: KickoffConfig;
  screens: ScreenDef[];
  scenarios: Scenario[];
  strings: KitStrings;
  screensById: Map<string, ScreenDef>;
  rolesById: Map<string, RoleDef>;
  components: Map<string, LazyExoticComponent<ComponentType>>;
  defaultRole: RoleDef;
}

let runtime: KickoffRuntime | null = null;
let router: AnyRouter | null = null;

export function setRuntime(value: KickoffRuntime, routerValue: AnyRouter) {
  runtime = value;
  router = routerValue;
}

export function getRuntime(): KickoffRuntime {
  if (!runtime) throw new Error("@kickoff/kit: call createKickoffApp() first");
  return runtime;
}

export const KickoffContext = createContext<KickoffRuntime | null>(null);

export interface ScreenContextValue {
  role: RoleDef;
  screen: ScreenDef | null;
}

export const ScreenContext = createContext<ScreenContextValue | null>(null);

export function useKickoff(): KickoffRuntime {
  return useContext(KickoffContext) ?? getRuntime();
}

/** Strings of the kit chrome in config.lang. */
export function useKitStrings(): KitStrings {
  return useKickoff().strings;
}

/** The role of the current route (falls back to config.defaultRole). */
export function useRole(): RoleDef {
  const value = useContext(ScreenContext);
  const rt = useKickoff();
  return value?.role ?? rt.defaultRole;
}

/** The screen being rendered. Throws outside a screen route. */
export function useScreen(): ScreenDef {
  const value = useContext(ScreenContext);
  if (!value?.screen) throw new Error("useScreen() must be used inside a screen");
  return value.screen;
}

/** Search params of the current screen as strings, without the demo bar's reserved keys. */
export function useScreenParams(): ScreenParams {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  return useMemo(() => {
    const out: ScreenParams = {};
    for (const [key, value] of Object.entries(search)) {
      if ((RESERVED_PARAMS as readonly string[]).includes(key) || value == null || value === "") continue;
      out[key] = String(value);
    }
    return out;
  }, [search]);
}

export function cleanParams(params: ParamInput | undefined): ScreenParams {
  const out: ScreenParams = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === null || value === undefined || value === "") continue;
    out[key] = String(value);
  }
  return out;
}

/** Search string helpers (all values are strings; no JSON encoding in URLs). */
export function parseSearch(search: string): ScreenParams {
  return Object.fromEntries(new URLSearchParams(search.startsWith("?") ? search.slice(1) : search));
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === null || value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

/** The role id in the current URL, if any. */
export function currentRoleId(): string | undefined {
  const path = router?.state.location.pathname ?? "";
  const segment = path.split("/").filter(Boolean)[0];
  return segment && runtime?.rolesById.has(segment) ? segment : undefined;
}

export interface GoOptions {
  /** Replace the history entry (filters, sort, paging). */
  replace?: boolean;
  /** Navigate as another role (defaults to the current role, or the screen's first role). */
  role?: string;
}

/**
 * Navigate to a screen: go("sc-02"), go("sc-01", { status: "draft", page: 2 }, { replace: true }).
 * Params become URL search params and are read back with useScreenParams().
 */
export function go(screenId: string, params?: ParamInput, options: GoOptions = {}): Promise<void> {
  const rt = getRuntime();
  if (!router) throw new Error("@kickoff/kit: call createKickoffApp() first");
  const screen = rt.screensById.get(screenId);
  let role = options.role ?? currentRoleId() ?? rt.config.defaultRole;
  if (!options.role && screen && !screen.roles.includes(role)) role = screen.roles[0] ?? role;
  return router.navigate({
    to: "/$role/$screen",
    params: { role, screen: screenId },
    search: cleanParams(params),
    replace: options.replace,
  } as never);
}

/** Hash href of a screen, for plain anchors and sharing. */
export function screenHref(role: string, screenId: string, params?: ParamInput): string {
  return `#/${encodeURIComponent(role)}/${encodeURIComponent(screenId)}${stringifySearch(cleanParams(params))}`;
}
