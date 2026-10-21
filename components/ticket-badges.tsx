import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

interface TicketBadgesProps {
  isUsed: boolean;
  isListed: boolean;
  voidedAt: string | null;
  /** "refunded" when a refund voided the ticket. */
  voidReason?: string | null;
}

/**
 * A ticket's state as chips. One main state (voided beats checked in beats
 * valid), plus "Listed for resale" while it is on sale. Every chip is a word,
 * never colour alone.
 */
export function TicketBadges({ isUsed, isListed, voidedAt, voidReason }: TicketBadgesProps) {
  return (
    <>
      {voidedAt ? (
        <Badge variant="destructive" dot title={`Voided ${formatDateTime(voidedAt)}`}>
          {voidReason === "refunded" ? "Refunded" : "Voided"}
        </Badge>
      ) : isUsed ? (
        <Badge variant="neutral" dot>
          Checked in
        </Badge>
      ) : (
        <Badge variant="success" dot>
          Valid
        </Badge>
      )}
      {isListed && !voidedAt && <Badge variant="info">Listed for resale</Badge>}
    </>
  );
}
