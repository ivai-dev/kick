import { describe, expect, it } from "vitest";
import { validateKickoff } from "@kickoff/kit";

import { config } from "./kickoff/config";
import { scenarios } from "./kickoff/scenarios";
import { screens } from "./kickoff/screens";

describe("kickoff registry", () => {
  it("config, screens, scenarios and screens/*.tsx are consistent", () => {
    const screenModules = import.meta.glob("./screens/*.tsx");
    expect(validateKickoff({ config, screens, scenarios, screenModules })).toEqual([]);
  });
});
