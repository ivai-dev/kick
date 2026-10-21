/** Shell a role works in: "app" = sidebar work tool, "site" = public site. */
export type Shell = "app" | "site";
export type Density = "compact" | "comfortable" | "touch";
export type Theme = "light" | "dark";
/** Release scope of the demo bar: everything, first release only, or later releases outlined. */
export type Scope = "all" | "mvp" | "tagged";
export type PageKind = "data" | "form";

export interface RoleDef {
  id: string;
  name: string;
  shell: Shell;
  /** Screen id the role lands on. */
  home: string;
  density?: Density;
}

export interface KickoffConfig {
  product: string;
  /** BCP-47 language of the UI, used for <html lang> and kit strings ("vi", "en"). */
  lang: string;
  /** Locale for number/date formatting ("vi-VN"). */
  locale: string;
  /** Ordered releases; the first one is the MVP. */
  releases: string[];
  defaultRole: string;
  roles: RoleDef[];
}

export interface ScreenDef {
  id: string;
  code: string;
  name: string;
  roles: string[];
  platforms: string[];
  rel: string;
  /** Navigation group label, or null when the screen is not in the menu. */
  nav: string | null;
  page: PageKind;
}

export interface ScenarioStep {
  text: string;
  screen: string;
  params?: Record<string, string>;
}

export interface Scenario {
  id: string;
  name: string;
  role: string;
  steps: ScenarioStep[];
}

/** Result of import.meta.glob("./screens/*.tsx") (lazy). */
export type ScreenModules = Record<string, () => Promise<unknown>>;

export type ScreenParams = Record<string, string>;
export type ParamInput = Record<string, string | number | boolean | null | undefined>;
