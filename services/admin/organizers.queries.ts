import { useQuery } from "@tanstack/react-query";
import * as organizersAPI from "./organizers";

export const useAdminOrganizers = () =>
  useQuery({
    queryKey: ["admin", "organizers"],
    queryFn: organizersAPI.getOrganizers,
  });

export const useAdminOrganizerDetail = (id: string) =>
  useQuery({
    queryKey: ["admin", "organizers", id],
    queryFn: () => organizersAPI.getOrganizerDetail(id),
    enabled: !!id,
  });
