// data.js — synthetic sample data: invented books, members and loans.
KIT.D = {
  today: "2026-10-12",
  me: "m1", // the member signed in on the phone
  books: [
    { id: "b1", title: "The Silent Harbor", author: "Mara Ellison", genre: "Fiction" },
    { id: "b2", title: "Gardens of the North", author: "Tomas Varga", genre: "Nature" },
    { id: "b3", title: "A Short History of Bridges", author: "Lena Okafor", genre: "History" },
    { id: "b4", title: "Cooking with Seven Spices", author: "Ravi Menon", genre: "Food" },
    { id: "b5", title: "The Clockmaker's Daughter", author: "Ines Duval", genre: "Fiction" },
    { id: "b6", title: "Stars Over the Valley", author: "Owen Pryce", genre: "Science" },
  ],
  members: [
    { id: "m1", name: "Ada Brennan", card: "C-1042" },
    { id: "m2", name: "Felix Navarro", card: "C-1057" },
    { id: "m3", name: "Grace Whitlow", card: "C-1063" },
    { id: "m4", name: "Hugo Lindqvist", card: "C-1071" },
  ],
  loans: [
    { id: "l1", book: "b1", member: "m1", out: "2026-09-28", due: "2026-10-12", status: "out" },
    { id: "l2", book: "b3", member: "m2", out: "2026-09-20", due: "2026-10-04", status: "overdue" },
    { id: "l3", book: "b4", member: "m3", out: "2026-10-01", due: "2026-10-15", status: "out" },
    { id: "l4", book: "b6", member: "m1", out: "2026-10-03", due: "2026-10-17", status: "out" },
    { id: "l5", book: "b2", member: "m4", out: "2026-09-10", due: "2026-09-24", status: "returned" },
    { id: "l6", book: "b5", member: "m1", out: "2026-09-02", due: "2026-09-16", status: "returned" },
  ],
  monthly: [
    { month: "May", loans: 34 },
    { month: "Jun", loans: 41 },
    { month: "Jul", loans: 29 },
    { month: "Aug", loans: 37 },
    { month: "Sep", loans: 46 },
    { month: "Oct", loans: 18 },
  ],
};
