"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { DESCRIPTION_MAX_LENGTH, MAX_PHOTOS } from "@/lib/propertyOptions";
import { PROPERTIES_QUERY_KEY } from "./useProperties";
import { PORTFOLIO_QUERY_KEY } from "./usePortfolio";
import type { Property } from "@/types/models";

export const WIZARD_STEPS = [
  { id: "basics", label: "Información" },
  { id: "capacity", label: "Capacidad y precio" },
  { id: "details", label: "Descripción" },
  { id: "photos", label: "Fotos" },
  { id: "channels", label: "Canales" },
] as const;

export interface PropertyDraft {
  name: string;
  address: string;
  currency: string;
  property_type: string;
  nightly_rate: string;
  max_guests: string;
  bedrooms: string;
  bathrooms: string;
  description: string;
  amenities: string[];
  published_platforms: string[];
  photo_urls: string[];
}

export type DraftErrors = Partial<Record<keyof PropertyDraft, string>>;

function toDraft(property?: Property): PropertyDraft {
  const text = (value: unknown) => (value === null || value === undefined ? "" : String(value));
  return {
    name: property?.name ?? "",
    address: property?.address ?? "",
    currency: property?.currency ?? "USD",
    property_type: property?.property_type ?? "apartment",
    nightly_rate: text(property?.nightly_rate),
    max_guests: text(property?.max_guests),
    bedrooms: text(property?.bedrooms),
    bathrooms: text(property?.bathrooms),
    description: property?.description ?? "",
    amenities: property?.amenities ?? [],
    published_platforms: property?.published_platforms ?? [],
    photo_urls: property?.photo_urls ?? [],
  };
}

function isInteger(value: string, min: number, max: number): boolean {
  const n = Number(value);
  return value !== "" && Number.isInteger(n) && n >= min && n <= max;
}

function validateStep(step: number, d: PropertyDraft): DraftErrors {
  const errors: DraftErrors = {};

  if (step === 0) {
    if (!d.name.trim()) errors.name = "Escribe el nombre de la propiedad";
    if (!d.address.trim()) errors.address = "Escribe la dirección";
    if (!d.currency) errors.currency = "Selecciona una moneda";
    if (!d.property_type) errors.property_type = "Selecciona el tipo de propiedad";
  }

  if (step === 1) {
    const price = Number(d.nightly_rate);
    if (!d.nightly_rate || !Number.isFinite(price) || price <= 0) {
      errors.nightly_rate = "Ingresa un precio mayor a 0";
    }
    if (!isInteger(d.max_guests, 1, 100)) errors.max_guests = "Indica entre 1 y 100 huéspedes";
    if (!isInteger(d.bedrooms, 0, 50)) errors.bedrooms = "Indica las habitaciones (0 si es estudio)";
    if (!isInteger(d.bathrooms, 0, 50)) errors.bathrooms = "Usa un número entero de baños";
  }

  if (step === 2) {
    if (d.description.length > DESCRIPTION_MAX_LENGTH) {
      errors.description = `Máximo ${DESCRIPTION_MAX_LENGTH} caracteres`;
    }
  }

  if (step === 4) {
    if (d.published_platforms.length === 0) {
      errors.published_platforms = "Selecciona al menos un canal";
    }
  }

  return errors;
}

export function usePropertyWizard(property?: Property) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isDemoMode } = useAuth();
  const editingId = property?.id ?? null;

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<PropertyDraft>(() => toDraft(property));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [photoMessages, setPhotoMessages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateDraft = useCallback((patch: Partial<PropertyDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      (Object.keys(patch) as (keyof PropertyDraft)[]).forEach((key) => delete next[key]);
      return next;
    });
  }, []);

  const addPhotoUrl = useCallback(
    (raw: string): boolean => {
      const url = raw.trim();
      let message = "";

      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:") message = "La dirección debe empezar por https://";
      } catch {
        message = "Escribe una dirección de imagen válida";
      }
      if (!message && draft.photo_urls.includes(url)) message = "Esa foto ya está en la lista";
      if (!message && draft.photo_urls.length >= MAX_PHOTOS) message = `Solo puedes agregar hasta ${MAX_PHOTOS} fotos`;

      setPhotoMessages(message ? [message] : []);
      if (message) return false;

      updateDraft({ photo_urls: [...draft.photo_urls, url] });
      return true;
    },
    [draft.photo_urls, updateDraft],
  );

  const removePhoto = useCallback(
    (url: string) => {
      updateDraft({ photo_urls: draft.photo_urls.filter((u) => u !== url) });
      setPhotoMessages([]);
    },
    [draft.photo_urls, updateDraft],
  );

  const makeCover = useCallback(
    (url: string) => {
      updateDraft({ photo_urls: [url, ...draft.photo_urls.filter((u) => u !== url)] });
    },
    [draft.photo_urls, updateDraft],
  );

  const next = useCallback(() => {
    const found = validateStep(step, draft);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  }, [step, draft]);

  const back = useCallback(() => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const goTo = useCallback(
    (target: number) => {
      if (target <= step) {
        setErrors({});
        setStep(target);
      }
    },
    [step],
  );

  const submit = useCallback(async () => {
    for (let i = 0; i < WIZARD_STEPS.length; i += 1) {
      const found = validateStep(i, draft);
      if (Object.keys(found).length > 0) {
        setErrors(found);
        setStep(i);
        return;
      }
    }

    if (isDemoMode) {
      toast.info("Modo demo", "En modo demo los cambios no se guardan.");
      router.push("/properties");
      return;
    }

    const payload = {
      name: draft.name.trim(),
      address: draft.address.trim(),
      currency: draft.currency,
      property_type: draft.property_type,
      nightly_rate: Number(draft.nightly_rate),
      max_guests: Number(draft.max_guests),
      bedrooms: Number(draft.bedrooms),
      bathrooms: Number(draft.bathrooms),
      description: draft.description.trim() || null,
      amenities: draft.amenities,
      published_platforms: draft.published_platforms,
      photo_urls: draft.photo_urls,
    };

    setIsSubmitting(true);
    try {
      const response = editingId
        ? await api.put(`/properties/${editingId}`, payload)
        : await api.post("/properties/", payload);
      const propertyId = response.data.id as string;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ["property", propertyId] }),
        queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY }),
      ]);

      toast.success(
        editingId ? "Propiedad actualizada" : "Propiedad creada",
        "La ficha se guardó correctamente.",
      );
      router.push(`/properties/${propertyId}`);
    } catch {
      toast.error("Error", "No se pudo guardar la propiedad.");
    } finally {
      setIsSubmitting(false);
    }
  }, [draft, editingId, isDemoMode, queryClient, router, toast]);

  return {
    isEditing: !!editingId,
    isDemoMode,
    step,
    draft,
    errors,
    photoMessages,
    isSubmitting,
    updateDraft,
    addPhotoUrl,
    removePhoto,
    makeCover,
    next,
    back,
    goTo,
    submit,
  };
}
