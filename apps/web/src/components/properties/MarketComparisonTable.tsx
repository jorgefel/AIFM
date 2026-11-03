import { ArrowDown, ArrowUp, ExternalLink, Minus } from "lucide-react";
import type { Property } from "@/types/models";
import type { MarketComparison, MarketListing } from "@/types/marketComparison";

type Props = { property: Property; comparison: MarketComparison };
type NumericValue = number | null | undefined;

function asNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function number(value: NumericValue) {
  return value == null ? "—" : value.toLocaleString();
}

function price(value: NumericValue, currency: string) {
  return value == null ? "Sin definir" : `${currency} ${value.toLocaleString()}`;
}

function ComparisonHint({ own, competitor, higherIsBetter }: { own: NumericValue; competitor: NumericValue; higherIsBetter: boolean }) {
  if (own == null || competitor == null) return <span className="inline-flex items-center gap-1 text-ink-muted"><Minus className="h-3 w-3" />Sin referencia</span>;
  if (own === competitor) return <span className="inline-flex items-center gap-1 text-ink-muted"><Minus className="h-3 w-3" />Similar</span>;
  const favorable = higherIsBetter ? own > competitor : own < competitor;
  return favorable
    ? <span className="inline-flex items-center gap-1 text-emerald-600"><ArrowUp className="h-3 w-3" />Te favorece</span>
    : <span className="inline-flex items-center gap-1 text-rose-600"><ArrowDown className="h-3 w-3" />Te desfavorece</span>;
}

function Metric({ label, value, own, competitor, higherIsBetter }: {
  label: string; value: string; own?: NumericValue; competitor?: NumericValue; higherIsBetter?: boolean;
}) {
  return <div className="flex items-start justify-between gap-3 border-t border-line-soft py-3">
    <dt className="text-xs text-ink-muted">{label}</dt>
    <dd className="text-right text-sm font-semibold text-ink">
      <div>{value}</div>
      {higherIsBetter !== undefined && <div className="mt-1 text-xs font-medium"><ComparisonHint own={own} competitor={competitor} higherIsBetter={higherIsBetter} /></div>}
    </dd>
  </div>;
}

function ListingImage({ src, alt }: { src?: string | null; alt: string }) {
  // shortcut: Airbnb serves images from dynamic hosts, so native img avoids a brittle allowlist.
  return src ? <img src={src} alt={alt} className="h-40 w-full object-cover" /> : <div className="flex h-40 items-center justify-center bg-surface text-sm text-ink-muted">Sin foto disponible</div>;
}

function PropertyCard({ property }: { property: Property }) {
  const nightlyRate = asNumber(property.nightly_rate);
  return <article className="h-full w-72 shrink-0 overflow-hidden rounded-xl border border-violet-500/40 bg-surface sm:w-80" aria-label={`Tu propiedad ${property.name}`}>
    <ListingImage src={property.photo_urls?.[0]} alt={`Foto de ${property.name}`} />
    <div className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Tu alojamiento</p>
      <h2 className="mt-1 min-h-12 line-clamp-2 text-base font-semibold text-ink">{property.name}</h2>
      <dl className="mt-3">
        <Metric label="Precio por noche" value={price(nightlyRate, property.currency)} />
        <Metric label="Habitaciones" value={number(property.bedrooms)} />
        <Metric label="Camas" value={number(property.beds)} />
        <Metric label="Baños" value={number(property.bathrooms)} />
        <Metric label="Calificación pública" value="No disponible" />
        <Metric label="Reseñas públicas" value="No disponible" />
      </dl>
    </div>
  </article>;
}

function CompetitorCard({ listing, property, currency }: { listing: MarketListing; property: Property; currency: string }) {
  const ownNightlyRate = asNumber(property.nightly_rate);
  const title = listing.title || "Alojamiento Airbnb";
  return <article className="h-full w-72 shrink-0 snap-start overflow-hidden rounded-xl border border-line-soft bg-surface sm:w-80" aria-label={`Competidor ${title}`}>
    <ListingImage src={listing.image_url} alt={`Foto de ${title}`} />
    <div className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Alojamiento cercano</p>
      <div className="mt-1 flex min-h-12 items-start justify-between gap-2">
        <h2 className="line-clamp-2 text-base font-semibold text-ink">{title}</h2>
        {listing.url && <a href={listing.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${title} en Airbnb`} className="shrink-0 text-ink-muted hover:text-violet-600"><ExternalLink className="h-4 w-4" /></a>}
      </div>
      <dl className="mt-3">
        <Metric label="Precio por noche" value={price(listing.nightly_rate, listing.currency || currency)} own={ownNightlyRate} competitor={listing.nightly_rate} higherIsBetter={false} />
        <Metric label="Habitaciones" value={number(listing.bedrooms)} own={property.bedrooms} competitor={listing.bedrooms} higherIsBetter />
        <Metric label="Camas" value={number(listing.beds)} own={property.beds} competitor={listing.beds} higherIsBetter />
        <Metric label="Baños" value={number(listing.bathrooms)} own={property.bathrooms} competitor={listing.bathrooms} higherIsBetter />
        <Metric label="Calificación pública" value={listing.rating == null ? "—" : listing.rating.toFixed(1)} />
        <Metric label="Reseñas públicas" value={number(listing.public_review_count)} />
      </dl>
      <p className="mt-3 min-h-4 text-xs font-medium text-amber-700">{listing.is_superhost ? "Superhost" : listing.is_guest_favorite ? "Favorito de huéspedes" : ""}</p>
    </div>
  </article>;
}

export function MarketComparisonTable({ property, comparison }: Props) {
  return <section aria-label="Comparación con alojamientos cercanos" className="flex flex-col gap-4 lg:flex-row">
    <PropertyCard property={property} />
    <div className="min-w-0 flex-1">
      <p className="mb-2 text-sm text-ink-muted">Desliza para comparar cada alojamiento con el tuyo. Verde te favorece; rojo te desfavorece.</p>
      <div className="overflow-x-auto pb-3" tabIndex={0} aria-label="Lista desplazable de alojamientos cercanos">
        <div className="flex w-max snap-x snap-mandatory gap-4" role="list">
          {comparison.listings.map((listing) => <div key={listing.id} role="listitem"><CompetitorCard listing={listing} property={property} currency={comparison.currency} /></div>)}
        </div>
      </div>
    </div>
  </section>;
}
