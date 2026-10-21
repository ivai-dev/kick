import type { KickoffConfig, Scenario, ScreenDef, ScreenModules } from "./types";

export interface KickoffRegistry {
  config: KickoffConfig;
  screens: ScreenDef[];
  scenarios?: Scenario[];
  /** import.meta.glob("./screens/*.tsx") — keys are checked against screen ids. */
  screenModules?: ScreenModules;
}

/** "./screens/sc-01.tsx" -> "sc-01" */
export function moduleId(path: string): string {
  return path.replace(/^.*\//, "").replace(/\.[jt]sx?$/, "");
}

/**
 * Consistency checks of the generated registry. Returns human-readable
 * problems; an empty array means the registry is consistent.
 */
export function validateKickoff({ config, screens, scenarios = [], screenModules }: KickoffRegistry): string[] {
  const problems: string[] = [];
  const roleIds = new Set(config.roles.map((r) => r.id));
  const screenById = new Map<string, ScreenDef>();

  if (!config.releases.length) problems.push("config.releases is empty");
  if (!roleIds.has(config.defaultRole)) problems.push(`config.defaultRole "${config.defaultRole}" is not a role`);
  if (roleIds.size !== config.roles.length) problems.push("duplicate role ids in config.roles");

  for (const screen of screens) {
    if (screenById.has(screen.id)) problems.push(`duplicate screen id "${screen.id}"`);
    screenById.set(screen.id, screen);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(screen.id)) problems.push(`screen id "${screen.id}" must be lower-case kebab`);
    if (!screen.roles.length) problems.push(`screen ${screen.id} has no roles`);
    for (const role of screen.roles) {
      if (!roleIds.has(role)) problems.push(`screen ${screen.id} uses unknown role "${role}"`);
    }
    if (!config.releases.includes(screen.rel)) problems.push(`screen ${screen.id} has unknown release "${screen.rel}"`);
  }

  for (const role of config.roles) {
    const home = screenById.get(role.home);
    if (!home) problems.push(`role ${role.id} home "${role.home}" is not a screen`);
    else if (!home.roles.includes(role.id)) problems.push(`role ${role.id} home ${role.home} is not available to the role`);
  }

  const scenarioIds = new Set<string>();
  for (const scenario of scenarios) {
    if (scenarioIds.has(scenario.id)) problems.push(`duplicate scenario id "${scenario.id}"`);
    scenarioIds.add(scenario.id);
    if (!roleIds.has(scenario.role)) problems.push(`scenario ${scenario.id} uses unknown role "${scenario.role}"`);
    if (!scenario.steps.length) problems.push(`scenario ${scenario.id} has no steps`);
    scenario.steps.forEach((step, i) => {
      const screen = screenById.get(step.screen);
      if (!screen) problems.push(`scenario ${scenario.id} step ${i + 1} uses unknown screen "${step.screen}"`);
      else if (!screen.roles.includes(scenario.role))
        problems.push(`scenario ${scenario.id} step ${i + 1}: ${step.screen} is not available to ${scenario.role}`);
    });
  }

  if (screenModules) {
    const moduleIds = new Set(Object.keys(screenModules).map(moduleId));
    for (const screen of screens) {
      if (!moduleIds.has(screen.id)) problems.push(`screen ${screen.id} has no module screens/${screen.id}.tsx`);
    }
    for (const id of moduleIds) {
      if (!screenById.has(id)) problems.push(`screens/${id}.tsx has no row in screens.ts`);
    }
  }

  return problems;
}
