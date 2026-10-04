"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_NAMES } from "@/lib/plans";

export function SubscriptionCard() {
  const { subscription, isPro } = useSubscription();

  const endDate = subscription.current_period_end
    ? format(parseISO(subscription.current_period_end), "d 'de' MMMM yyyy", { locale: es })
    : null;

  let detail = "Estás usando el plan gratuito.";
  if (subscription.plan === "pro") {
    if (subscription.status === "past_due") {
      detail = "No pudimos procesar tu último pago.";
    } else if (subscription.cancel_at_period_end && endDate) {
      detail = `Cancelado. Pro sigue activo hasta el ${endDate}.`;
    } else if (isPro && endDate) {
      detail = `Se renueva el ${endDate}.`;
    } else if (isPro) {
      detail = "Tu plan Pro está activo.";
    } else {
      detail = "Tu suscripción Pro no está activa.";
    }
  }

  return (
    <section aria-labelledby="subscription-title" className="card-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 id="subscription-title" className="flex items-center gap-2 font-semibold text-ink">
          <Sparkles className="h-4 w-4 text-violet-500" />
          Tu plan
        </h3>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            isPro
              ? "border-violet-200 bg-violet-50 text-violet-700"
              : "border-line bg-surface text-ink-muted"
          }`}
        >
          {PLAN_NAMES[isPro ? "pro" : "free"]}
        </span>
      </div>
      <p
        className={`mt-3 text-sm ${
          subscription.status === "past_due" ? "text-amber-700" : "text-ink-muted"
        }`}
      >
        {detail}
      </p>
      <Link
        href="/plans"
        className="mt-4 inline-block text-sm font-medium text-violet-600 transition-colors hover:text-violet-500"
      >
        {isPro ? "Ver planes" : "Conocer el plan Pro"}
      </Link>
    </section>
  );
}
