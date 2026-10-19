import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Audit log" };

export default function AuditPage() {
  return (
    <PageHeader
      title="Audit log"
      description="Every admin action: who did it, when, why, and what changed."
    />
  );
}
