import { useMutation } from "@tanstack/react-query";
import * as ticketsAPI from "./tickets";

export const useVerifyTicket = () =>
  useMutation({
    mutationFn: (payload: { ticketId?: string; code?: string; eventId: string }) =>
      ticketsAPI.verifyTicket(payload),
  });
