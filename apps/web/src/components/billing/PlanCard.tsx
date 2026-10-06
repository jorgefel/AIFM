import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
      className={`relative flex flex-col rounded-3xl border bg-card p-7 ${
        isPro
          ? "border-violet-400 shadow-[0_20px_40px_-20px_rgba(124,92,252,0.45)] ring-1 ring-violet-400/30"
          : "border-line shadow-sm"
      }`}
    >
      {isPro && (
        <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-violet-500 to-violet-600 px-3 py-1 text-xs font-semibold text-white">
          Recomendado
        </span>
      )}

      <header>
        <h2 className="text-xl font-bold text-ink">{isPro ? "Nomora Pro" : "Gratis"}</h2>
        <p className="mt-1 min-h-10 text-sm text-ink-muted">
          {isPro
            ? "Automatización, migración de canales y asistente de IA."
            : "Para llevar el control manual de tus propiedades."}
        </p>
      </header>

      <div className="mt-6">
        {isPro ? (
          <>
            <p className="text-2xl font-bold tracking-tight text-ink">Suscripción mensual</p>
            <p className="mt-1 h-5 text-xs text-ink-muted">El precio se muestra en la página de pago de Stripe</p>
          </>
        ) : (
          <>
            <p className="text-4xl font-bold tracking-tight text-ink">
              $0
              <span className="ml-1 text-base font-normal text-ink-muted">para siempre</span>
            </p>
            <p className="mt-1 h-5 text-xs text-ink-muted">Sin tarjeta</p>
          </>
        )}
      </div>

      <div className="mt-6">
        {isPro ? (
          isLoading ? (
            <Button className="w-full" size="lg" disabled isLoading>
              Consultando plan
            </Button>
          ) : (
            action && (
              <Button
                className="w-full"
                size="lg"
                variant={action.variant ?? "primary"}
                onClick={action.onClick}
                isLoading={action.isLoading}
              >
                {action.label}
              </Button>
            )
          )
        ) : (
          <Button className="w-full" size="lg" variant="secondary" disabled>
            {isCurrent ? "Tu plan actual" : "Siempre disponible"}
          </Button>
        )}
      </div>

      <ul className="mt-7 space-y-3 border-t border-line-soft pt-6">
        {isPro && <li className="text-sm font-semibold text-ink">Todo lo de Gratis, y además:</li>}
        {features.map((feature) => (
          <li key={feature.label} className="flex items-start gap-3 text-sm text-ink">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
            <span>{feature.label}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
