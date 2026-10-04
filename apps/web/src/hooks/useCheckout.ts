import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { BillingPeriod } from "@/lib/plans";

export function useCheckout() {
  const { isDemoMode } = useAuth();
  const toast = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const startCheckout = async (billing: BillingPeriod) => {
    if (isDemoMode) {
      toast.info("Modo demo", "El pago no está disponible en modo demo.");
      return;
    }

    setIsRedirecting(true);
    try {
      const response = await api.post("/billing/checkout", {
        plan: "pro",
        billing_period: billing,
      });
      const url = response.data?.checkout_url;
      if (typeof url !== "string" || !url.startsWith("https://")) {
        throw new Error("Invalid checkout url");
      }
      window.location.assign(url);
    } catch {
      toast.error("No se pudo iniciar el pago", "Inténtalo de nuevo en unos minutos.");
      setIsRedirecting(false);
    }
  };

  return { startCheckout, isRedirecting };
}
