"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";

const PUBLIC_PATHS = ["/login", "/register"];

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!isLoading && !user && !isPublicPage) {
      router.push("/login");
    }
  }, [isLoading, user, router, isPublicPage]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-obsidian">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Si no hay usuario y no es una página pública, retornamos null mientras redirige
  if (!user && !isPublicPage) {
    return null;
  }

  return <>{children}</>;
}
