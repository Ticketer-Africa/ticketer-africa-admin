import Link from "next/link";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Alert01Icon,
  CancelCircleIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { entityHref } from "@/components/entity-link";
import { KeyValues } from "@/components/key-values";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TicketVerifyResult } from "@/types/tickets.type";
import type { AdminTicketDetail } from "@/services/v2/tickets";

type Tone = "success" | "warning" | "destructive" | "neutral";

interface Outcome {
  tone: Tone;
  icon: IconSvgElement;
  /** What to do at the gate, in two or three words. */
  title: string;
}

/**
 * What the gate should do. The tone is the same one StatusBadge uses
 * (green: let them in, amber: look twice, crimson: refuse), but it is
 * never the only signal: each state also has its own icon and wording.
 */
export function scanOutcome(result: TicketVerifyResult): Outcome {
  switch (result.status) {
    case "SCANNED":
      return result.scansToday > 1
        ? { tone: "warning", icon: Alert01Icon, title: "Already scanned" }
        : { tone: "success", icon: CheckmarkCircle01Icon, title: "Valid. Let them in" };
    case "INVALID":
      return {
        tone: "destructive",
        icon: CancelCircleIcon,
        title: /refund/i.test(result.message) ? "Refunded ticket" : "Voided ticket",
      };
    case "NOT_STARTED":
      return { tone: "warning", icon: Clock01Icon, title: "Event hasn't started" };
    case "EVENT_PASSED":
      return { tone: "neutral", icon: Clock01Icon, title: "Event is over" };
    default:
      return { tone: "neutral", icon: Alert01Icon, title: "Not recognised" };
  }
}

const TONE_CLASSES: Record<Tone, { panel: string; icon: string }> = {
  success: { panel: "border-success/30 bg-success/10", icon: "text-success" },
  warning: { panel: "border-warning/30 bg-warning/10", icon: "text-warning" },
  destructive: { panel: "border-destructive/30 bg-destructive/10", icon: "text-destructive" },
  neutral: { panel: "border-border bg-muted", icon: "text-muted-foreground" },
};

interface ScanResultProps {
  result: TicketVerifyResult;
  /** The ticket's full record, for the event and owner (loads after the scan). */
  ticket: { data?: AdminTicketDetail; isPending: boolean };
  onScanNext: () => void;
}

export function ScanResult({ result, ticket, onScanNext }: ScanResultProps) {
  const outcome = scanOutcome(result);
  const tone = TONE_CLASSES[outcome.tone];
  const category = result.ticketCategory;
  const earlier = result.scansOtherDays;

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <Panel role="status" aria-live="polite" className={cn("p-5 text-center", tone.panel)}>
        <HugeiconsIcon icon={outcome.icon} aria-hidden="true" className={cn("mx-auto size-14", tone.icon)} />
        <h1
          data-page-title=""
          tabIndex={-1}
          className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-[-0.01em] text-foreground focus:outline-none"
        >
          {outcome.title}
        </h1>
        <p className="mt-1 text-base text-foreground">{result.message}</p>
      </Panel>

      <Panel className="p-4">
        <KeyValues
          columns={1}
          items={[
            {
              label: "Event",
              value: ticket.data ? (
                ticket.data.event.name
              ) : ticket.isPending ? (
                <Skeleton className="h-4 w-40" />
              ) : null,
            },
            {
              label: "Category",
              value: category ? (
                <>
                  {category.name}
                  {" · "}
                  {category.price > 0 ? <Money value={category.price} /> : "Free"}
                </>
              ) : null,
            },
            { label: "Ticket code", value: result.code, mono: true },
            {
              label: "Owner",
              value: ticket.data ? ticket.data.owner.name : ticket.isPending ? <Skeleton className="h-4 w-32" /> : null,
              hidden: !ticket.data && !ticket.isPending,
            },
            {
              label: "Scans",
              value: `${formatCount(result.scansToday)} today${earlier > 0 ? `, ${formatCount(earlier)} on other days` : ""}`,
              mono: true,
              hidden: result.status !== "SCANNED",
            },
          ]}
        />
      </Panel>

      <div className="flex flex-col gap-2">
        <Button variant="primary" size="lg" className="w-full" onClick={onScanNext}>
          Scan next ticket
        </Button>
        <Button variant="secondary" size="lg" className="w-full" asChild>
          <Link href={entityHref("ticket", result.ticketId)}>Open ticket</Link>
        </Button>
      </div>
    </div>
  );
}
