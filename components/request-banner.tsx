"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { HourglassIcon } from "@hugeicons/core-free-icons";
import { entityHref } from "@/components/entity-link";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMe } from "@/services/v2/me";
import { usePendingRequestsFor } from "@/services/v2/requests";
import type { AdminTargetType } from "@/services/v2/types";

interface RequestBannerProps {
  /** "transaction" | "event" | "wallet" | "payout" | "user" | "platform" */
  targetType: AdminTargetType;
  targetId: string | undefined;
  className?: string;
}

/**
 * "Refund ₦12,000.00 to … · requested by Tolu 2 h ago · waiting for approval".
 * Renders nothing while loading or when nothing is pending. It refreshes
 * whenever ["v2", "requests"] is invalidated (ActionSheet tier 3 does that).
 */
export function RequestBanner({ targetType, targetId, className }: RequestBannerProps) {
  const { data: requests } = usePendingRequestsFor(targetType, targetId);
  const { data: me } = useMe();
  if (!requests?.length) return null;

  return (
    <section
      aria-label="Waiting for approval"
      className={cn(
        "mb-5 space-y-2 rounded-lg border border-warning/25 bg-warning/10 px-4 py-3",
        className,
      )}
    >
      {requests.map((request) => {
        const who =
          me && request.requestedBy.id === me.id ? "you" : request.requestedBy.name;
        return (
          <div key={request.id} className="flex items-start gap-2.5">
            <HugeiconsIcon
              icon={HourglassIcon}
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-warning"
            />
            <p className="min-w-0 flex-1 text-sm text-foreground">
              <span className="font-medium">{request.summary}</span>
              <span className="text-muted-foreground">
                {" "}
                · requested by {who} {formatRelative(request.createdAt)} · waiting for
                approval.{" "}
              </span>
              <Link
                href={entityHref("request", request.id)}
                className="whitespace-nowrap font-medium text-primary-text underline-offset-4 hover:underline"
              >
                View request
              </Link>
            </p>
          </div>
        );
      })}
    </section>
  );
}
