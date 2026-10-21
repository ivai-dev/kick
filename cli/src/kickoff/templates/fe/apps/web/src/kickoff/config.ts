import type { KickoffConfig } from "@kickoff/kit";

export const config: KickoffConfig = {
  product: "Kickoff Demo",
  lang: "vi",
  locale: "vi-VN",
  releases: ["MVP", "R2"],
  defaultRole: "reader",
  roles: [
    { id: "reader", name: "Reader", shell: "app", home: "sc-01", density: "compact" },
    { id: "visitor", name: "Visitor", shell: "site", home: "sc-03" },
  ],
};
