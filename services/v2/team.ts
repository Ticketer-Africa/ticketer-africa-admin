"use client";

import { useQuery } from "@tanstack/react-query";
import { adminGet } from "./client";
import type { Role } from "./types";

export const teamKey = ["v2", "team"] as const;

/** GET /v2/admin/team: everyone with an admin role. */
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export function useTeam() {
  return useQuery({
    queryKey: teamKey,
    queryFn: () => adminGet<TeamMember[]>("/team"),
    staleTime: 5 * 60_000,
  });
}
