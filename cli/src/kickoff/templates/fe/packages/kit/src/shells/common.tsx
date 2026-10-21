import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { isFirstRelease } from "../nav";
import { useDemo } from "../demo-store";
import { useKickoff } from "../runtime";
import { cx } from "../text";
import type { ScreenDef } from "../types";

export function SkipLink() {
  const { strings } = useKickoff();
  return (
    <a
      href="#main"
      onClick={(event) => {
        // Hash routing owns the fragment: move focus without changing the URL.
        event.preventDefault();
        const main = document.getElementById("main");
        main?.focus();
        main?.scrollIntoView();
      }}
      className="sr-only z-[70] rounded-md bg-background px-3 py-2 text-label text-foreground shadow focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      {strings.skip}
    </a>
  );
}

export interface ShellProps {
  children: ReactNode;
  /** Id of the screen being shown (for aria-current). */
  current?: string | null;
}

export function ScreenLink({
  role,
  screen,
  current,
  className,
  activeClassName,
  children,
  onNavigate,
}: {
  role: string;
  screen: ScreenDef;
  current?: string | null;
  className?: string;
  activeClassName?: string;
  children?: ReactNode;
  onNavigate?: () => void;
}) {
  const active = current === screen.id;
  return (
    <Link
      to="/$role/$screen"
      params={{ role, screen: screen.id } as never}
      aria-current={active ? "page" : undefined}
      className={cx(className, active && activeClassName)}
      onClick={onNavigate}
    >
      {children ?? screen.name}
      <ReleaseTag rel={screen.rel} />
    </Link>
  );
}

/** Small release badge on nav items when the demo bar scope is "tagged". */
export function ReleaseTag({ rel }: { rel: string }) {
  const { config } = useKickoff();
  const scope = useDemo((state) => state.scope);
  if (scope !== "tagged" || isFirstRelease(config, rel)) return null;
  return (
    <span className="ml-auto rounded border border-dashed border-primary px-1 text-caption text-primary">
      {rel}
    </span>
  );
}
