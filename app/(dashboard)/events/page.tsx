"use client";

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
                <TableHead>Ticket categories</TableHead>
                <TableHead className="text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.name}</TableCell>
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
                  <TableCell>
                    {event.ticketCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="font-mono text-xs tabular-nums text-muted-foreground"
                      >
                        {cat.name}: {cat.minted}/{cat.maxTickets}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="text-right">
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
