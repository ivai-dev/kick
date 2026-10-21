import { DropdownMenu } from "radix-ui";
import { ChevronDownIcon, CircleDotIcon, HouseIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { useDemo } from "../demo-store";
import { navGroups } from "../nav";
import { useKickoff, useRole } from "../runtime";
import { cx } from "../text";
import { ScreenLink, SkipLink, type ShellProps } from "./common";

const topLink =
  "inline-flex min-h-(--control-h) items-center gap-1 rounded-md px-3 text-label text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/** Public-site shell: header with brand and top menu, footer, phone bottom tab bar. */
export function SiteShell({ children, current }: ShellProps) {
  const { screens, config, strings } = useKickoff();
  const role = useRole();
  const scope = useDemo((state) => state.scope);
  const groups = navGroups(screens, role.id, config, scope);
  const tabs = groups.slice(0, 5);

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground" data-shell="site">
      <SkipLink />
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
          <Link to="/$role/$screen" params={{ role: role.id, screen: role.home } as never} className="truncate text-label font-semibold">
      {config.product}
    </Link>
          {groups.length > 0 && (
            <nav aria-label={strings.mainNav} className="ml-auto hidden md:block">
              <ul className="flex items-center gap-1">
                {groups.map((group) =>
                  group.items.length === 1 ? (
                    <li key={group.label}>
                      <ScreenLink
                        role={role.id}
                        screen={group.items[0]!}
                        current={current}
                        className={topLink}
                        activeClassName="bg-accent font-medium"
                      >
                        {group.label}
                      </ScreenLink>
                    </li>
                  ) : (
                    <li key={group.label}>
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger
                          className={cx(
                            topLink,
                            group.items.some((s) => s.id === current) && "bg-accent font-medium",
                          )}
                        >
                          {group.label}
                          <ChevronDownIcon className="size-4" aria-hidden />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            align="end"
                            className="z-50 min-w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                          >
                            {group.items.map((screen) => (
                              <DropdownMenu.Item key={screen.id} asChild>
                                <Link
                                  to="/$role/$screen"
                                  params={{ role: role.id, screen: screen.id } as never}
                                  aria-current={current === screen.id ? "page" : undefined}
                                  className="flex min-h-(--control-h) cursor-default items-center rounded-sm px-2 text-label outline-none data-[highlighted]:bg-accent"
                                >
                                  {screen.name}
                                </Link>
                              </DropdownMenu.Item>
                            ))}
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </li>
                  ),
                )}
              </ul>
            </nav>
          )}
        </div>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className={cx(
          "mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 py-6 outline-none",
          tabs.length > 0 && "pb-24 md:pb-6",
        )}
      >
        {children}
      </main>

      <footer className={cx("border-t", tabs.length > 0 && "pb-16 md:pb-0")}>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-meta text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {config.product}
          </span>
          <span>{strings.footer}</span>
        </div>
      </footer>

      {tabs.length > 0 && (
        <nav
          aria-label={strings.tabsNav}
          className="fixed inset-x-0 bottom-0 z-30 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
            {tabs.map((group) => {
              const target = group.items[0]!;
              const active = group.items.some((s) => s.id === current);
              const Icon = target.id === role.home ? HouseIcon : CircleDotIcon;
              return (
                <li key={group.label}>
                  <Link
                    to="/$role/$screen"
                    params={{ role: role.id, screen: target.id } as never}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-caption focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      active ? "font-medium text-primary" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                    <span className="max-w-full truncate">{group.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
