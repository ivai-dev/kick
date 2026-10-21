import * as React from "react"

import { cn } from "../lib/utils"

export interface PageHeaderProps {
  /** Rendered as the page's single <h1>. */
  title: React.ReactNode
  description?: React.ReactNode
  /** Primary actions, right-aligned on wide screens, wrapped below on phones. */
  actions?: React.ReactNode
  /** Optional breadcrumb or back link shown above the title. */
  breadcrumb?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, breadcrumb, className }: PageHeaderProps) {
  return (
    <header data-slot="page-header" className={cn("mb-6 flex flex-col gap-2", className)}>
      {breadcrumb}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-title break-words">{title}</h1>
          {description && (
            <p className="mt-1 text-body text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
