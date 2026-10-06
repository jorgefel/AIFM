import {
  CHANNEL_OPTIONS,
  formatNightlyPrice,
  getChannelLabel,
} from "@/lib/propertyOptions";
import { ToggleChip } from "./ToggleChip";
import type { PropertyDraft } from "@/hooks/usePropertyWizard";

interface ChannelsReviewStepProps {
  draft: PropertyDraft;
  photoCount: number;
  onChange: (patch: Partial<PropertyDraft>) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-sm text-ink-muted">{label}</dt>
      <dd className="text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

export function ChannelsReviewStep({ draft, photoCount, onChange }: ChannelsReviewStepProps) {
  const toggleChannel = (id: string, checked: boolean) => {
    onChange({
      channels: checked ? [...draft.channels, id] : draft.channels.filter((c) => c !== id),
    });
  };

  const price = formatNightlyPrice(draft.price_per_night, draft.currency);

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-medium text-ink/80">Canales donde publicas</legend>
        <p className="mb-2 mt-1 text-xs text-ink-muted">
          Indica en qué plataformas está publicada esta propiedad. Es solo informativo, no
          conecta ninguna cuenta.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CHANNEL_OPTIONS.map((channel) => (
            <ToggleChip
              key={channel.id}
              label={channel.label}
              checked={draft.channels.includes(channel.id)}
              onChange={(checked) => toggleChannel(channel.id, checked)}
            />
          ))}
        </div>
      </fieldset>

      <section aria-labelledby="review-title" className="rounded-xl bg-surface p-4">
        <h3 id="review-title" className="mb-1 text-sm font-semibold text-ink">
          Resumen
        </h3>
        <dl className="divide-y divide-line-soft">
          <Row label="Propiedad">{draft.name}</Row>
          <Row label="Dirección">{draft.address}</Row>
          <Row label="Precio por noche">{price ?? "Sin definir"}</Row>
          <Row label="Capacidad">
            {draft.max_guests} huéspedes, {draft.bedrooms} habitaciones, {draft.beds} camas,{" "}
            {draft.bathrooms} baños
          </Row>
          <Row label="Amenidades">{draft.amenities.length} seleccionadas</Row>
          <Row label="Fotos">{photoCount}</Row>
          <Row label="Canales">
            {draft.channels.length > 0
              ? draft.channels.map(getChannelLabel).join(", ")
              : "Ninguno"}
          </Row>
        </dl>
      </section>
    </div>
  );
}
