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
import { DEMO_USER } from "@/lib/demoData";
import { useState } from "react";

const DEMO_FLAG = "nomora_demo_mode";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tier: "free" | "pro";
  phone: string | null;
  age: number | null;
  rental_experience_years: number | null;
  average_monthly_reservations: number | null;
  previous_platforms: string[];
  preferences: Record<string, unknown>;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  ai_usage_count?: number;
  ai_limit_monthly?: number;
}

export interface ProfileUpdate {
  full_name?: string;
  phone?: string | null;
  preferences?: Record<string, unknown>;
}

export interface OnboardingUpdate {
  full_name?: string;
  age?: number;
  rental_experience_years?: number;
  average_monthly_reservations?: number;
  previous_platforms?: string[];
  complete?: boolean;
}

/** New accounts start the questionnaire; saved drafts remain resumable from Settings. */
export function shouldStartOnboarding(user: User | null): boolean {
  return Boolean(user && !user.onboarding_completed && user.age === null);
}

export type SocialProvider = "google" | "apple";

interface AuthContextType {
  user: User | null;
  isPro: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  loginDemo: (overrides?: Partial<User>) => void;
  login: (data: any) => Promise<void>;
  registerUser: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: ProfileUpdate) => Promise<User>;
  updateOnboarding: (data: OnboardingUpdate) => Promise<User>;
  startSocialLogin: (provider: SocialProvider) => void;
  completeSocialLogin: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check demo mode initially
  React.useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(DEMO_FLAG) === "true") {
      setIsDemoMode(true);
    }
  }, []);

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
      const result = await refetch();
      router.push(shouldStartOnboarding(result.data ?? null) ? "/onboarding" : "/");
    },
    [refetch, router]
  );

  const registerUser = useCallback(
    async (data: any) => {
      await api.post("/auth/register", data);
      setSessionHint();
      const result = await refetch();
      router.push(shouldStartOnboarding(result.data ?? null) ? "/onboarding" : "/");
    },
    [refetch, router]
  );

  const loginDemo = useCallback((overrides?: Partial<User>) => {
    const demoUser = { ...DEMO_USER, ...overrides } as User;
    localStorage.setItem(DEMO_FLAG, "true");
    localStorage.setItem("nomora_demo_user", JSON.stringify(demoUser));
    queryClient.setQueryData(["me"], demoUser);
    setIsDemoMode(true);
    router.push("/");
  }, [queryClient, router]);

  const logout = useCallback(async () => {
    if (isDemoMode) {
      localStorage.removeItem(DEMO_FLAG);
      localStorage.removeItem("nomora_demo_user");
      setIsDemoMode(false);
      queryClient.setQueryData(["me"], null);
      router.push("/login");
      return;
    }
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

  const updateProfile = useCallback(async (data: ProfileUpdate) => {
    const response = await api.patch<User>("/users/me", data);
    queryClient.setQueryData(["me"], response.data);
    return response.data;
  }, [queryClient]);

  const updateOnboarding = useCallback(async (data: OnboardingUpdate) => {
    const response = await api.patch<User>("/users/me/onboarding", data);
    queryClient.setQueryData(["me"], response.data);
    return response.data;
  }, [queryClient]);

  const startSocialLogin = useCallback((provider: SocialProvider) => {
    // OAuth must use a top-level navigation so the provider can redirect the user.
    // Always use the relative path so the request goes through the Vercel proxy,
    // keeping the oauth_state cookie on the same domain as the callback.
    window.location.assign(`/api/v1/auth/${provider}`);
  }, []);

  const completeSocialLogin = useCallback(async () => {
    // The backend sets the auth cookies before redirecting to this application.
    // Refetching /users/me validates that cookie and updates the React Query cache.
    setSessionHint();
    const result = await refetch();

    if (result.data) {
      return result.data;
    }

    clearSessionHint();
    return null;
  }, [refetch]);

  const value = useMemo(
    () => ({ user, isPro: user?.tier === "pro", isLoading: isQueryLoading, isDemoMode, login, loginDemo, registerUser, logout, checkAuth, updateProfile, updateOnboarding, startSocialLogin, completeSocialLogin }),
    [user, isQueryLoading, isDemoMode, login, loginDemo, registerUser, logout, checkAuth, updateProfile, updateOnboarding, startSocialLogin, completeSocialLogin]
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
