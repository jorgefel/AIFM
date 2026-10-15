"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, X, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export function NonInvasiveBottomAd() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const isDismissed = localStorage.getItem("nomora_ad_bottom_dismissed");
    if (!isDismissed) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("nomora_ad_bottom_dismissed", "true");
  };

  if (dismissed) return null;

  return (
    <div className="relative mt-6 overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-obsidian to-teal-950/30 p-4 sm:p-5 shadow-lg backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                Alianza Estratégica
              </span>
              <span className="text-xs text-ink-muted">· Recomendado para anfitriones</span>
            </div>
            <p className="mt-1 text-sm font-medium text-ink">
              Automatiza la mensajería con tus huéspedes y sincroniza calendarios con Beds24 y Airbnb.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
          <Link
            href="/settings/integrations"
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20 hover:from-violet-500 hover:to-violet-400 transition-all"
          >
            Conectar canales
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
          <button
            onClick={handleDismiss}
            aria-label="Cerrar anuncio"
            className="rounded-lg p-2 text-ink-muted hover:bg-surface/50 hover:text-ink transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function NonInvasiveSideAd() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mt-auto px-3 py-2">
      <div className="relative rounded-2xl border border-teal-500/20 bg-gradient-to-b from-teal-950/30 to-obsidian-light/40 p-3.5 shadow-sm">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 rounded p-1 text-slate-400 hover:text-white transition-colors"
          title="Ocultar"
        >
          <X className="h-3 w-3" />
        </button>
        <div className="flex items-center gap-2 text-teal-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Nomora Pro</span>
        </div>
        <p className="mt-1 text-xs text-slate-300 leading-snug">
          Exporta reportes ilimitados y obtén previsiones con IA avanzada.
        </p>
        <Link
          href="/plans"
          className="mt-2.5 inline-flex w-full items-center justify-center rounded-lg bg-teal-500/20 px-2.5 py-1.5 text-xs font-medium text-teal-200 hover:bg-teal-500/30 transition-colors"
        >
          Ver ventajas Pro
        </Link>
      </div>
    </div>
  );
}
