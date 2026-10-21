"use client";

import { EntityLink } from "@/components/entity-link";
import { ErrorState } from "@/components/error-state";
import { KeyValues } from "@/components/key-values";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { PayoutPauseControl } from "@/components/payout-pause-control";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { useHealth } from "@/services/v2/health";
import { useMe } from "@/services/v2/me";
import { useTeam } from "@/services/v2/team";

export default function SettingsPage() {
  const { data: me } = useMe();
  const team = useTeam();
  const health = useHealth();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team & settings"
        description="Who can use the admin console, the payout switch, and the Korapay connection."
      />

      <Panel>
        <PanelHeader>
          <PanelTitle>Admins</PanelTitle>
        </PanelHeader>
        {team.isPending ? (
          <div className="space-y-2 p-4" aria-busy="true">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : team.isError ? (
          <ErrorState title="Couldn't load the team" error={team.error} onRetry={() => void team.refetch()} />
        ) : (
          <ul className="divide-y divide-border">
            {team.data.map((admin) => (
              <li key={admin.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <EntityLink kind="user" id={admin.id} label={admin.name} className="text-sm" />
                  {admin.id === me?.id && <span className="text-xs text-muted-foreground"> (you)</span>}
                  <p className="num truncate text-xs text-muted-foreground">{admin.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant={admin.role === "SUPERADMIN" ? "info" : "neutral"}>
                    {admin.role === "SUPERADMIN" ? "Superadmin" : "Admin"}
                  </Badge>
                  <span className="num hidden text-xs text-muted-foreground sm:inline">since {formatDate(admin.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          To add or remove an admin, open the person&apos;s page and use Role. Admin role changes need a second
          superadmin.
        </p>
      </Panel>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-foreground">Payouts</h2>
        <PayoutPauseControl />
      </section>

      <Panel>
        <PanelHeader>
          <PanelTitle>Korapay</PanelTitle>
        </PanelHeader>
        <div className="p-4">
          {health.isPending ? (
            <Skeleton className="h-10 w-full" />
          ) : health.isError ? (
            <ErrorState title="Couldn't check Korapay" error={health.error} onRetry={() => void health.refetch()} />
          ) : (
            <KeyValues
              items={[
                {
                  label: "Connection",
                  value:
                    health.data.korapay.available === null ? (
                      <Badge variant="destructive" dot>
                        Couldn&apos;t reach Korapay
                      </Badge>
                    ) : (
                      <Badge variant="success" dot>
                        Connected
                      </Badge>
                    ),
                },
                {
                  label: "Available balance",
                  value: <Money value={health.data.korapay.available ?? 0} />,
                  hidden: health.data.korapay.available === null,
                },
                {
                  label: "Settling",
                  value: <Money value={health.data.korapay.pending ?? 0} />,
                  hidden: health.data.korapay.pending === null,
                },
                { label: "Organizers are owed", value: <Money value={health.data.liabilities} /> },
              ]}
            />
          )}
        </div>
      </Panel>
    </div>
  );
}
