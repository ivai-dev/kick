import { z } from "zod";

/**
 * Example entity contract. One file per entity in src/contract/.
 * The zod schema is the single source of truth: the mock repo validates
 * against it, screens derive form schemas from it, and the real backend
 * later implements the same shape.
 */
export const requestStatuses = ["draft", "submitted", "approved", "rejected"] as const;
export const RequestStatus = z.enum(requestStatuses);
export type RequestStatus = z.infer<typeof RequestStatus>;

export const Request = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500),
  status: RequestStatus,
  owner: z.string().min(1),
  createdAt: z.iso.datetime(),
  amount: z.number().nonnegative(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
});
export type Request = z.infer<typeof Request>;

/** Fields a client may send when creating a request. */
export const RequestCreate = Request.pick({
  title: true,
  owner: true,
  amount: true,
  description: true,
  tags: true,
}).extend({
  status: RequestStatus.default("draft"),
});
export type RequestCreate = z.input<typeof RequestCreate>;

export const RequestUpdate = RequestCreate.partial();
export type RequestUpdate = z.input<typeof RequestUpdate>;

/** Sortable fields, used by list({ sort }). */
export const requestSortFields = ["title", "status", "owner", "createdAt", "amount"] as const;
export type RequestSortField = (typeof requestSortFields)[number];
