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
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {filtered.length}{" "}
          {filtered.length === 1 ? "transaction" : "transactions"}
        </p>
        <Input
          placeholder="Search by user or reference"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {txn.reference}
                  </TableCell>
                  <TableCell>
                    {txn.user.name}
                    <div className="font-mono text-xs text-muted-foreground">
                      {txn.user.email}
                    </div>
                  </TableCell>
                  <TableCell>{txn.event?.name ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {txn.type}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatPrice(txn.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[txn.status] ?? "outline"}>
                      {txn.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatDate(txn.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
