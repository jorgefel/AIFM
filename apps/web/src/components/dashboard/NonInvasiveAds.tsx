"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ExternalLink, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const ADSENSE_CLIENT_ID = "ca-pub-9712620157990148";

export interface DisplayAd {
  id: string;
  brand: string;
  domain: string;
  headline: string;
  subline: string;
  ctaText: string;
  targetUrl: string;
  imageUrl: string;
  category: string;
}

// Banners display de anunciantes reales del sector de alquiler vacacional, domótica y suministros
const REAL_DISPLAY_ADS: DisplayAd[] = [
  {
    id: "nuki-smart-lock",
    brand: "Nuki Home Solutions",
    domain: "nuki.io",
    headline: "Cerraduras inteligentes para Airbnb: Check-in autónomo 24/7",
    subline: "Entrega llaves digitales sin estar presente y sincroniza códigos con cada reserva.",
    ctaText: "Ver ofertas",
    targetUrl: "https://nuki.io/es/",
    imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=720&q=80",
    category: "Domótica y Seguridad",
  },
  {
    id: "booking-partners",
    brand: "Booking.com Partners",
    domain: "join.booking.com",
    headline: "Multiplica tus reservas: Da de alta tu alojamiento en Booking",
    subline: "Llega a viajeros de más de 190 países con reservas instantáneas confirmadas.",
    ctaText: "Comenzar gratis",
    targetUrl: "https://join.booking.com/?lang=es",
    imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=720&q=80",
    category: "Canal OTA",
  },
  {
    id: "ring-security",
    brand: "Ring by Amazon",
    domain: "es-es.ring.com",
    headline: "Videotimbres y cámaras exteriores para proteger tu propiedad",
    subline: "Detecta paquetes, entregas y visitas sospechosas en tiempo real desde tu móvil.",
    ctaText: "Comprar en Amazon",
    targetUrl: "https://es-es.ring.com/",
    imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=720&q=80",
    category: "Seguridad para Anfitriones",
  },
  {
    id: "ikea-business",
    brand: "IKEA Business Network",
    domain: "ikea.com",
    headline: "Equipa tu apartamento turístico con descuentos profesionales",
    subline: "Mobiliario resistente y diseño nórdico con financiación especial para alojamientos.",
    ctaText: "Ver catálogo para empresas",
    targetUrl: "https://www.ikea.com/es/es/ikea-business/",
    imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=720&q=80",
    category: "Mobiliario y Decoración",
  },
  {
    id: "turno-cleaning",
    brand: "Turno (TurnoverBnB)",
    domain: "turno.com",
    headline: "Encuentra equipos de limpieza especializados para alquiler vacacional",
    subline: "Pagos automáticos, listas de control fotográficas y rotación de personal certificada.",
    ctaText: "Buscar limpiadores locales",
    targetUrl: "https://turno.com",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=720&q=80",
    category: "Limpieza Profesional",
  },
];

/**
 * Componente oficial para renderizar bloques de Google AdSense
 */
export function GoogleAdSenseSlot({
  slotId,
  format = "auto",
  responsive = true,
  className = "",
  style,
}: {
  slotId: string;
  format?: string;
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (pushedRef.current) return;
    try {
      if (typeof window !== "undefined") {
        ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
          (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []).push({});
        pushedRef.current = true;
      }
    } catch (e) {
      // Ignorar bloqueadores de anuncios (uBlock, AdBlock, Brave)
      console.warn("Google AdSense initialization notice:", e);
    }
  }, [slotId]);

  return (
    <div className="overflow-hidden my-2 flex justify-center items-center">
      <ins
        className={`adsbygoogle ${className}`}
        style={style || { display: "block", minHeight: "90px", width: "100%" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}

/**
 * Anuncio horizontal con imagen display real para el final del dashboard
 * Si se especifica slotId o NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM, carga el bloque de AdSense
 */
export function NonInvasiveBottomAd({ slotId }: { slotId?: string }) {
  const { isPro } = useAuth();
  const [dismissed, setDismissed] = useState(true);
  const [selectedAd, setSelectedAd] = useState<DisplayAd>(REAL_DISPLAY_ADS[0]);

  const activeSlot = slotId || process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM;

  useEffect(() => {
    if (isPro) return;

    const isDismissed = sessionStorage.getItem("nomora_bottom_ad_dismissed");
    if (!isDismissed) {
      setDismissed(false);
      const randomIndex = Math.floor(Math.random() * REAL_DISPLAY_ADS.length);
      setSelectedAd(REAL_DISPLAY_ADS[randomIndex]);
    }
  }, [isPro]);

  if (isPro || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("nomora_bottom_ad_dismissed", "true");
  };

  return (
    <aside
      aria-label="Publicidad"
      className="relative mt-8 overflow-hidden rounded-2xl border border-line-soft bg-surface/80 backdrop-blur-md shadow-md transition-all hover:border-line"
    >
      {/* Etiqueta superior estilo Google AdChoices / Ad banner */}
      <div className="flex items-center justify-between border-b border-line-soft bg-card/60 px-4 py-1.5 text-[11px] text-ink-muted">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold uppercase tracking-wider text-[10px] bg-surface px-1.5 py-0.5 rounded border border-line-soft">
            Anuncio
          </span>
          <span>{activeSlot ? "Google AdSense" : selectedAd.domain}</span>
          {!activeSlot && (
            <>
              <span className="text-line-soft">|</span>
              <span className="truncate">{selectedAd.category}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/plans"
            className="text-[10px] text-ink-muted hover:text-ink underline decoration-line-soft"
            title="Sube a Pro para no ver publicidad"
          >
            Quitar anuncios con Plan Pro
          </Link>
          <button
            onClick={handleDismiss}
            aria-label="Cerrar publicidad"
            className="rounded p-0.5 text-ink-muted hover:bg-surface-hover hover:text-ink transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Si hay un slot de Google AdSense configurado, renderiza el bloque oficial */}
      {activeSlot ? (
        <div className="p-3">
          <GoogleAdSenseSlot slotId={activeSlot} format="horizontal" />
        </div>
      ) : (
        /* Fallback visual de alta calidad con marcas reales mientras AdSense aprueba el dominio */
        <div className="flex flex-col sm:flex-row items-center gap-4 p-3 sm:p-4">
          <div className="relative h-32 w-full sm:h-28 sm:w-48 shrink-0 overflow-hidden rounded-xl border border-line-soft bg-card">
            <img
              src={selectedAd.imageUrl}
              alt={selectedAd.headline}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
            <div className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
              {selectedAd.brand}
            </div>
          </div>

          <div className="flex-1 min-w-0 text-left">
            <h4 className="text-sm font-semibold text-ink sm:text-base leading-snug line-clamp-1">
              {selectedAd.headline}
            </h4>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed line-clamp-2">
              {selectedAd.subline}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] font-medium text-emerald-500">
                Patrocinado por {selectedAd.brand}
              </span>
            </div>
          </div>

          <div className="shrink-0 self-stretch sm:self-center flex sm:flex-col items-center justify-end">
            <a
              href={selectedAd.targetUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-600/20 hover:bg-violet-500 transition-all"
            >
              <span>{selectedAd.ctaText}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </aside>
  );
}

/**
 * Anuncio vertical en tarjeta gráfica para el sidebar
 * Si se especifica slotId o NEXT_PUBLIC_ADSENSE_SLOT_SIDE, carga el bloque de AdSense
 */
export function NonInvasiveSideAd({ slotId }: { slotId?: string }) {
  const { isPro } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [selectedAd, setSelectedAd] = useState<DisplayAd>(REAL_DISPLAY_ADS[1]);

  const activeSlot = slotId || process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDE;

  useEffect(() => {
    if (isPro) return;
    const randomIndex = Math.floor(Math.random() * REAL_DISPLAY_ADS.length);
    setSelectedAd(REAL_DISPLAY_ADS[randomIndex]);
  }, [isPro]);

  if (isPro || dismissed) return null;

  return (
    <aside aria-label="Publicidad" className="mt-auto px-3 py-2">
      <div className="group relative overflow-hidden rounded-2xl border border-line-soft bg-surface/70 shadow-sm transition-all hover:border-line">
        {/* Cabecera miniatura */}
        <div className="flex items-center justify-between border-b border-line-soft bg-card/60 px-2.5 py-1 text-[10px] text-ink-muted">
          <span className="font-semibold uppercase tracking-wider text-[9px] bg-surface px-1 py-0.2 rounded border border-line-soft">
            Anuncio
          </span>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Ocultar anuncio"
            className="rounded p-0.5 text-ink-muted hover:text-ink transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {activeSlot ? (
          <div className="p-2">
            <GoogleAdSenseSlot slotId={activeSlot} format="rectangle" style={{ display: "block", minHeight: "150px" }} />
          </div>
        ) : (
          <>
            {/* Imagen del producto */}
            <div className="relative h-24 w-full overflow-hidden bg-card">
              <img
                src={selectedAd.imageUrl}
                alt={selectedAd.brand}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-1.5 left-2 right-2">
                <span className="text-[10px] font-bold text-white drop-shadow-sm">
                  {selectedAd.brand}
                </span>
              </div>
            </div>

            {/* Texto y botón */}
            <div className="p-2.5 text-left">
              <p className="text-[11px] font-semibold text-ink leading-tight line-clamp-2">
                {selectedAd.headline}
              </p>
              <p className="mt-1 text-[10px] text-ink-muted leading-tight line-clamp-2">
                {selectedAd.subline}
              </p>

              <a
                href={selectedAd.targetUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-card border border-line-soft py-1.5 px-2 text-[11px] font-medium text-ink shadow-sm hover:bg-surface-hover hover:border-line transition-all"
              >
                <span>{selectedAd.ctaText}</span>
                <ExternalLink className="h-3 w-3 text-ink-muted" />
              </a>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
