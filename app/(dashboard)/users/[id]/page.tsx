"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminUserDetail } from "@/services/admin/users.queries";
import { formatPrice, formatDate } from "@/lib/helpers";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: user, isLoading } = useAdminUserDetail(params.id);

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (!user) {
    return <p className="text-sm text-muted-foreground">User not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/users"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to users
      </Link>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">{user.name}</h2>
        <p className="font-mono text-sm text-muted-foreground">
          {user.email}
        </p>
        <Badge variant="outline" className="mt-2">
          {user.role}
        </Badge>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Tickets</h3>
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Purchased</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {user.tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-xs">
                    {ticket.code}
                  </TableCell>
                  <TableCell>{ticket.event?.name ?? "—"}</TableCell>
                  <TableCell>{ticket.ticketCategory?.name ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatDate(ticket.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Transactions</h3>
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {user.transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {txn.reference}
                  </TableCell>
                  <TableCell>{txn.event?.name ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatPrice(txn.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{txn.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatDate(txn.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
