"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { DEMO_USER } from "@/lib/demoData";

const DEMO_FLAG = "nomora_demo_mode";

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
  isDemoMode: boolean;
  login: (data: any) => Promise<void>;
  loginDemo: (overrides?: Partial<User>) => void;
  registerUser: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const router = useRouter();

  const checkAuth = async () => {
    // Modo demo: evita golpear el backend y usa un usuario de ejemplo
    if (typeof window !== "undefined" && localStorage.getItem(DEMO_FLAG) === "true") {
      const stored = typeof window !== "undefined" ? localStorage.getItem("nomora_demo_user") : null;
      setUser(stored ? JSON.parse(stored) : (DEMO_USER as User));
      setIsDemoMode(true);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get("/users/me");
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials: any) => {
    // Send as JSON (backend expects Pydantic BaseModel, not form data)
    await api.post("/auth/login", {
      email: credentials.email,
      password: credentials.password
    });
    // After successful login, fetch user profile
    await checkAuth();
    router.push("/");
  };

  const loginDemo = (overrides?: Partial<User>) => {
    const demoUser = { ...DEMO_USER, ...overrides } as User;
    localStorage.setItem(DEMO_FLAG, "true");
    localStorage.setItem("nomora_demo_user", JSON.stringify(demoUser));
    setUser(demoUser);
    setIsDemoMode(true);
    router.push("/");
  };

  const registerUser = async (data: any) => {
    await api.post("/auth/register", data);
    await checkAuth();
    router.push("/");
  };

  const logout = async () => {
    if (isDemoMode) {
      localStorage.removeItem(DEMO_FLAG);
      localStorage.removeItem("nomora_demo_user");
      setUser(null);
      setIsDemoMode(false);
      router.push("/login");
      return;
    }

    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isDemoMode, login, loginDemo, registerUser, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
