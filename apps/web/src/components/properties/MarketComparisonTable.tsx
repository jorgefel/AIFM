import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { Property } from "@/types/models";
import type { MarketComparison } from "@/types/marketComparison";

type Props = { property: Property; comparison: MarketComparison };

function Position({ value, median, higherIsBetter }: { value: number | null | undefined; median: number | null | undefined; higherIsBetter: boolean }) {
  if (value == null || median == null || median === 0) return <span className="inline-flex items-center gap-1 text-ink-muted"><Minus className="h-3.5 w-3.5" />Sin datos</span>;
  const difference = (value - median) / median;
  if (Math.abs(difference) <= 0.05) return <span className="inline-flex items-center gap-1 text-ink-muted"><Minus className="h-3.5 w-3.5" />Similar</span>;
  const favorable = higherIsBetter ? difference > 0 : difference < 0;
  return favorable ? <span className="inline-flex items-center gap-1 text-emerald-600"><ArrowUp className="h-3.5 w-3.5" />Ventaja</span> : <span className="inline-flex items-center gap-1 text-rose-600"><ArrowDown className="h-3.5 w-3.5" />Desventaja</span>;
}

export function MarketComparisonTable({ property, comparison }: Props) {
  const aggregates = comparison.aggregates;
  const propertyNightlyRate = typeof property.nightly_rate === "number"
    ? property.nightly_rate
    : typeof property.nightly_rate === "string" && property.nightly_rate.trim() !== ""
      ? Number(property.nightly_rate)
      : null;
  return (
    <div className="overflow-x-auto rounded-xl border border-line-soft">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">Comparación entre tu propiedad y los alojamientos Airbnb encontrados</caption>
        <thead className="bg-surface text-xs uppercase tracking-wide text-ink-muted">
          <tr>
            <th className="px-4 py-3">Alojamiento</th>
            <th className="px-4 py-3">Precio/noche</th>
            <th className="px-4 py-3">Calificación</th>
            <th className="px-4 py-3">Reseñas públicas</th>
            <th className="px-4 py-3">Camas</th>
            <th className="px-4 py-3">Posición</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          <tr className="bg-violet-50/60">
            <th scope="row" className="px-4 py-3 font-semibold text-ink">Tu propiedad: {property.name}</th>
            <td className="px-4 py-3">{property.nightly_rate == null ? "Sin definir" : `${property.currency} ${property.nightly_rate.toLocaleString()}`}</td>
            <td className="px-4 py-3 text-ink-muted">No disponible</td>
            <td className="px-4 py-3 text-ink-muted">No disponible</td>
            <td className="px-4 py-3">—</td>
            <td className="px-4 py-3"><Position value={Number.isFinite(propertyNightlyRate) ? propertyNightlyRate : null} median={aggregates?.median_nightly_rate} higherIsBetter={false} /></td>
          </tr>
          {comparison.listings.map((listing) => (
            <tr key={listing.id}>
              <th scope="row" className="px-4 py-3 font-medium text-ink">
                {listing.url ? (
                  <a className="hover:text-violet-600 hover:underline" href={listing.url} target="_blank" rel="noreferrer">
                    {listing.title || "Alojamiento Airbnb"}
                  </a>
                ) : listing.title || "Alojamiento Airbnb"}
              </th>
              <td className="px-4 py-3">
                {listing.nightly_rate == null ? "—" : `${listing.currency || comparison.currency || ""} ${listing.nightly_rate.toLocaleString()}`}
              </td>
              <td className="px-4 py-3">{listing.rating?.toFixed(1) ?? "—"}</td>
              <td className="px-4 py-3">{listing.public_review_count ?? "—"}</td>
              <td className="px-4 py-3">{listing.beds ?? "—"}</td>
              <td className="px-4 py-3 text-ink-muted">Referencia del mercado</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
