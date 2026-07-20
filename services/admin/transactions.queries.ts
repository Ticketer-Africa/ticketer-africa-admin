import { useQuery } from "@tanstack/react-query";
import * as transactionsAPI from "./transactions";

export const useAdminTransactions = () =>
  useQuery({
    queryKey: ["admin", "transactions"],
    queryFn: transactionsAPI.getTransactions,
  });
