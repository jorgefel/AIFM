"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
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

const DEMO_FLAG = "nomora_demo_mode";
const DEMO_USER_KEY = "nomora_demo_user";

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

function buildDemoUser(overrides?: Partial<User>): User {
  return {
    phone: null,
    age: 30,
    rental_experience_years: 2,
    average_monthly_reservations: 10,
    previous_platforms: [],
    preferences: {},
    onboarding_completed: true,
    onboarding_completed_at: null,
    ...DEMO_USER,
    tier: "free",
    ...overrides,
  } as User;
}

function readDemoUser(): User | null {
  if (typeof window === "undefined" || localStorage.getItem(DEMO_FLAG) !== "true") return null;
  try {
    const stored = localStorage.getItem(DEMO_USER_KEY);
    return stored ? (JSON.parse(stored) as User) : buildDemoUser();
  } catch {
    return buildDemoUser();
  }
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

const AUTH_USER_KEY = "nomora_auth_user";

function readCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [demo, setDemo] = useState<{ checked: boolean; user: User | null }>({ checked: false, user: null });

  useEffect(() => {
    setDemo({ checked: true, user: readDemoUser() });
  }, []);

  const isPublic = typeof window !== "undefined" ? isPublicAuthRoute() : true;
  const shouldFetch = !isPublic && !demo.user;

  const { data: apiUser = null, isLoading: isQueryLoading, refetch } = useQuery<User | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const response = await api.get("/users/me");
        setSessionHint();
        if (typeof window !== "undefined" && response.data) {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data));
        }
        return response.data;
      } catch (err) {
        // shortcut: solo borrar sesión si el backend responde 401 explícito
        clearSessionHint();
        if (typeof window !== "undefined") {
          localStorage.removeItem(AUTH_USER_KEY);
        }
        return null;
      }
    },
    initialData: () => readCachedUser(),
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const user = demo.user ?? apiUser;

  const checkAuth = useCallback(async () => {
    if (demo.user) return;
    await refetch();
  }, [refetch, demo.user]);

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

  const loginDemo = useCallback(
    (overrides?: Partial<User>) => {
      const demoUser = buildDemoUser(overrides);
      localStorage.setItem(DEMO_FLAG, "true");
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      setDemo({ checked: true, user: demoUser });
      router.push("/");
    },
    [router]
  );

  const logout = useCallback(async () => {
    if (demo.user) {
      localStorage.removeItem(DEMO_FLAG);
      localStorage.removeItem(DEMO_USER_KEY);
      setDemo({ checked: true, user: null });
      queryClient.clear();
      router.push("/login");
      return;
    }
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      clearSessionHint();
      localStorage.removeItem("nomora_last_activity");
      localStorage.removeItem(AUTH_USER_KEY);
      queryClient.setQueryData(["me"], null);
      queryClient.clear(); // Clear all cached queries on logout
      router.push("/login");
    }
  }, [router, queryClient, demo.user]);

  const updateProfile = useCallback(async (data: ProfileUpdate) => {
    if (demo.user) {
      const updated = { ...demo.user, ...data, preferences: { ...demo.user.preferences, ...data.preferences } } as User;
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(updated));
      setDemo({ checked: true, user: updated });
      return updated;
    }
    const response = await api.patch<User>("/users/me", data);
    queryClient.setQueryData(["me"], response.data);
    return response.data;
  }, [queryClient, demo.user]);

  const updateOnboarding = useCallback(async (data: OnboardingUpdate) => {
    if (demo.user) {
      const updated = { ...demo.user, ...data } as User;
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(updated));
      setDemo({ checked: true, user: updated });
      return updated;
    }
    const response = await api.patch<User>("/users/me/onboarding", data);
    queryClient.setQueryData(["me"], response.data);
    return response.data;
  }, [queryClient, demo.user]);

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
    () => ({ user, isPro: user?.tier === "pro", isLoading: isQueryLoading || !demo.checked, isDemoMode: demo.user !== null, loginDemo, login, registerUser, logout, checkAuth, updateProfile, updateOnboarding, startSocialLogin, completeSocialLogin }),
    [user, isQueryLoading, demo, loginDemo, login, registerUser, logout, checkAuth, updateProfile, updateOnboarding, startSocialLogin, completeSocialLogin]
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
