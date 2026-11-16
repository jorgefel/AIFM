"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PlanCard } from "@/components/billing/PlanCard";
import { PlanComparison } from "@/components/billing/PlanComparison";
import { PlanGuide } from "@/components/billing/PlanGuide";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { containerVariants, itemVariants } from "@/lib/animations";

interface Subscription {
  id: string;
  provider: string;
  status: string;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
}

interface BillingStatus {
  tier: "free" | "pro";
  subscription: Subscription | null;
}

const longDate = new Intl.DateTimeFormat("es-CO", { dateStyle: "long" });
const shortDate = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

function Banner({
  tone,
  children,
}: {
  tone: "info" | "success" | "warning" | "error";
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-700",
    success: "border-teal-200 bg-teal-50 text-teal-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    error: "border-red-200 bg-red-50 text-red-700",
  };
  return (
    <div role="status" className={`mx-auto flex max-w-3xl items-center justify-center gap-3 rounded-xl border p-4 text-sm ${styles[tone]}`}>
      {children}
    </div>
  );
}

function PlansContent() {
  const { checkAuth, isDemoMode } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const params = useSearchParams();
  const checkoutState = params.get("checkout");
  const awaitingWebhook = checkoutState === "success";

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const { data, isLoading, error } = useQuery<BillingStatus>({
    queryKey: ["billing-status"],
    queryFn: async () => (await api.get("/billing/status")).data,
    enabled: !isDemoMode,
    refetchInterval: (query) => (awaitingWebhook && query.state.data?.tier !== "pro" ? 3000 : false),
  });

  const { data: history = [] } = useQuery<Subscription[]>({
    queryKey: ["billing-history"],
    queryFn: async () => (await api.get("/billing/history")).data,
    enabled: !isDemoMode,
  });

  const isPro = data?.tier === "pro";

  useEffect(() => {
    if (isPro) void checkAuth();
  }, [checkAuth, isPro]);

  const redirectTo = async (path: string, setBusy: (value: boolean) => void) => {
    if (isDemoMode) {
      toast.info("Modo demo", "El pago no está disponible en modo demo.");
      return;
    }
    setBusy(true);
    try {
      const response = await api.post<{ url: string }>(path);
      const url = response.data?.url;
      if (typeof url !== "string" || !url.startsWith("https://")) throw new Error("Invalid url");
      window.location.assign(url);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.success("¡Plan Pro activo!", "Tu suscripción Pro ya se encuentra activa.");
        await checkAuth();
        queryClient.invalidateQueries({ queryKey: ["billing-status"] });
        queryClient.invalidateQueries({ queryKey: ["me"] });
      } else {
        toast.error("No se pudo continuar", "Inténtalo de nuevo en unos minutos.");
      }
      setBusy(false);
    }
  };

  const periodEnd = data?.subscription?.current_period_end
    ? longDate.format(new Date(data.subscription.current_period_end))
    : null;

  const proAction = isPro
    ? {
        label: "Gestionar facturación",
        onClick: () => redirectTo("/billing/portal-session", setIsOpeningPortal),
        isLoading: isOpeningPortal,
        variant: "secondary" as const,
      }
    : {
        label: "Activar Pro",
        onClick: () => redirectTo("/billing/checkout-session", setIsRedirecting),
        isLoading: isRedirecting,
        variant: "primary" as const,
      };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-5xl space-y-12"
    >
      <motion.header variants={itemVariants} className="space-y-4 text-center">
        <p className="text-sm font-semibold text-ink-muted">Planes Nomora</p>
        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
          Elige cómo <span className="text-gradient">administrar tu alquiler</span>
        </h1>
        <p className="mx-auto max-w-xl text-lg text-ink-muted">
          Empieza gratis con el registro manual y activa Pro cuando necesites automatización e
          inteligencia.
        </p>
      </motion.header>

      <motion.div variants={itemVariants} className="space-y-3">
        {checkoutState === "success" && !isPro && !isDemoMode && (
          <Banner tone="info">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Pago recibido. Estamos confirmando tu suscripción de forma segura.
          </Banner>
        )}
        {checkoutState === "success" && isPro && (
          <Banner tone="success">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            Tu plan Pro está activo. Ya puedes usar las funciones avanzadas.
          </Banner>
        )}
        {checkoutState === "cancelled" && (
          <Banner tone="warning">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            El pago se canceló y no se hizo ningún cobro. Puedes intentarlo de nuevo cuando quieras.
          </Banner>
        )}
        {error && !isDemoMode && (
          <Banner tone="error">No pudimos consultar tu suscripción. Intenta recargar la página.</Banner>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        <PlanCard plan="free" isCurrent={!isPro} />
        <PlanCard plan="pro" isCurrent={isPro} isLoading={isLoading && !isDemoMode} action={proAction} />
      </motion.div>

      <motion.section variants={itemVariants} aria-labelledby="status-title" className="card-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="status-title" className="flex items-center gap-2 font-semibold text-ink">
              <CreditCard className="h-4 w-4 text-violet-500" aria-hidden="true" />
              Estado de suscripción
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {isPro
                ? `Pro activo${periodEnd ? `. Próximo cobro: ${periodEnd}.` : "."}`
                : "Actualmente estás en el plan Gratis."}
              {data?.subscription?.cancel_at_period_end
                ? " Se cancelará al terminar el periodo actual."
                : ""}
            </p>
          </div>
          {isPro && (
            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700">
              Pro activo
            </span>
          )}
        </div>
        {history.length > 0 && (
          <div className="mt-5 border-t border-line-soft pt-4">
            <p className="mb-2 text-sm font-medium text-ink">Historial</p>
            <ul className="divide-y divide-line-soft">
              {history.map((subscription) => (
                <li key={subscription.id} className="flex justify-between py-2 text-sm text-ink-muted">
                  <span>Stripe, {subscription.status}</span>
                  <span>{shortDate.format(new Date(subscription.created_at))}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.section>

      <motion.section variants={itemVariants} aria-labelledby="compare-title">
        <h2 id="compare-title" className="mb-6 text-center text-2xl font-bold tracking-tight text-ink">
          Compara los planes
        </h2>
        <PlanComparison />
      </motion.section>

      <motion.div variants={itemVariants}>
        <PlanGuide />
      </motion.div>

      <p className="text-center text-xs text-ink-muted">
        Los pagos se procesan de forma segura por Stripe. Nunca almacenamos los datos de tu tarjeta.
      </p>
    </motion.div>
  );
}

export default function PlansPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-center text-ink-muted">Cargando planes</div>}>
        <PlansContent />
      </Suspense>
    </DashboardLayout>
  );
}
