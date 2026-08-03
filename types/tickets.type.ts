export interface QRTicketData {
  ticketId: string;
  eventId: string;
  userId: string;
  code: string;
  verificationCode: string;
  timestamp: number;
}

export interface TicketVerifyResult {
  status: string;
  ticketId: string;
  code: string;
  eventId: string;
  ticketCategory?: { name: string; price: number };
  markedUsed: boolean;
  resalePrice?: number;
  event?: {
    id: string;
    name: string;
    date: string;
    venueName?: string;
    bannerUrl?: string;
  };
  message?: string;
  isValid: boolean;
}
