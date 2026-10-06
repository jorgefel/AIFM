"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarX, Lock, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BillingToggle } from "@/components/billing/BillingToggle";
import { Button } from "@/components/ui/Button";
import { useCheckout } from "@/hooks/useCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import {
  PRO_PRICING,
  formatPlanPrice,
  isBillingPeriod,
  type BillingPeriod,
} from "@/lib/plans";

const TRUST_ITEMS = [
  { icon: Lock, text: "La conexión con la página de pago está cifrada." },
  { icon: ShieldCheck, text: "Nomora no almacena los datos de tu tarjeta." },
  { icon: CalendarX, text: "Puedes cancelar cuando quieras." },
];

function CheckoutContent() {
  const params = useSearchParams();
  const initialBilling = params.get("billing");
  const [billing, setBilling] = useState<BillingPeriod>(
    isBillingPeriod(initialBilling) ? initialBilling : "monthly",
  );
  const { startCheckout, isRedirecting } = useCheckout();
  const { isPro } = useSubscription();

  const isValidPlan = params.get("plan") === "pro";
  const total = PRO_PRICING[billing];
  const periodLabel = billing === "monthly" ? "mes" : "año";

  if (!isValidPlan) {
    return (
      <div className="card-surface mx-auto max-w-md p-8 text-center">
        <p className="text-lg font-medium text-ink">No encontramos ese plan</p>
        <Link href="/plans" className="mt-3 inline-block text-sm font-medium text-violet-600 hover:text-violet-500">
          Ver los planes disponibles
        </Link>
      </div>
    );
  }

  if (isPro) {
    return (
      <div className="card-surface mx-auto max-w-md p-8 text-center">
        <p className="text-lg font-medium text-ink">Ya tienes el plan Pro</p>
        <p className="mt-1 text-sm text-ink-muted">No necesitas pagar de nuevo.</p>
        <Link href="/settings" className="mt-3 inline-block text-sm font-medium text-violet-600 hover:text-violet-500">
          Ir a Configuración
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/plans"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a los planes
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Confirma tu suscripción</h1>
        <p className="mt-1 text-ink-muted">Revisa el resumen y continúa al pago seguro.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section aria-labelledby="summary-title" className="card-surface space-y-6 p-6 lg:col-span-3">
          <h2 id="summary-title" className="text-lg font-semibold text-ink">
            Resumen del pedido
          </h2>

          <div>
            <p className="mb-2 text-sm font-medium text-ink/80">Periodo de facturación</p>
            <BillingToggle value={billing} onChange={setBilling} />
          </div>

          <dl className="divide-y divide-line-soft rounded-xl bg-surface px-4">
            <div className="flex items-center justify-between py-3.5">
              <dt className="text-sm text-ink">
                Nomora Pro, {billing === "monthly" ? "mensual" : "anual"}
              </dt>
              <dd className="text-sm font-medium text-ink">{formatPlanPrice(total)}</dd>
            </div>
            <div className="flex items-center justify-between py-3.5">
              <dt className="font-semibold text-ink">Total a pagar hoy</dt>
              <dd className="text-xl font-bold text-ink">{formatPlanPrice(total)}</dd>
            </div>
          </dl>

          <p className="text-xs text-ink-muted">
            La suscripción se renueva cada {periodLabel} hasta que la canceles. Si aplican
            impuestos, se calculan en la página de pago.
          </p>
        </section>

        <aside className="card-surface flex flex-col p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-ink">Pago seguro</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Elegirás el método de pago en la página de nuestro proveedor.
          </p>

          <ul className="my-6 space-y-3">
            {TRUST_ITEMS.map((item) => (
              <li key={item.text} className="flex items-start gap-3 text-sm text-ink">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                {item.text}
              </li>
            ))}
          </ul>

          <Button
            size="lg"
            className="mt-auto w-full"
            isLoading={isRedirecting}
            onClick={() => startCheckout(billing)}
          >
            {!isRedirecting && <Lock className="mr-2 h-4 w-4" />}
            Continuar al pago seguro
          </Button>
        </aside>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <CheckoutContent />
      </Suspense>
    </DashboardLayout>
  );
}
