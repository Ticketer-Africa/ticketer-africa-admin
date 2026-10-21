"use client";

import { useParams } from "next/navigation";
import { ActionSheet } from "@/components/actions/action-sheet";
import { InlineConfirm } from "@/components/actions/inline-confirm";
import { ActivityFeed } from "@/components/activity-feed";
import { DetailHeader } from "@/components/detail-header";
import { EntityLink } from "@/components/entity-link";
import { ErrorState } from "@/components/error-state";
import { KeyValues } from "@/components/key-values";
import { Money } from "@/components/money";
import { RequestBanner } from "@/components/request-banner";
import Link from "next/link";
import { entityHref } from "@/components/entity-link";
import { RoleActions } from "./role-actions";
import { StatusBadge, userStatus } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  resendSignupCode,
  suspendUser,
  unsuspendUser,
  usersKey,
  useUser,
  type AdminUserDetail,
} from "@/services/v2/users";
import { auditKey, useRecordActivity } from "@/services/v2/audit";

const ADMIN_ROLES = ["ADMIN", "SUPERADMIN"];

/*
 * A person's account: status, role, tickets, payments, wallet (organizers)
 * and what admins have done to it.
 */
export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useUser(id);

  if (query.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load this user"
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isRefetching}
      />
    );
  }

  const user = query.data;
  return (
    <div className="space-y-5">
      <DetailHeader
        backHref="/users"
        backLabel="Users"
        title={user.name}
        status={<StatusBadge kind="user" value={userStatus(user)} />}
        subtitle={<span className="num">{user.email}</span>}
        facts={[
          { label: "Role", value: user.role.charAt(0) + user.role.slice(1).toLowerCase() },
          { label: "Spent", value: <Money value={user.totalSpent} /> },
          { label: "Joined", value: <span className="num">{formatDate(user.createdAt)}</span> },
        ]}
        actions={
          <>
            <InlineConfirm
              key="resend-code"
              available={!user.isVerified}
              label="Resend sign-up code"
              message={
                <>
                  Email a new sign-up code to <span className="num break-all">{user.email}</span>?
                </>
              }
              confirmLabel="Send code"
              successMessage="Sign-up code sent"
              invalidate={[auditKey]}
              onConfirm={() => resendSignupCode(user.id)}
            />
            <SuspensionAction user={user} />
            <RoleActions user={user} />
          </>
        }
      />

      <RequestBanner targetType="user" targetId={user.id} />

      {user.suspendedAt && (
        <Panel className="p-4">
          <KeyValues
            items={[
              { label: "Suspended", value: formatDateTime(user.suspendedAt), mono: true },
              { label: "Reason", value: user.suspendedReason },
            ]}
          />
        </Panel>
      )}

      {user.wallet && (
        <Panel>
          <PanelHeader>
            <PanelTitle>Wallet</PanelTitle>
            <Link
              href={entityHref("wallet", user.id)}
              className="text-sm font-medium text-primary-text underline-offset-4 hover:underline"
            >
              Ledger
            </Link>
          </PanelHeader>
          <div className="p-4">
            <KeyValues
              items={[
                { label: "Balance", value: <Money value={user.wallet.balance} /> },
                { label: "Last change", value: formatDateTime(user.wallet.updatedAt), mono: true },
                ...(user.role === "ORGANIZER"
                  ? [{ label: "Organizer page", value: <EntityLink kind="organizer" id={user.id} label="Open" /> }]
                  : []),
              ]}
            />
          </div>
        </Panel>
      )}

      <Panel>
        <PanelHeader>
          <PanelTitle>Tickets</PanelTitle>
        </PanelHeader>
        {user.tickets.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No tickets.</p>
        ) : (
          <Table aria-label="Tickets">
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Bought</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {user.tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="num text-xs">
                    <EntityLink kind="ticket" id={ticket.id} label={ticket.code} mono />
                  </TableCell>
                  <TableCell className="max-w-[16rem] truncate">
                    {ticket.event ? (
                      <EntityLink kind="event" id={ticket.event.id} label={ticket.event.name} />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="num text-right text-xs text-muted-foreground">
                    {formatDate(ticket.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <Panel>
        <PanelHeader>
          <PanelTitle>Transactions</PanelTitle>
        </PanelHeader>
        {user.transactions.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No transactions.</p>
        ) : (
          <Table aria-label="Transactions">
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {user.transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="max-w-[14rem]">
                    <EntityLink kind="transaction" id={txn.id} label={txn.reference} mono className="text-xs" />
                  </TableCell>
                  <TableCell>
                    <StatusBadge kind="transaction" value={txn.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Money value={txn.amount} />
                  </TableCell>
                  <TableCell className="num text-right text-xs text-muted-foreground">
                    {formatDate(txn.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <UserActivity userId={user.id} />
    </div>
  );
}

function UserActivity({ userId }: { userId: string }) {
  const activity = useRecordActivity("user", userId);
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Activity</PanelTitle>
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
            className="py-6"
          />
        ) : (
          <ActivityFeed entries={activity.data.items} />
        )}
      </div>
    </Panel>
  );
}

function SuspensionAction({ user }: { user: AdminUserDetail }) {
  // Admins can't be suspended; they have to be demoted first.
  if (ADMIN_ROLES.includes(user.role)) return null;
  const invalidate = [usersKey, auditKey];
  const suspended = Boolean(user.suspendedAt);

  // Both stay mounted; `available` picks the one that applies now.
  return (
    <>
      <ActionSheet
        key="suspend"
        tier={2}
        available={!suspended}
        title={`Suspend ${user.name}`}
        description="They're signed out everywhere and can't sign in or buy tickets until you lift it."
        confirmLabel="Suspend"
        destructive
        successMessage="User suspended"
        invalidate={invalidate}
        onSubmit={(reason) => suspendUser(user.id, reason)}
        summary={<UserSummary user={user} />}
        trigger={<Button variant="destructive-outline">Suspend</Button>}
      />
      <ActionSheet
        key="unsuspend"
        tier={2}
        available={suspended}
        title={`Lift ${user.name}'s suspension`}
        description="They can sign in and buy tickets again straight away."
        confirmLabel="Unsuspend"
        successMessage="Suspension lifted"
        invalidate={invalidate}
        onSubmit={(reason) => unsuspendUser(user.id, reason)}
        summary={<UserSummary user={user} />}
        trigger={<Button variant="secondary">Unsuspend</Button>}
      />
    </>
  );
}

function UserSummary({ user }: { user: AdminUserDetail }) {
  return (
    <KeyValues
      columns={1}
      items={[
        { label: "User", value: user.name },
        { label: "Email", value: user.email, mono: true },
        { label: "Spent so far", value: <Money value={user.totalSpent} /> },
      ]}
    />
  );
}
