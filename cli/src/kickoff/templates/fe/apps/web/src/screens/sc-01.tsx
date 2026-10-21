import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PlusIcon } from "lucide-react";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type ColumnDef,
  type SortingState,
} from "@app/ui";
import { requestSortFields, requestStatuses, type Request, type RequestSortField, type RequestStatus } from "@app/mocks";
import { go, useScreenParams } from "@kickoff/kit";

import { api } from "../lib/api";
import { formatDate, formatMoney } from "../lib/format";

const statusVariant: Record<RequestStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  submitted: "secondary",
  approved: "default",
  rejected: "destructive",
};

/** SC-01 Requests — a real list: URL params drive filter, sort and paging. */
export default function Screen() {
  const { t } = useTranslation();
  const params = useScreenParams();

  const q = params.q ?? "";
  const status = (requestStatuses as readonly string[]).includes(params.status ?? "") ? params.status! : "";
  const [sortField, sortDir] = (params.sort ?? "createdAt:desc").split(":") as [string, string];
  const sort = (requestSortFields as readonly string[]).includes(sortField)
    ? { field: sortField as RequestSortField, dir: sortDir === "asc" ? ("asc" as const) : ("desc" as const) }
    : { field: "createdAt" as const, dir: "desc" as const };
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = [10, 20, 50, 100].includes(Number(params.size)) ? Number(params.size) : 20;

  const query = useQuery({
    queryKey: ["requests", { q, status, sort, page, pageSize }],
    queryFn: () => api.requests.list({ search: q, filters: { status }, sort, page, pageSize }),
    placeholderData: keepPreviousData,
  });

  const update = (patch: Record<string, string | number | undefined>) =>
    go("sc-01", { ...params, ...patch }, { replace: true });

  const sorting: SortingState = [{ id: sort.field, desc: sort.dir === "desc" }];

  const columns = useMemo<ColumnDef<Request, unknown>[]>(
    () => [
      {
        accessorKey: "id",
        header: t("request.id"),
        enableSorting: false,
        cell: ({ row }) => <span className="font-mono text-meta whitespace-nowrap">{row.original.id}</span>,
      },
      {
        accessorKey: "title",
        header: t("request.title"),
        cell: ({ row }) => (
          <div className="flex max-w-md min-w-48 flex-col gap-1 whitespace-normal">
            <span className="line-clamp-2 break-words">{row.original.title}</span>
            {row.original.tags.length > 0 && (
              <span className="truncate text-caption text-muted-foreground">
                {row.original.tags.slice(0, 4).join(" · ")}
                {row.original.tags.length > 4 && ` +${row.original.tags.length - 4}`}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: t("request.status"),
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status]}>
            {t(`request.statuses.${row.original.status}`)}
          </Badge>
        ),
      },
      {
        accessorKey: "owner",
        header: t("request.owner"),
        cell: ({ row }) => <span className="line-clamp-2 min-w-32 whitespace-normal">{row.original.owner}</span>,
      },
      {
        accessorKey: "createdAt",
        header: t("request.createdAt"),
        cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.createdAt)}</span>,
      },
      {
        accessorKey: "amount",
        header: t("request.amount"),
        cell: ({ row }) => (
          <span className="block text-right whitespace-nowrap tabular-nums">{formatMoney(row.original.amount)}</span>
        ),
      },
    ],
    [t],
  );

  return (
    <>
      <PageHeader
        title={t("requests.title")}
        description={t("requests.description")}
        actions={
          <Button onClick={() => go("sc-02")}>
            <PlusIcon aria-hidden />
            {t("requests.new")}
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={query.data?.items ?? []}
        total={query.data?.total ?? 0}
        loading={query.isFetching}
        page={page}
        pageSize={pageSize}
        onPageChange={(next) => update({ page: next })}
        onPageSizeChange={(size) => update({ size, page: undefined })}
        sorting={sorting}
        onSortingChange={(next) => {
          const first = next[0];
          update({ sort: first ? `${first.id}:${first.desc ? "desc" : "asc"}` : undefined, page: undefined });
        }}
        enableRowSelection
        getRowId={(row) => row.id}
        toolbar={
          <FilterBar
            search={q}
            onSearchChange={(value) => update({ q: value, page: undefined })}
            searchLabel={t("common.search")}
            searchPlaceholder={t("requests.searchPlaceholder")}
            onReset={() => go("sc-01", {}, { replace: true })}
            resetLabel={t("common.reset")}
            active={Boolean(q || status)}
          >
            <Select
              value={status || "all"}
              onValueChange={(value) => update({ status: value === "all" ? undefined : value, page: undefined })}
            >
              <SelectTrigger aria-label={t("requests.statusFilter")} className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {requestStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`request.statuses.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBar>
        }
        labels={{
          table: t("table.label"),
          columns: t("table.columns"),
          selectAll: t("table.selectAll"),
          selectRow: t("table.selectRow"),
          rowsPerPage: t("table.rowsPerPage"),
          pageOf: (p, pages) => t("table.pageOf", { page: p, pages }),
          summary: (total, selected) =>
            selected ? t("table.summarySelected", { selected, total }) : t("table.summary", { total }),
          previous: t("table.previous"),
          next: t("table.next"),
          empty: t("table.empty"),
        }}
      />
    </>
  );
}
