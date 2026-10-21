import { useSyncExternalStore } from "react";

import type { Density, Motion, Scope, Theme, Tweak } from "./types";

/** URL search keys owned by the demo bar; never passed to screens. */
export const RESERVED_PARAMS = ["demo", "theme", "density", "scope", "scenario", "step", "look", "tweak"] as const;

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
  /** Direction picked in the bar; null = the locked or the first offered direction. */
  direction: string | null;
  tweak: Tweak;
}

const PREFIX = "kickoff:";
const persisted = ["theme", "density", "scope", "collapsed", "direction", "tweak"] as const;

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

const motions: Motion[] = ["off", "calm", "lively"];
const DIRECTION_ID = /^[a-z0-9][a-z0-9-]*$/;

function pick<T extends string>(value: string | null | undefined, allowed: T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function bounded(value: string | undefined, min: number, max: number): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
}

/** "h:250,c:0.12,r:0.75,m:calm" -> { h: 250, c: 0.12, r: 0.75, m: "calm" }; unknown keys and bad values are dropped. */
export function parseTweak(text: string | null | undefined): Tweak {
  const out: Tweak = {};
  for (const part of (text ?? "").split(",")) {
    const [key, value] = part.split(":").map((s) => s.trim());
    if (key === "h") out.h = bounded(value, 0, 360);
    else if (key === "c") out.c = bounded(value, 0, 0.3);
    else if (key === "r") out.r = bounded(value, 0, 1.5);
    else if (key === "m") out.m = pick(value, motions);
  }
  for (const key of Object.keys(out) as Array<keyof Tweak>) if (out[key] === undefined) delete out[key];
  return out;
}

/** The inverse of parseTweak; "" when nothing is tweaked. */
export function formatTweak(tweak: Tweak): string {
  const parts: string[] = [];
  if (tweak.h !== undefined) parts.push(`h:${Math.round(tweak.h)}`);
  if (tweak.c !== undefined) parts.push(`c:${Number(tweak.c.toFixed(3))}`);
  if (tweak.r !== undefined) parts.push(`r:${Number(tweak.r.toFixed(3))}`);
  if (tweak.m !== undefined) parts.push(`m:${tweak.m}`);
  return parts.join(",");
}

function directionId(value: string | null | undefined): string | null {
  return value && DIRECTION_ID.test(value) ? value : null;
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
    direction: (hasWindow && directionId(readStorage("direction"))) || null,
    tweak: hasWindow ? parseTweak(readStorage("tweak")) : {},
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
          if (key === "tweak") writeStorage(key, formatTweak(state.tweak) || null);
          else writeStorage(key, value === null ? null : typeof value === "boolean" ? (value ? "1" : "0") : String(value));
        }
      }
    }
    for (const listener of listeners) listener();
  },
  /** Apply reserved URL params (?demo=0&theme=dark&density=touch&scope=mvp&scenario=x&step=2&look=b&tweak=h:30)
   * without persisting them. */
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
    const direction = directionId(get("look"));
    if (direction) patch.direction = direction;
    const tweak = get("tweak");
    if (tweak !== undefined) patch.tweak = parseTweak(tweak);
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
