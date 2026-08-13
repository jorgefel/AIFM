"use client";

import { GlassLayout } from "./glass/GlassLayout";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <GlassLayout>{children}</GlassLayout>;
}
