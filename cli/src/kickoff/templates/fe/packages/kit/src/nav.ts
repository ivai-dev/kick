import type { KickoffConfig, Scope, ScreenDef } from "./types";

export interface NavGroup {
  label: string;
  items: ScreenDef[];
}

/** Is this screen part of the first release (MVP)? */
export function isFirstRelease(config: KickoffConfig, rel: string): boolean {
  return config.releases.indexOf(rel) === 0;
}

/** Screens with a nav label for the role, grouped by label in first-appearance order. */
export function navGroups(
  screens: ScreenDef[],
  roleId: string,
  config?: KickoffConfig,
  scope: Scope = "all",
): NavGroup[] {
  const groups = new Map<string, NavGroup>();
  for (const screen of screens) {
    if (!screen.nav || !screen.roles.includes(roleId)) continue;
    if (config && scope === "mvp" && !isFirstRelease(config, screen.rel)) continue;
    let group = groups.get(screen.nav);
    if (!group) {
      group = { label: screen.nav, items: [] };
      groups.set(screen.nav, group);
    }
    group.items.push(screen);
  }
  return [...groups.values()];
}
