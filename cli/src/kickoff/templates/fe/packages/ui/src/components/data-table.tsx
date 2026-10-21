import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Columns3Icon,
} from "lucide-react"

import { cn } from "../lib/utils"
import { Button } from "./button"
import { Checkbox } from "./checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"
import { Skeleton } from "./skeleton"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"

export type { ColumnDef, RowSelectionState, SortingState, VisibilityState }

export interface DataTableLabels {
  table: string
  columns: string
  selectAll: string
  selectRow: string
  rowsPerPage: string
  /** e.g. "Page {page} of {pages}" */
  pageOf: (page: number, pages: number) => string
  /** e.g. "{total} rows" / "{selected} of {total} selected" */
  summary: (total: number, selected: number) => string
  previous: string
  next: string
  empty: string
}

export const defaultDataTableLabels: DataTableLabels = {
  table: "Data table",
  columns: "Columns",
  selectAll: "Select all rows on this page",
  selectRow: "Select row",
  rowsPerPage: "Rows per page",
  pageOf: (page, pages) => `Page ${page} of ${pages}`,
  summary: (total, selected) =>
    selected ? `${selected} of ${total} selected` : `${total} rows`,
  previous: "Previous page",
  next: "Next page",
  empty: "No results.",
}

export interface DataTableProps<TData> {
  /** Column definitions; give each an `id` or `accessorKey` and a string `header` (or meta.label) for the columns menu. */
  columns: ColumnDef<TData, unknown>[]
  /** The rows of the CURRENT page only (server-style). */
  data: TData[]
  /** Total rows matching the query on the server. */
  total: number
  /** 1-based page number. */
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  /** Enables the checkbox column. Selection is keyed by getRowId. */
  enableRowSelection?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (selection: RowSelectionState) => void
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: (visibility: VisibilityState) => void
  getRowId?: (row: TData, index: number) => string
  loading?: boolean
  empty?: React.ReactNode
  toolbar?: React.ReactNode
  labels?: Partial<DataTableLabels>
  className?: string
}

function resolve<T>(updater: T | ((old: T) => T), old: T): T {
  return typeof updater === "function" ? (updater as (old: T) => T)(old) : updater
}

export function DataTable<TData>({
  columns,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  sorting = [],
  onSortingChange,
  enableRowSelection = false,
  rowSelection: rowSelectionProp,
  onRowSelectionChange,
  columnVisibility: visibilityProp,
  onColumnVisibilityChange,
  getRowId,
  loading = false,
  empty,
  toolbar,
  labels: labelsProp,
  className,
}: DataTableProps<TData>) {
  const labels = { ...defaultDataTableLabels, ...labelsProp }
  const sizeLabelId = React.useId()
  const [localSelection, setLocalSelection] = React.useState<RowSelectionState>({})
  const [localVisibility, setLocalVisibility] = React.useState<VisibilityState>({})
  const rowSelection = rowSelectionProp ?? localSelection
  const columnVisibility = visibilityProp ?? localVisibility
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  const allColumns = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
    if (!enableRowSelection) return columns
    const select: ColumnDef<TData, unknown> = {
      id: "__select",
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          aria-label={labels.selectAll}
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={labels.selectRow}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    }
    return [select, ...columns]
  }, [columns, enableRowSelection, labels.selectAll, labels.selectRow])

  const handleSorting: OnChangeFn<SortingState> = (updater) =>
    onSortingChange?.(resolve(updater, sorting))
  const handleSelection: OnChangeFn<RowSelectionState> = (updater) => {
    const next = resolve(updater, rowSelection)
    if (onRowSelectionChange) onRowSelectionChange(next)
    else setLocalSelection(next)
  }
  const handleVisibility: OnChangeFn<VisibilityState> = (updater) => {
    const next = resolve(updater, columnVisibility)
    if (onColumnVisibilityChange) onColumnVisibilityChange(next)
    else setLocalVisibility(next)
  }

  // TanStack Table v8 returns non-memoizable functions; this is expected.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: allColumns,
    getRowId,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
      pagination: { pageIndex: page - 1, pageSize },
    },
    pageCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableRowSelection,
    enableSortingRemoval: true,
    onSortingChange: handleSorting,
    onRowSelectionChange: handleSelection,
    onColumnVisibilityChange: handleVisibility,
    getCoreRowModel: getCoreRowModel(),
  })

  const selectedCount = Object.values(rowSelection).filter(Boolean).length
  const hideable = table.getAllLeafColumns().filter((column) => column.getCanHide())
  const visibleColumnCount = table.getVisibleLeafColumns().length

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">{toolbar}</div>
        {hideable.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3Icon aria-hidden />
                {labels.columns}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{labels.columns}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {hideable.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  onSelect={(event) => event.preventDefault()}
                >
                  {columnLabel(column.columnDef, column.id)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div
        className="relative w-full overflow-x-auto rounded-md border"
        role="region"
        aria-label={labels.table}
        aria-busy={loading}
        tabIndex={0}
      >
        <table data-slot="table" className="w-full caption-bottom text-sm">
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const canSort = header.column.getCanSort() && !!onSortingChange
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : canSort
                              ? "none"
                              : undefined
                      }
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-2"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? (
                            <ArrowUpIcon aria-hidden />
                          ) : sorted === "desc" ? (
                            <ArrowDownIcon aria-hidden />
                          ) : (
                            <ArrowUpDownIcon aria-hidden className="opacity-50" />
                          )}
                        </Button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading && data.length === 0 ? (
              Array.from({ length: Math.min(pageSize, 8) }, (_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: visibleColumnCount }, (_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumnCount} className="h-24 text-center">
                  {empty ?? labels.empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground" aria-live="polite">
          {labels.summary(total, selectedCount)}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span id={sizeLabelId} className="text-muted-foreground">
                {labels.rowsPerPage}
              </span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                <SelectTrigger size="sm" aria-labelledby={sizeLabelId} className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <span>{labels.pageOf(Math.min(page, pageCount), pageCount)}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={labels.previous}
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeftIcon aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={labels.next}
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRightIcon aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function columnLabel<TData>(def: ColumnDef<TData, unknown>, id: string): string {
  const meta = def.meta as { label?: string } | undefined
  if (meta?.label) return meta.label
  if (typeof def.header === "string") return def.header
  return id
}
