import type { ScreenDef } from "@kickoff/kit";

export const screens: ScreenDef[] = [
  { id: "sc-01", code: "SC-01", name: "Requests", roles: ["reader"], platforms: ["web"], rel: "MVP", nav: "Requests", page: "data" },
  { id: "sc-02", code: "SC-02", name: "New request", roles: ["reader"], platforms: ["web"], rel: "MVP", nav: "Requests", page: "form" },
  { id: "sc-03", code: "SC-03", name: "Home", roles: ["visitor"], platforms: ["web"], rel: "MVP", nav: "Home", page: "data" },
];
