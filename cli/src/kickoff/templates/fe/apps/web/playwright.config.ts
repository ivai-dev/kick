import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

import { defineConfig } from "@playwright/test";

/**
 * Browser: an installed Edge/Chrome via `channel` so no browser download is
 * needed. PW_CHANNEL overrides ("msedge", "chrome", "chromium" = Playwright's
 * own build from `npx playwright install chromium`).
 */
function pickChannel(): string | undefined {
  const wanted = process.env.PW_CHANNEL;
  if (wanted) return wanted === "chromium" ? undefined : wanted;
  const pf = process.env["PROGRAMFILES"] ?? "C:\\Program Files";
  const pf86 = process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)";
  const local = process.env.LOCALAPPDATA ?? "";
  const candidates: Array<[string, string]> = [
    ["msedge", `${pf86}\\Microsoft\\Edge\\Application\\msedge.exe`],
    ["msedge", `${pf}\\Microsoft\\Edge\\Application\\msedge.exe`],
    ["msedge", "/opt/microsoft/msedge/msedge"],
    ["msedge", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"],
    ["chrome", `${pf}\\Google\\Chrome\\Application\\chrome.exe`],
    ["chrome", `${pf86}\\Google\\Chrome\\Application\\chrome.exe`],
    ["chrome", `${local}\\Google\\Chrome\\Application\\chrome.exe`],
    ["chrome", "/opt/google/chrome/chrome"],
    ["chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"],
  ];
  return candidates.find(([, path]) => existsSync(path))?.[0];
}

/** A free TCP port, chosen once in the runner and inherited by workers through the env. */
function freePort(): string {
  const script =
    "const s=require('net').createServer();s.listen(0,'127.0.0.1',()=>{process.stdout.write(String(s.address().port));s.close()})";
  return execFileSync(process.execPath, ["-e", script], { encoding: "utf8" }).trim();
}

process.env.KICKOFF_E2E_PORT ??= freePort();
const port = process.env.KICKOFF_E2E_PORT;
const baseURL = `http://127.0.0.1:${port}/`;
// Set KICKOFF_E2E_NO_BUILD=1 to reuse an existing dist/ and dist-artifact/.
const build = process.env.KICKOFF_E2E_NO_BUILD ? "" : "pnpm run build:e2e && ";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  timeout: 60_000,
  use: {
    baseURL,
    channel: pickChannel(),
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `${build}pnpm exec vite preview --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
