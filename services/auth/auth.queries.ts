import { useMutation } from "@tanstack/react-query";
import { login, type LoginDto } from "./auth";

export const useAdminLogin = () =>
  useMutation({
    mutationFn: (dto: LoginDto) => login(dto),
  });
