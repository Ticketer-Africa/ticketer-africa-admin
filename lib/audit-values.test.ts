import { describe, expect, it } from "vitest";
import { auditChanges, formatAuditValue, humanizeAction } from "@/lib/audit-values";

describe("formatAuditValue", () => {
  it("turns kobo strings in money fields into naira", () => {
    expect(formatAuditValue("amount", "1234550")).toBe("₦12,345.50");
    expect(formatAuditValue("balance", "-30000")).toBe("-₦300.00");
    expect(formatAuditValue("feeKobo", "5")).toBe("₦0.05");
    expect(formatAuditValue("totalSpent", "100")).toBe("₦1.00");
  });

  it("leaves money fields that aren't kobo strings alone", () => {
    expect(formatAuditValue("amount", 50)).toBe("50");
    expect(formatAuditValue("amount", "about 5k")).toBe("about 5k");
  });

  it("never treats non-money digit strings as money", () => {
    expect(formatAuditValue("code", "123456")).toBe("123456");
  });

  it("formats ISO timestamps, empties, booleans and objects", () => {
    expect(formatAuditValue("suspendedAt", "2026-10-18T23:30:00.000Z")).toBe(
      "19 Oct 2026, 00:30",
    );
    expect(formatAuditValue("suspendedAt", null)).toBe("—");
    expect(formatAuditValue("isActive", false)).toBe("No");
    expect(formatAuditValue("isActive", true)).toBe("Yes");
  });

  it("reads every balance field as kobo, including balanceAfter", () => {
    expect(formatAuditValue("balanceAfter", "2500000")).toBe("₦25,000.00");
    expect(formatAuditValue("balanceBefore", "0")).toBe("₦0.00");
  });

  it("adds ₦ to amounts the API already gave in naira", () => {
    expect(formatAuditValue("valueAmount", 750.5)).toBe("₦750.50");
  });

  it("spells out nested objects and lists, formatting values by their own key", () => {
    expect(formatAuditValue("meta", { a: 1 })).toBe("A: 1");
    expect(
      formatAuditValue("event", { name: "Jazz", amountKobo: "5000", isActive: true }),
    ).toBe("Name: Jazz; Amount: ₦50.00; Is active: Yes");
    expect(formatAuditValue("delistedTicketIds", ["t1", "t2"])).toBe("t1, t2");
    expect(formatAuditValue("fields", [])).toBe("—");
    expect(formatAuditValue("meta", {})).toBe("—");
  });
});

describe("auditChanges", () => {
  it("lists every key from before and after once, in order", () => {
    expect(
      auditChanges({ role: "USER" }, { role: "ORGANIZER", note: "x" }),
    ).toEqual([
      { key: "role", label: "Role", before: "USER", after: "ORGANIZER" },
      { key: "note", label: "Note", before: "—", after: "x" },
    ]);
  });

  it("handles missing or non-object sides", () => {
    expect(auditChanges(null, { amount: "100" })).toEqual([
      { key: "amount", label: "Amount", before: "—", after: "₦1.00" },
    ]);
    expect(auditChanges(undefined, undefined)).toEqual([]);
  });
});

describe("humanizeAction", () => {
  it("turns an unknown key into words", () => {
    expect(humanizeAction("transaction.marked_failed")).toBe("Transaction marked failed");
    expect(humanizeAction("PAYOUT_FAILED_REFUNDED")).toBe("Payout failed refunded");
  });
});
