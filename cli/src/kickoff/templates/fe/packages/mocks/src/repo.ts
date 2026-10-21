import {
  Request,
  RequestCreate,
  RequestUpdate,
  type RequestSortField,
  type RequestCreate as RequestCreateInput,
  type RequestUpdate as RequestUpdateInput,
} from "./contract/request";

export type SortDir = "asc" | "desc";

export interface ListQuery<F extends string = string> {
  search?: string;
  /** Exact-match filters; an array means "any of". Empty values are ignored. */
  filters?: Partial<Record<string, string | string[] | null | undefined>>;
  sort?: { field: F; dir: SortDir } | null;
  /** 1-based. */
  page?: number;
  pageSize?: number;
}

export interface Page<T> {
  items: T[];
  total: number;
}

/** Lower-case and strip diacritics so "de nghi" matches "Đề nghị". */
export function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
}

export class NotFoundError extends Error {
  constructor(id: string) {
    super(`Not found: ${id}`);
    this.name = "NotFoundError";
  }
}

export interface RequestRepo {
  list(query?: ListQuery<RequestSortField>): Page<Request>;
  get(id: string): Request | undefined;
  create(input: RequestCreateInput): Request;
  update(id: string, patch: RequestUpdateInput): Request;
  remove(id: string): boolean;
}

const searchFields = ["id", "title", "owner", "description"] as const;

export function createRequestRepo(seed: Request[], now: () => Date = () => new Date()): RequestRepo {
  const rows = new Map(seed.map((row) => [row.id, structuredClone(row)]));
  let counter = rows.size;

  const nextId = () => {
    let id: string;
    do {
      counter += 1;
      id = `REQ-${String(counter).padStart(5, "0")}`;
    } while (rows.has(id));
    return id;
  };

  return {
    list({ search, filters, sort, page = 1, pageSize = 20 } = {}) {
      let items = [...rows.values()];

      const terms = fold(search ?? "").split(/\s+/).filter(Boolean);
      if (terms.length) {
        items = items.filter((row) => {
          const haystack = fold(searchFields.map((field) => row[field] ?? "").join(" "));
          return terms.every((term) => haystack.includes(term));
        });
      }

      for (const [field, raw] of Object.entries(filters ?? {})) {
        const wanted = (Array.isArray(raw) ? raw : [raw]).filter(
          (value): value is string => value != null && value !== "",
        );
        if (!wanted.length) continue;
        items = items.filter((row) => {
          const value = (row as Record<string, unknown>)[field];
          return Array.isArray(value)
            ? value.some((v) => wanted.includes(String(v)))
            : wanted.includes(String(value));
        });
      }

      if (sort) {
        const factor = sort.dir === "desc" ? -1 : 1;
        items.sort((a, b) => {
          const x = a[sort.field];
          const y = b[sort.field];
          const result =
            typeof x === "number" && typeof y === "number"
              ? x - y
              : String(x).localeCompare(String(y), "vi");
          return result * factor || a.id.localeCompare(b.id);
        });
      }

      const size = Math.max(1, Math.min(pageSize, 500));
      const start = (Math.max(1, page) - 1) * size;
      return { items: items.slice(start, start + size).map((row) => structuredClone(row)), total: items.length };
    },

    get(id) {
      const row = rows.get(id);
      return row ? structuredClone(row) : undefined;
    },

    create(input) {
      const data = RequestCreate.parse(input);
      const row = Request.parse({ ...data, id: nextId(), createdAt: now().toISOString() });
      rows.set(row.id, row);
      return structuredClone(row);
    },

    update(id, patch) {
      const current = rows.get(id);
      if (!current) throw new NotFoundError(id);
      const data = RequestUpdate.parse(patch);
      const defined = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
      const row = Request.parse({ ...current, ...defined, id });
      rows.set(id, row);
      return structuredClone(row);
    },

    remove(id) {
      return rows.delete(id);
    },
  };
}
