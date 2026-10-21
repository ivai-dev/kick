import { fileURLToPath } from "node:url";

import { test } from "@playwright/test";
import { sweep } from "@kickoff/kit/e2e";

import { config } from "../src/kickoff/config";
import { scenarios } from "../src/kickoff/scenarios";
import { screens } from "../src/kickoff/screens";

// Every screen x role x viewport x theme, every scenario, and the single-file artifact.
sweep(test, {
  config,
  screens,
  scenarios,
  artifact: fileURLToPath(new URL("../dist-artifact/index.html", import.meta.url)),
});
