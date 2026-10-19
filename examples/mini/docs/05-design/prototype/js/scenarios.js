// scenarios.js — guided demo scenarios for the review workshop.
KIT.SCENARIOS = [
  {
    id: "borrow",
    name: "Lend a book at the desk",
    role: "librarian",
    platform: "web",
    steps: [
      { text: "The librarian starts on Home: books on loan, overdue loans and what is due back soon.", go: ["sc-01"], expect: '[data-kpi="loans"]' },
      { text: "Loans lists every loan with its due date; Lend a book opens the lending form.", go: ["sc-02"], expect: "table" },
    ],
  },
];
