import { EMPTY, formatDateTime, formatNaira } from "@/lib/format";

/*
 * Audit before/after snapshots are raw JSON from the database. BigInt money
 * in them was stored as kobo strings (the API's naira conversion doesn't
 * reach inside JSON columns), so known money fields are converted here.
 * People never see kobo.
 */

const MONEY_KEYS = new Set([
  "amount",
  "balance",
  "totalSpent",
  "fee",
  "fees",
  "platformFee",
  "withdrawalFee",
  "organizerDebit",
  "platformDebit",
  "organizerShare",
  "platformShare",
]);

// balance, balanceAfter, balanceBefore... are all wallet kobo.
const isMoneyKey = (key: string) =>
  MONEY_KEYS.has(key) || /Kobo$/i.test(key) || /^balance/i.test(key);
/** Fields the API already converted to naira before they were audited. */
const NAIRA_KEYS = new Set(["valueAmount"]);
const KOBO = /^-?\d+$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** Exact kobo string → "₦1,234.56" (bigint math, no float rounding). */
export function nairaFromKobo(kobo: string): string {
  const value = BigInt(kobo);
  const abs = value < BigInt(0) ? -value : value;
  const naira = (abs / BigInt(100)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const rest = (abs % BigInt(100)).toString().padStart(2, "0");
  return `${value < BigInt(0) ? "-" : ""}₦${naira}.${rest}`;
}

export function formatAuditValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return EMPTY;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    if (isMoneyKey(key) && KOBO.test(value)) return nairaFromKobo(value);
    if (ISO_TIMESTAMP.test(value)) return formatDateTime(value);
    return value;
  }
  if (typeof value === "number") {
    return NAIRA_KEYS.has(key) ? formatNaira(value) : String(value);
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? EMPTY : value.map((v) => formatAuditValue(key, v)).join(", ");
  }
  if (typeof value === "object") {
    // Nested snapshots read as "Name: Jazz Night; Amount: ₦50.00", each value
    // formatted by its own key so money inside them is naira too.
    const parts = Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => `${humanizeKey(k)}: ${formatAuditValue(k, v)}`,
    );
    return parts.length === 0 ? EMPTY : parts.join("; ");
  }
  return String(value);
}

/** "suspendedReason" → "Suspended reason". */
export function humanizeKey(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_.]+/g, " ")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** "transaction.marked_failed" → "Transaction marked failed". */
export const humanizeAction = humanizeKey;

export interface AuditChange {
  key: string;
  label: string;
  before: string;
  after: string;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

/** One row per key in either snapshot, before-keys first. */
export function auditChanges(before: unknown, after: unknown): AuditChange[] {
  const b = asRecord(before);
  const a = asRecord(after);
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])];
  return keys.map((key) => ({
    key,
    label: humanizeKey(key),
    before: formatAuditValue(key, b[key]),
    after: formatAuditValue(key, a[key]),
  }));
}
