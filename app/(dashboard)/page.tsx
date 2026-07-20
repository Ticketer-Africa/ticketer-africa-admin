"use client";

import { Users, Calendar, Ticket, Wallet, TrendingUp, Landmark } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { MetricCard } from "@/components/metric-card";
import { formatPrice } from "@/lib/helpers";
import {
  useAdminStats,
  useAdminRevenue,
  useAdminDailyRevenue,
  useAdminEventCategories,
  useAdminWalletsSummary,
} from "@/services/admin/metrics.queries";
import { Skeleton } from "@/components/ui/skeleton";

const dailyChartConfig = {
  totalProcessed: { label: "Processed", color: "hsl(var(--chart-1))" },
  profit: { label: "Profit", color: "hsl(var(--chart-2))" },
};

const categoryColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function OverviewPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: revenue, isLoading: revenueLoading } = useAdminRevenue();
  const { data: daily, isLoading: dailyLoading } = useAdminDailyRevenue();
  const { data: categories, isLoading: categoriesLoading } =
    useAdminEventCategories();
  const { data: wallets, isLoading: walletsLoading } = useAdminWalletsSummary();

  const isLoading = statsLoading || revenueLoading || dailyLoading || walletsLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total processed"
          value={formatPrice(revenue?.totalProcessed ?? 0)}
          icon={TrendingUp}
        />
        <MetricCard
          title="Lifetime profit"
          value={formatPrice(revenue?.lifetimeProfit ?? 0)}
          icon={Landmark}
          subtext="Recomputed from every transaction's fee"
        />
        <MetricCard
          title="Platform wallet balance"
          value={formatPrice(revenue?.platformWalletBalance ?? 0)}
          icon={Wallet}
          subtext="Current available balance"
        />
        <MetricCard
          title="Organizer wallet balance"
          value={formatPrice(wallets?.totalOrganizerBalance ?? 0)}
          icon={Wallet}
        />
        <MetricCard title="Users" value={String(stats?.users ?? 0)} icon={Users} />
        <MetricCard title="Events" value={String(stats?.events ?? 0)} icon={Calendar} />
        <MetricCard title="Tickets sold" value={String(stats?.tickets ?? 0)} icon={Ticket} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border p-4">
          <h2 className="mb-4 text-sm font-medium">Daily processed & profit</h2>
          <ChartContainer config={dailyChartConfig} className="h-64 w-full">
            <LineChart data={daily ?? []}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={40} />
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

        <div className="rounded-2xl border p-4">
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
