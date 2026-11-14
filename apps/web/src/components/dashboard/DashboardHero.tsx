"use client";

import { useCurrency } from "@/contexts/CurrencyContext";

interface DashboardHeroProps {
  revenue: number;
  change: number | null;
  periodLabel: string;
  isLoading: boolean;
}

export function DashboardHero({ revenue, change, periodLabel, isLoading }: DashboardHeroProps) {
  const { formatCurrency } = useCurrency();

  const changeText =
    change === null
      ? "Sin periodo previo para comparar"
      : `${change >= 0 ? "+" : ""}${change}% frente al periodo anterior`;

  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex flex-col gap-8 py-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div
        className="hero-orb pointer-events-none absolute -top-8 right-4 hidden h-72 w-72 rounded-full opacity-95 md:block"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <h1
          id="hero-title"
          className="max-w-xl text-5xl font-extrabold leading-[1] tracking-tight text-ink sm:text-6xl lg:text-7xl"
        >
          Tu negocio, <span className="text-gradient">de un vistazo.</span>
        </h1>
        <p className="mt-5 max-w-md text-base text-ink-muted">
          El resumen de tus propiedades, reservas e ingresos en un solo lugar.
        </p>
      </div>

      <div className="surface-gradient relative z-10 min-w-[280px] rounded-[1.75rem] p-7 shadow-[0_28px_56px_-24px_rgba(147,51,234,0.8)] lg:mt-24">
        <p className="text-sm">Ingresos {periodLabel}</p>
        <p className="mt-1 font-display text-5xl font-extrabold tracking-tight">
          {isLoading ? "--" : formatCurrency(revenue)}
        </p>
        <p className="mt-1 text-sm">{isLoading ? "" : changeText}</p>
      </div>
    </section>
  );
}
