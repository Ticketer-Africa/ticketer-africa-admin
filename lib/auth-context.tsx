"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Axios from "@/services/axios";
import { buildEndpoint } from "@/services/api-config";

interface AdminUser {
  sub: string;
  email: string;
  name: string;
  role: "ADMIN" | "SUPERADMIN";
}

interface UserContextType {
  user: AdminUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    Axios.get(buildEndpoint("v1", "auth/me"))
      .then((res) => {
        if (!cancelled) setUser(res.data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await Axios.post(buildEndpoint("v1", "auth/logout"));
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const value = useMemo<UserContextType>(
    () => ({ user, isLoading, logout }),
    [user, isLoading, logout],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within an AuthProvider");
  }
  return context;
}
