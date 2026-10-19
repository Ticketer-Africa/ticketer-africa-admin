import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Approvals" };

export default function ApprovalsPage() {
  return (
    <PageHeader
      title="Approvals"
      description="Actions waiting for a second founder, and everything decided before."
    />
  );
}
