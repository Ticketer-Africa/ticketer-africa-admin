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
import { useAdminOrganizers } from "@/services/admin/organizers.queries";
import { useTableSearch } from "@/lib/use-table-search";
import { formatPrice, formatDate } from "@/lib/helpers";

export default function OrganizersPage() {
  const { data: organizers, isLoading } = useAdminOrganizers();
  const { query, setQuery, filtered } = useTableSearch(
    organizers,
    (o) => `${o.name} ${o.email}`,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Organizers</h1>
        <Input
          placeholder="Search by name or email"
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Wallet balance</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((organizer) => (
                <TableRow key={organizer.id}>
                  <TableCell>{organizer.name}</TableCell>
                  <TableCell>{organizer.email}</TableCell>
                  <TableCell>
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
                  <TableCell>{formatDate(organizer.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
