import Axios from "@/services/axios";
import { buildEndpoint } from "@/services/api-config";
import { AdminTransaction } from "@/types/admin.type";

export const getTransactions = async (): Promise<AdminTransaction[]> => {
  const res = await Axios.get(buildEndpoint("v1", "admin/transactions"));
  return res.data;
};
