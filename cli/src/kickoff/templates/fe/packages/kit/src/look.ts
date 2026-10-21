/** The visual direction and the tweak panel's overrides, applied to <html>. */
import type { KickoffConfig, Motion, Tweak } from "./types";

/** The direction in effect: the locked one, else the bar's pick when offered, else the first offered. */
export function activeDirection(config: KickoffConfig, picked: string | null): string | null {
  if (config.direction) return config.direction;
  const offered = config.directions ?? [];
  return offered.find((d) => d.id === picked)?.id ?? offered[0]?.id ?? null;
}

const TWEAK_VARS = { h: "--brand-h", c: "--brand-c", r: "--radius" } as const;
/** fast, base, slow in ms; "calm" keeps the direction's own durations. */
const MOTION_LEVELS: Record<Motion, [number, number, number] | null> = {
  off: [0, 0, 0],
  calm: null,
  lively: [160, 280, 440],
};

export function applyLook(direction: string | null, tweak: Tweak) {
  const root = document.documentElement;
  if (direction) root.dataset.direction = direction;
  else delete root.dataset.direction;
  for (const [key, name] of Object.entries(TWEAK_VARS) as Array<[keyof typeof TWEAK_VARS, string]>) {
    const value = tweak[key];
    if (value === undefined) root.style.removeProperty(name);
    else root.style.setProperty(name, key === "r" ? `${value}rem` : String(value));
  }
  if (tweak.m) root.dataset.motion = tweak.m;
  else delete root.dataset.motion;
  // Inline, so the level beats a direction's own durations; the kit's reduced-motion rule still stops transitions.
  const durations = tweak.m ? MOTION_LEVELS[tweak.m] : null;
  for (const [i, name] of ["--duration-fast", "--duration-base", "--duration-slow"].entries()) {
    if (durations) root.style.setProperty(name, `${durations[i]}ms`);
    else root.style.removeProperty(name);
  }
}
