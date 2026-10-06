"use client";

import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePropertyWizard, WIZARD_STEPS } from "@/hooks/usePropertyWizard";
import { StepIndicator } from "./StepIndicator";
import { BasicsStep } from "./BasicsStep";
import { CapacityPricingStep } from "./CapacityPricingStep";
import { DescriptionAmenitiesStep } from "./DescriptionAmenitiesStep";
import { PhotosStep } from "./PhotosStep";
import { ChannelsReviewStep } from "./ChannelsReviewStep";
import type { Property } from "@/types/models";

interface PropertyWizardProps {
  property?: Property;
}

export function PropertyWizard({ property }: PropertyWizardProps) {
  const router = useRouter();
  const wizard = usePropertyWizard(property);
  const isLast = wizard.step === WIZARD_STEPS.length - 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLast) {
      wizard.submit();
    } else {
      wizard.next();
    }
  };

  const submitLabel = wizard.isEditing ? "Guardar cambios" : "Crear propiedad";

  return (
    <form onSubmit={handleSubmit} className="card-surface space-y-8 p-5 sm:p-8">
      <StepIndicator steps={WIZARD_STEPS} current={wizard.step} onSelect={wizard.goTo} />

      {wizard.isDemoMode && (
        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Estás en modo demo: puedes recorrer el formulario, pero los cambios no se guardan.
        </div>
      )}

      <div className="min-h-[18rem]">
        {wizard.step === 0 && (
          <BasicsStep draft={wizard.draft} errors={wizard.errors} onChange={wizard.updateDraft} />
        )}
        {wizard.step === 1 && (
          <CapacityPricingStep
            draft={wizard.draft}
            errors={wizard.errors}
            onChange={wizard.updateDraft}
          />
        )}
        {wizard.step === 2 && (
          <DescriptionAmenitiesStep
            draft={wizard.draft}
            errors={wizard.errors}
            onChange={wizard.updateDraft}
          />
        )}
        {wizard.step === 3 && (
          <PhotosStep
            urls={wizard.draft.photo_urls}
            messages={wizard.photoMessages}
            onAdd={wizard.addPhotoUrl}
            onRemove={wizard.removePhoto}
            onMakeCover={wizard.makeCover}
          />
        )}
        {wizard.step === 4 && (
          <ChannelsReviewStep
            draft={wizard.draft}
            errors={wizard.errors}
            onChange={wizard.updateDraft}
          />
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-line-soft pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          disabled={wizard.isSubmitting}
          onClick={() => router.push(property ? `/properties/${property.id}` : "/properties")}
        >
          Cancelar
        </Button>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {wizard.step > 0 && (
            <Button
              type="button"
              variant="secondary"
              disabled={wizard.isSubmitting}
              onClick={wizard.back}
            >
              Atrás
            </Button>
          )}
          <Button type="submit" isLoading={wizard.isSubmitting}>
            {isLast ? submitLabel : "Siguiente"}
          </Button>
        </div>
      </div>
    </form>
  );
}
