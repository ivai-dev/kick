import { createBrowserHistory, createMemoryHistory, parseHref, type RouterHistory } from "@tanstack/history";

/**
 * Hash history that also works where the stock one fails:
 * - file:// (customer opens the single-file artifact from disk);
 * - sandboxed iframes with an opaque origin (about:srcdoc, blob:), where a
 *   relative pushState URL resolves against the parent and throws.
 * Hrefs are absolute (document URL without fragment + "#/path"), so only the
 * fragment ever changes. If the host forbids history writes entirely, the app
 * falls back to in-memory history (links still work, the address bar does not
 * change).
 */
export function createKickoffHistory(): RouterHistory {
  const win = window;
  const hashPath = () => win.location.hash.split("#").slice(1)[0] || "/";

  try {
    win.history.replaceState(win.history.state, "", win.location.href);
  } catch {
    return createMemoryHistory({ initialEntries: [hashPath()] });
  }

  return createBrowserHistory({
    window: win,
    parseLocation: () => {
      const parts = win.location.hash.split("#").slice(1);
      const rest = parts.slice(1);
      return parseHref(`${parts[0] || "/"}${rest.length ? `#${rest.join("#")}` : ""}`, win.history.state);
    },
    createHref: (href) => `${win.location.href.split("#")[0]}#${href}`,
  });
}
