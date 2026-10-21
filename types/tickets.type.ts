export interface QRTicketData {
  ticketId: string;
  eventId: string;
  userId: string;
  code: string;
  verificationCode: string;
  timestamp: number;
}

/**
 * POST /v1/tickets/verify, from the backend's ticket-verification service.
 * Every response is a 200 carrying a `status`; only a missing ticket or a
 * permission problem is an error. A refunded or voided ticket comes back
 * INVALID, with the reason in `message`.
 */
export type TicketVerifyStatus =
  | "SCANNED"
  | "INVALID"
  | "NOT_STARTED"
  | "EVENT_PASSED";

export interface TicketVerifyResult {
  status: TicketVerifyStatus;
  ticketId: string;
  code: string;
  eventId: string;
  /** Naira. */
  ticketCategory?: { name: string; price: number } | null;
  message: string;
  /** Scans recorded today, this one included. More than 1: already used. */
  scansToday: number;
  scansOtherDays: number;
  scannedAt: string | null;
}
