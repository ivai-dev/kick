import { createMockApi, type ApiClient } from "@app/mocks";

import { config } from "../kickoff/config";

/**
 * The one API client the screens use. FE v0 runs on the mock adapter; swap
 * in the real adapter later without touching the screens.
 */
export const api: ApiClient = createMockApi({ locale: config.lang, seed: 42, count: 240 });
