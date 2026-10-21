import type { ReactNode } from "react";

import { useKickoff, useScreen } from "../runtime";
import type { PageKind } from "../types";

function Bar({ className }: { className: string }) {
  return <div className={`rounded-md bg-muted ${className}`} />;
}

function PageSketch({ kind }: { kind: PageKind }) {
  if (kind === "form") {
    return (
      <div aria-hidden className="flex max-w-xl flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Bar className="h-3 w-24" />
            <Bar className="h-(--control-h) w-full" />
          </div>
        ))}
        <Bar className="h-(--control-h) w-32" />
      </div>
    );
  }
  return (
    <div aria-hidden className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Bar className="h-(--control-h) w-full sm:w-64" />
        <Bar className="h-(--control-h) w-32" />
      </div>
      <div className="flex flex-col gap-2 rounded-md border p-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Bar key={i} className="h-6 w-full" />
        ))}
      </div>
    </div>
  );
}

/** Stand-in for a screen that is not built yet: h1 = screen name, code, roles, release. */
export function Placeholder({ children }: { children?: ReactNode }) {
  const { strings, rolesById } = useKickoff();
  const screen = useScreen();
  const roles = screen.roles.map((id) => rolesById.get(id)?.name ?? id).join(", ");

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6" data-placeholder={screen.id}>
      <div className="flex flex-col gap-2">
        <p className="text-meta text-muted-foreground">{screen.code}</p>
        <h1 className="text-title break-words">{screen.name}</h1>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-meta">
          <dt className="text-muted-foreground">{strings.roles}</dt>
          <dd>{roles}</dd>
          <dt className="text-muted-foreground">{strings.release}</dt>
          <dd>{screen.rel}</dd>
          <dt className="text-muted-foreground">{strings.platforms}</dt>
          <dd>{screen.platforms.join(", ")}</dd>
        </dl>
      </div>
      <p className="rounded-md border border-dashed p-4 text-body">
        <strong className="font-semibold">{strings.toBeBuilt}.</strong>{" "}
        <span className="text-muted-foreground">{strings.placeholderBody}</span>
      </p>
      {children}
      <PageSketch kind={screen.page} />
    </section>
  );
}
