import { Check } from "lucide-react";
import { PLAN_FEATURES, type PlanId } from "@/lib/plans";

interface PlanCardProps {
  plan: PlanId;
  isCurrent: boolean;
  isLoading?: boolean;
  action?: {
    label: string;
    onClick: () => void;
    isLoading?: boolean;
    variant?: "primary" | "secondary";
  };
}

export function PlanCard({ plan, isCurrent, isLoading = false, action }: PlanCardProps) {
  const isPro = plan === "pro";
  const features = PLAN_FEATURES.filter((f) => (isPro ? f.pro && !f.free : f.free));

  return (
    <article
      className={`relative flex flex-col rounded-[2rem] p-8 ${
        isPro
          ? "surface-gradient border border-white/30 shadow-[0_36px_70px_-30px_rgba(147,51,234,0.9)]"
          : "card-surface"
      }`}
    >
      {isPro && (
        <span className="absolute -top-3.5 left-8 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-violet-800">
          Recomendado
        </span>
      )}

      <header>
        <h2 className={`font-display text-2xl font-extrabold ${isPro ? "" : "text-ink"}`}>
          {isPro ? "Nomora Pro" : "Gratis"}
        </h2>
        <p className={`mt-2 min-h-10 text-sm ${isPro ? "text-white/95" : "text-ink-muted"}`}>
          {isPro
            ? "Automatización, migración de canales y asistente de IA."
            : "Para llevar el control manual de tus propiedades."}
        </p>
      </header>

      <div className="mt-6">
        {isPro ? (
          <>
            <p className="font-display text-3xl font-extrabold tracking-tight">Suscripción mensual</p>
            <p className="mt-1 h-5 text-xs text-white/90">El precio se muestra en la página de pago de Stripe</p>
          </>
        ) : (
          <>
            <p className="font-display text-5xl font-extrabold tracking-tight text-ink">
              $0
              <span className="ml-2 font-sans text-base font-medium text-ink-muted">para siempre</span>
            </p>
            <p className="mt-1 h-5 text-xs text-ink-muted">Sin tarjeta</p>
          </>
        )}
      </div>

      <div className="mt-6">
        {isPro ? (
          isLoading ? (
            <button type="button" disabled className="w-full rounded-full bg-white/70 px-6 py-3.5 text-base font-semibold text-violet-800">
              Consultando plan
            </button>
          ) : (
            action && (
              <button
                type="button"
                onClick={action.onClick}
                disabled={action.isLoading}
                className="w-full rounded-full bg-white px-6 py-3.5 text-base font-semibold text-violet-800 transition-colors hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {action.isLoading ? "Redirigiendo..." : action.label}
              </button>
            )
          )
        ) : (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-full border border-line bg-transparent px-6 py-3.5 text-base font-semibold text-ink-muted"
          >
            {isCurrent ? "Tu plan actual" : "Siempre disponible"}
          </button>
        )}
      </div>

      <ul className={`mt-7 space-y-3.5 border-t pt-6 ${isPro ? "border-white/25" : "border-line-soft"}`}>
        {isPro && <li className="text-sm font-semibold">Todo lo del plan Gratis, y además:</li>}
        {features.map((feature) => (
          <li key={feature.label} className={`flex items-start gap-3 text-sm ${isPro ? "" : "text-ink"}`}>
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${isPro ? "text-white" : "text-violet-500"}`} />
            <span>{feature.label}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
