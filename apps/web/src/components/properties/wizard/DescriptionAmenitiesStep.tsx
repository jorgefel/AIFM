import { Textarea } from "@/components/ui/Textarea";
import { AMENITY_OPTIONS, DESCRIPTION_MAX_LENGTH } from "@/lib/propertyOptions";
import { getAmenityIcon } from "../amenityIcons";
import { ToggleChip } from "./ToggleChip";
import type { DraftErrors, PropertyDraft } from "@/hooks/usePropertyWizard";

interface StepProps {
  draft: PropertyDraft;
  errors: DraftErrors;
  onChange: (patch: Partial<PropertyDraft>) => void;
}

export function DescriptionAmenitiesStep({ draft, errors, onChange }: StepProps) {
  const toggleAmenity = (id: string, checked: boolean) => {
    onChange({
      amenities: checked
        ? [...draft.amenities, id]
        : draft.amenities.filter((a) => a !== id),
    });
  };

  return (
    <div className="space-y-6">
      <Textarea
        label="Descripción"
        rows={6}
        placeholder="Cuenta cómo es la propiedad, el entorno y lo que la hace especial"
        value={draft.description}
        error={errors.description}
        hint={`${draft.description.length} de ${DESCRIPTION_MAX_LENGTH} caracteres`}
        onChange={(e) => onChange({ description: e.target.value })}
      />

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink/80">Amenidades</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {AMENITY_OPTIONS.map((amenity) => (
            <ToggleChip
              key={amenity.id}
              label={amenity.label}
              icon={getAmenityIcon(amenity.id)}
              checked={draft.amenities.includes(amenity.id)}
              onChange={(checked) => toggleAmenity(amenity.id, checked)}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
