"use client";

import { useQuery } from "@tanstack/react-query";
import { adminGet } from "./client";
import type { Me } from "./types";

export const meKey = ["v2", "me"] as const;

/** The signed-in admin, with `canApprove` for gating tier 3 decisions. */
export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: () => adminGet<Me>("/me"),
    staleTime: 5 * 60_000,
  });
}

