"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RefreshCw } from "lucide-react";

export default function OtaSetupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings/integrations");
  }, [router]);

  return (
    <DashboardLayout>
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-teal-400 mb-3" />
          <p className="text-slate-300 text-sm">Redirigiendo al Gestor de Canales...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
