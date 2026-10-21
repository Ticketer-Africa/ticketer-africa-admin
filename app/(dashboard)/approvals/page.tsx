"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Panel } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import { useMe } from "@/services/v2/me";
import { REQUEST_TYPE_LABELS } from "@/services/v2/request-labels";
import { useRequests } from "@/services/v2/requests";

type Tab = "pending" | "decided" | "mine";

export default function ApprovalsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const tab: Tab = (["pending", "decided", "mine"] as const).find((t) => t === search.get("tab")) ?? "pending";
  const { data: me } = useMe();

  const params =
    tab === "pending"
      ? { status: "PENDING", pageSize: 50 }
      : tab === "decided"
        ? { decided: "true", pageSize: 50 }
        : { requestedById: me?.id, pageSize: 50 };
  const query = useRequests(params, { enabled: tab !== "mine" || Boolean(me) });

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Money moves and admin role changes need a second superadmin. Anything waiting on a decision is here."
      />
      <Segmented<Tab>
        aria-label="Which requests"
        className="mb-4"
        value={tab}
        onValueChange={(next) => router.replace(next === "pending" ? pathname : `${pathname}?tab=${next}`)}
        options={[
          { value: "pending", label: "Waiting" },
          { value: "decided", label: "Decided" },
          { value: "mine", label: "Mine" },
        ]}
      />
      {query.isPending || (tab === "mine" && !me) ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState
          title="Couldn't load requests"
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isRefetching}
        />
      ) : query.data.items.length === 0 ? (
        <Panel>
          <EmptyState
            title={tab === "pending" ? "Nothing waiting" : tab === "decided" ? "No decisions yet" : "You haven't asked for anything"}
            hint={
              tab === "pending"
                ? "Refunds, wallet adjustments, payout changes and admin role changes show up here until someone decides."
                : "Requests show up here once they're made."
            }
          />
        </Panel>
      ) : (
        <Panel>
          <ul className="divide-y divide-border">
            {query.data.items.map((request) => (
              <li key={request.id} className="relative px-4 py-3 hover:bg-muted/50">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 space-y-1">
                    <Link
                      href={`/approvals/${request.id}`}
                      className="block text-sm font-medium text-foreground after:absolute after:inset-0 focus-visible:outline-none"
                    >
                      {request.summary}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {REQUEST_TYPE_LABELS[request.type]} · asked by {request.requestedBy?.name ?? "someone"}{" "}
                      <span className="num">{formatRelative(request.createdAt)}</span>
                      {request.decidedBy && (
                        <>
                          {" "}· {request.selfApproved ? "approved by themselves" : `decided by ${request.decidedBy.name}`}
                        </>
                      )}
                    </p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">“{request.requestReason}”</p>
                  </div>
                  <StatusBadge kind="request" value={request.status} className="self-start" />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
