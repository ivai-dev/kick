import type { ReactNode } from "react";

import { useDemo } from "../demo-store";
import { isFirstRelease } from "../nav";
import { useKickoff } from "../runtime";

export interface RelProps {
  /** Release this block belongs to, e.g. "R2". Blocks of the first release always render. */
  r: string;
  children: ReactNode;
  className?: string;
}

/**
 * Release scope wrapper. With the demo bar scope:
 * - "all": renders children as is;
 * - "mvp": hides blocks of later releases;
 * - "tagged": outlines later-release blocks and labels them with the release.
 */
export function Rel({ r, children, className }: RelProps) {
  const { config } = useKickoff();
  const scope = useDemo((state) => state.scope);

  if (isFirstRelease(config, r) || scope === "all") return <>{children}</>;
  if (scope === "mvp") return null;
  return (
    <div
      data-rel={r}
      className={`relative rounded-md outline-2 outline-offset-4 outline-primary outline-dashed ${className ?? ""}`}
    >
      <span className="absolute -top-3 right-2 z-10 rounded bg-primary px-1.5 text-caption font-medium text-primary-foreground">
        {r}
      </span>
      {children}
    </div>
  );
}
