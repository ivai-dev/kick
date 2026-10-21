import { useState } from "react";
import { Dialog } from "radix-ui";
import { MenuIcon, XIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { useDemo } from "../demo-store";
import { navGroups } from "../nav";
import { useKickoff, useRole } from "../runtime";
import { ScreenLink, SkipLink, type ShellProps } from "./common";

function NavTree({ current, onNavigate }: { current?: string | null; onNavigate?: () => void }) {
  const { screens, config } = useKickoff();
  const role = useRole();
  const scope = useDemo((state) => state.scope);
  const groups = navGroups(screens, role.id, config, scope);
  if (!groups.length) return null;
  return (
    <ul className="flex flex-col gap-4">
      {groups.map((group) => {
        const showHeading = !(group.items.length === 1 && group.items[0]?.name === group.label);
        return (
          <li key={group.label}>
            {showHeading && (
              <p className="px-2 pb-1 text-caption font-medium text-muted-foreground">{group.label}</p>
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((screen) => (
                <li key={screen.id}>
                  <ScreenLink
                    role={role.id}
                    screen={screen}
                    current={current}
                    onNavigate={onNavigate}
                    className="flex min-h-(--control-h) items-center gap-2 rounded-md px-2 text-label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
                    activeClassName="bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  />
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

function Brand() {
  const { config } = useKickoff();
  const role = useRole();
  return (
    <Link to="/$role/$screen" params={{ role: role.id, screen: role.home } as never} className="truncate text-label font-semibold text-foreground">
      {config.product}
    </Link>
  );
}

/** Work-tool shell: sidebar navigation (a Sheet below 768px), one <main>. */
export function AppShell({ children, current }: ShellProps) {
  const { strings } = useKickoff();
  const role = useRole();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-svh bg-background text-foreground" data-shell="app">
      <SkipLink />
      <div className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-sidebar-border bg-sidebar p-3 md:flex">
        <div className="flex h-10 items-center px-2">
          <Brand />
        </div>
        <nav aria-label={strings.mainNav} className="flex-1">
          <NavTree current={current} />
        </nav>
        <p className="px-2 text-caption text-muted-foreground">{role.name}</p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-3 md:hidden">
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                aria-label={strings.openMenu}
                className="inline-flex size-(--control-h) items-center justify-center rounded-md hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <MenuIcon className="size-5" aria-hidden />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
              <Dialog.Content
                aria-describedby={undefined}
                className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-4 overflow-y-auto bg-sidebar p-3 shadow-lg data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left"
              >
                <div className="flex h-10 items-center justify-between px-2">
                  <Dialog.Title className="text-label font-semibold">{strings.menu}</Dialog.Title>
                  <Dialog.Close
                    aria-label={strings.closeMenu}
                    className="inline-flex size-(--control-h) items-center justify-center rounded-md hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
                  >
                    <XIcon className="size-5" aria-hidden />
                  </Dialog.Close>
                </div>
                <nav aria-label={strings.mainNav}>
                  <NavTree current={current} onNavigate={() => setOpen(false)} />
                </nav>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <Brand />
        </header>

        <main id="main" tabIndex={-1} className="min-w-0 flex-1 p-4 outline-none md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
