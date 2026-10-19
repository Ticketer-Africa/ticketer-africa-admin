"use client";

import { useQuery } from "@tanstack/react-query";
import { adminGet } from "./client";
import type { AuditEntry, Paged } from "./types";

export const auditKey = ["v2", "audit"] as const;

/** The newest admin actions on one record, for its Activity section. */
export function useRecordActivity(
  targetType: string,
  targetId: string | undefined,
  pageSize = 20,
) {
  return useQuery({
    queryKey: [...auditKey, "for", targetType, targetId, pageSize],
    queryFn: () =>
      adminGet<Paged<AuditEntry>>("/audit", { targetType, targetId, pageSize }),
    enabled: Boolean(targetId),
  });
}
