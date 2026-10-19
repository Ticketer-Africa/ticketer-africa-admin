import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <PageHeader
      title="Analytics"
      description="Sales, revenue and growth over any date range, compared with the period before."
    />
  );
}
