/**
 * Prints the screen/scenario manifest of the app as JSON on stdout:
 *   {"screens":[{"id","code","roles","platforms","rel"}],"scenarios":["id"],"directions":["id"],"direction":"id"|null}
 *
 * Run from the repo root (Node >= 22.6):
 *   node --experimental-strip-types packages/kit/scripts/manifest.ts [appDir]
 *
 * apps/web/src/kickoff/{config,screens,scenarios}.ts must stay plain data with
 * type-only imports (no enums, namespaces or other TS-only runtime syntax).
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

interface ScreenRow {
  id: string;
  code: string;
  roles: string[];
  platforms: string[];
  rel: string;
}

const appDir = resolve(process.argv[2] ?? "apps/web");
const kickoffDir = resolve(appDir, "src/kickoff");

async function load<T>(file: string, name: string): Promise<T> {
  const path = resolve(kickoffDir, file);
  if (!existsSync(path)) throw new Error(`missing ${path}`);
  const mod = (await import(pathToFileURL(path).href)) as Record<string, unknown>;
  if (!(name in mod)) throw new Error(`${path} does not export "${name}"`);
  return mod[name] as T;
}

try {
  const screens = await load<ScreenRow[]>("screens.ts", "screens");
  const scenarios = await load<Array<{ id: string }>>("scenarios.ts", "scenarios");
  const config = await load<{ directions?: Array<{ id: string }>; direction?: string }>("config.ts", "config");
  const manifest = {
    screens: screens.map(({ id, code, roles, platforms, rel }) => ({ id, code, roles, platforms, rel })),
    scenarios: scenarios.map((scenario) => scenario.id),
    directions: (config.directions ?? []).map((direction) => direction.id),
    direction: config.direction ?? null,
  };
  process.stdout.write(`${JSON.stringify(manifest)}\n`);
} catch (error) {
  process.stderr.write(`manifest: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
