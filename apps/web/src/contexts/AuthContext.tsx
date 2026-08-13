"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { api } from "@/lib/api";
import {
  clearSessionHint,
  hasSessionHint,
  isPublicAuthRoute,
  setSessionHint,
} from "@/lib/session";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  registerUser: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return !(isPublicAuthRoute() && !hasSessionHint());
  });
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get("/users/me");
      setUser(response.data);
      setSessionHint();
    } catch {
      setUser(null);
      clearSessionHint();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const onPublicRoute = isPublicAuthRoute();
    const sessionHint = hasSessionHint();

    if (onPublicRoute && !sessionHint) {
      setIsLoading(false);
      return;
    }

    checkAuth();
  }, [checkAuth]);

  const login = useCallback(
    async (credentials: any) => {
      await api.post("/auth/login", {
        email: credentials.email,
        password: credentials.password,
      });
      setSessionHint();
      await checkAuth();
      router.push("/");
    },
    [checkAuth, router]
  );

  const registerUser = useCallback(
    async (data: any) => {
      await api.post("/auth/register", data);
      setSessionHint();
      await checkAuth();
      router.push("/");
    },
    [checkAuth, router]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      clearSessionHint();
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const value = useMemo(
    () => ({ user, isLoading, login, registerUser, logout, checkAuth }),
    [user, isLoading, login, registerUser, logout, checkAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
