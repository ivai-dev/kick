import * as React from "react"
import { InboxIcon } from "lucide-react"

import { cn } from "../lib/utils"

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center",
        className
      )}
    >
      <div className="text-muted-foreground [&_svg]:size-8" aria-hidden>
        {icon ?? <InboxIcon />}
      </div>
      <p className="text-label">{title}</p>
      {description && <p className="max-w-prose text-meta text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
