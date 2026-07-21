import { useQuery } from "@tanstack/react-query";
import * as metricsAPI from "./metrics";

export const useAdminStats = () =>
  useQuery({ queryKey: ["admin", "stats"], queryFn: metricsAPI.getStats });

export const useAdminRevenue = () =>
  useQuery({ queryKey: ["admin", "revenue"], queryFn: metricsAPI.getRevenue });

export const useAdminDailyRevenue = () =>
  useQuery({
    queryKey: ["admin", "revenue", "daily"],
    queryFn: metricsAPI.getDailyRevenue,
  });

export const useAdminEventCategories = () =>
  useQuery({
    queryKey: ["admin", "events", "categories"],
    queryFn: metricsAPI.getEventCategories,
  });

export const useAdminWalletsSummary = () =>
  useQuery({
    queryKey: ["admin", "wallets", "summary"],
    queryFn: metricsAPI.getWalletsSummary,
  });

export const useAdminKoraBalance = () =>
  useQuery({
    queryKey: ["admin", "kora-balance"],
    queryFn: metricsAPI.getKoraBalance,
    staleTime: 60 * 1000,
    retry: 1,
  });
