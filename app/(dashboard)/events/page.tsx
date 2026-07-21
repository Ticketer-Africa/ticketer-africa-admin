"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminEvents, useToggleAdminEvent } from "@/services/admin/events.queries";
import { useTableSearch } from "@/lib/use-table-search";
import { formatDate } from "@/lib/helpers";

export default function EventsPage() {
  const router = useRouter();
  const { data: events, isLoading } = useAdminEvents();
  const toggleEvent = useToggleAdminEvent();
  const { query, setQuery, filtered } = useTableSearch(
    events,
    (e) => `${e.name} ${e.organizer?.name ?? ""}`,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "event" : "events"}
        </p>
        <Input
          placeholder="Search by event or organizer"
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
                <TableHead>Event</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead className="text-right">Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((event) => (
                <TableRow
                  key={event.id}
                  onClick={() => router.push(`/events/${event.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <Link href={`/events/${event.id}`} className="hover:underline">
                      {event.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {event.organizer.name}
                    <div className="font-mono text-xs text-muted-foreground">
                      {event.organizer.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatDate(event.date)}
                  </TableCell>
                  <TableCell>{event.category}</TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Switch
                      checked={event.isActive}
                      onCheckedChange={() => toggleEvent.mutate(event.id)}
                    />
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
