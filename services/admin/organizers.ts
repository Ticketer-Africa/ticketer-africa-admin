import Axios from "@/services/axios";
import { buildEndpoint } from "@/services/api-config";
import { AdminOrganizer, AdminOrganizerDetail } from "@/types/admin.type";

export const getOrganizers = async (): Promise<AdminOrganizer[]> => {
  const res = await Axios.get(buildEndpoint("v1", "admin/organizers"));
  return res.data;
};

export const getOrganizerDetail = async (
  id: string,
): Promise<AdminOrganizerDetail> => {
  const res = await Axios.get(buildEndpoint("v1", `admin/organizers/${id}`));
  return res.data;
};
