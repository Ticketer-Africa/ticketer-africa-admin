"use client";

import { ActivityFeed } from "@/components/activity-feed";
import { ErrorState } from "@/components/error-state";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecordActivity } from "@/services/v2/audit";

interface RecordActivityProps {
  /** Audit target type: "transaction", "refund", … */
  targetType: string;
  targetId: string;
  title?: string;
}

/** A detail page's Activity panel: the admin actions on this record, newest first. */
export function RecordActivity({ targetType, targetId, title = "Activity" }: RecordActivityProps) {
  const activity = useRecordActivity(targetType, targetId);
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>{title}</PanelTitle>
      </PanelHeader>
      <div className="p-4">
        {activity.isPending ? (
          <div className="space-y-3" aria-hidden="true">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : activity.isError ? (
          <ErrorState
            title="Couldn't load activity"
            error={activity.error}
            onRetry={() => void activity.refetch()}
            retrying={activity.isRefetching}
            className="py-6"
          />
        ) : (
          <ActivityFeed entries={activity.data.items} />
        )}
      </div>
    </Panel>
  );
}
