import type { Scenario } from "@kickoff/kit";

export const scenarios: Scenario[] = [
  { id: "scn-01", name: "Create a request", role: "reader", steps: [{ text: "The reader reviews submitted requests", screen: "sc-01", params: { status: "submitted" } }, { text: "The reader creates a new request", screen: "sc-02" }] },
];
