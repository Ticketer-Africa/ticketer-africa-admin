"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  AlertDiamondIcon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { ActivityFeed } from "@/components/activity-feed";
import { BarList } from "@/components/charts/bar-list";
import { ChartPanel, ChartTable } from "@/components/charts/chart-panel";
import { Metric } from "@/components/charts/metric";
import { bucketLabel, TimeseriesChart } from "@/components/charts/timeseries-chart";
import { ANALYTICS_PRESETS, DateRangePicker, useAnalyticsRange } from "@/components/date-range-picker";
import { EntityLink } from "@/components/entity-link";
import { ErrorState } from "@/components/error-state";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount, formatDateTime, formatNaira, formatPercent, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { autoGranularity, rangeDays, useOverview, useTimeseries } from "@/services/v2/analytics";
import { useRecentActivity } from "@/services/v2/audit";
import { useHealth, type HealthItem, type HealthSeverity } from "@/services/v2/health";
import { useRecentTransactions } from "@/services/v2/transactions";

export default function OverviewPage() {
  const { range, setRange } = useAnalyticsRange();
  const days = rangeDays(range);
  const compareLabel = days === 1 ? "vs the day before" : `vs previous ${days} days`;

  return (
    <>
      <PageHeader
        title="Overview"
        description="How sales are going, and anything that needs you right now."
        actions={<DateRangePicker value={range} onChange={setRange} presets={ANALYTICS_PRESETS} />}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
        <NeedsAttention className="lg:col-span-4 lg:col-start-9 lg:row-start-1" />
        <MoneyCover className="lg:col-span-4 lg:col-start-9 lg:row-start-2" />
        <Performance
          range={range}
          compareLabel={compareLabel}
          className="md:col-span-2 lg:col-span-8 lg:col-start-1 lg:row-span-2 lg:row-start-1"
        />
        <RecentTransactions className="md:col-span-2 lg:col-span-7" />
        <RecentActivity className="md:col-span-2 lg:col-span-5" />
      </div>
    </>
  );
}

/* ─── Performance: headline figures and processed vs net revenue ─── */

function Performance({
  range,
  compareLabel,
  className,
}: {
  range: { from?: string; to?: string };
  compareLabel: string;
  className?: string;
}) {
  const granularity = autoGranularity(range);
  const overview = useOverview(range);
  const timeseries = useTimeseries(range, granularity);
  const current = overview.data?.current;
  const previous = overview.data?.previous;
  const points = timeseries.data?.points ?? [];
  const loading = overview.isPending;

  const summary = (
    <div className="border-b border-border">
      {overview.isError ? (
        <ErrorState
          title="Couldn't load the figures"
          error={overview.error}
          onRetry={() => overview.refetch()}
          retrying={overview.isFetching}
          className="py-6"
        />
      ) : (
        <div
          aria-busy={overview.isPlaceholderData || undefined}
          className={cn(
            "grid grid-cols-2 gap-x-4 gap-y-5 p-4 transition-opacity duration-state xl:grid-cols-4 xl:gap-0 xl:divide-x xl:divide-border xl:px-0",
            overview.isPlaceholderData && "opacity-60",
          )}
        >
          <div className="xl:px-4">
            <Metric
              label="Processed"
              value={formatNaira(current?.processed)}
              current={current?.processed}
              previous={previous?.processed}
              previousDisplay={formatNaira(previous?.processed)}
              compareLabel={compareLabel}
              loading={loading}
            />
          </div>
          <div className="xl:px-4">
            <Metric
              label="Net revenue"
              value={formatNaira(current?.netRevenue)}
              current={current?.netRevenue}
              previous={previous?.netRevenue}
              previousDisplay={formatNaira(previous?.netRevenue)}
              compareLabel={compareLabel}
              loading={loading}
            />
          </div>
          <div className="xl:px-4">
            <Metric
              label="Tickets sold"
              value={formatCount(current?.ticketsSold)}
              current={current?.ticketsSold}
              previous={previous?.ticketsSold}
              previousDisplay={formatCount(previous?.ticketsSold)}
              compareLabel={compareLabel}
              loading={loading}
            />
          </div>
          <div className="xl:px-4">
            <Metric
              label="Payment success rate"
              value={formatPercent(current?.paymentSuccessRate)}
              current={current?.paymentSuccessRate}
              previous={previous?.paymentSuccessRate}
              previousDisplay={formatPercent(previous?.paymentSuccessRate)}
              compareLabel={compareLabel}
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ChartPanel
      className={className}
      title="Sales"
      description="Processed is what buyers paid; net revenue is what Ticketer Africa kept."
      summary={summary}
      query={timeseries}
      empty={points.length > 0 && points.every((p) => p.processed === 0 && p.netRevenue === 0)}
      emptyTitle="No sales in this range"
      height={260}
      legend={[
        { label: "Processed", color: "chart-1", shape: "block" },
        { label: "Net revenue", color: "chart-2", shape: "line" },
      ]}
      table={
        <ChartTable
          caption="Processed and net revenue by period"
          columns={[
            { label: granularity === "day" ? "Day" : granularity === "week" ? "Week" : "Month" },
            { label: "Processed", numeric: true },
            { label: "Net revenue", numeric: true },
          ]}
          rows={points.map((p) => ({
            key: p.bucket,
            cells: [bucketLabel(p.bucket, granularity, true), formatNaira(p.processed), formatNaira(p.netRevenue)],
          }))}
        />
      }
    >
      <TimeseriesChart
        data={points}
        granularity={granularity}
        format="naira"
        height={260}
        fill
        series={[
          { key: "processed", label: "Processed", color: "chart-1", kind: "area" },
          { key: "netRevenue", label: "Net revenue", color: "chart-2", kind: "line" },
        ]}
      />
    </ChartPanel>
  );
}

/* ─── Needs attention (GET /health) ─── */

const SEVERITY: Record<HealthSeverity, { icon: typeof Alert02Icon; label: string; className: string }> = {
  critical: { icon: AlertDiamondIcon, label: "Critical", className: "text-destructive" },
  warning: { icon: Alert02Icon, label: "Warning", className: "text-warning" },
  info: { icon: InformationCircleIcon, label: "Note", className: "text-info" },
};

const AMOUNT_SUFFIX = /\s*\(-?₦[\d,.]+\)$/;

/**
 * Most labels end with "(₦…)"; that amount moves to its own line in mono.
 * Labels that say the amount mid-sentence keep it there.
 */
function splitLabel(item: HealthItem): { text: string; amount?: number } {
  if (item.amount !== undefined && AMOUNT_SUFFIX.test(item.label)) {
    return { text: item.label.replace(AMOUNT_SUFFIX, ""), amount: item.amount };
  }
  return { text: item.label };
}

function NeedsAttention({ className }: { className?: string }) {
  const health = useHealth();
  const items = health.data?.items ?? [];

  return (
    <Panel className={cn("flex flex-col", className)}>
      <PanelHeader>
        <div className="min-w-0">
          <PanelTitle>Needs attention</PanelTitle>
          <PanelDescription className="mt-0.5">
            {health.dataUpdatedAt
              ? `Checked ${formatDateTime(health.dataUpdatedAt).split(", ")[1]}, every minute`
              : "Checked every minute"}
          </PanelDescription>
        </div>
      </PanelHeader>
      {health.isPending ? (
        <ul aria-label="Loading checks" className="grid gap-3 p-4">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-3">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </li>
          ))}
        </ul>
      ) : health.isError ? (
        <ErrorState
          title="Couldn't run the checks"
          error={health.error}
          onRetry={() => health.refetch()}
          retrying={health.isFetching}
          className="py-8"
        />
      ) : items.length === 0 ? (
        <div className="flex flex-1 items-center gap-3 p-4">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" className="size-5 shrink-0 text-success" />
          <div>
            <p className="text-sm font-medium text-foreground">All clear</p>
            <p className="text-sm text-muted-foreground">No stuck payments, payouts or refunds, and wallets match the ledger.</p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const severity = SEVERITY[item.severity];
            const { text, amount } = splitLabel(item);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="group flex items-start gap-3 px-4 py-3 text-sm transition-colors duration-state hover:bg-accent focus-visible:-outline-offset-2"
                >
                  <HugeiconsIcon
                    icon={severity.icon}
                    aria-hidden="true"
                    className={cn("mt-0.5 size-4 shrink-0", severity.className)}
                  />
                  <span className="min-w-0 flex-1 text-foreground">
                    <span className="sr-only">{severity.label}: </span>
                    {text}
                    {amount !== undefined && (
                      <Money value={amount} className="mt-0.5 block text-xs text-muted-foreground" />
                    )}
                  </span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors duration-state group-hover:text-foreground"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/* ─── Korapay balance against what organizers are owed ─── */

function MoneyCover({ className }: { className?: string }) {
  const health = useHealth();
  const data = health.data;
  const available = data?.korapay.available ?? null;
  const pending = data?.korapay.pending ?? null;
  const owed = data?.liabilities ?? 0;
  const gap = available !== null ? available - owed : null;

  return (
    <Panel className={cn("flex flex-col", className)}>
      <PanelHeader>
        <div className="min-w-0">
          <PanelTitle>Korapay and wallets</PanelTitle>
          <PanelDescription className="mt-0.5">Can we pay every organizer what they&rsquo;re owed today?</PanelDescription>
        </div>
      </PanelHeader>
      <PanelContent className="grid gap-4">
        {health.isPending ? (
          <div className="grid gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : health.isError ? (
          <ErrorState
            title="Couldn't load balances"
            error={health.error}
            onRetry={() => health.refetch()}
            retrying={health.isFetching}
            className="py-4"
          />
        ) : available === null ? (
          <>
            <p className="flex items-start gap-2 text-sm text-foreground">
              <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
              <span>
                <span className="font-medium">Couldn&rsquo;t reach Korapay</span>, so we can&rsquo;t compare right now.
                Organizers are owed <Money value={owed} className="font-medium" />.
              </span>
            </p>
          </>
        ) : (
          <>
            <p className="text-base text-foreground">
              Korapay holds <Money value={available} className="font-semibold" />; organizers are owed{" "}
              <Money value={owed} className="font-semibold" />.
            </p>
            {gap !== null && gap >= 0 ? (
              <p className="flex items-start gap-2 text-sm text-foreground">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
                <span>
                  Covered, with <Money value={gap} /> to spare.
                </span>
              </p>
            ) : (
              <p className="flex items-start gap-2 text-sm text-foreground">
                <HugeiconsIcon icon={AlertDiamondIcon} aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
                <span>
                  <span className="font-medium">Short by <Money value={Math.abs(gap ?? 0)} /></span>. Not every organizer
                  could be paid out at once.
                </span>
              </p>
            )}
            <BarList
              color="chart-2"
              rows={[
                { key: "korapay", label: "Available at Korapay", value: available, display: formatNaira(available) },
                { key: "owed", label: "Owed to organizers", value: owed, display: formatNaira(owed) },
              ]}
            />
            {pending !== null && pending > 0 && (
              <p className="text-xs text-muted-foreground">
                Another <Money value={pending} /> is waiting to settle at Korapay.
              </p>
            )}
          </>
        )}
      </PanelContent>
    </Panel>
  );
}

/* ─── Latest transactions and admin activity ─── */

function RecentTransactions({ className }: { className?: string }) {
  const query = useRecentTransactions(8);
  const rows = query.data?.items ?? [];

  return (
    <Panel className={cn("flex min-w-0 flex-col", className)}>
      <PanelHeader>
        <PanelTitle>Latest transactions</PanelTitle>
        <SeeAll href="/transactions">All transactions</SeeAll>
      </PanelHeader>
      {query.isPending ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="Couldn't load transactions"
          error={query.error}
          onRetry={() => query.refetch()}
          retrying={query.isFetching}
          className="py-8"
        />
      ) : rows.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">No transactions yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((txn) => (
            <li
              key={txn.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
            >
              <div className="min-w-0">
                <EntityLink kind="transaction" id={txn.id} label={txn.reference} mono className="text-sm" />
                <p className="truncate text-xs text-muted-foreground">
                  {txn.event?.name ?? (txn.type === "WITHDRAW" ? "Withdrawal" : txn.type === "FUND" ? "Wallet top-up" : "—")}
                  {" · "}
                  {txn.user.name}
                  {txn.type === "RESALE" && " · Resale"}
                </p>
              </div>
              <div className="row-span-2 hidden sm:block">
                <StatusBadge kind="transaction" value={txn.status} />
              </div>
              <div className="text-right">
                <Money value={txn.amount} className="text-sm text-foreground" />
                <p className="text-xs text-muted-foreground">
                  <time dateTime={txn.createdAt} title={formatDateTime(txn.createdAt)}>
                    {formatRelative(txn.createdAt)}
                  </time>
                </p>
              </div>
              <div className="col-span-2 sm:hidden">
                <StatusBadge kind="transaction" value={txn.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function RecentActivity({ className }: { className?: string }) {
  const query = useRecentActivity(8);

  return (
    <Panel className={cn("flex min-w-0 flex-col", className)}>
      <PanelHeader>
        <PanelTitle>Admin activity</PanelTitle>
        <SeeAll href="/audit">Audit log</SeeAll>
      </PanelHeader>
      {query.isPending ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="Couldn't load admin activity"
          error={query.error}
          onRetry={() => query.refetch()}
          retrying={query.isFetching}
          className="py-8"
        />
      ) : (
        <PanelContent>
          <ActivityFeed entries={query.data.items} showTarget emptyText="No admin actions yet." />
        </PanelContent>
      )}
    </Panel>
  );
}

function SeeAll({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground transition-colors duration-state hover:text-foreground"
    >
      {children}
      <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" className="size-4" />
    </Link>
  );
}

function ListSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-4 p-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
