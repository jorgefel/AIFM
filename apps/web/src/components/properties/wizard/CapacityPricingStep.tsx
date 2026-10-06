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
        value={draft.nightly_rate}
        error={errors.nightly_rate}
        onChange={(e) => onChange({ nightly_rate: e.target.value })}
        autoFocus
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
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
          max={50}
          step={1}
          label="Habitaciones"
          value={draft.bedrooms}
          error={errors.bedrooms}
          onChange={(e) => onChange({ bedrooms: e.target.value })}
        />
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          max={50}
          step={1}
          label="Baños"
          value={draft.bathrooms}
          error={errors.bathrooms}
          onChange={(e) => onChange({ bathrooms: e.target.value })}
        />
      </div>
    </div>
  );
}
