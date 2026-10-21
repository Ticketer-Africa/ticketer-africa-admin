export type { QRTicketData } from "@/types/tickets.type";
import { QRTicketData } from "@/types/tickets.type";

export const parseTicketData = (dataString: string): QRTicketData | null => {
  try {
    const data = JSON.parse(decodeURIComponent(dataString));
    if (!data.ticketId || !data.eventId || !data.userId || !data.verificationCode) {
      return null;
    }
    return data as QRTicketData;
  } catch {
    return null;
  }
};

/**
 * The ticket data inside whatever was scanned or pasted: a verification
 * link (`…?data=<encoded ticket data>`) gives its `data` value, anything
 * else is taken as the data itself.
 */
export const extractTicketData = (raw: string): string => {
  const text = raw.trim();
  try {
    return new URL(text).searchParams.get("data") || text;
  } catch {
    return text;
  }
};
