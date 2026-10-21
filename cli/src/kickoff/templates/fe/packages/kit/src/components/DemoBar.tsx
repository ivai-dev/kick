import { useId, useMemo, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { Popover } from "radix-ui";
import { ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, FlaskConicalIcon, ListIcon } from "lucide-react";

import { demoStore, useDemo } from "../demo-store";
import { activeDirection } from "../look";
import { isFirstRelease } from "../nav";
import { go, useKickoff } from "../runtime";
import { fill } from "../strings";
import { cx, matchesQuery } from "../text";
import type { Density, Scope, Theme } from "../types";
import { Tweaks } from "./Tweaks";

const control =
  "h-7 rounded border border-input bg-background px-1.5 text-caption text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";
const iconButton =
  "inline-flex size-7 shrink-0 items-center justify-center rounded border border-input bg-background text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50";

function DemoSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | "";
  options: Array<{ value: T | ""; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <label className="flex shrink-0 items-center gap-1">
      <span className="sr-only">{label}</span>
      <select
        className={control}
        value={value}
        title={label}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function useCurrentRole() {
  const { rolesById, defaultRole } = useKickoff();
  const params = useParams({ strict: false }) as { role?: string; screen?: string };
  return {
    role: (params.role && rolesById.get(params.role)) || defaultRole,
    screenId: params.screen,
  };
}

function ScreenIndex() {
  const { screens, strings, config } = useKickoff();
  const { role, screenId } = useCurrentRole();
  const scope = useDemo((state) => state.scope);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputId = useId();

  const visible = useMemo(
    () =>
      screens.filter(
        (screen) =>
          (scope !== "mvp" || isFirstRelease(config, screen.rel)) &&
          matchesQuery(`${screen.code} ${screen.name} ${screen.nav ?? ""} ${screen.id}`, query),
      ),
    [screens, scope, config, query],
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className={cx(control, "inline-flex shrink-0 items-center gap-1")}>
        <ListIcon className="size-3.5" aria-hidden />
        {strings.screens} ({screens.length})
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-[80] flex max-h-[min(28rem,70vh)] w-[min(24rem,92vw)] flex-col gap-2 rounded-md border bg-popover p-2 text-popover-foreground shadow-lg"
        >
          <label htmlFor={inputId} className="sr-only">
            {strings.filterScreens}
          </label>
          <input
            id={inputId}
            type="search"
            autoFocus
            value={query}
            placeholder={strings.filterScreens}
            onChange={(event) => setQuery(event.target.value)}
            className="h-8 rounded border border-input bg-background px-2 text-meta focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
          <ul className="flex flex-col overflow-y-auto">
            {visible.length === 0 && <li className="p-2 text-meta text-muted-foreground">{strings.noScreens}</li>}
            {visible.map((screen) => {
              const asRole = screen.roles.includes(role.id) ? role.id : screen.roles[0];
              return (
                <li key={screen.id}>
                  <button
                    type="button"
                    aria-current={screen.id === screenId ? "page" : undefined}
                    onClick={() => {
                      setOpen(false);
                      void go(screen.id, undefined, { role: asRole });
                    }}
                    className="flex w-full items-baseline gap-2 rounded px-2 py-1.5 text-left text-meta hover:bg-accent focus-visible:bg-accent focus-visible:outline-none aria-[current=page]:font-semibold"
                  >
                    <span className="shrink-0 text-muted-foreground tabular-nums">{screen.code}</span>
                    <span className="min-w-0 flex-1 truncate">{screen.name}</span>
                    <span className="shrink-0 text-caption text-muted-foreground">
                      {screen.roles.join(", ")} · {screen.rel}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function ScenarioPlayer() {
  const { scenarios, strings } = useKickoff();
  const scenarioId = useDemo((state) => state.scenarioId);
  const step = useDemo((state) => state.step);
  const scenario = scenarios.find((s) => s.id === scenarioId);

  const goToStep = (index: number, id = scenarioId) => {
    const target = scenarios.find((s) => s.id === id);
    const item = target?.steps[index];
    if (!target || !item) return;
    demoStore.set({ scenarioId: target.id, step: index }, { persist: false });
    void go(item.screen, item.params, { role: target.role });
  };

  const current = scenario?.steps[step];
  return (
    <div className="flex min-w-0 shrink-0 items-center gap-1">
      <DemoSelect
        label={strings.scenario}
        value={scenarioId ?? ""}
        options={[
          { value: "", label: strings.noScenario },
          ...scenarios.map((s) => ({ value: s.id, label: s.name })),
        ]}
        onChange={(id) => {
          if (!id) demoStore.set({ scenarioId: null, step: 0 }, { persist: false });
          else goToStep(0, id);
        }}
      />
      {scenario && current && (
        <>
          <button
            type="button"
            data-kickoff-prev
            className={iconButton}
            aria-label={strings.prevStep}
            disabled={step <= 0}
            onClick={() => goToStep(step - 1)}
          >
            <ChevronLeftIcon className="size-4" aria-hidden />
          </button>
          <span className="max-w-[40ch] truncate" title={current.text} aria-live="polite">
            <span className="font-medium">{fill(strings.step, { n: step + 1, total: scenario.steps.length })}</span>{" "}
            {current.text}
          </span>
          <button
            type="button"
            data-kickoff-next
            className={iconButton}
            aria-label={strings.nextStep}
            disabled={step >= scenario.steps.length - 1}
            onClick={() => goToStep(step + 1)}
          >
            <ChevronRightIcon className="size-4" aria-hidden />
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Prototype bar: role switcher, screen index, direction (while none is locked), tweaks, theme, density,
 * release scope, scenario player. Not product chrome; hidden with ?demo=0.
 */
export function DemoBar() {
  const { config, scenarios, strings } = useKickoff();
  const visible = useDemo((state) => state.visible);
  const collapsed = useDemo((state) => state.collapsed);
  const theme = useDemo((state) => state.theme);
  const density = useDemo((state) => state.density);
  const scope = useDemo((state) => state.scope);
  const direction = activeDirection(config, useDemo((state) => state.direction));
  const offered = config.direction ? [] : (config.directions ?? []);
  const { role } = useCurrentRole();

  if (!visible) return null;

  if (collapsed) {
    return (
      <button
        type="button"
        data-kickoff-demobar="collapsed"
        aria-label={strings.expand}
        title={strings.expand}
        onClick={() => demoStore.set({ collapsed: false })}
        className="fixed top-1 right-1 z-[80] inline-flex size-7 items-center justify-center rounded-full border border-dashed border-input bg-muted text-foreground opacity-70 shadow hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <FlaskConicalIcon className="size-4" aria-hidden />
      </button>
    );
  }

  return (
    <aside
      aria-label={strings.demoControls}
      data-kickoff-demobar=""
      className="relative z-[60] border-b border-dashed border-input bg-muted text-caption text-foreground"
    >
      <div className="flex items-center gap-2 overflow-x-auto px-2 py-1">
        <span className="inline-flex shrink-0 items-center gap-1 font-semibold">
          <FlaskConicalIcon className="size-3.5" aria-hidden />
          {strings.demo}
        </span>
        <DemoSelect
          label={strings.role}
          value={role.id}
          options={config.roles.map((r) => ({ value: r.id, label: r.name }))}
          onChange={(id) => {
            const target = config.roles.find((r) => r.id === id);
            if (target) void go(target.home, undefined, { role: target.id });
          }}
        />
        <ScreenIndex />
        {offered.length > 1 && (
          <DemoSelect
            label={strings.direction}
            value={direction ?? ""}
            options={offered.map((d) => ({ value: d.id, label: d.summary ? `${d.name} · ${d.summary}` : d.name }))}
            onChange={(id) => demoStore.set({ direction: id })}
          />
        )}
        <Tweaks direction={direction} />
        <DemoSelect<Theme>
          label={strings.theme}
          value={theme}
          options={[
            { value: "light", label: strings.light },
            { value: "dark", label: strings.dark },
          ]}
          onChange={(value) => demoStore.set({ theme: value })}
        />
        <DemoSelect<Density>
          label={strings.density}
          value={density ?? role.density ?? "comfortable"}
          options={[
            { value: "compact", label: strings.compact },
            { value: "comfortable", label: strings.comfortable },
            { value: "touch", label: strings.touch },
          ]}
          onChange={(value) => demoStore.set({ density: value })}
        />
        <DemoSelect<Scope>
          label={strings.scope}
          value={scope}
          options={[
            { value: "all", label: strings.scopeAll },
            { value: "mvp", label: fill(strings.scopeMvp, { mvp: config.releases[0] ?? "MVP" }) },
            { value: "tagged", label: strings.scopeTagged },
          ]}
          onChange={(value) => demoStore.set({ scope: value })}
        />
        {scenarios.length > 0 && <ScenarioPlayer />}
        <button
          type="button"
          className={cx(iconButton, "ml-auto")}
          aria-label={strings.collapse}
          title={strings.collapse}
          onClick={() => demoStore.set({ collapsed: true })}
        >
          <ChevronUpIcon className="size-4" aria-hidden />
        </button>
      </div>
    </aside>
  );
}
