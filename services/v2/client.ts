import { isAxiosError } from "axios";
import Axios from "@/services/axios";

/*
 * Typed access to /v2/admin on the shared axios instance (session cookie,
 * the admin app header, and the 401 → /login?next= redirect).
 *
 * Every function throws ApiError, carrying the backend's own `message`, so
 * sheets and error states can show it as-is.
 *
 * Query keys: ["v2", <area>, ...]. Invalidating ["v2", "users"] refreshes
 * every users list and detail; ["v2", "requests"] refreshes the pending
 * count and every request banner.
 */

const BASE = "/v2/admin";

export const NETWORK_ERROR_MESSAGE =
  "Couldn't reach Ticketer Africa. Check your connection and try again.";

export class ApiError extends Error {
  /** HTTP status, or 0 when the request never got a response. */
  readonly status: number;
  /** Optional machine-readable code some endpoints add. */
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type Body = { message?: unknown; code?: unknown } | undefined;

const PERMISSION_MESSAGE = "You don't have permission to do that.";

function messageFrom(body: Body, status: number): string {
  const raw = body?.message;
  // Nest's guard default, not written for people.
  if (raw === "Forbidden resource") return PERMISSION_MESSAGE;
  // Validation errors arrive as a list of sentences.
  if (Array.isArray(raw) && raw.length) return raw.map(String).join(". ");
  if (typeof raw === "string" && raw.trim()) return raw;
  if (status >= 500) return "Something went wrong on our side. Try again in a moment.";
  if (status === 403) return PERMISSION_MESSAGE;
  if (status === 404) return "Not found.";
  return `Request failed (${status}).`;
}

async function readBody(data: unknown): Promise<Body> {
  // Blob responses (downloads) carry their error as JSON text.
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    try {
      return JSON.parse(await data.text()) as Body;
    } catch {
      return undefined;
    }
  }
  return data && typeof data === "object" ? (data as Body) : undefined;
}

export async function toApiError(error: unknown): Promise<ApiError> {
  if (error instanceof ApiError) return error;
  if (isAxiosError(error)) {
    if (!error.response) return new ApiError(0, NETWORK_ERROR_MESSAGE);
    const { status, data } = error.response;
    const body = await readBody(data);
    const code = typeof body?.code === "string" ? body.code : undefined;
    return new ApiError(status, messageFrom(body, status), code);
  }
  return new ApiError(0, error instanceof Error ? error.message : String(error));
}

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

/** Drops empty values so they don't reach the API as `?role=`. */
function cleanParams(params?: QueryParams): Record<string, string> | undefined {
  if (!params) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = String(value);
  }
  return out;
}

const url = (path: string) => `${BASE}${path.startsWith("/") ? path : `/${path}`}`;

async function run<T>(request: () => Promise<{ data: T }>): Promise<T> {
  try {
    return (await request()).data;
  } catch (error) {
    throw await toApiError(error);
  }
}

export function adminGet<T>(path: string, params?: QueryParams): Promise<T> {
  return run(() => Axios.get<T>(url(path), { params: cleanParams(params) }));
}

export function adminPost<T>(path: string, body?: unknown): Promise<T> {
  return run(() => Axios.post<T>(url(path), body ?? {}));
}

export function adminPatch<T>(path: string, body?: unknown): Promise<T> {
  return run(() => Axios.patch<T>(url(path), body ?? {}));
}

/**
 * Fetches a file (CSV export) with the session cookie and saves it.
 * Paging params are dropped: exports take the list's filters and sort only.
 */
export async function adminDownload(
  path: string,
  params: QueryParams | undefined,
  filename: string,
): Promise<void> {
  const rest = { ...(params ?? {}) };
  delete rest.page;
  delete rest.pageSize;
  const blob = await run(() =>
    Axios.get<Blob>(url(path), {
      params: cleanParams(rest),
      responseType: "blob",
    }),
  );
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}
