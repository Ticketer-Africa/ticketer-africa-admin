import { useQuery } from "@tanstack/react-query";
import * as usersAPI from "./users";

export const useAdminUsers = () =>
  useQuery({ queryKey: ["admin", "users"], queryFn: usersAPI.getUsers });

export const useAdminUserDetail = (id: string) =>
  useQuery({
    queryKey: ["admin", "users", id],
    queryFn: () => usersAPI.getUserDetail(id),
    enabled: !!id,
  });
