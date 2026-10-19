import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Team & settings" };

export default function SettingsPage() {
  return (
    <PageHeader
      title="Team & settings"
      description="Admins and their roles, the payout switch and the Korapay connection."
    />
  );
}
