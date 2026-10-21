"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PauseCircleIcon, PlayCircleIcon } from "@hugeicons/core-free-icons";
import { ActionSheet } from "@/components/actions/action-sheet";
import { InlineConfirm } from "@/components/actions/inline-confirm";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { auditKey } from "@/services/v2/audit";
import { useMe } from "@/services/v2/me";
import { pausePayouts, payoutsKey, usePauseState } from "@/services/v2/payouts";
import { createAndMaybeSelfApprove, requestsKey, useRequests } from "@/services/v2/requests";

/**
 * Whether payouts are going out, and the switch. Pausing is the emergency
 * brake: one click, for any admin. Resuming lets money flow again, so it
 * needs a second superadmin.
 */
export function PayoutPauseControl({ className }: { className?: string }) {
  const { data: me } = useMe();
  const state = usePauseState();
  const pending = useRequests({ status: "PENDING", type: "PAYOUTS_RESUME", pageSize: 1 });
  const [resumeOpen, setResumeOpen] = useState(false);

  if (state.isPending) return <Skeleton className={cn("h-16 w-full rounded-lg", className)} />;
  if (state.isError) {
    return (
      <Panel className={cn("p-4 text-sm text-muted-foreground", className)} role="status">
        Couldn&apos;t check whether payouts are paused.{" "}
        <button type="button" className="font-medium text-primary-text underline-offset-4 hover:underline" onClick={() => void state.refetch()}>
          Try again
        </button>
      </Panel>
    );
  }

  const { paused, source, ttlSeconds, lastChange } = state.data;
  const resumeWaiting = (pending.data?.items.length ?? 0) > 0;
  const invalidate = [payoutsKey, auditKey];

  return (
    <Panel
      className={cn(
        "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between",
        paused && "border-warning/50 bg-warning/5",
        className,
      )}
      role="status"
    >
      <div className="flex min-w-0 items-start gap-3">
        <HugeiconsIcon
          icon={paused ? PauseCircleIcon : PlayCircleIcon}
          aria-hidden="true"
          className={cn("mt-0.5 size-5 shrink-0", paused ? "text-warning" : "text-success")}
        />
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            {paused ? "Payouts are paused" : "Payouts are running"}
          </p>
          <p className="text-xs text-muted-foreground">
            {paused && source === "automatic"
              ? `Paused automatically after a provider error. It lifts itself in about ${Math.max(1, Math.round((ttlSeconds ?? 0) / 60))} min unless someone pauses it for good.`
              : paused && lastChange
                ? `Paused by ${lastChange.actor?.name ?? "an admin"} on ${formatDateTime(lastChange.createdAt)}${lastChange.reason ? `: ${lastChange.reason}` : "."}`
                : paused
                  ? "Paused until someone resumes them."
                  : "Withdrawals and seller settlements go out as normal."}
          </p>
          {resumeWaiting && <p className="text-xs text-warning">A resume is waiting for approval.</p>}
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        <InlineConfirm
          key="pause"
          available={!paused || source === "automatic"}
          label={paused ? "Keep paused" : "Pause payouts"}
          variant="secondary"
          message={
            paused
              ? "Make this pause permanent? Payouts stay off until someone resumes them, with a second person's approval."
              : "Stop all withdrawals and settlements now? Nothing goes out until someone resumes them, which needs a second person's approval."
          }
          confirmLabel="Pause"
          invalidate={invalidate}
          onConfirm={() => pausePayouts()}
          successMessage="Payouts paused"
        />
        <Button
          key="resume"
          variant="secondary"
          onClick={() => setResumeOpen(true)}
          className={cn(!(paused && !resumeWaiting) && "hidden")}
        >
          Request resume
        </Button>
        <ActionSheet
          key="resume-sheet"
          tier={3}
          open={resumeOpen}
          onOpenChange={setResumeOpen}
          available={paused && !resumeWaiting}
          title="Resume payouts"
          description="Withdrawals and settlements start going out again. Queued payouts are picked up on the next run."
          selfApprove={Boolean(me?.canApprove)}
          successMessage="Resume requested"
          invalidate={[...invalidate, requestsKey]}
          onSubmit={(reason, extra) =>
            createAndMaybeSelfApprove({ type: "PAYOUTS_RESUME", payload: {}, reason }, extra)
          }
        />
      </div>
    </Panel>
  );
}
