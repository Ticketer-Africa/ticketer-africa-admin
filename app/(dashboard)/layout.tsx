import { cookies } from "next/headers";
import { AppShell } from "@/components/shell/app-shell";
import { SIDEBAR_COOKIE_NAME } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  return <AppShell defaultSidebarOpen={sidebarOpen}>{children}</AppShell>;
}
