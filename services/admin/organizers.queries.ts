import { useQuery } from "@tanstack/react-query";
import * as organizersAPI from "./organizers";

export const useAdminOrganizers = () =>
  useQuery({
    queryKey: ["admin", "organizers"],
    queryFn: organizersAPI.getOrganizers,
  });
