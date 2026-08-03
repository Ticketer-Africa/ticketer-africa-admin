import Axios from "@/services/axios";
import { buildEndpoint } from "@/services/api-config";
import { TicketVerifyResult } from "@/types/tickets.type";

export const verifyTicket = async (data: {
  ticketId?: string;
  code?: string;
  eventId: string;
}): Promise<TicketVerifyResult> => {
  const res = await Axios.post(buildEndpoint("v1", "tickets/verify"), data);
  return res.data;
};
