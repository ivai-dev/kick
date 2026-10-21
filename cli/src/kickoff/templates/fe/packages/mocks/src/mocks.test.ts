import { describe, expect, it } from "vitest";

import { createMockApi, createRequestRepo, fold, Request, seedRequests } from "./index";

describe("seed", () => {
  it("is deterministic for the same seed and locale", () => {
    expect(seedRequests({ seed: 7, locale: "vi", count: 20 })).toEqual(
      seedRequests({ seed: 7, locale: "vi", count: 20 }),
    );
  });

  it("changes with the seed and the locale", () => {
    const a = seedRequests({ seed: 1, count: 10, stress: false });
    expect(seedRequests({ seed: 2, count: 10, stress: false })).not.toEqual(a);
    expect(seedRequests({ seed: 1, count: 10, locale: "vi", stress: false })).not.toEqual(a);
  });

  it("produces rows that satisfy the contract, including stress fixtures", () => {
    const rows = seedRequests({ count: 50 });
    expect(rows).toHaveLength(53);
    for (const row of rows) expect(Request.safeParse(row).success).toBe(true);
    expect(rows.find((r) => r.id === "REQ-LONG")!.title.length).toBeGreaterThan(200);
    expect(rows.find((r) => r.id === "REQ-MIN")!.description).toBeUndefined();
    expect(rows.find((r) => r.id === "REQ-TAGS")!.tags).toHaveLength(30);
  });
});

describe("repo", () => {
  const make = () => createRequestRepo(seedRequests({ count: 100 }), () => new Date("2026-07-01T00:00:00Z"));

  it("folds diacritics", () => {
    expect(fold("Đề Nghị")).toBe("de nghi");
  });

  it("searches without diacritics", () => {
    const { items } = make().list({ search: "de nghi", pageSize: 100 });
    expect(items.map((r) => r.id)).toEqual(expect.arrayContaining(["REQ-LONG", "REQ-MIN"]));
  });

  it("filters, sorts and pages with a stable total", () => {
    const repo = make();
    const all = repo.list({ filters: { status: "approved" }, pageSize: 500 });
    expect(all.items.every((r) => r.status === "approved")).toBe(true);
    const page2 = repo.list({
      filters: { status: "approved" },
      sort: { field: "amount", dir: "desc" },
      page: 2,
      pageSize: 5,
    });
    expect(page2.total).toBe(all.total);
    expect(page2.items).toHaveLength(Math.min(5, Math.max(0, all.total - 5)));
    const amounts = page2.items.map((r) => r.amount);
    expect([...amounts].sort((a, b) => b - a)).toEqual(amounts);
  });

  it("ignores empty filters and supports any-of arrays", () => {
    const repo = make();
    const total = repo.list().total;
    expect(repo.list({ filters: { status: "" } }).total).toBe(total);
    const some = repo.list({ filters: { status: ["draft", "rejected"] }, pageSize: 500 });
    expect(some.items.every((r) => r.status === "draft" || r.status === "rejected")).toBe(true);
  });

  it("creates, updates and removes", () => {
    const repo = make();
    const created = repo.create({ title: "Mua laptop", owner: "An", amount: 1000 });
    expect(created.status).toBe("draft");
    expect(created.createdAt).toBe("2026-07-01T00:00:00.000Z");
    expect(repo.get(created.id)?.title).toBe("Mua laptop");
    expect(repo.update(created.id, { status: "submitted" }).status).toBe("submitted");
    expect(repo.remove(created.id)).toBe(true);
    expect(repo.get(created.id)).toBeUndefined();
  });

  it("rejects invalid input", () => {
    expect(() => make().create({ title: "", owner: "An", amount: -1 })).toThrow();
  });

  it("returns copies, not internal state", () => {
    const repo = make();
    const row = repo.get("REQ-MIN")!;
    row.title = "mutated";
    expect(repo.get("REQ-MIN")!.title).toBe("Đề nghị");
  });
});

describe("mock api", () => {
  it("serves pages of a large dataset", async () => {
    const api = createMockApi({ latency: 0, count: 10_000 });
    const page = await api.requests.list({ page: 400, pageSize: 25 });
    expect(page.total).toBe(10_003);
    expect(page.items).toHaveLength(25);
  });

  it("applies artificial latency", async () => {
    const api = createMockApi({ latency: 30, count: 5 });
    const started = performance.now();
    await api.requests.get("REQ-00001");
    expect(performance.now() - started).toBeGreaterThanOrEqual(25);
  });

  it("returns null for unknown ids and rejects removing them", async () => {
    const api = createMockApi({ latency: 0, count: 5 });
    expect(await api.requests.get("nope")).toBeNull();
    await expect(api.requests.remove("nope")).rejects.toThrow("Not found");
  });
});
