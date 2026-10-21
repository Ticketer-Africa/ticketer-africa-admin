"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ActivityFeed, actionLabel, AUDIT_ACTIONS } from "@/components/activity-feed";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { Pagination } from "@/components/data-table/pagination";
import { DateRangePicker } from "@/components/date-range-picker";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { defineListDefaults, useListParams } from "@/lib/list-params";
import { auditKey } from "@/services/v2/audit";
import { adminGet } from "@/services/v2/client";
import { useTeam } from "@/services/v2/team";
import type { AuditEntry, Paged } from "@/services/v2/types";

const DEFAULTS = defineListDefaults({
  filters: { actorId: undefined, action: undefined, targetType: undefined, from: undefined, to: undefined },
  sort: "createdAt",
  order: "desc",
});

const TARGET_OPTIONS = [
  { value: "transaction", label: "Payments" },
  { value: "refund", label: "Refunds" },
  { value: "event", label: "Events" },
  { value: "user", label: "People" },
  { value: "ticket", label: "Tickets" },
  { value: "payout", label: "Payouts" },
  { value: "payout_destination", label: "Bank details" },
  { value: "wallet", label: "Wallets" },
  { value: "discount", label: "Promo codes" },
  { value: "request", label: "Approvals" },
  { value: "platform", label: "Platform" },
];

const ACTION_OPTIONS = AUDIT_ACTIONS.map((action) => {
  const label = actionLabel(action);
  return { value: action, label: label.charAt(0).toUpperCase() + label.slice(1) };
});

export default function AuditPage() {
  const { params, setFilter, setFilters, setPage, reset, activeFilterCount } = useListParams(DEFAULTS);
  const team = useTeam();
  const query = useQuery({
    queryKey: [...auditKey, "list", params],
    queryFn: () => adminGet<Paged<AuditEntry>>("/audit", params),
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Everything an admin has done, who did it, why, and what changed."
      />
      <FilterBar activeCount={activeFilterCount} onClear={reset}>
        <FilterSelect
          label="Who"
          anyLabel="Any admin"
          value={params.actorId}
          onChange={(actorId) => setFilter("actorId", actorId)}
          options={(team.data ?? []).map((admin) => ({ value: admin.id, label: admin.name }))}
        />
        <FilterSelect
          label="Action"
          anyLabel="Any action"
          value={params.action}
          onChange={(action) => setFilter("action", action)}
          options={ACTION_OPTIONS}
        />
        <FilterSelect
          label="On"
          anyLabel="Anything"
          value={params.targetType}
          onChange={(targetType) => setFilter("targetType", targetType)}
          options={TARGET_OPTIONS}
        />
        <DateRangePicker
          label="When"
          value={{ from: params.from, to: params.to }}
          onChange={(range) => setFilters({ from: range.from, to: range.to })}
        />
      </FilterBar>

      <Panel>
        {query.isPending ? (
          <div className="space-y-4 p-4" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            title="Couldn't load the audit log"
            error={query.error}
            onRetry={() => void query.refetch()}
            retrying={query.isRefetching}
          />
        ) : (
          <>
            <div className={query.isPlaceholderData ? "p-4 opacity-60" : "p-4"}>
              <ActivityFeed
                entries={query.data.items}
                showTarget
                emptyText={activeFilterCount ? "Nothing matches these filters." : "No admin actions yet."}
              />
              {activeFilterCount > 0 && query.data.items.length === 0 && (
                <Button variant="secondary" size="sm" className="mt-3" onClick={reset}>
                  Clear filters
                </Button>
              )}
            </div>
            {query.data.total > query.data.pageSize && (
              <Pagination
                page={query.data.page}
                pageSize={query.data.pageSize}
                total={query.data.total}
                onPage={setPage}
                noun="actions"
              />
            )}
          </>
        )}
      </Panel>
    </div>
  );
}
