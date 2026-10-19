import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Refunds" };

export default function RefundsPage() {
  return (
    <PageHeader
      title="Refunds"
      description="Refund requests and completed refunds, with who asked and who approved."
    />
  );
}
