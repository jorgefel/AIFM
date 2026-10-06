import Link from "next/link";
import { Sparkles } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const INTEGRATIONS = [
  {
    name: "Airbnb",
    logo: "Ab",
    color: "bg-rose-500",
    description: "Sincroniza tus reservas y la disponibilidad de tu calendario.",
    pro: true,
  },
  {
    name: "Booking.com",
    logo: "B.",
    color: "bg-blue-600",
    description: "Importa reservas y mantén los precios al día en un solo lugar.",
    pro: true,
  },
  {
    name: "Stripe",
    logo: "S",
    color: "bg-violet-600",
    description: "Procesa pagos de forma segura.",
    pro: false,
  },
  {
    name: "Google Calendar",
    logo: "31",
    color: "bg-teal-600",
    description: "Sincroniza tus reservas con tu calendario personal.",
    pro: false,
  },
];

export default function IntegrationsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Integraciones</h1>
          <p className="mt-1 text-ink-muted">Conecta Nomora con las herramientas que ya usas.</p>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-700">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Las integraciones se irán habilitando de forma gradual. Las de Airbnb y Booking.com forman
            parte del plan Pro.{" "}
            <Link href="/plans" className="font-semibold underline underline-offset-2">
              Ver planes
            </Link>
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {INTEGRATIONS.map((integration) => (
            <li key={integration.name} className="card-surface flex flex-col p-6">
              <div className="flex items-start justify-between">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white ${integration.color}`}
                  aria-hidden="true"
                >
                  {integration.logo}
                </span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  Próximamente
                </span>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-ink">{integration.name}</h2>
              <p className="mt-1 flex-1 text-sm text-ink-muted">{integration.description}</p>
              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-muted"
                >
                  Conectar
                </button>
                {integration.pro && (
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                    Pro
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </DashboardLayout>
  );
}
