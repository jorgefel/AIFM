import { Input } from "@/components/ui/Input";
import type { DraftErrors, PropertyDraft } from "@/hooks/usePropertyWizard";

interface StepProps {
  draft: PropertyDraft;
  errors: DraftErrors;
  onChange: (patch: Partial<PropertyDraft>) => void;
}

export function CapacityPricingStep({ draft, errors, onChange }: StepProps) {
  return (
    <div className="space-y-4">
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        label={`Precio por noche (${draft.currency})`}
        placeholder="450"
        value={draft.price_per_night}
        error={errors.price_per_night}
        onChange={(e) => onChange({ price_per_night: e.target.value })}
        autoFocus
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          label="Huéspedes máximos"
          value={draft.max_guests}
          error={errors.max_guests}
          onChange={(e) => onChange({ max_guests: e.target.value })}
        />
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          label="Habitaciones"
          value={draft.bedrooms}
          error={errors.bedrooms}
          onChange={(e) => onChange({ bedrooms: e.target.value })}
        />
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          label="Camas"
          value={draft.beds}
          error={errors.beds}
          onChange={(e) => onChange({ beds: e.target.value })}
        />
        <Input
          type="number"
          inputMode="decimal"
          min={0.5}
          step={0.5}
          label="Baños"
          value={draft.bathrooms}
          error={errors.bathrooms}
          onChange={(e) => onChange({ bathrooms: e.target.value })}
        />
      </div>
    </div>
  );
}
