/*
 * Shapes shared by every /v2/admin area, read from the backend's
 * src/v2/admin/** controllers and services. Money fields are naira numbers
 * (the API converts kobo on the way out), except inside JSON columns
 * (audit before/after, request payloads), where BigInt money is a kobo
 * string. Dates are ISO strings.
 */

/** Every list endpoint: `{ items, total, page, pageSize }`. */
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type Role = "USER" | "ORGANIZER" | "ADMIN" | "SUPERADMIN";

/** GET /v2/admin/me */
export interface Me {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Only SUPERADMINs approve tier 3 requests. */
  canApprove: boolean;
}

export interface PersonRef {
  id: string;
  name: string;
  email: string;
}

export type AdminRequestType =
  | "REFUND"
  | "EVENT_REFUND_ALL"
  | "WALLET_ADJUSTMENT"
  | "PAYOUT_FORCE_FAIL"
  | "PAYOUTS_RESUME"
  | "PRIVILEGED_ROLE_CHANGE";

export type AdminRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "EXECUTED"
  | "FAILED"
  | "REJECTED"
  | "CANCELLED";

/** "transaction" | "event" | "wallet" | "payout" | "user" | "platform" */
export type AdminTargetType = string;

/**
 * A request as stored (POST /requests returns this; detail payloads list
 * pending ones as `pendingRequests`, without the people).
 */
export interface PendingRequestRef {
  id: string;
  type: AdminRequestType;
  status: AdminRequestStatus;
  targetType: AdminTargetType;
  targetId: string | null;
  /** Kobo strings for amounts. */
  payload: Record<string, unknown>;
  /** Human sentence, already naira-formatted. */
  summary: string;
  requestedById: string;
  requestReason: string;
  decidedById: string | null;
  decisionReason: string | null;
  selfApproved: boolean;
  decidedAt: string | null;
  executedAt: string | null;
  result: unknown;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /requests, GET /requests/:id: the request plus who asked and who decided. */
export interface AdminRequest extends PendingRequestRef {
  requestedBy: PersonRef;
  decidedBy: PersonRef | null;
}

/** POST /v2/admin/requests */
export interface CreateRequestInput {
  type: AdminRequestType;
  targetId?: string;
  payload: Record<string, unknown>;
  reason: string;
}

/** GET /v2/admin/audit item. */
export interface AuditEntry {
  id: string;
  actorId: string;
  actor: PersonRef;
  /** e.g. "user.suspended", "request.created". */
  action: string;
  targetType: string;
  targetId: string | null;
  reason: string | null;
  /** Raw JSON snapshots; BigInt money inside is a kobo string. */
  before: unknown;
  after: unknown;
  metadata: unknown;
  requestId: string | null;
  ip: string | null;
  createdAt: string;
}
