/**
 * @kickoff/kit/e2e — generated Playwright checks for every screen.
 *
 *   import { test } from "@playwright/test";
 *   import { sweep } from "@kickoff/kit/e2e";
 *   sweep(test, { config, screens, scenarios, artifact: "dist-artifact/index.html" });
 */
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Frame, type Page, type test as baseTest } from "@playwright/test";

import type { KickoffConfig, Scenario, ScreenDef } from "../src/types";

type TestType = typeof baseTest;

export interface SweepOptions {
  config: KickoffConfig;
  screens: ScreenDef[];
  scenarios?: Scenario[];
  viewports?: Array<{ name: string; width: number; height: number }>;
  themes?: Array<"light" | "dark">;
  /** axe impacts that fail a test (light theme only). */
  axeImpacts?: string[];
  /** Absolute path of the single-file build; adds file:// and sandboxed-iframe tests. */
  artifact?: string;
  /** Direction to sweep in (`kickoff fe check --direction <id>` sets KICKOFF_DIRECTION). */
  direction?: string;
}

export const defaultViewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
];

type Target = Page | Frame;

/** Collect console errors and page errors for the duration of a test. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

/** Wait until the screen `id` has rendered (or failed) and no region is aria-busy. */
export async function waitForScreen(target: Target, id: string, timeout = 15_000) {
  await target.waitForFunction(
    (expected) => {
      const data = document.documentElement.dataset;
      if (data.kickoffError) return true;
      return data.kickoffReady === "1" && data.kickoffScreen === expected;
    },
    id,
    { timeout },
  );
  const error = await target.evaluate(() => document.documentElement.dataset.kickoffError ?? null);
  expect(error, "data-kickoff-error").toBeNull();
  await expect(target.locator('[aria-busy="true"]')).toHaveCount(0, { timeout });
}

function query(params: Record<string, string> | undefined, extra: Record<string, string>) {
  const search = new URLSearchParams({ ...(params ?? {}), ...extra });
  return search.toString() ? `?${search}` : "";
}

export function screenUrl(role: string, screen: string, params?: Record<string, string>, extra: Record<string, string> = {}) {
  return `/#/${role}/${screen}${query(params, extra)}`;
}

export function sweep(test: TestType, options: SweepOptions) {
  const {
    screens,
    scenarios = [],
    viewports = defaultViewports,
    themes = ["light", "dark"],
    axeImpacts = ["serious", "critical"],
    artifact,
    direction = process.env.KICKOFF_DIRECTION || undefined,
  } = options;
  const look: Record<string, string> = direction ? { look: direction } : {};

  test.describe("kickoff sweep", () => {
    for (const screen of screens) {
      for (const role of screen.roles) {
        for (const viewport of viewports) {
          for (const theme of themes) {
            test(`${screen.code} ${screen.name} | ${role} | ${viewport.name} | ${theme}`, async ({ page }) => {
              const errors = watchErrors(page);
              await page.setViewportSize({ width: viewport.width, height: viewport.height });
              await page.goto(screenUrl(role, screen.id, undefined, { demo: "0", theme, ...look }));
              await waitForScreen(page, screen.id);
              const shots = process.env.KICKOFF_SHOTS; // `kickoff fe check --shots <dir>`: the design review set
              if (shots) {
                mkdirSync(shots, { recursive: true });
                await page.screenshot({ path: join(shots, `${screen.id}-${role}-${viewport.name}-${theme}.png`.replace(/[^\w.-]+/g, "_")), fullPage: true });
              }

              await expect(page.locator("h1"), "exactly one h1").toHaveCount(1);
              await expect(page.locator("main"), "exactly one main").toHaveCount(1);
              expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
              if (direction) {
                expect(await page.evaluate(() => document.documentElement.dataset.direction), "direction").toBe(
                  options.config.direction ?? direction,
                );
              }

              if (viewport.width <= 480) {
                const overflow = await page.evaluate(() => {
                  const el = document.scrollingElement ?? document.documentElement;
                  return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
                });
                expect(overflow.scrollWidth, "no horizontal scroll on phones").toBeLessThanOrEqual(
                  overflow.clientWidth + 1,
                );
              }

              if (theme === "light") {
                const results = await new AxeBuilder({ page }).analyze();
                const violations = results.violations
                  .filter((v) => v.impact && axeImpacts.includes(v.impact))
                  .map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`);
                expect(violations, "axe serious/critical violations").toEqual([]);
              }

              expect(errors, "console / page errors").toEqual([]);
            });
          }
        }
      }
    }

    for (const scenario of scenarios) {
      test(`scenario ${scenario.id} ${scenario.name}`, async ({ page }) => {
        const errors = watchErrors(page);
        const [first, ...rest] = scenario.steps;
        if (!first) return;
        await page.goto(screenUrl(scenario.role, first.screen, first.params, { scenario: scenario.id, step: "0" }));
        await waitForScreen(page, first.screen);
        await expect(page.locator("h1")).toHaveCount(1);

        for (const step of rest) {
          await page.locator("[data-kickoff-next]").click();
          await page.waitForFunction(
            ({ role, screen, params }) => {
              const [path, search = ""] = window.location.hash.slice(1).split("?");
              if (path !== `/${role}/${screen}`) return false;
              const actual = new URLSearchParams(search);
              return Object.entries(params).every(([k, v]) => actual.get(k) === v);
            },
            { role: scenario.role, screen: step.screen, params: step.params ?? {} },
          );
          await waitForScreen(page, step.screen);
          await expect(page.locator("h1")).toHaveCount(1);
        }
        expect(errors, "console / page errors").toEqual([]);
      });
    }

    if (artifact) {
      const home = options.config.roles.find((r) => r.id === options.config.defaultRole)?.home ?? screens[0]?.id ?? "";

      test("artifact: single file opens from file:// with hash routing", async ({ page }) => {
        const errors = watchErrors(page);
        const html = readFileSync(artifact, "utf8");
        expect(html, "no external scripts").not.toMatch(/<script[^>]+src=/i);
        expect(html, "no external stylesheets").not.toMatch(/<link[^>]+rel=["']?stylesheet/i);
        await page.goto(pathToFileURL(artifact).href);
        await waitForScreen(page, home);
        await expect(page.locator("h1")).toHaveCount(1);
        expect(page.url()).toContain(`#/${options.config.defaultRole}/${home}`);
        expect(errors).toEqual([]);
      });

      test("artifact: works inside a sandboxed iframe (no storage, opaque origin)", async ({ page }) => {
        const errors = watchErrors(page);
        const html = readFileSync(artifact, "utf8");
        await page.setContent('<iframe sandbox="allow-scripts" style="width:1200px;height:800px;border:0"></iframe>');
        await page.locator("iframe").evaluate((frame, srcdoc) => {
          (frame as HTMLIFrameElement).srcdoc = srcdoc;
        }, html);
        const frame = page.frames().find((f) => f !== page.mainFrame());
        expect(frame).toBeTruthy();
        await expect
          .poll(async () => (await page.locator("iframe").contentFrame().locator("h1").count()), { timeout: 15_000 })
          .toBe(1);
        const ready = await page.locator("iframe").contentFrame().locator("html").getAttribute("data-kickoff-ready");
        expect(ready).toBe("1");
        expect(errors).toEqual([]);
      });
    }
  });
}
