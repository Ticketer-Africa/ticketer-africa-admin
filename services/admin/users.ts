import Axios from "@/services/axios";
import { buildEndpoint } from "@/services/api-config";
import { AdminUser, AdminUserDetail } from "@/types/admin.type";

export const getUsers = async (): Promise<AdminUser[]> => {
  const res = await Axios.get(buildEndpoint("v1", "admin/users"));
  return res.data;
};

export const getUserDetail = async (id: string): Promise<AdminUserDetail> => {
  const res = await Axios.get(buildEndpoint("v1", `admin/users/${id}`));
  return res.data;
};
