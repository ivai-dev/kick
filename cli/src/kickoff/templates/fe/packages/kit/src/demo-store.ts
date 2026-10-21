import { useSyncExternalStore } from "react";

import type { Density, Scope, Theme } from "./types";

/** URL search keys owned by the demo bar; never passed to screens. */
export const RESERVED_PARAMS = ["demo", "theme", "density", "scope", "scenario", "step"] as const;

export interface DemoState {
  theme: Theme;
  /** null = use the role's density. */
  density: Density | null;
  scope: Scope;
  /** false after ?demo=0 (customer links, screenshots, e2e). */
  visible: boolean;
  collapsed: boolean;
  scenarioId: string | null;
  step: number;
}

const PREFIX = "kickoff:";
const persisted = ["theme", "density", "scope", "collapsed"] as const;

/** localStorage throws in sandboxed iframes, private windows, blocked storage. */
function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(PREFIX + key);
    else window.localStorage.setItem(PREFIX + key, value);
  } catch {
    /* storage unavailable: keep the value in memory only */
  }
}

const themes: Theme[] = ["light", "dark"];
const densities: Density[] = ["compact", "comfortable", "touch"];
const scopes: Scope[] = ["all", "mvp", "tagged"];

function pick<T extends string>(value: string | null | undefined, allowed: T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function initialState(): DemoState {
  const hasWindow = typeof window !== "undefined";
  return {
    theme: (hasWindow && pick(readStorage("theme"), themes)) || "light",
    density: (hasWindow && pick(readStorage("density"), densities)) || null,
    scope: (hasWindow && pick(readStorage("scope"), scopes)) || "all",
    visible: true,
    collapsed: hasWindow && readStorage("collapsed") === "1",
    scenarioId: null,
    step: 0,
  };
}

let state: DemoState = initialState();
const listeners = new Set<() => void>();

export const demoStore = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Update; `persist` writes theme/density/scope/collapsed to localStorage. */
  set(patch: Partial<DemoState>, { persist = true }: { persist?: boolean } = {}) {
    state = { ...state, ...patch };
    if (persist) {
      for (const key of persisted) {
        if (key in patch) {
          const value = state[key];
          writeStorage(key, value === null ? null : typeof value === "boolean" ? (value ? "1" : "0") : value);
        }
      }
    }
    for (const listener of listeners) listener();
  },
  /** Apply reserved URL params (?demo=0&theme=dark&density=touch&scope=mvp&scenario=x&step=2) without persisting them. */
  applyParams(params: Record<string, unknown>) {
    const get = (key: string) => (params[key] == null ? undefined : String(params[key]));
    const patch: Partial<DemoState> = {};
    const demo = get("demo");
    if (demo !== undefined) patch.visible = demo !== "0" && demo !== "false";
    const theme = pick(get("theme"), themes);
    if (theme) patch.theme = theme;
    const density = pick(get("density"), densities);
    if (density) patch.density = density;
    const scope = pick(get("scope"), scopes);
    if (scope) patch.scope = scope;
    const scenario = get("scenario");
    if (scenario !== undefined) {
      patch.scenarioId = scenario || null;
      patch.step = Math.max(0, Number(get("step") ?? 0) || 0);
    }
    if (Object.keys(patch).length) demoStore.set(patch, { persist: false });
  },
};

export function useDemo<T>(selector: (state: DemoState) => T): T {
  return useSyncExternalStore(
    demoStore.subscribe,
    () => selector(state),
    () => selector(state),
  );
}
