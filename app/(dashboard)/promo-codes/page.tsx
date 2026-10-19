import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Promo codes" };

export default function PromoCodesPage() {
  return (
    <PageHeader
      title="Promo codes"
      description="Discount codes across all events, their limits and how often they've been used."
    />
  );
}
