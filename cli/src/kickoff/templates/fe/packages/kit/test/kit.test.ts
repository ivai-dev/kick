import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { ESLint } from "eslint";
import tseslint from "typescript-eslint";
import { describe, expect, it } from "vitest";

import kickoffRules from "../eslint/index.js";
import { contrastRatio } from "../src/contrast";
import { formatTweak, parseTweak } from "../src/demo-store";
import { activeDirection } from "../src/look";
import { navGroups } from "../src/nav";
import { foldText, matchesQuery } from "../src/text";
import type { KickoffConfig, ScreenDef } from "../src/types";
import { moduleId, validateKickoff } from "../src/validate";

const config: KickoffConfig = {
  product: "Test",
  lang: "vi",
  locale: "vi-VN",
  releases: ["MVP", "R2"],
  defaultRole: "a",
  roles: [
    { id: "a", name: "A", shell: "app", home: "s1" },
    { id: "b", name: "B", shell: "site", home: "s3" },
  ],
};
const screens: ScreenDef[] = [
  { id: "s1", code: "S1", name: "Đơn hàng", roles: ["a"], platforms: ["web"], rel: "MVP", nav: "Orders", page: "data" },
  { id: "s2", code: "S2", name: "New", roles: ["a"], platforms: ["web"], rel: "R2", nav: "Orders", page: "form" },
  { id: "s3", code: "S3", name: "Home", roles: ["b"], platforms: ["web"], rel: "MVP", nav: "Home", page: "data" },
  { id: "s4", code: "S4", name: "Hidden", roles: ["a", "b"], platforms: ["web"], rel: "MVP", nav: null, page: "data" },
];

describe("text", () => {
  it("folds Vietnamese diacritics", () => {
    expect(foldText("Đơn Hàng Mới")).toBe("don hang moi");
    expect(matchesQuery("SC-01 Đơn hàng", "don HANG")).toBe(true);
    expect(matchesQuery("SC-01 Đơn hàng", "don x")).toBe(false);
  });
});

describe("navGroups", () => {
  it("groups by nav label per role, skipping screens without nav", () => {
    expect(navGroups(screens, "a").map((g) => [g.label, g.items.map((s) => s.id)])).toEqual([["Orders", ["s1", "s2"]]]);
    expect(navGroups(screens, "b").map((g) => g.label)).toEqual(["Home"]);
  });
  it("hides later releases in mvp scope", () => {
    expect(navGroups(screens, "a", config, "mvp")[0]!.items.map((s) => s.id)).toEqual(["s1"]);
  });
});

describe("validateKickoff", () => {
  const modules = Object.fromEntries(screens.map((s) => [`./screens/${s.id}.tsx`, async () => ({})]));

  it("accepts a consistent registry", () => {
    expect(validateKickoff({ config, screens, screenModules: modules, scenarios: [] })).toEqual([]);
  });

  it("reports broken references", () => {
    const problems = validateKickoff({
      config: { ...config, defaultRole: "zz", roles: [...config.roles, { id: "c", name: "C", shell: "app", home: "s3" }] },
      screens: [...screens, { ...screens[0]!, id: "s5", roles: ["nobody"], rel: "R9" }],
      scenarios: [{ id: "x", name: "X", role: "a", steps: [{ text: "t", screen: "s3" }] }],
      screenModules: { ...modules, "./screens/orphan.tsx": async () => ({}) },
    });
    expect(problems).toEqual(
      expect.arrayContaining([
        'config.defaultRole "zz" is not a role',
        'screen s5 uses unknown role "nobody"',
        'screen s5 has unknown release "R9"',
        "role c home s3 is not available to the role",
        "scenario x step 1: s3 is not available to a",
        "screen s5 has no module screens/s5.tsx",
        "screens/orphan.tsx has no row in screens.ts",
      ]),
    );
  });

  it("derives module ids from glob keys", () => {
    expect(moduleId("./screens/sc-01.tsx")).toBe("sc-01");
  });
});

describe("eslint rules", () => {
  const eslint = new ESLint({
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    overrideConfigFile: true,
    overrideConfig: [
      { files: ["**/*.tsx"], languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } } },
      ...kickoffRules,
    ],
  });
  const lint = async (code: string, filePath = "apps/web/src/x.tsx") => {
    const [result] = await eslint.lintText(code, { filePath });
    return result!.messages.map((m) => m.ruleId);
  };

  it("flags raw hex, inline font styles, heavy weights and radix imports in apps", async () => {
    // Patterns are assembled at runtime so this file does not trip the rules itself.
    const hex = "#" + "ff0000";
    const heavy = "font-" + "black";
    expect(await lint(`export const A = () => <div className="bg-[${hex}] p-2" />;`)).toEqual(["kickoff/no-raw-hex"]);
    expect(await lint('export const A = () => <div className="#fff" />;')).toEqual(["kickoff/no-raw-hex"]);
    expect(await lint("export const A = () => <p style={{ fontSize: 12 }} />;")).toEqual(["kickoff/no-inline-font"]);
    expect(await lint(`export const A = () => <p className="${heavy}" />;`)).toEqual(["kickoff/no-heavy-font"]);
    expect(await lint('import { Dialog } from "radix-ui";\nexport const A = Dialog;')).toEqual(["no-restricted-imports"]);
    expect(await lint('import * as D from "@radix-ui/react-dialog";\nexport const A = D;')).toEqual(["no-restricted-imports"]);
  });

  it("allows tokens, and radix imports outside apps", async () => {
    expect(await lint('export const A = () => <div className="bg-primary text-title font-semibold" style={{ width: 2 }} />;')).toEqual([]);
    expect(await lint('import { Dialog } from "radix-ui";\nexport const A = Dialog;', "packages/ui/src/x.tsx")).toEqual([]);
  });
});

describe("manifest script", () => {
  it("prints the sample app's manifest as JSON", () => {
    const root = fileURLToPath(new URL("../../..", import.meta.url));
    const out = execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "packages/kit/scripts/manifest.ts"], {
      cwd: root,
      encoding: "utf8",
    });
    const manifest = JSON.parse(out) as {
      screens: Array<{ id: string }>;
      scenarios: string[];
      directions: string[];
      direction: string | null;
    };
    expect(manifest.screens.length).toBeGreaterThan(0);
    expect(Array.isArray(manifest.directions)).toBe(true);
    expect(manifest.direction === null || typeof manifest.direction === "string").toBe(true);
    expect(Object.keys(manifest.screens[0]!).sort()).toEqual(["code", "id", "platforms", "rel", "roles"]);
    expect(Array.isArray(manifest.scenarios)).toBe(true);
  });
});

describe("directions and tweaks", () => {
  const offered: KickoffConfig = {
    ...config,
    directions: [
      { id: "ledger", name: "Ledger" },
      { id: "harbour", name: "Harbour" },
    ],
  };

  it("uses the locked direction, else the pick, else the first offered", () => {
    expect(activeDirection(config, null)).toBeNull();
    expect(activeDirection(offered, null)).toBe("ledger");
    expect(activeDirection(offered, "harbour")).toBe("harbour");
    expect(activeDirection(offered, "gone")).toBe("ledger");
    expect(activeDirection({ ...offered, direction: "harbour" }, "ledger")).toBe("harbour");
  });

  it("parses tweaks within bounds and drops the rest", () => {
    expect(parseTweak("h:400,c:0.5,r:-1,m:calm")).toEqual({ h: 360, c: 0.3, r: 0, m: "calm" });
    expect(parseTweak("h:abc,x:1,m:wild")).toEqual({});
    expect(parseTweak(null)).toEqual({});
    expect(formatTweak(parseTweak("h:24.4,c:0.12,r:0.75,m:lively"))).toBe("h:24,c:0.12,r:0.75,m:lively");
    expect(formatTweak({})).toBe("");
  });

  it("reads WCAG contrast", () => {
    expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 5);
    expect(contrastRatio([118, 118, 118], [255, 255, 255])).toBeCloseTo(4.54, 2);
  });

  it("validates direction ids and the lock", () => {
    expect(validateKickoff({ config: { ...offered, direction: "nope" }, screens })).toContain(
      'config.direction "nope" is not in config.directions',
    );
    expect(validateKickoff({ config: { ...offered, directions: [{ id: "A b", name: "x" }] }, screens })).toContain(
      'direction id "A b" must be lower-case kebab',
    );
  });
});
