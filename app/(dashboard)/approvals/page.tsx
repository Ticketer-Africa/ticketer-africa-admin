"use client";

import Link from "next/link";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { Pagination } from "@/components/data-table/pagination";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Panel } from "@/components/ui/panel";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import { defineListDefaults, useListParams } from "@/lib/list-params";
import { useMe } from "@/services/v2/me";
import { REQUEST_TYPE_LABELS } from "@/services/v2/request-labels";
import { useRequests } from "@/services/v2/requests";
import type { AdminRequestType } from "@/services/v2/types";

type Tab = "pending" | "decided" | "mine";
const TABS = ["pending", "decided", "mine"] as const;

// `tab` lives in the URL with the other list state but is never sent: each
// tab maps to its own API filter below.
const DEFAULTS = defineListDefaults({
  filters: { tab: undefined, type: undefined },
  sort: "createdAt",
  order: "desc",
});

const TYPE_OPTIONS = (Object.keys(REQUEST_TYPE_LABELS) as AdminRequestType[]).map((value) => ({
  value,
  label: REQUEST_TYPE_LABELS[value],
}));

export default function ApprovalsPage() {
  const { params, setFilter, setFilters, setPage } = useListParams(DEFAULTS);
  const tab: Tab = TABS.find((t) => t === params.tab) ?? "pending";
  const { data: me } = useMe();

  const { tab: _tab, ...listParams } = params;
  void _tab;
  const scope =
    tab === "pending"
      ? { status: "PENDING" }
      : tab === "decided"
        ? { decided: "true" }
        : { requestedById: me?.id };
  const query = useRequests({ ...listParams, ...scope }, { enabled: tab !== "mine" || Boolean(me) });

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
        onValueChange={(next) => setFilters({ tab: next === "pending" ? undefined : next })}
        options={[
          { value: "pending", label: "Waiting" },
          { value: "decided", label: "Decided" },
          { value: "mine", label: "Mine" },
        ]}
      />
      <FilterBar>
        <FilterSelect
          label="Type"
          anyLabel="Any type"
          value={params.type}
          onChange={(value) => setFilter("type", value)}
          options={TYPE_OPTIONS}
        />
      </FilterBar>
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
                      className="block text-sm font-medium text-foreground rounded-sm after:absolute after:inset-0 after:rounded-sm focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
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
          <Pagination
            page={query.data.page}
            pageSize={query.data.pageSize}
            total={query.data.total}
            onPage={setPage}
            noun="requests"
          />
        </Panel>
      )}
    </div>
  );
}
