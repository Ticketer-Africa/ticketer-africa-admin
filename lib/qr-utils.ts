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
