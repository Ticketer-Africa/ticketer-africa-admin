import Axios from "@/services/axios";
import { buildEndpoint } from "@/services/api-config";
import { AdminEvent, AdminEventDetail } from "@/types/admin.type";

export const getEvents = async (): Promise<AdminEvent[]> => {
  const res = await Axios.get(buildEndpoint("v1", "admin/events"));
  return res.data;
};

export const toggleEvent = async (eventId: string) => {
  const res = await Axios.patch(
    buildEndpoint("v1", `admin/events/${eventId}/toggle`),
  );
  return res.data;
};

export const getEventDetail = async (id: string): Promise<AdminEventDetail> => {
  const res = await Axios.get(buildEndpoint("v1", `admin/events/${id}`));
  return res.data;
};
