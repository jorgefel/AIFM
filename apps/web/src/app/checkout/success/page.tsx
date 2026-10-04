"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { useSubscription } from "@/hooks/useSubscription";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

export default function CheckoutSuccessPage() {
  const [timedOut, setTimedOut] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(true);

  const { subscription, isPro, refresh } = useSubscription({
    refreshInterval: pollingEnabled ? POLL_INTERVAL_MS : 0,
  });

  useEffect(() => {
    if (isPro) {
      setPollingEnabled(false);
      return;
    }
    if (!pollingEnabled) return;
    const timer = setTimeout(() => {
      setPollingEnabled(false);
      setTimedOut(true);
    }, POLL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isPro, pollingEnabled]);

  const retry = async () => {
    setIsChecking(true);
    setTimedOut(false);
    setPollingEnabled(true);
    await refresh();
    setIsChecking(false);
  };

  const renewal = subscription.current_period_end
    ? format(parseISO(subscription.current_period_end), "d 'de' MMMM yyyy", { locale: es })
    : null;

  return (
    <DashboardLayout>
      <div className="card-surface mx-auto mt-10 max-w-lg p-8 text-center" role="status" aria-live="polite">
        {isPro ? (
          <>
            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-600">
              <CheckCircle2 className="h-9 w-9" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Tu plan Pro está activo</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Gracias por suscribirte.
              {renewal ? ` Tu plan se renueva el ${renewal}.` : ""}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/">
                <Button className="w-full sm:w-auto">Ir al inicio</Button>
              </Link>
              <Link href="/settings">
                <Button variant="secondary" className="w-full sm:w-auto">Ver mi plan</Button>
              </Link>
            </div>
          </>
        ) : timedOut ? (
          <>
            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Clock className="h-9 w-9" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Seguimos esperando la confirmación</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Todavía no recibimos la confirmación de tu pago. Puede tardar unos minutos. Si el cobro
              ya se realizó, tu plan se activará apenas llegue.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={retry} isLoading={isChecking}>
                Verificar de nuevo
              </Button>
              <Link href="/">
                <Button variant="secondary" className="w-full sm:w-auto">Ir al inicio</Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 text-violet-600">
              <Loader2 className="h-9 w-9 animate-spin" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Confirmando tu pago</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Estamos esperando la respuesta del proveedor de pagos. No cierres esta página.
            </p>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
