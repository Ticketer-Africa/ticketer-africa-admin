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
import { useAdminOrganizerDetail } from "@/services/admin/organizers.queries";
import { formatPrice, formatDate } from "@/lib/helpers";

export default function OrganizerDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useAdminOrganizerDetail(params.id);

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Organizer not found.</p>;
  }

  const { organizer, totalProcessed, profit } = data;

  return (
    <div className="space-y-6">
      <Link
        href="/organizers"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to organizers
      </Link>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">{organizer.name}</h2>
        <p className="font-mono text-sm text-muted-foreground">
          {organizer.email}
        </p>
        <p className="text-xs text-muted-foreground">
          Joined {formatDate(organizer.createdAt)}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Wallet balance
            </p>
            <p className="mt-2 font-mono text-xl font-medium tabular-nums">
              {formatPrice(organizer.wallet?.balance ?? 0)}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Processed (all events)
            </p>
            <p className="mt-2 font-mono text-xl font-medium tabular-nums">
              {formatPrice(totalProcessed)}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Platform profit generated
            </p>
            <p className="mt-2 font-mono text-xl font-medium tabular-nums">
              {formatPrice(profit)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Events</h3>
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Ticket sales</TableHead>
                <TableHead className="text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizer.events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <Link href={`/events/${event.id}`} className="hover:underline">
                      {event.name}
                    </Link>
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
                    <Badge variant={event.isActive ? "success" : "outline"}>
                      {event.isActive ? "active" : "inactive"}
                    </Badge>
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
