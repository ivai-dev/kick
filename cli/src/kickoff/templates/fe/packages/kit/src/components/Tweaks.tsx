import { useEffect, useId, useState } from "react";
import { Popover } from "radix-ui";
import { SlidersHorizontalIcon } from "lucide-react";

import { contrastRatio, toRgb } from "../contrast";
import { demoStore, formatTweak, useDemo } from "../demo-store";
import { useKickoff } from "../runtime";
import { fill } from "../strings";
import { cx } from "../text";
import type { Motion, Tweak } from "../types";

const control =
  "h-7 rounded border border-input bg-background px-1.5 text-caption text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/** The value the page uses now: the tweak, else the computed CSS variable. */
function current(name: string, fallback: number): number {
  if (typeof document === "undefined") return fallback;
  const n = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(n) ? n : fallback;
}

/** Contrast of the primary button's text, read from the live tokens. */
function useButtonContrast(key: string): number | null {
  const [ratio, setRatio] = useState<number | null>(null);
  useEffect(() => {
    // Next frame: the root applies the look in a layout effect that runs after this component renders.
    const frame = requestAnimationFrame(() => {
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden;background:var(--primary);color:var(--primary-foreground)";
      document.body.appendChild(probe);
      const style = getComputedStyle(probe);
      const bg = toRgb(style.backgroundColor);
      const fg = toRgb(style.color);
      probe.remove();
      setRatio(bg && fg ? contrastRatio(bg, fg) : null);
    });
    return () => cancelAnimationFrame(frame);
  }, [key]);
  return ratio;
}

/** The current screen's link with the look in it, for the customer to send back. */
export function lookLink(direction: string | null, tweak: Tweak, href = window.location.href): string {
  const [base, hash = ""] = href.split("#");
  const [path, query = ""] = hash.split("?");
  const search = new URLSearchParams(query);
  search.delete("direction");
  search.delete("tweak");
  if (direction) search.set("direction", direction);
  const t = formatTweak(tweak);
  if (t) search.set("tweak", t);
  const q = search.toString();
  return `${base}#${path}${q ? `?${q}` : ""}`;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-meta">
          {label}
        </label>
        <span className="text-caption text-muted-foreground tabular-nums">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[var(--primary)]"
      />
    </div>
  );
}

/**
 * Tweak panel of the prototype bar: brand hue and chroma, radius and motion within bounds, a live contrast
 * reading, and a link that carries the look (?direction=…&tweak=…).
 */
export function Tweaks({ direction }: { direction: string | null }) {
  const { strings, config } = useKickoff();
  const tweak = useDemo((state) => state.tweak);
  const theme = useDemo((state) => state.theme);
  const [copied, setCopied] = useState(false);
  const linkId = useId();
  const ratio = useButtonContrast(`${formatTweak(tweak)}|${direction}|${theme}`);
  const number = new Intl.NumberFormat(config.locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 });

  const set = (patch: Tweak) => {
    setCopied(false);
    demoStore.set({ tweak: { ...tweak, ...patch } });
  };
  const link = typeof window === "undefined" ? "" : lookLink(direction, tweak);
  const hue = tweak.h ?? current("--brand-h", 250);
  const chroma = tweak.c ?? current("--brand-c", 0);
  const radius = tweak.r ?? current("--radius", 0.5);
  const motions: Array<{ value: Motion; label: string }> = [
    { value: "off", label: strings.motionOff },
    { value: "calm", label: strings.motionCalm },
    { value: "lively", label: strings.motionLively },
  ];

  return (
    <Popover.Root>
      <Popover.Trigger className={cx(control, "inline-flex shrink-0 items-center gap-1")} data-kickoff-tweaks="">
        <SlidersHorizontalIcon className="size-3.5" aria-hidden />
        {strings.tweaks}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          aria-label={strings.tweaksTitle}
          className="z-[80] grid w-[min(20rem,92vw)] gap-3 rounded-md border bg-popover p-3 text-popover-foreground shadow-lg"
        >
          <p className="text-label">{strings.tweaksTitle}</p>
          <Slider label={strings.hue} value={hue} min={0} max={360} step={1} display={`${Math.round(hue)}°`}
            onChange={(h) => set({ h })} />
          <Slider label={strings.chroma} value={chroma} min={0} max={0.3} step={0.005}
            display={number.format(chroma * 100)} onChange={(c) => set({ c })} />
          <Slider label={strings.radius} value={radius} min={0} max={1.5} step={0.125}
            display={`${number.format(radius)} rem`} onChange={(r) => set({ r })} />
          <label className="flex items-center justify-between gap-2 text-meta">
            {strings.motion}
            <select className={control} value={tweak.m ?? "calm"} onChange={(event) => set({ m: event.target.value as Motion })}>
              {motions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          {ratio !== null && (
            <p className="text-caption" data-kickoff-contrast={ratio.toFixed(2)}>
              <span className="tabular-nums">{fill(strings.contrast, { ratio: number.format(ratio) })}</span>
              {ratio < 4.5 && <span className="block text-destructive">{strings.contrastLow}</span>}
            </p>
          )}
          <div className="grid gap-1">
            <label htmlFor={linkId} className="text-caption text-muted-foreground">
              {strings.shareHint}
            </label>
            <input
              id={linkId}
              readOnly
              value={link}
              onFocus={(event) => event.currentTarget.select()}
              className="h-7 rounded border border-input bg-background px-1.5 text-caption"
            />
          </div>
          <div className="flex justify-between gap-2">
            <button
              type="button"
              className={control}
              onClick={() => {
                setCopied(false);
                demoStore.set({ tweak: {} });
              }}
            >
              {strings.reset}
            </button>
            <button
              type="button"
              className={cx(control, "font-medium")}
              aria-live="polite"
              onClick={() => {
                // Clipboard access can be refused inside a sandboxed frame; the link stays selectable above.
                void navigator.clipboard?.writeText(link).then(() => setCopied(true), () => setCopied(false));
              }}
            >
              {copied ? strings.copied : strings.copyLink}
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
