import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as eventsAPI from "./events";
import { AdminEvent } from "@/types/admin.type";

export const useAdminEvents = () =>
  useQuery({ queryKey: ["admin", "events"], queryFn: eventsAPI.getEvents });

export const useToggleAdminEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => eventsAPI.toggleEvent(eventId),
    onMutate: async (eventId: string) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "events"] });
      const previous = queryClient.getQueryData<AdminEvent[]>([
        "admin",
        "events",
      ]);

      queryClient.setQueryData<AdminEvent[]>(["admin", "events"], (old) =>
        old?.map((event) =>
          event.id === eventId
            ? { ...event, isActive: !event.isActive }
            : event,
        ),
      );

      return { previous };
    },
    onError: (_err, _eventId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["admin", "events"], context.previous);
      }
      toast.error("Failed to update event status");
    },
    onSuccess: () => {
      toast.success("Event status updated");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
    },
  });
};
