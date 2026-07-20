"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminTransactions } from "@/services/admin/transactions.queries";
import { useTableSearch } from "@/lib/use-table-search";
import { formatPrice, formatDate } from "@/lib/helpers";

const statusVariant: Record<
  string,
  "success" | "warning" | "destructive" | "outline"
> = {
  SUCCESS: "success",
  PENDING: "warning",
  FAILED: "destructive",
};

export default function TransactionsPage() {
  const { data: transactions, isLoading } = useAdminTransactions();
  const { query, setQuery, filtered } = useTableSearch(
    transactions,
    (t) => `${t.user.name} ${t.user.email} ${t.reference}`,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <Input
          placeholder="Search by user or reference"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <div className="rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>{txn.reference}</TableCell>
                  <TableCell>
                    {txn.user.name}
                    <div className="text-xs text-muted-foreground">
                      {txn.user.email}
                    </div>
                  </TableCell>
                  <TableCell>{txn.event?.name ?? "—"}</TableCell>
                  <TableCell>{txn.type}</TableCell>
                  <TableCell>{formatPrice(txn.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[txn.status] ?? "outline"}>
                      {txn.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(txn.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
