"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarList } from "@/components/charts/bar-list";
import { ChartPanel, ChartTable } from "@/components/charts/chart-panel";
import { Donut } from "@/components/charts/donut";
import { Heatmap, hourRange, WEEKDAYS } from "@/components/charts/heatmap";
import { Metric } from "@/components/charts/metric";
import { partialNote, periodLabel, TimeseriesChart, type Partials } from "@/components/charts/timeseries-chart";
import { ANALYTICS_PRESETS, DateRangePicker, useAnalyticsRange } from "@/components/date-range-picker";
import { EntityLink } from "@/components/entity-link";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { statusMeta } from "@/components/status-badge";
import { Panel, PanelDescription, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { formatCount, formatNaira, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  autoGranularity,
  partialBuckets,
  rangeDays,
  useCategories,
  useFees,
  useHeatmap,
  useOverview,
  usePayoutStats,
  useTimeseries,
  useTopEvents,
  useTopOrganizers,
  type Granularity,
  type Metrics,
} from "@/services/v2/analytics";
import type { DateRange } from "@/lib/date-range";

const GRANULARITIES: Granularity[] = ["day", "week", "month"];
const PERIOD_NAME: Record<Granularity, string> = { day: "Day", week: "Week", month: "Month" };

/** `?granularity=` overrides the automatic choice; absent means auto. */
function useGranularity(range: DateRange) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const raw = searchParams.get("granularity");
  const override = GRANULARITIES.includes(raw as Granularity) ? (raw as Granularity) : null;

  const setChoice = useCallback(
    (value: Granularity | "auto") => {
      const search = new URLSearchParams(query);
      if (value === "auto") search.delete("granularity");
      else search.set("granularity", value);
      const qs = search.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [query, router, pathname],
  );

  const choice: Granularity | "auto" = override ?? "auto";
  return { granularity: override ?? autoGranularity(range), choice, setChoice };
}

export default function AnalyticsPage() {
  const { range, setRange } = useAnalyticsRange();
  const { granularity, choice, setChoice } = useGranularity(range);
  const days = rangeDays(range);
  const compareLabel = days === 1 ? "vs the day before" : `vs previous ${days} days`;
  const overview = useOverview(range);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Sales, revenue and growth for any date range, compared with the period before."
        actions={
          <>
            <DateRangePicker value={range} onChange={setRange} presets={ANALYTICS_PRESETS} />
            <Segmented
              aria-label="Group charts by"
              value={choice}
              onValueChange={setChoice}
              options={[
                { value: "auto", label: "Auto" },
                { value: "day", label: "Day" },
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
              ]}
            />
          </>
        }
      />

      {overview.isError && (
        <Panel className="mb-4">
          <ErrorState
            title="Couldn't load the figures for this range"
            error={overview.error}
            onRetry={() => overview.refetch()}
            retrying={overview.isFetching}
          />
        </Panel>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
        <SalesPanel range={range} granularity={granularity} compareLabel={compareLabel} overview={overview} className="md:col-span-2 lg:col-span-8" />
        <TicketsPanel range={range} granularity={granularity} className="md:col-span-2 lg:col-span-4" />
        <RevenuePanel range={range} granularity={granularity} compareLabel={compareLabel} overview={overview} className="md:col-span-2 lg:col-span-8" />
        <FeesPanel range={range} className="md:col-span-2 lg:col-span-4" />
        <FiguresPanel
          title="Resale"
          description="Tickets sold on by their buyers."
          className="lg:col-span-6"
          overview={overview}
          compareLabel={compareLabel}
          figures={[
            { key: "resaleVolume", label: "Resale volume", money: true },
            { key: "resaleCount", label: "Resales" },
            { key: "royalties", label: "Royalties to organizers", money: true },
          ]}
        />
        <FiguresPanel
          title="Growth"
          description="New people and events on the platform."
          className="lg:col-span-6"
          overview={overview}
          compareLabel={compareLabel}
          figures={[
            { key: "newUsers", label: "New users" },
            { key: "newOrganizers", label: "New organizers" },
            { key: "eventsCreated", label: "Events created" },
            { key: "eventsHeld", label: "Events taking place" },
          ]}
        />
        <PayoutsPanel range={range} className="md:col-span-2 lg:col-span-4" />
        <CategoriesPanel range={range} className="md:col-span-2 lg:col-span-8" />
        <TopEventsPanel range={range} className="md:col-span-2 lg:col-span-6" />
        <TopOrganizersPanel range={range} className="md:col-span-2 lg:col-span-6" />
        <HeatmapPanel range={range} className="md:col-span-2 lg:col-span-12" />
      </div>
    </>
  );
}

type OverviewQuery = ReturnType<typeof useOverview>;

interface Figure {
  key: keyof Metrics;
  label: string;
  money?: boolean;
  percent?: boolean;
  downIsGood?: boolean;
}

function show(figure: Figure, value: number | null | undefined) {
  if (figure.money) return formatNaira(value);
  if (figure.percent) return formatPercent(value);
  return formatCount(value);
}

/** A grid of figures with their change, used as a chart's summary or a panel of its own. */
function Figures({
  figures,
  overview,
  compareLabel,
  className,
}: {
  figures: Figure[];
  overview: OverviewQuery;
  compareLabel: string;
  className?: string;
}) {
  const current = overview.data?.current;
  const previous = overview.data?.previous;
  return (
    <div
      aria-busy={overview.isPlaceholderData || undefined}
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-5 p-4 transition-opacity duration-state",
        overview.isPlaceholderData && "opacity-60",
        className,
      )}
    >
      {figures.map((figure) => (
        <Metric
          key={figure.key}
          label={figure.label}
          value={show(figure, current?.[figure.key])}
          current={current?.[figure.key]}
          previous={previous?.[figure.key]}
          previousDisplay={show(figure, previous?.[figure.key])}
          compareLabel={compareLabel}
          downIsGood={figure.downIsGood}
          deltaKind={figure.percent ? "points" : "percent"}
          loading={overview.isPending}
        />
      ))}
    </div>
  );
}

function FiguresPanel({
  title,
  description,
  figures,
  overview,
  compareLabel,
  className,
}: {
  title: string;
  description: string;
  figures: Figure[];
  overview: OverviewQuery;
  compareLabel: string;
  className?: string;
}) {
  return (
    <Panel className={cn("min-w-0", className)}>
      <PanelHeader>
        <div className="min-w-0">
          <PanelTitle>{title}</PanelTitle>
          <PanelDescription className="mt-0.5">{description}</PanelDescription>
        </div>
      </PanelHeader>
      <Figures figures={figures} overview={overview} compareLabel={compareLabel} className="sm:grid-cols-2" />
    </Panel>
  );
}

interface RangeProps {
  range: DateRange;
  className?: string;
}

interface SeriesProps extends RangeProps {
  granularity: Granularity;
}

function partialsFor(points: { bucket: string }[], range: DateRange, granularity: Granularity): Partials {
  return partialBuckets(
    points.map((p) => p.bucket),
    range,
    granularity,
  );
}

function withNote(text: string, partials: Partials, granularity: Granularity): string {
  const note = partialNote(partials, granularity);
  return note ? `${text} ${note}` : text;
}

/* ─── Sales ─── */

function SalesPanel({
  range,
  granularity,
  compareLabel,
  overview,
  className,
}: SeriesProps & { compareLabel: string; overview: OverviewQuery }) {
  const query = useTimeseries(range, granularity);
  const points = query.data?.points ?? [];
  const partials = partialsFor(points, range, granularity);
  return (
    <ChartPanel
      className={className}
      title="Sales"
      description={withNote("Processed is everything buyers paid for tickets and resales, refunded or not.", partials, granularity)}
      summary={
        <Figures
          overview={overview}
          compareLabel={compareLabel}
          className="border-b border-border sm:grid-cols-3"
          figures={[
            { key: "processed", label: "Processed", money: true },
            { key: "ticketsSold", label: "Tickets sold" },
            { key: "orders", label: "Orders" },
            { key: "buyers", label: "Buyers" },
            { key: "averageOrderValue", label: "Average order", money: true },
            { key: "paymentSuccessRate", label: "Payment success rate", percent: true },
          ]}
        />
      }
      query={query}
      empty={points.every((p) => p.processed === 0)}
      emptyTitle="No sales in this range"
      table={
        <ChartTable
          caption="Processed by period"
          columns={[{ label: PERIOD_NAME[granularity] }, { label: "Processed", numeric: true }]}
          rows={points.map((p) => ({
            key: p.bucket,
            cells: [periodLabel(p.bucket, granularity, partials), formatNaira(p.processed)],
          }))}
        />
      }
      legend={[{ label: "Processed", color: "chart-1", shape: "block" }]}
    >
      <TimeseriesChart
        data={points}
        granularity={granularity}
        partials={partials}
        format="naira"
        series={[{ key: "processed", label: "Processed", color: "chart-1", kind: "area" }]}
      />
    </ChartPanel>
  );
}

function TicketsPanel({ range, granularity, className }: SeriesProps) {
  const query = useTimeseries(range, granularity);
  const points = query.data?.points ?? [];
  const partials = partialsFor(points, range, granularity);
  return (
    <ChartPanel
      className={className}
      title="Tickets and orders"
      description={withNote("One order can hold several tickets.", partials, granularity)}
      query={query}
      empty={points.every((p) => p.ticketsSold === 0 && p.orders === 0)}
      emptyTitle="No tickets sold in this range"
      height={280}
      legend={[
        { label: "Tickets sold", color: "chart-1", shape: "block" },
        { label: "Orders", color: "chart-2", shape: "line" },
      ]}
      table={
        <ChartTable
          caption="Tickets sold and orders by period"
          columns={[
            { label: PERIOD_NAME[granularity] },
            { label: "Tickets sold", numeric: true },
            { label: "Orders", numeric: true },
          ]}
          rows={points.map((p) => ({
            key: p.bucket,
            cells: [periodLabel(p.bucket, granularity, partials), formatCount(p.ticketsSold), formatCount(p.orders)],
          }))}
        />
      }
    >
      <TimeseriesChart
        data={points}
        granularity={granularity}
        partials={partials}
        format="count"
        height={280}
        series={[
          { key: "ticketsSold", label: "Tickets sold", color: "chart-1", kind: "bar" },
          { key: "orders", label: "Orders", color: "chart-2", kind: "line" },
        ]}
      />
    </ChartPanel>
  );
}

/* ─── Revenue and fees ─── */

function RevenuePanel({
  range,
  granularity,
  compareLabel,
  overview,
  className,
}: SeriesProps & { compareLabel: string; overview: OverviewQuery }) {
  const query = useTimeseries(range, granularity);
  const points = query.data?.points ?? [];
  const partials = partialsFor(points, range, granularity);
  return (
    <ChartPanel
      className={className}
      title="Revenue"
      description={withNote("Net revenue is platform fees kept after refund reversals.", partials, granularity)}
      summary={
        <Figures
          overview={overview}
          compareLabel={compareLabel}
          className="border-b border-border sm:grid-cols-3"
          figures={[
            { key: "netRevenue", label: "Net revenue", money: true },
            { key: "refunded", label: "Refunded to buyers", money: true, downIsGood: true },
          ]}
        />
      }
      query={query}
      empty={points.every((p) => p.netRevenue === 0 && p.refunded === 0)}
      emptyTitle="No revenue or refunds in this range"
      legend={[
        { label: "Net revenue", color: "chart-1", shape: "block" },
        { label: "Refunded", color: "chart-2", shape: "line" },
      ]}
      table={
        <ChartTable
          caption="Net revenue and refunds by period"
          columns={[
            { label: PERIOD_NAME[granularity] },
            { label: "Net revenue", numeric: true },
            { label: "Refunded", numeric: true },
          ]}
          rows={points.map((p) => ({
            key: p.bucket,
            cells: [periodLabel(p.bucket, granularity, partials), formatNaira(p.netRevenue), formatNaira(p.refunded)],
          }))}
        />
      }
    >
      <TimeseriesChart
        data={points}
        granularity={granularity}
        partials={partials}
        format="naira"
        series={[
          { key: "netRevenue", label: "Net revenue", color: "chart-1", kind: "area" },
          { key: "refunded", label: "Refunded", color: "chart-2", kind: "line" },
        ]}
      />
    </ChartPanel>
  );
}

function FeesPanel({ range, className }: RangeProps) {
  const query = useFees(range);
  const fees = query.data;
  const segments = [
    { key: "primaryFees", label: "Ticket sales", value: fees?.primaryFees ?? 0, color: "chart-1" },
    { key: "resaleFees", label: "Resales", value: fees?.resaleFees ?? 0, color: "chart-2" },
    { key: "withdrawalFees", label: "Withdrawals", value: fees?.withdrawalFees ?? 0, color: "chart-5" },
  ];
  return (
    <ChartPanel
      className={className}
      title="Fees"
      description="Platform fees earned, by where they came from."
      query={query}
      empty={(fees?.total ?? 0) === 0}
      emptyTitle="No fees in this range"
      height={176}
      table={
        <ChartTable
          caption="Fees by source"
          columns={[{ label: "Source" }, { label: "Fees", numeric: true }]}
          rows={[
            ...segments.map((s) => ({ key: s.key, cells: [s.label, formatNaira(s.value)] })),
            { key: "total", cells: ["Total", formatNaira(fees?.total)] },
          ]}
        />
      }
    >
      <Donut segments={segments} total={fees?.total} format={formatNaira} totalLabel="in fees" />
    </ChartPanel>
  );
}

/* ─── Payouts ─── */

function PayoutsPanel({ range, className }: RangeProps) {
  const query = usePayoutStats(range);
  const data = query.data;
  const rows = data?.byStatus ?? [];
  const label = (status: string) => statusMeta("payout", status).label;
  return (
    <ChartPanel
      className={className}
      title="Payouts"
      description="Payouts requested in this range, by where they are now."
      query={query}
      empty={rows.every((r) => r.count === 0)}
      emptyTitle="No payouts requested in this range"
      height={200}
      legend={[{ label: "Amount", color: "chart-2", shape: "block" }]}
      summary={
        data && (
          <div className="grid grid-cols-2 gap-4 border-b border-border p-4">
            <Metric size="sm" label="Paying out now" value={formatNaira(data.inFlight)} />
            <Metric size="sm" label="Owed to organizers" value={formatNaira(data.walletLiabilities)} />
          </div>
        )
      }
      table={
        <ChartTable
          caption="Payouts by status"
          columns={[{ label: "Status" }, { label: "Payouts", numeric: true }, { label: "Amount", numeric: true }]}
          rows={rows.map((r) => ({ key: r.status, cells: [label(r.status), formatCount(r.count), formatNaira(r.amount)] }))}
        />
      }
    >
      <BarList
        color="chart-2"
        rows={rows.map((r) => ({
          key: r.status,
          label: label(r.status),
          value: r.amount,
          display: formatNaira(r.amount),
          detail: `${formatCount(r.count)} ${r.count === 1 ? "payout" : "payouts"}`,
        }))}
      />
    </ChartPanel>
  );
}

/* ─── Top events and organizers ─── */

function TopEventsPanel(props: RangeProps) {
  return <TopPanel kind="event" query={useTopEvents(props.range, 10)} className={props.className} />;
}

function TopOrganizersPanel(props: RangeProps) {
  return <TopPanel kind="organizer" query={useTopOrganizers(props.range, 10)} className={props.className} />;
}

function TopPanel({
  kind,
  query,
  className,
}: {
  kind: "event" | "organizer";
  query: ReturnType<typeof useTopEvents>;
  className?: string;
}) {
  const items = query.data?.items ?? [];
  const noun = kind === "event" ? "Event" : "Organizer";
  return (
    <ChartPanel
      className={className}
      title={kind === "event" ? "Top events" : "Top organizers"}
      description="By processed sales in this range."
      query={query}
      empty={items.length === 0}
      emptyTitle={kind === "event" ? "No event sold tickets in this range" : "No organizer sold tickets in this range"}
      height={200}
      legend={[{ label: "Processed", color: "chart-1", shape: "block" }]}
      table={
        <ChartTable
          caption={`Top ${noun.toLowerCase()}s by processed sales`}
          columns={[
            { label: noun },
            { label: "Tickets", numeric: true },
            { label: "Orders", numeric: true },
            { label: "Processed", numeric: true },
          ]}
          rows={items.map((item) => ({
            key: item.id,
            cells: [
              <EntityLink key="name" kind={kind} id={item.id} label={item.name} className="max-w-[16rem]" />,
              formatCount(item.ticketsSold),
              formatCount(item.orders),
              formatNaira(item.processed),
            ],
          }))}
        />
      }
    >
      <BarList
        rows={items.map((item) => ({
          key: item.id,
          label: <EntityLink kind={kind} id={item.id} label={item.name} />,
          value: item.processed,
          display: formatNaira(item.processed),
          detail: `${formatCount(item.ticketsSold)} ${item.ticketsSold === 1 ? "ticket" : "tickets"}`,
        }))}
      />
    </ChartPanel>
  );
}

/* ─── Categories ─── */

const categoryName = (category: string) => category.charAt(0) + category.slice(1).toLowerCase();

function CategoriesPanel({ range, className }: RangeProps) {
  const query = useCategories(range);
  const items = query.data?.items ?? [];
  return (
    <ChartPanel
      className={className}
      title="Categories"
      description="Processed sales by event category."
      query={query}
      empty={items.length === 0}
      emptyTitle="No category had sales in this range"
      height={200}
      legend={[{ label: "Processed", color: "chart-1", shape: "block" }]}
      table={
        <ChartTable
          caption="Processed sales by category"
          columns={[
            { label: "Category" },
            { label: "Events", numeric: true },
            { label: "Tickets", numeric: true },
            { label: "Processed", numeric: true },
          ]}
          rows={items.map((item) => ({
            key: item.category,
            cells: [
              categoryName(item.category),
              formatCount(item.events),
              formatCount(item.ticketsSold),
              formatNaira(item.processed),
            ],
          }))}
        />
      }
    >
      <BarList
        columns
        rows={items.map((item) => ({
          key: item.category,
          label: categoryName(item.category),
          value: item.processed,
          display: formatNaira(item.processed),
          detail: `${formatCount(item.events)} ${item.events === 1 ? "event" : "events"}`,
        }))}
      />
    </ChartPanel>
  );
}

/* ─── When people buy ─── */

function HeatmapPanel({ range, className }: RangeProps) {
  const query = useHeatmap(range);
  const cells = query.data?.cells ?? [];
  const at = (weekday: number, hour: number) =>
    cells.find((c) => c.weekday === weekday && c.hour === hour)?.ticketsSold ?? 0;
  return (
    <ChartPanel
      className={className}
      title="When people buy"
      description="Tickets sold by day of the week and hour, Lagos time."
      query={query}
      empty={cells.every((c) => c.ticketsSold === 0)}
      emptyTitle="No tickets sold in this range"
      height={200}
      table={
        <ChartTable
          caption="Tickets sold by weekday and hour, Lagos time"
          columns={[
            { label: "Day" },
            ...Array.from({ length: 24 }, (_, hour) => ({ label: hourRange(hour).slice(0, 5), numeric: true })),
          ]}
          rows={WEEKDAYS.map((day, weekday) => ({
            key: day,
            cells: [day, ...Array.from({ length: 24 }, (_, hour) => formatCount(at(weekday, hour)))],
          }))}
        />
      }
    >
      <Heatmap cells={cells} />
    </ChartPanel>
  );
}

