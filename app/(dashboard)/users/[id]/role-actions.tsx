"use client";

import { useState } from "react";
import { ActionSheet } from "@/components/actions/action-sheet";
import { ActionsMenu, type ActionsMenuItem } from "@/components/actions/actions-menu";
import { KeyValues } from "@/components/key-values";
import { auditKey } from "@/services/v2/audit";
import { useMe } from "@/services/v2/me";
import { createAndMaybeSelfApprove } from "@/services/v2/requests";
import type { Role } from "@/services/v2/types";
import { changeUserRole, usersKey, type AdminUserDetail } from "@/services/v2/users";

const ROLE_LABELS: Record<Role, string> = {
  USER: "User",
  ORGANIZER: "Organizer",
  ADMIN: "Admin",
  SUPERADMIN: "Superadmin",
};

const isAdminRole = (role: Role) => role === "ADMIN" || role === "SUPERADMIN";

/**
 * Role changes. Between user and organizer: a reason (tier 2). Anything that
 * gives or takes away an admin role: a second superadmin (tier 3). The
 * person is signed out everywhere either way, so the new role applies now.
 */
export function RoleActions({ user }: { user: AdminUserDetail }) {
  const { data: me } = useMe();
  const [target, setTarget] = useState<Role | null>(null);
  const isSelf = me?.id === user.id;

  const plainTarget: Role | null =
    user.role === "USER" ? "ORGANIZER" : user.role === "ORGANIZER" ? "USER" : null;
  const adminTargets: Role[] = (["ADMIN", "SUPERADMIN", "USER"] as Role[]).filter(
    (role) => role !== user.role && (isAdminRole(user.role) || role !== "USER"),
  );

  const items: ActionsMenuItem[] = [];
  if (plainTarget) {
    items.push({
      key: plainTarget,
      label: plainTarget === "ORGANIZER" ? "Make organizer" : "Make a regular user",
      tier: 2,
    });
  }
  for (const role of adminTargets) {
    items.push({
      key: role,
      label: isAdminRole(role) ? `Make ${ROLE_LABELS[role].toLowerCase()}` : "Remove admin role",
      tier: 3,
      destructive: !isAdminRole(role),
      disabled: isSelf || Boolean(user.suspendedAt),
      note: isSelf
        ? "Another admin has to change your own role."
        : user.suspendedAt
          ? "Lift the suspension first."
          : undefined,
    });
  }

  const tier2 = target !== null && !isAdminRole(target) && !isAdminRole(user.role);
  const summary = target && (
    <KeyValues
      columns={1}
      items={[
        { label: "Person", value: user.name },
        { label: "Email", value: <span className="break-all">{user.email}</span>, mono: true },
        { label: "Role now", value: ROLE_LABELS[user.role] },
        { label: "New role", value: ROLE_LABELS[target] },
      ]}
    />
  );
  const onOpenChange = (next: boolean) => {
    if (!next) setTarget(null);
  };

  return (
    <>
      <ActionsMenu items={items} onSelect={(key) => setTarget(key as Role)} label="Role" />
      <ActionSheet
        key="role-plain"
        tier={2}
        open={tier2}
        onOpenChange={onOpenChange}
        available={plainTarget !== null}
        title={target === "ORGANIZER" ? `Make ${user.name} an organizer` : `Make ${user.name} a regular user`}
        description={
          target === "ORGANIZER"
            ? "They can create events and get a wallet for their sales. They're signed out so the change applies straight away."
            : "They can no longer create or manage events. Existing events and their wallet stay. They're signed out so the change applies straight away."
        }
        confirmLabel="Change role"
        successMessage="Role changed"
        invalidate={[usersKey, auditKey]}
        summary={summary}
        onSubmit={(reason) => changeUserRole(user.id, target as "USER" | "ORGANIZER", reason)}
      />
      <ActionSheet
        key="role-privileged"
        tier={3}
        open={target !== null && !tier2}
        onOpenChange={onOpenChange}
        available={adminTargets.length > 0}
        title={
          target && isAdminRole(target)
            ? `Make ${user.name} ${target === "ADMIN" ? "an admin" : "a superadmin"}`
            : `Remove ${user.name}'s admin role`
        }
        description={
          target === "SUPERADMIN"
            ? "Superadmins can do everything, including approving refunds and wallet adjustments. Another superadmin has to approve this."
            : target === "ADMIN"
              ? "Admins can see everything and take day-to-day actions, and ask for approval on money moves. Another superadmin has to approve this."
              : "They lose access to the admin console. Another superadmin has to approve this."
        }
        destructive={target !== null && !isAdminRole(target)}
        selfApprove={Boolean(me?.canApprove)}
        successMessage="Role change requested"
        invalidate={[usersKey, auditKey]}
        summary={summary}
        onSubmit={(reason, extra) =>
          createAndMaybeSelfApprove(
            { type: "PRIVILEGED_ROLE_CHANGE", targetId: user.id, payload: { role: target }, reason },
            extra,
          )
        }
      />
    </>
  );
}
