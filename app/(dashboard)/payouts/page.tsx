import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Payouts" };

export default function PayoutsPage() {
  return (
    <PageHeader
      title="Payouts"
      description="Organizer withdrawals to their banks, their Korapay status and the payout switch."
    />
  );
}
