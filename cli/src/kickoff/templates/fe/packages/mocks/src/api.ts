import type {
  Request,
  RequestCreate,
  RequestSortField,
  RequestUpdate,
} from "./contract/request";
import { createRequestRepo, NotFoundError, type ListQuery, type Page } from "./repo";
import { seedOwners, seedRequests } from "./seed";

/**
 * The typed API the screens talk to. FE v0 uses createMockApi(); the real
 * backend later gets an adapter with the same interface (e.g. createHttpApi).
 * Screens never import the repo or the seed directly.
 */
export interface ApiClient {
  requests: {
    list(query?: ListQuery<RequestSortField>): Promise<Page<Request>>;
    get(id: string): Promise<Request | null>;
    create(input: RequestCreate): Promise<Request>;
    update(id: string, patch: RequestUpdate): Promise<Request>;
    remove(id: string): Promise<void>;
  };
  lookups: {
    owners(): Promise<string[]>;
  };
}

export interface MockApiOptions {
  /** Faker locale for generated content ("vi", "en"). */
  locale?: string;
  seed?: number;
  count?: number;
  /** Artificial latency in ms: a number, or [min, max]. 0 disables it (tests). */
  latency?: number | [number, number];
}

export function createMockApi({
  locale = "en",
  seed = 42,
  count = 240,
  latency = [80, 240],
}: MockApiOptions = {}): ApiClient {
  const repo = createRequestRepo(seedRequests({ locale, seed, count }));
  const owners = seedOwners(locale, seed);

  const wait = () => {
    const ms = Array.isArray(latency)
      ? latency[0] + Math.random() * (latency[1] - latency[0])
      : latency;
    return ms > 0 ? new Promise<void>((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
  };
  const respond = async <T>(fn: () => T): Promise<T> => {
    await wait();
    return fn();
  };

  return {
    requests: {
      list: (query) => respond(() => repo.list(query)),
      get: (id) => respond(() => repo.get(id) ?? null),
      create: (input) => respond(() => repo.create(input)),
      update: (id, patch) => respond(() => repo.update(id, patch)),
      remove: (id) =>
        respond(() => {
          if (!repo.remove(id)) throw new NotFoundError(id);
        }),
    },
    lookups: {
      owners: () => respond(() => [...owners]),
    },
  };
}
