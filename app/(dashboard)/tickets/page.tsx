import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Tickets" };

export default function TicketsPage() {
  return (
    <PageHeader
      title="Tickets"
      description="Find any ticket by code, buyer or event; resend, void or undo a check-in."
    />
  );
}
