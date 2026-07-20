import Axios from "@/services/axios";
import { buildEndpoint } from "@/services/api-config";
import { AdminOrganizer } from "@/types/admin.type";

export const getOrganizers = async (): Promise<AdminOrganizer[]> => {
  const res = await Axios.get(buildEndpoint("v1", "admin/organizers"));
  return res.data;
};
