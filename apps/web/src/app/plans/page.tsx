"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Check, CreditCard, Crown, Loader2, Sparkles } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type Subscription = {
  id: string;
  provider: string;
  status: string;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
};

type BillingStatus = { tier: "free" | "pro"; subscription: Subscription | null };

function PlansContent() {
  const { checkAuth } = useAuth();
  const params = useSearchParams();
  const checkoutState = params.get("checkout");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const awaitingWebhook = checkoutState === "success";
  const { data, isLoading, error } = useQuery<BillingStatus>({
    queryKey: ["billing-status"],
    queryFn: async () => (await api.get("/billing/status")).data,
    refetchInterval: (query) => awaitingWebhook && query.state.data?.tier !== "pro" ? 3000 : false,
  });
  const { data: history = [] } = useQuery<Subscription[]>({
    queryKey: ["billing-history"],
    queryFn: async () => (await api.get("/billing/history")).data,
  });

  const startCheckout = async () => {
    setIsRedirecting(true);
    try {
      const response = await api.post<{ url: string }>("/billing/checkout-session");
      window.location.assign(response.data.url);
    } finally {
      setIsRedirecting(false);
    }
  };

  const openPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const response = await api.post<{ url: string }>("/billing/portal-session");
      window.location.assign(response.data.url);
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const isPro = data?.tier === "pro";
  useEffect(() => {
    if (isPro) void checkAuth();
  }, [checkAuth, isPro]);
  const periodEnd = data?.subscription?.current_period_end
    ? new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(new Date(data.subscription.current_period_end))
    : null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="text-center">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-300"><Sparkles className="h-4 w-4" /> Planes Nomora</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Elige cómo administrar tu alquiler</h1>
          <p className="mt-2 text-slate-400">Puedes comenzar gratis y activar Pro cuando necesites automatización e inteligencia.</p>
        </div>

        {checkoutState === "success" && !isPro && (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-blue-400/30 bg-blue-400/10 p-4 text-sm text-blue-100"><Loader2 className="h-5 w-5 animate-spin" /> Pago recibido. Estamos confirmando tu suscripción de forma segura…</div>
        )}
        {checkoutState === "success" && isPro && <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-center text-sm text-emerald-100">¡Tu plan Pro está activo! Ya puedes usar las funciones avanzadas.</div>}
        {checkoutState === "cancelled" && <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-center text-sm text-amber-100">El pago fue cancelado; tu cuenta no fue modificada.</div>}
        {error && <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-center text-sm text-rose-100">No pudimos consultar tu suscripción. Intenta recargar la página.</div>}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="glass-panel p-8">
            <h2 className="text-xl font-bold text-white">Gratis</h2>
            <p className="mt-2 text-slate-400">Para llevar el control manual de tus propiedades.</p>
            <p className="my-6 text-3xl font-bold text-white">$0 <span className="text-base font-normal text-slate-400">para siempre</span></p>
            <ul className="space-y-3 text-sm text-slate-300">{["Propiedades, reservas, ingresos y gastos manuales", "Calendario y panel financiero", "Análisis determinístico y exportaciones"].map((item) => <li key={item} className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-emerald-400" />{item}</li>)}</ul>
          </section>
          <section className="relative overflow-hidden rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 p-8 shadow-xl shadow-emerald-950/30">
            <div className="absolute right-5 top-5 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-emerald-950">RECOMENDADO</div>
            <Crown className="h-8 w-8 text-amber-300" />
            <h2 className="mt-3 text-xl font-bold text-white">Nomora Pro</h2>
            <p className="mt-2 text-slate-300">Automatización, migración de canales y asistente de IA.</p>
            <p className="my-6 text-3xl font-bold text-white">Precio configurado en checkout <span className="text-base font-normal text-slate-300">/ mes</span></p>
            <ul className="space-y-3 text-sm text-slate-200">{["Sincronización y migración de plataformas", "Agente IA para análisis y acciones", "Automatizaciones operativas"].map((item) => <li key={item} className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-emerald-300" />{item}</li>)}</ul>
            <div className="mt-8">
              {isLoading ? <Button disabled isLoading>Consultando plan</Button> : isPro ? <Button onClick={openPortal} isLoading={isOpeningPortal} variant="secondary"><CreditCard className="mr-2 h-4 w-4" />Gestionar facturación</Button> : <Button onClick={startCheckout} isLoading={isRedirecting}><Crown className="mr-2 h-4 w-4" />Activar Pro</Button>}
            </div>
          </section>
        </div>

        <section className="glass-panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-semibold text-white">Estado de suscripción</h2><p className="mt-1 text-sm text-slate-400">{isPro ? `Pro activo${periodEnd ? ` · próximo cobro: ${periodEnd}` : ""}` : "Actualmente estás en el plan Gratis."}{data?.subscription?.cancel_at_period_end ? " Se cancelará al terminar el período actual." : ""}</p></div>{isPro && <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-300">Pro activo</span>}</div>
          {history.length > 0 && <div className="mt-5 border-t border-white/10 pt-4"><p className="mb-2 text-sm font-medium text-slate-300">Historial</p>{history.map((subscription) => <div key={subscription.id} className="flex justify-between py-2 text-sm text-slate-400"><span>Stripe · {subscription.status}</span><span>{new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(subscription.created_at))}</span></div>)}</div>}
        </section>
        <p className="text-center text-xs text-slate-500">Los pagos se procesan de forma segura por Stripe. Nunca almacenamos los datos de tu tarjeta.</p>
      </div>
    </DashboardLayout>
  );
}

export default function PlansPage() {
  return <Suspense fallback={<DashboardLayout><div className="p-8 text-center text-slate-400">Cargando planes…</div></DashboardLayout>}><PlansContent /></Suspense>;
}
