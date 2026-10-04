import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CURRENCY_OPTIONS } from "@/lib/propertyOptions";
import type { DraftErrors, PropertyDraft } from "@/hooks/usePropertyWizard";

interface StepProps {
  draft: PropertyDraft;
  errors: DraftErrors;
  onChange: (patch: Partial<PropertyDraft>) => void;
}

export function BasicsStep({ draft, errors, onChange }: StepProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Nombre de la propiedad"
        placeholder="Ej. Villa Tulum"
        value={draft.name}
        error={errors.name}
        onChange={(e) => onChange({ name: e.target.value })}
        maxLength={200}
        autoFocus
      />
      <Input
        label="Dirección"
        placeholder="Dirección completa"
        value={draft.address}
        error={errors.address}
        onChange={(e) => onChange({ address: e.target.value })}
        maxLength={500}
      />
      <Select
        label="Moneda principal"
        value={draft.currency}
        error={errors.currency}
        onChange={(e) => onChange({ currency: e.target.value })}
        options={CURRENCY_OPTIONS}
      />
    </div>
  );
}
