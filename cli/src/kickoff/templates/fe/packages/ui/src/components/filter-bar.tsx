import * as React from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { Button } from "./button"
import { Input } from "./input"

export interface FilterBarProps {
  /** External (URL) search value. */
  search?: string
  /** Called after the user stops typing for `debounceMs`. */
  onSearchChange?: (value: string) => void
  searchLabel?: string
  searchPlaceholder?: string
  debounceMs?: number
  /** Filter controls (selects, comboboxes, toggles). */
  children?: React.ReactNode
  /** Shows a reset button when provided and `active` is true. */
  onReset?: () => void
  resetLabel?: string
  active?: boolean
  className?: string
}

export function FilterBar({
  search = "",
  onSearchChange,
  searchLabel = "Search",
  searchPlaceholder,
  debounceMs = 250,
  children,
  onReset,
  resetLabel = "Reset filters",
  active = false,
  className,
}: FilterBarProps) {
  const [draft, setDraft] = React.useState(search)
  const [synced, setSynced] = React.useState(search)
  const callback = React.useRef(onSearchChange)

  React.useEffect(() => {
    callback.current = onSearchChange
  }, [onSearchChange])

  // Follow external changes (back button, reset) without fighting the user's typing.
  if (search !== synced) {
    setSynced(search)
    setDraft(search)
  }

  React.useEffect(() => {
    if (draft === search) return
    const handle = window.setTimeout(() => callback.current?.(draft), debounceMs)
    return () => window.clearTimeout(handle)
  }, [draft, search, debounceMs])

  return (
    <div
      role="search"
      data-slot="filter-bar"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {onSearchChange && (
        <div className="relative w-full sm:w-64">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label={searchLabel}
            placeholder={searchPlaceholder ?? searchLabel}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="pl-8"
          />
        </div>
      )}
      {children}
      {onReset && active && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <XIcon aria-hidden />
          {resetLabel}
        </Button>
      )}
    </div>
  )
}
