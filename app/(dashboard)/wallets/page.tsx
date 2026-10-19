import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Wallets" };

export default function WalletsPage() {
  return (
    <PageHeader
      title="Wallets"
      description="Organizer wallet balances and every ledger entry behind them."
    />
  );
}
