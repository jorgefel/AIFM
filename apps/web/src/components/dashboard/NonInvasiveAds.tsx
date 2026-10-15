"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ExternalLink, X, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export interface SponsoredAd {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  cta: string;
  url: string;
  badge: string;
}

const SPONSORED_ADS: SponsoredAd[] = [
  {
    id: "nuki",
    name: "Nuki Smart Lock",
    category: "Cerraduras Inteligentes",
    tagline: "Check-in 100% autónomo para huéspedes",
    description: "Entrega llaves digitales sin esperas y automatiza el acceso para tus reservas de Airbnb y Booking.",
    cta: "Visitar web oficial",
    url: "https://nuki.io",
    badge: "Smart Access",
  },
  {
    id: "turno",
    name: "Turno Cleaner Network",
    category: "Limpieza Especializada",
    tagline: "Automatiza la limpieza de tus alojamientos",
    description: "Encuentra y agenda personal de limpieza automáticamente sincronizado con las fechas de checkout.",
    cta: "Explorar servicios",
    url: "https://turno.com",
    badge: "Operaciones",
  },
  {
    id: "minut",
    name: "Minut Noise Sensor",
    category: "Seguridad y Sensores",
    tagline: "Protege tu propiedad sin cámaras",
    description: "Monitor de decibelios y ocupación para evitar fiestas o molestias vecinales respetando la privacidad.",
    cta: "Ver soluciones",
    url: "https://www.minut.com",
    badge: "Seguridad",
  },
  {
    id: "pricelabs",
    name: "PriceLabs Dynamic Pricing",
    category: "Precios Inteligentes",
    tagline: "Maximiza tus ingresos por noche",
    description: "Tarificación dinámica impulsada por datos de mercado local y demanda en tiempo real.",
    cta: "Conocer más",
    url: "https://pricelabs.co",
    badge: "Revenue",
  },
];

export function NonInvasiveBottomAd() {
  const { isPro } = useAuth();
  const [dismissed, setDismissed] = useState(true);
  const [adIndex, setAdIndex] = useState(0);

  useEffect(() => {
    // Si es pro, no hacemos nada
    if (isPro) return;

    const isDismissed = sessionStorage.getItem("nomora_ad_bottom_dismissed");
    if (!isDismissed) {
      setDismissed(false);
      // Seleccionar un anuncio aleatorio para rotación
      setAdIndex(Math.floor(Math.random() * SPONSORED_ADS.length));
    }
  }, [isPro]);

  if (isPro || dismissed) return null;

  const currentAd = SPONSORED_ADS[adIndex] || SPONSORED_ADS[0];

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("nomora_ad_bottom_dismissed", "true");
  };

  return (
    <aside
      aria-label="Anuncio patrocinado"
      className="relative mt-8 overflow-hidden rounded-2xl border border-line-soft bg-surface/70 backdrop-blur-md p-4 sm:p-5 shadow-sm transition-all hover:border-line"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <ExternalLink className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted bg-surface-hover px-2 py-0.5 rounded border border-line-soft">
                Publicidad externa
              </span>
              <span className="text-xs text-ink-muted">· {currentAd.category}</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-ink">
              {currentAd.name}: <span className="font-normal text-ink-muted">{currentAd.description}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
          <a
            href={currentAd.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line-soft bg-card px-3.5 py-2 text-xs font-medium text-ink shadow-sm hover:bg-surface-hover hover:border-line transition-all"
          >
            <span>{currentAd.cta}</span>
            <ExternalLink className="h-3 w-3 text-ink-muted" />
          </a>

          <Link
            href="/plans"
            className="hidden lg:inline-flex text-[11px] text-ink-muted hover:text-ink underline decoration-line-soft underline-offset-2 transition-colors px-1"
            title="Quitar anuncios suscribiéndote a Pro"
          >
            Eliminar anuncios
          </Link>

          <button
            onClick={handleDismiss}
            aria-label="Cerrar anuncio"
            className="rounded-lg p-2 text-ink-muted hover:bg-surface-hover hover:text-ink transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function NonInvasiveSideAd() {
  const { isPro } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [adIndex, setAdIndex] = useState(0);

  useEffect(() => {
    if (isPro) return;
    setAdIndex(Math.floor(Math.random() * SPONSORED_ADS.length));
  }, [isPro]);

  if (isPro || dismissed) return null;

  const currentAd = SPONSORED_ADS[adIndex] || SPONSORED_ADS[0];

  return (
    <aside aria-label="Anuncio patrocinado" className="mt-auto px-3 py-2">
      <div className="relative rounded-2xl border border-line-soft bg-surface/60 p-3 shadow-sm hover:border-line transition-all">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 rounded p-1 text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
          title="Ocultar"
          aria-label="Ocultar anuncio"
        >
          <X className="h-3 w-3" />
        </button>

        <div className="flex items-center gap-1.5 text-ink-muted">
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-surface px-1.5 py-0.5 rounded border border-line-soft">
            Anuncio
          </span>
          <span className="text-[11px] truncate">{currentAd.badge}</span>
        </div>

        <p className="mt-1.5 text-xs font-semibold text-ink line-clamp-1">
          {currentAd.name}
        </p>
        <p className="mt-0.5 text-[11px] text-ink-muted leading-snug line-clamp-2">
          {currentAd.tagline}
        </p>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <a
            href={currentAd.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-line-soft bg-card px-2.5 py-1.5 text-[11px] font-medium text-ink hover:bg-surface-hover transition-colors"
          >
            <span>Ver web</span>
            <ExternalLink className="h-3 w-3 text-ink-muted" />
          </a>

          <Link
            href="/plans"
            title="Quitar anuncios con Plan Pro"
            className="text-[10px] text-ink-muted hover:text-ink transition-colors"
          >
            Quitar
          </Link>
        </div>
      </div>
    </aside>
  );
}
