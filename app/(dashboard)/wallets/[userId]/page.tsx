"use client";

import { useId, useState } from "react";
import { useParams } from "next/navigation";
import { ActionSheet } from "@/components/actions/action-sheet";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { DateRangePicker } from "@/components/date-range-picker";
import { DetailHeader } from "@/components/detail-header";
import { EntityLink } from "@/components/entity-link";
import { ErrorState } from "@/components/error-state";
import { KeyValues } from "@/components/key-values";
import { LEDGER_TYPE_LABELS } from "@/components/ledger-entries";
import { Money } from "@/components/money";
import { RecordActivity } from "@/components/record-activity";
import { RequestBanner } from "@/components/request-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatNaira } from "@/lib/format";
import { defineListDefaults, useListParams } from "@/lib/list-params";
import { cn } from "@/lib/utils";
import { auditKey } from "@/services/v2/audit";
import { useMe } from "@/services/v2/me";
import { createAndMaybeSelfApprove } from "@/services/v2/requests";
import { usersKey, useUser } from "@/services/v2/users";
import { useWalletLedger, walletsKey, type WalletLedgerRow } from "@/services/v2/wallets";

const DEFAULTS = defineListDefaults({
  filters: { type: undefined, from: undefined, to: undefined },
  sort: "createdAt",
  order: "desc",
});

const TYPE_OPTIONS = Object.entries(LEDGER_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const MAX_ADJUSTMENT = 10_000_000;

const columns: ColumnDef<WalletLedgerRow, unknown>[] = [
  {
    id: "type",
    header: "Entry",
    cell: ({ row }) => (
      <div className="min-w-0">
        <span className="block text-foreground">{LEDGER_TYPE_LABELS[row.original.type] ?? row.original.type}</span>
        {row.original.link ? (
          <EntityLink
            kind={row.original.link.kind}
            id={row.original.link.id}
            label={row.original.reference}
            mono
            className="text-xs"
          />
        ) : (
          <span className="num block truncate text-xs text-muted-foreground">{row.original.reference}</span>
        )}
      </div>
    ),
  },
  {
    id: "createdAt",
    header: "When",
    meta: { sortKey: "createdAt", hideBelow: "lg" },
    cell: ({ row }) => (
      <span className="num whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
    ),
  },
  {
    id: "amount",
    header: "Amount",
    meta: { align: "right" },
    cell: ({ row }) => (
      <span className={cn("num whitespace-nowrap", row.original.amount < 0 ? "text-destructive" : "text-success")}>
        {row.original.amount > 0 ? "+" : ""}
        {formatNaira(row.original.amount)}
      </span>
    ),
  },
  {
    id: "balanceAfter",
    header: "Balance after",
    meta: { align: "right", hideBelow: "lg" },
    cell: ({ row }) => <Money value={row.original.balanceAfter} className="text-muted-foreground" />,
  },
];

export default function WalletDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const user = useUser(userId);
  const { params, setFilter, setFilters, setSort, setPage, reset, activeFilterCount } = useListParams(DEFAULTS);
  const ledger = useWalletLedger(userId, params);

  if (user.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }
  if (user.isError) {
    return (
      <ErrorState
        title="Couldn't load this wallet"
        error={user.error}
        onRetry={() => void user.refetch()}
        retrying={user.isRefetching}
      />
    );
  }

  const owner = user.data;
  const balance = owner.wallet?.balance ?? 0;
  return (
    <div>
      <DetailHeader
        backHref="/wallets"
        backLabel="Wallets"
        title={owner.name}
        subtitle={<span className="num">{owner.email}</span>}
        facts={[
          { label: "Balance", value: <Money value={balance} /> },
          {
            label: "Account",
            value: (
              <EntityLink
                kind={owner.role === "ORGANIZER" ? "organizer" : "user"}
                id={owner.id}
                label={owner.role === "ORGANIZER" ? "Organizer page" : "User page"}
              />
            ),
          },
          { label: "Last change", value: <span className="num">{formatDateTime(owner.wallet?.updatedAt ?? null)}</span> },
        ]}
        actions={owner.wallet ? <AdjustWallet userId={owner.id} name={owner.name} balance={balance} /> : null}
      />

      <RequestBanner targetType="wallet" targetId={owner.id} />

      <FilterBar activeCount={activeFilterCount} onClear={reset}>
        <FilterSelect
          label="Entry"
          anyLabel="Any entry"
          value={params.type}
          onChange={(type) => setFilter("type", type)}
          options={TYPE_OPTIONS}
        />
        <DateRangePicker
          label="When"
          value={{ from: params.from, to: params.to }}
          onChange={(range) => setFilters({ from: range.from, to: range.to })}
        />
      </FilterBar>

      <DataTable
        label="Ledger"
        noun="entries"
        columns={columns}
        query={ledger}
        params={params}
        onSort={setSort}
        onPage={setPage}
        mobileRow={(entry) => (
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground">{LEDGER_TYPE_LABELS[entry.type] ?? entry.type}</span>
              <span className={cn("num text-sm", entry.amount < 0 ? "text-destructive" : "text-success")}>
                {entry.amount > 0 ? "+" : ""}
                {formatNaira(entry.amount)}
              </span>
            </div>
            <p className="num truncate text-xs text-muted-foreground">
              {formatDateTime(entry.createdAt)} · balance {formatNaira(entry.balanceAfter)}
            </p>
          </div>
        )}
        errorTitle="Couldn't load the ledger"
        emptyTitle={activeFilterCount ? "No entries match" : "No entries yet"}
        emptyHint={activeFilterCount ? "Try another entry type or a wider date range." : "Sales, withdrawals and adjustments show up here."}
      />

      <div className="mt-5">
        <RecordActivity targetType="wallet" targetId={owner.id} />
      </div>
    </div>
  );
}

function AdjustWallet({ userId, name, balance }: { userId: string; name: string; balance: number }) {
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [amountText, setAmountText] = useState("");
  const [memo, setMemo] = useState("");
  const ids = { amount: useId(), memo: useId() };

  const amount = /^\d+(\.\d{1,2})?$/.test(amountText.trim()) ? Number(amountText.trim()) : null;
  const amountError =
    amountText.trim() === ""
      ? null
      : amount === null || amount <= 0
        ? "Enter an amount in naira, up to two decimals."
        : amount > MAX_ADJUSTMENT
          ? `At most ${formatNaira(MAX_ADJUSTMENT)}.`
          : direction === "DEBIT" && amount > balance
            ? "That's more than the wallet holds."
            : null;
  const memoOk = memo.trim().length >= 3 && memo.trim().length <= 200;
  const valid = amount !== null && amount > 0 && !amountError && memoOk;
  const after = amount === null ? balance : direction === "CREDIT" ? balance + amount : balance - amount;

  function onOpenChange(next: boolean) {
    if (next) {
      setDirection("CREDIT");
      setAmountText("");
      setMemo("");
    }
    setOpen(next);
  }

  return (
    <>
      <Button key="adjust-button" variant="secondary" onClick={() => onOpenChange(true)}>
        Adjust wallet
      </Button>
      <ActionSheet
        key="adjust"
        tier={3}
        open={open}
        onOpenChange={onOpenChange}
        available
        title={`Adjust ${name}'s wallet`}
        description="Adds an adjustment entry to the ledger. The balance is never set directly, so the history always adds up."
        selfApprove={Boolean(me?.canApprove)}
        successMessage="Adjustment requested"
        invalidate={[walletsKey, usersKey, auditKey]}
        canSubmit={valid}
        summary={
          <KeyValues
            columns={1}
            items={[
              { label: "Balance now", value: <Money value={balance} /> },
              {
                label: direction === "CREDIT" ? "Credit" : "Debit",
                value: amount ? <Money value={direction === "CREDIT" ? amount : -amount} /> : "—",
              },
              { label: "Balance after", value: <Money value={after} /> },
            ]}
          />
        }
        onSubmit={(reason, extra) =>
          createAndMaybeSelfApprove(
            {
              type: "WALLET_ADJUSTMENT",
              targetId: userId,
              payload: { direction, amount, memo: memo.trim() },
              reason,
            },
            extra,
          )
        }
      >
        <div className="space-y-4">
          <Segmented<"CREDIT" | "DEBIT">
            aria-label="Credit or debit"
            block
            value={direction}
            onValueChange={setDirection}
            options={[
              { value: "CREDIT", label: "Credit (add money)" },
              { value: "DEBIT", label: "Debit (take money)" },
            ]}
          />
          <div className="space-y-1.5">
            <Label htmlFor={ids.amount}>Amount (₦)</Label>
            <Input
              id={ids.amount}
              inputMode="decimal"
              autoComplete="off"
              className="num"
              value={amountText}
              aria-invalid={Boolean(amountError) || undefined}
              aria-describedby={`${ids.amount}-hint`}
              onChange={(e) => setAmountText(e.target.value)}
            />
            <p id={`${ids.amount}-hint`} className={amountError ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
              {amountError ?? "In naira, up to two decimals."}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={ids.memo}>Memo</Label>
            <Textarea
              id={ids.memo}
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              aria-describedby={`${ids.memo}-hint`}
            />
            <p id={`${ids.memo}-hint`} className="text-xs text-muted-foreground">
              Shown on the ledger entry and the request (3 to 200 characters).
            </p>
          </div>
        </div>
      </ActionSheet>
    </>
  );
}
