import Axios from "@/services/axios";
import { buildEndpoint } from "@/services/api-config";
import {
  AdminStats,
  AdminRevenueSummary,
  AdminDailyRevenue,
  AdminEventCategoryBreakdown,
  AdminWalletsSummary,
} from "@/types/admin.type";

export const getStats = async (): Promise<AdminStats> => {
  const res = await Axios.get(buildEndpoint("v1", "admin/stats"));
  return res.data;
};

export const getRevenue = async (): Promise<AdminRevenueSummary> => {
  const res = await Axios.get(buildEndpoint("v1", "admin/revenue"));
  return res.data;
};

export const getDailyRevenue = async (): Promise<AdminDailyRevenue[]> => {
  const res = await Axios.get(buildEndpoint("v1", "admin/revenue/daily"));
  return res.data;
};

export const getEventCategories = async (): Promise<
  AdminEventCategoryBreakdown[]
> => {
  const res = await Axios.get(buildEndpoint("v1", "admin/events/categories"));
  return res.data;
};

export const getWalletsSummary = async (): Promise<AdminWalletsSummary> => {
  const res = await Axios.get(buildEndpoint("v1", "admin/wallets/summary"));
  return res.data;
};
