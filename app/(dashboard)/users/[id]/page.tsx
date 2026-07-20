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
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  if (!user) {
    return <p className="text-sm text-muted-foreground">User not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/users"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to users
      </Link>

      <div>
        <h1 className="text-xl font-semibold">{user.name}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <Badge variant="outline" className="mt-2">
          {user.role}
        </Badge>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium">Tickets</h2>
        <div className="rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Purchased</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {user.tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.code}</TableCell>
                  <TableCell>{ticket.event?.name ?? "—"}</TableCell>
                  <TableCell>{ticket.ticketCategory?.name ?? "—"}</TableCell>
                  <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium">Transactions</h2>
        <div className="rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {user.transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>{txn.reference}</TableCell>
                  <TableCell>{txn.event?.name ?? "—"}</TableCell>
                  <TableCell>{formatPrice(txn.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{txn.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(txn.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
