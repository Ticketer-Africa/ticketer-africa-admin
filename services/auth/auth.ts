import Axios from "@/services/axios";
import { buildEndpoint } from "@/services/api-config";

export interface LoginDto {
  email: string;
  password: string;
}

export const login = async (dto: LoginDto) => {
  const res = await Axios.post(buildEndpoint("v1", "auth/login"), dto);
  return res.data;
};
