// config.js — Library Loans: roles, releases and platforms of the prototype.
window.KIT_CONFIG = {
  product: "Library Loans",
  roles: [
    { id: "librarian", name: "Librarian", home: "sc-01" },
    { id: "member", name: "Member", home: "a-01" },
    { id: "admin", name: "Administrator", home: "sc-01" },
  ],
  releases: ["MVP", "R2"],
  platforms: ["web", "android"],
  defaultRole: "librarian",
};
