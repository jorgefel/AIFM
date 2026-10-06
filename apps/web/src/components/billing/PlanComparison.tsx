import { Check, Minus } from "lucide-react";
import { PLAN_FEATURES } from "@/lib/plans";

function Cell({ included }: { included: boolean }) {
  return (
    <td className="px-4 py-3.5 text-center">
      {included ? (
        <>
          <Check className="mx-auto h-5 w-5 text-violet-500" aria-hidden="true" />
          <span className="sr-only">Incluido</span>
        </>
      ) : (
        <>
          <Minus className="mx-auto h-5 w-5 text-ink/25" aria-hidden="true" />
          <span className="sr-only">No incluido</span>
        </>
      )}
    </td>
  );
}

export function PlanComparison() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line-soft bg-card">
      <table className="w-full min-w-[32rem] border-collapse text-left">
        <caption className="sr-only">Comparación de funciones entre los planes Gratis y Pro</caption>
        <thead>
          <tr className="border-b border-line-soft bg-surface text-xs font-semibold uppercase tracking-wider text-ink-muted">
            <th scope="col" className="px-4 py-3.5">Función</th>
            <th scope="col" className="w-28 px-4 py-3.5 text-center">Gratis</th>
            <th scope="col" className="w-28 px-4 py-3.5 text-center text-violet-600">Pro</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {PLAN_FEATURES.map((feature) => (
            <tr key={feature.label}>
              <th scope="row" className="px-4 py-3.5 text-sm font-normal text-ink">
                {feature.label}
              </th>
              <Cell included={feature.free} />
              <Cell included={feature.pro} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
