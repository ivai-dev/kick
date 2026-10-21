import { Component, useEffect, type ErrorInfo, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { fill, type KitStrings } from "../strings";
import { useKickoff, useRole } from "../runtime";

const html = () => document.documentElement;

export function markNavigationStart() {
  delete html().dataset.kickoffReady;
  delete html().dataset.kickoffError;
}

export function markError(message: string) {
  html().dataset.kickoffError = message || "error";
}

let firstScreen = true;

/**
 * Rendered after the screen content inside the same Suspense boundary: when it
 * commits, the screen has rendered. Sets the title, data-kickoff-ready and
 * data-kickoff-screen, and moves focus to the h1 on in-app navigations.
 */
export function ReadyMarker({ id, title }: { id: string; title: string }) {
  useEffect(() => {
    document.title = title;
    const root = html();
    root.dataset.kickoffScreen = id;
    root.dataset.kickoffReady = "1";
    if (firstScreen) {
      firstScreen = false;
      return;
    }
    const heading = document.querySelector<HTMLElement>("main h1");
    if (heading) {
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
  }, [id, title]);
  return null;
}

export function Loading() {
  const { strings } = useKickoff();
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-3 py-2">
      <span className="sr-only">{strings.loading}</span>
      <div aria-hidden className="h-8 w-1/3 animate-pulse rounded-md bg-muted" />
      <div aria-hidden className="h-4 w-2/3 animate-pulse rounded-md bg-muted" />
      <div aria-hidden className="h-40 w-full animate-pulse rounded-md bg-muted" />
    </div>
  );
}

function SystemPage({ title, body }: { title: string; body: string }) {
  const role = useRole();
  const { strings } = useKickoff();
  return (
    <section className="mx-auto flex max-w-xl flex-col items-start gap-3 py-12">
      <h1 className="text-title">{title}</h1>
      <p className="text-body text-muted-foreground">{body}</p>
      <Link
        to="/$role/$screen"
        params={{ role: role.id, screen: role.home } as never}
        className="text-label text-primary underline underline-offset-4"
      >
        {strings.goHome}
      </Link>
    </section>
  );
}

export function NotFoundContent() {
  const { strings } = useKickoff();
  return <SystemPage title={strings.notFound} body={strings.notFoundBody} />;
}

export function NotAvailableContent({ screen }: { screen: string }) {
  const { strings } = useKickoff();
  const role = useRole();
  return (
    <SystemPage
      title={strings.notAvailable}
      body={fill(strings.notAvailableBody, { screen, role: role.name })}
    />
  );
}

interface BoundaryProps {
  strings: KitStrings;
  children: ReactNode;
}

/** Catches render errors of a screen; sets data-kickoff-error for the checks. */
export class ScreenBoundary extends Component<BoundaryProps, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    markError(error.message);
    console.error("[kickoff] screen render error", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    const { strings } = this.props;
    if (!error) return this.props.children;
    return (
      <section role="alert" className="mx-auto flex max-w-xl flex-col items-start gap-3 py-12">
        <h1 className="text-title">{strings.error}</h1>
        <p className="text-body text-muted-foreground">{strings.errorBody}</p>
        <pre className="max-w-full overflow-x-auto rounded-md bg-muted p-3 text-caption">{error.message}</pre>
        <button
          type="button"
          className="text-label text-primary underline underline-offset-4"
          onClick={() => this.setState({ error: null })}
        >
          {strings.retry}
        </button>
      </section>
    );
  }
}

/** Router-level error component (loader/route errors). */
export function RouteError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  useEffect(() => markError(message), [message]);
  return (
    <section role="alert" className="p-6">
      <h1 className="text-title">Error</h1>
      <pre className="text-caption">{message}</pre>
    </section>
  );
}
