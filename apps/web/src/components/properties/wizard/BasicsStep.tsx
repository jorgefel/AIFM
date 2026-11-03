import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CURRENCY_OPTIONS, PROPERTY_TYPE_OPTIONS } from "@/lib/propertyOptions";
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="País" placeholder="Colombia" value={draft.country} error={errors.country} onChange={(e) => onChange({ country: e.target.value })} maxLength={100} />
        <Input label="Ciudad" placeholder="Cartagena" value={draft.city} error={errors.city} onChange={(e) => onChange({ city: e.target.value })} maxLength={100} />
        <Input label="Barrio" placeholder="Getsemaní" value={draft.neighborhood} error={errors.neighborhood} onChange={(e) => onChange({ neighborhood: e.target.value })} maxLength={100} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Tipo de propiedad"
          value={draft.property_type}
          error={errors.property_type}
          onChange={(e) => onChange({ property_type: e.target.value })}
          options={PROPERTY_TYPE_OPTIONS}
        />
        <Select
          label="Moneda principal"
          value={draft.currency}
          error={errors.currency}
          onChange={(e) => onChange({ currency: e.target.value })}
          options={CURRENCY_OPTIONS}
        />
      </div>
    </div>
  );
}
