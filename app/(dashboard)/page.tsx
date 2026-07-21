"use client";

import { Users, Calendar, Ticket, Wallet } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatPrice } from "@/lib/helpers";
import {
  useAdminStats,
  useAdminRevenue,
  useAdminDailyRevenue,
  useAdminEventCategories,
  useAdminWalletsSummary,
  useAdminKoraBalance,
} from "@/services/admin/metrics.queries";
import { Skeleton } from "@/components/ui/skeleton";

const dailyChartConfig = {
  totalProcessed: { label: "Processed", color: "oklch(var(--chart-1))" },
  profit: { label: "Profit", color: "oklch(var(--chart-2))" },
};

const categoryColors = [
  "oklch(var(--chart-1))",
  "oklch(var(--chart-2))",
  "oklch(var(--chart-3))",
  "oklch(var(--chart-4))",
  "oklch(var(--chart-5))",
];

const ledgerRows = [
  {
    key: "totalProcessed" as const,
    label: "Total processed",
    description: "Successful purchase & resale volume, all time",
  },
  {
    key: "lifetimeProfit" as const,
    label: "Lifetime profit",
    description: "Platform's cut, recomputed per transaction's fee",
  },
  {
    key: "platformWalletBalance" as const,
    label: "Platform wallet balance",
    description: "Current available balance",
  },
];

const statStripItems = [
  { key: "users" as const, label: "Users", icon: Users, source: "stats" as const },
  { key: "events" as const, label: "Events", icon: Calendar, source: "stats" as const },
  { key: "tickets" as const, label: "Tickets sold", icon: Ticket, source: "stats" as const },
  {
    key: "totalOrganizerBalance" as const,
    label: "Organizer wallets",
    icon: Wallet,
    source: "wallets" as const,
  },
];

export default function OverviewPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: revenue, isLoading: revenueLoading } = useAdminRevenue();
  const { data: daily, isLoading: dailyLoading } = useAdminDailyRevenue();
  const { data: categories, isLoading: categoriesLoading } =
    useAdminEventCategories();
  const { data: wallets, isLoading: walletsLoading } = useAdminWalletsSummary();
  const {
    data: koraBalance,
    isLoading: koraLoading,
    isError: koraError,
  } = useAdminKoraBalance();

  const isLoading =
    statsLoading || revenueLoading || dailyLoading || walletsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          {ledgerRows.map((row) => (
            <div key={row.key} className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {row.label}
              </p>
              <p className="mt-2 font-mono text-2xl font-medium tabular-nums">
                {formatPrice(revenue?.[row.key] ?? 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {row.description}
              </p>
            </div>
          ))}
          <div className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Korapay balance (live)
            </p>
            {koraLoading ? (
              <Skeleton className="mt-2 h-8 w-32" />
            ) : koraError ? (
              <p className="mt-2 text-2xl font-medium text-muted-foreground">
                Unavailable
              </p>
            ) : (
              <p className="mt-2 font-mono text-2xl font-medium tabular-nums">
                {formatPrice(koraBalance?.NGN?.availableBalance ?? 0)}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {koraError
                ? "Could not reach Korapay"
                : `Pending: ${formatPrice(koraBalance?.NGN?.pendingBalance ?? 0)}`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap divide-x divide-border overflow-hidden rounded-xl border border-border bg-card">
        {statStripItems.map((item) => {
          const value =
            item.source === "stats"
              ? (stats?.[item.key as keyof typeof stats] ?? 0)
              : (wallets?.[item.key as keyof typeof wallets] ?? 0);
          const display =
            item.key === "totalOrganizerBalance"
              ? formatPrice(value)
              : String(value);
          return (
            <div
              key={item.key}
              className="flex min-w-[10rem] flex-1 items-center gap-3 px-5 py-3"
            >
              <item.icon className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-mono text-sm font-medium tabular-nums">
                  {display}
                </p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-medium">Daily processed & profit</h2>
          <ChartContainer config={dailyChartConfig} className="h-64 w-full">
            <LineChart data={daily ?? []}>
              <CartesianGrid vertical={false} stroke="oklch(var(--border))" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={40}
                tick={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="totalProcessed"
                stroke="var(--color-totalProcessed)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="var(--color-profit)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-medium">Events by category</h2>
          {categoriesLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <ChartContainer config={{}} className="h-64 w-full">
              <PieChart>
                <Pie
                  data={categories ?? []}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  strokeWidth={0}
                >
                  {(categories ?? []).map((_, index) => (
                    <Cell
                      key={index}
                      fill={categoryColors[index % categoryColors.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          )}
        </div>
      </div>
    </div>
  );
}
