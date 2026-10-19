import { EntityLink } from "@/components/entity-link";
import { Money } from "@/components/money";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LedgerEntry, LedgerEntryType } from "@/services/v2/transactions";

export const LEDGER_TYPE_LABELS: Record<LedgerEntryType, string> = {
  OPENING_BALANCE: "Opening balance",
  PURCHASE_PROCEEDS: "Organizer proceeds",
  RESALE_ROYALTY: "Resale royalty",
  PLATFORM_FEE: "Platform fee",
  EVENT_PAYOUT_RELEASE: "Payout release",
  WITHDRAWAL_HOLD: "Withdrawal hold",
  WITHDRAWAL_REFUND: "Withdrawal returned",
  ADJUSTMENT: "Adjustment",
  REFUND_REVERSAL: "Refund reversal",
  REFUND_REVERSAL_RESTORED: "Reversal restored",
};

interface LedgerEntriesProps {
  entries: Pick<LedgerEntry, "id" | "type" | "amount" | "balanceAfter" | "reference" | "createdAt" | "owner">[];
  emptyText?: string;
  className?: string;
}

/**
 * Who got (or gave back) what: one line per wallet ledger entry, with the
 * wallet's owner, the kind of entry, the signed amount and the balance
 * after it. Rows, not a table, so it fits a phone without scrolling.
 */
export function LedgerEntries({ entries, emptyText = "No ledger entries.", className }: LedgerEntriesProps) {
  if (!entries.length) {
    return <p className={cn("text-sm text-muted-foreground", className)}>{emptyText}</p>;
  }
  return (
    <ul className={cn("divide-y divide-border", className)}>
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm text-foreground">
              <EntityLink kind="wallet" id={entry.owner.id} label={entry.owner.name} />
              <span className="text-muted-foreground"> · {LEDGER_TYPE_LABELS[entry.type] ?? entry.type}</span>
            </p>
            <p className="num truncate text-xs text-muted-foreground" title={entry.reference}>
              {formatDateTime(entry.createdAt)} · {entry.reference}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm text-foreground">
              {entry.amount > 0 && <span className="num">+</span>}
              <Money value={entry.amount} />
            </p>
            <p className="text-xs text-muted-foreground">
              Balance <Money value={entry.balanceAfter} />
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
