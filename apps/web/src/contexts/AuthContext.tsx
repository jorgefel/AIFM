"use client";

import React, {
  createContext,
  useContext,
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
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export type SocialProvider = "google" | "apple";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  registerUser: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  startSocialLogin: (provider: SocialProvider) => void;
  completeSocialLogin: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const isPublic = typeof window !== "undefined" ? isPublicAuthRoute() : true;
  const hasHint = typeof window !== "undefined" ? hasSessionHint() : false;
  const shouldFetch = !isPublic && hasHint;

  const { data: user = null, isLoading: isQueryLoading, refetch } = useQuery<User | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const response = await api.get("/users/me");
        setSessionHint();
        return response.data;
      } catch {
        clearSessionHint();
        return null;
      }
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const isLoading = shouldFetch ? isQueryLoading : false;

  const checkAuth = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const login = useCallback(
    async (credentials: any) => {
      await api.post("/auth/login", {
        email: credentials.email,
        password: credentials.password,
      });
      setSessionHint();
      await refetch();
      router.push("/");
    },
    [refetch, router]
  );

  const registerUser = useCallback(
    async (data: any) => {
      await api.post("/auth/register", data);
      setSessionHint();
      await refetch();
      router.push("/");
    },
    [refetch, router]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      clearSessionHint();
      queryClient.setQueryData(["me"], null);
      queryClient.clear(); // Clear all cached queries on logout
      router.push("/login");
    }
  }, [router, queryClient]);

  const startSocialLogin = useCallback((provider: SocialProvider) => {
    // OAuth must use a top-level navigation so the provider can redirect the user.
    const authApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
    window.location.assign(`${authApiUrl.replace(/\/$/, "")}/auth/${provider}`);
  }, []);

  const completeSocialLogin = useCallback(async () => {
    // The backend sets the auth cookies before redirecting to this application.
    // Refetching /users/me validates that cookie and updates the React Query cache.
    setSessionHint();
    const result = await refetch();

    if (result.data) {
      return true;
    }

    clearSessionHint();
    return false;
  }, [refetch]);

  const value = useMemo(
    () => ({ user, isLoading, login, registerUser, logout, checkAuth, startSocialLogin, completeSocialLogin }),
    [user, isLoading, login, registerUser, logout, checkAuth, startSocialLogin, completeSocialLogin]
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
