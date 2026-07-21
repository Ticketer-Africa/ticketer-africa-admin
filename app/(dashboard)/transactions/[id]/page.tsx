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
import { useAdminTransactionDetail } from "@/services/admin/transactions.queries";
import { formatPrice, formatDate } from "@/lib/helpers";

const statusVariant: Record<
  string,
  "success" | "warning" | "destructive" | "outline"
> = {
  SUCCESS: "success",
  PENDING: "warning",
  FAILED: "destructive",
};

export default function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: txn, isLoading } = useAdminTransactionDetail(params.id);

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (!txn) {
    return <p className="text-sm text-muted-foreground">Transaction not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/transactions"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to transactions
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-mono text-lg font-semibold tracking-tight">
            {txn.reference}
          </h2>
          <Badge variant={statusVariant[txn.status] ?? "outline"}>
            {txn.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDate(txn.createdAt)} · {txn.type}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Base amount
            </p>
            <p className="mt-2 font-mono text-xl font-medium tabular-nums">
              {formatPrice(txn.baseAmount ?? txn.amount)}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Discount{txn.discountCode ? ` (${txn.discountCode.code})` : ""}
            </p>
            <p className="mt-2 font-mono text-xl font-medium tabular-nums">
              {formatPrice(txn.discountAmount ?? 0)}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Final amount
            </p>
            <p className="mt-2 font-mono text-xl font-medium tabular-nums">
              {formatPrice(txn.amount)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <p>
          User:{" "}
          <Link href={`/users/${txn.user.id}`} className="hover:underline">
            {txn.user.name}
          </Link>{" "}
          <span className="font-mono text-xs text-muted-foreground">
            ({txn.user.email})
          </span>
        </p>
        {txn.event && (
          <p>
            Event:{" "}
            <Link href={`/events/${txn.event.id}`} className="hover:underline">
              {txn.event.name}
            </Link>
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Tickets</h3>
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txn.tickets.map(({ ticket }) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-xs">
                    {ticket.code}
                  </TableCell>
                  <TableCell className="text-right">
                    {ticket.isUsed ? "Yes" : "No"}
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
