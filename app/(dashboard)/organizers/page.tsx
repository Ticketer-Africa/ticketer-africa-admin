"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useAdminOrganizers } from "@/services/admin/organizers.queries";
import { useTableSearch } from "@/lib/use-table-search";
import { formatPrice, formatDate } from "@/lib/helpers";

export default function OrganizersPage() {
  const router = useRouter();
  const { data: organizers, isLoading } = useAdminOrganizers();
  const { query, setQuery, filtered } = useTableSearch(
    organizers,
    (o) => `${o.name} ${o.email}`,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {filtered.length}{" "}
          {filtered.length === 1 ? "organizer" : "organizers"}
        </p>
        <Input
          placeholder="Search by name or email"
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Wallet balance</TableHead>
                <TableHead>Events</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((organizer) => (
                <TableRow
                  key={organizer.id}
                  onClick={() => router.push(`/organizers/${organizer.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <Link
                      href={`/organizers/${organizer.id}`}
                      className="hover:underline"
                    >
                      {organizer.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {organizer.email}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatPrice(organizer.wallet?.balance ?? 0)}
                  </TableCell>
                  <TableCell>
                    {organizer.events.map((event) => (
                      <div key={event.id} className="text-xs">
                        {event.name}{" "}
                        <Badge
                          variant={event.isActive ? "success" : "outline"}
                          className="ml-1"
                        >
                          {event.isActive ? "active" : "inactive"}
                        </Badge>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatDate(organizer.createdAt)}
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
