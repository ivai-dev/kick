const test = require("node:test");
const assert = require("node:assert/strict");
const { makeParser, formatHash } = require("../js/route.js");

const parse = makeParser({ roles: ["librarian", "member", "admin"], platforms: ["web", "android"] });

test("plain screen", () => {
  assert.deepEqual(parse("#sc-01"), { screen: "sc-01", scenario: null, theme: null, lens: "full", platform: null, role: null, params: {} });
});

test("parameters after the tokens", () => {
  const r = parse("#sc-08-dark-member?kiosk=1&id=tt03&full=true&q=lap%20rap");
  assert.equal(r.screen, "sc-08");
  assert.equal(r.role, "member");
  assert.equal(r.theme, "dark");
  assert.deepEqual(r.params, { kiosk: 1, id: "tt03", full: true, q: "lap rap" });
  assert.deepEqual(parse("#sc-01?flag").params, { flag: true });
  assert.deepEqual(parse("#sc-01?").params, {});
});

test("formatHash writes parameters back", () => {
  const r = parse("#sc-08-member?kiosk=1&q=lap%20rap");
  assert.deepEqual(parse(formatHash(r)), r);
  assert.equal(formatHash({ screen: "sc-08", params: { id: "tt03", gone: null } }), "#sc-08?id=tt03");
});

test("tokens in any order", () => {
  const a = parse("#sc-02-dark-mvp-member");
  const b = parse("#sc-02-member-dark-mvp");
  assert.deepEqual(a, b);
  assert.equal(a.screen, "sc-02");
  assert.equal(a.theme, "dark");
  assert.equal(a.lens, "mvp");
  assert.equal(a.role, "member");
});

test("platform token and dashed screen ids", () => {
  const r = parse("#a-01-android-light");
  assert.equal(r.screen, "a-01");
  assert.equal(r.platform, "android");
  assert.equal(r.theme, "light");
});

test("scenario route", () => {
  const r = parse("#scn-borrow-dark");
  assert.equal(r.scenario, "borrow");
  assert.equal(r.screen, null);
  assert.equal(r.theme, "dark");
});

test("empty and unknown tokens", () => {
  assert.equal(parse("").screen, null);
  assert.equal(parse("#sc-01-foo").screen, "sc-01-foo");
});

test("formatHash round-trips", () => {
  const r = parse("#sc-02-dark-mvp-member");
  assert.deepEqual(parse(formatHash(r)), r);
  assert.equal(formatHash({ screen: "sc-01", lens: "full" }), "#sc-01");
});
