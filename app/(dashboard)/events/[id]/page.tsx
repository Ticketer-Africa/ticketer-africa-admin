"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { useAdminEventDetail } from "@/services/admin/events.queries";
import { formatPrice, formatDate } from "@/lib/helpers";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useAdminEventDetail(params.id);

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Event not found.</p>;
  }

  const { event, transactions, totalProcessed, profit } = data;

  return (
    <div className="space-y-6">
      <Link
        href="/events"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" /> Back to events
      </Link>

      <div className="flex items-start gap-4">
        {event.bannerUrl && (
          <Image
            src={event.bannerUrl}
            alt={event.name}
            width={96}
            height={96}
            className="size-24 shrink-0 rounded-xl border border-border object-cover"
          />
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{event.name}</h2>
            <Badge variant={event.isActive ? "success" : "outline"}>
              {event.isActive ? "active" : "inactive"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDate(event.date)} · {event.venueName ?? "—"} · {event.category}
          </p>
          <p className="text-sm text-muted-foreground">
            Organizer: {event.organizer.name} ({event.organizer.email})
          </p>
          {event.description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {event.description}
            </p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Processed
            </p>
            <p className="mt-2 font-mono text-2xl font-medium tabular-nums">
              {formatPrice(totalProcessed)}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Profit
            </p>
            <p className="mt-2 font-mono text-2xl font-medium tabular-nums">
              {formatPrice(profit)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Ticket categories</h3>
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="text-right">Max</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {event.ticketCategories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>{cat.name}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatPrice(cat.price)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {cat.minted}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {cat.maxTickets}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Layout & Page Content</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{event.layout.replace("_", " ")}</Badge>
            {process.env.NEXT_PUBLIC_FRONTEND_URL && (
              <a
                href={`${process.env.NEXT_PUBLIC_FRONTEND_URL}/events/${event.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                View public page
              </a>
            )}
          </div>
        </div>

        {!!event.lineup?.length && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Lineup</p>
            <p className="text-sm">{event.lineup.map((a) => a.name).join(", ")}</p>
          </div>
        )}

        {!!event.faq?.length && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">FAQ</p>
            <ul className="text-sm space-y-1">
              {event.faq.map((item) => (
                <li key={item.id}>
                  <span className="font-medium">{item.question}</span> — {item.answer}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!!event.goodToKnow?.length && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Good To Know</p>
            <ul className="text-sm list-disc list-inside">
              {event.goodToKnow.map((point) => (
                <li key={point.id}>{point.text}</li>
              ))}
            </ul>
          </div>
        )}

        {!!event.timelineSlots?.length && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Show Timeline</p>
            <ul className="text-sm space-y-1">
              {event.timelineSlots.map((slot) => (
                <li key={slot.id}>
                  {slot.time} · {slot.stage} · {slot.performer}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Transactions</h3>
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>
                    <Link
                      href={`/transactions/${txn.id}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {txn.reference}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {txn.user.name}
                    <div className="font-mono text-xs text-muted-foreground">
                      {txn.user.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {txn.type}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatPrice(txn.amount)}
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
