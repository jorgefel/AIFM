"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  ACCEPTED_PHOTO_TYPES,
  DESCRIPTION_MAX_LENGTH,
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
  MAX_PHOTO_MB,
} from "@/lib/propertyOptions";
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
  price_per_night: string;
  max_guests: string;
  bedrooms: string;
  beds: string;
  bathrooms: string;
  description: string;
  amenities: string[];
  channels: string[];
}

export interface PhotoItem {
  key: string;
  url: string;
  id?: string;
  file?: File;
}

export type DraftErrors = Partial<Record<keyof PropertyDraft, string>>;

function toDraft(property?: Property): PropertyDraft {
  const text = (value: unknown) => (value === null || value === undefined ? "" : String(value));
  return {
    name: property?.name ?? "",
    address: property?.address ?? "",
    currency: property?.currency ?? "USD",
    price_per_night: text(property?.price_per_night),
    max_guests: text(property?.max_guests),
    bedrooms: text(property?.bedrooms),
    beds: text(property?.beds),
    bathrooms: text(property?.bathrooms),
    description: property?.description ?? "",
    amenities: property?.amenities ?? [],
    channels: property?.channels ?? [],
  };
}

function toPhotoItems(property?: Property): PhotoItem[] {
  const photos = [...(property?.photos ?? [])].sort((a, b) => {
    if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
    return (a.position ?? 0) - (b.position ?? 0);
  });
  return photos.map((p) => ({ key: p.id, id: p.id, url: p.url }));
}

function validateStep(step: number, d: PropertyDraft): DraftErrors {
  const errors: DraftErrors = {};

  if (step === 0) {
    if (!d.name.trim()) errors.name = "Escribe el nombre de la propiedad";
    if (!d.address.trim()) errors.address = "Escribe la dirección";
    if (!d.currency) errors.currency = "Selecciona una moneda";
  }

  if (step === 1) {
    const price = Number(d.price_per_night);
    if (!d.price_per_night || !Number.isFinite(price) || price <= 0) {
      errors.price_per_night = "Ingresa un precio mayor a 0";
    }
    const guests = Number(d.max_guests);
    if (!d.max_guests || !Number.isInteger(guests) || guests < 1) {
      errors.max_guests = "Mínimo 1 huésped";
    }
    const bedrooms = Number(d.bedrooms);
    if (d.bedrooms === "" || !Number.isInteger(bedrooms) || bedrooms < 0) {
      errors.bedrooms = "Indica las habitaciones (0 si es estudio)";
    }
    const beds = Number(d.beds);
    if (!d.beds || !Number.isInteger(beds) || beds < 1) {
      errors.beds = "Mínimo 1 cama";
    }
    const bathrooms = Number(d.bathrooms);
    if (!d.bathrooms || !Number.isFinite(bathrooms) || bathrooms <= 0 || (bathrooms * 2) % 1 !== 0) {
      errors.bathrooms = "Usa números como 1, 1.5 o 2";
    }
  }

  if (step === 2) {
    if (d.description.length > DESCRIPTION_MAX_LENGTH) {
      errors.description = `Máximo ${DESCRIPTION_MAX_LENGTH} caracteres`;
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
  const [photos, setPhotos] = useState<PhotoItem[]>(() => toPhotoItems(property));
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [photoMessages, setPhotoMessages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const initialCoverId = useRef(toPhotoItems(property)[0]?.id);
  const photoCounter = useRef(0);
  const photosRef = useRef(photos);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => {
        if (p.file) URL.revokeObjectURL(p.url);
      });
    };
  }, []);

  const updateDraft = useCallback((patch: Partial<PropertyDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      (Object.keys(patch) as (keyof PropertyDraft)[]).forEach((key) => delete next[key]);
      return next;
    });
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const problems: string[] = [];
    const accepted: PhotoItem[] = [];
    let room = MAX_PHOTOS - photosRef.current.length;

    for (const file of files) {
      if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
        problems.push(`${file.name}: usa un archivo JPG, PNG o WebP`);
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        problems.push(`${file.name}: supera los ${MAX_PHOTO_MB} MB`);
        continue;
      }
      if (room <= 0) {
        problems.push(`Solo puedes subir hasta ${MAX_PHOTOS} fotos`);
        break;
      }
      photoCounter.current += 1;
      accepted.push({
        key: `new-${photoCounter.current}`,
        url: URL.createObjectURL(file),
        file,
      });
      room -= 1;
    }

    setPhotoMessages(problems);
    if (accepted.length > 0) setPhotos((prev) => [...prev, ...accepted]);
  }, []);

  const removePhoto = useCallback((key: string) => {
    const target = photosRef.current.find((p) => p.key === key);
    if (!target) return;
    if (target.file) URL.revokeObjectURL(target.url);
    if (target.id) setRemovedIds((prev) => [...prev, target.id as string]);
    setPhotos((prev) => prev.filter((p) => p.key !== key));
    setPhotoMessages([]);
  }, []);

  const makeCover = useCallback((key: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.key === key);
      if (!target) return prev;
      return [target, ...prev.filter((p) => p.key !== key)];
    });
  }, []);

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
    for (let i = 0; i <= 2; i += 1) {
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
      price_per_night: Number(draft.price_per_night),
      max_guests: Number(draft.max_guests),
      bedrooms: Number(draft.bedrooms),
      beds: Number(draft.beds),
      bathrooms: Number(draft.bathrooms),
      description: draft.description.trim(),
      amenities: draft.amenities,
      channels: draft.channels,
    };

    setIsSubmitting(true);
    let propertyId = editingId;

    try {
      const response = editingId
        ? await api.put(`/properties/${editingId}`, payload)
        : await api.post("/properties/", payload);
      propertyId = response.data.id as string;
    } catch {
      toast.error("Error", "No se pudo guardar la propiedad.");
      setIsSubmitting(false);
      return;
    }

    let photoFailures = 0;
    const newPhotos = photos.filter((p) => p.file);
    setProgress({ done: 0, total: newPhotos.length + removedIds.length });
    let done = 0;

    for (const id of removedIds) {
      try {
        await api.delete(`/properties/${propertyId}/photos/${id}`);
      } catch {
        photoFailures += 1;
      }
      done += 1;
      setProgress({ done, total: newPhotos.length + removedIds.length });
    }

    const uploadedIds: Record<string, string> = {};
    for (const photo of newPhotos) {
      try {
        const form = new FormData();
        form.append("file", photo.file as File);
        const res = await api.post(`/properties/${propertyId}/photos`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedIds[photo.key] = res.data.id;
      } catch {
        photoFailures += 1;
      }
      done += 1;
      setProgress({ done, total: newPhotos.length + removedIds.length });
    }

    const cover = photos[0];
    const coverId = cover ? (cover.id ?? uploadedIds[cover.key]) : undefined;
    if (coverId && coverId !== initialCoverId.current) {
      try {
        await api.patch(`/properties/${propertyId}/photos/${coverId}`, { is_cover: true });
      } catch {
        photoFailures += 1;
      }
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: PROPERTIES_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] }),
      queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY }),
    ]);
    setProgress(null);
    setIsSubmitting(false);

    if (photoFailures > 0) {
      toast.warning(
        "Propiedad guardada",
        "Algunas fotos no se pudieron procesar. Vuelve a intentarlo desde la edición.",
      );
      router.push(`/properties/${propertyId}/edit`);
      return;
    }

    toast.success(
      editingId ? "Propiedad actualizada" : "Propiedad creada",
      "La ficha se guardó correctamente.",
    );
    router.push(`/properties/${propertyId}`);
  }, [draft, editingId, isDemoMode, photos, queryClient, removedIds, router, toast]);

  return {
    isEditing: !!editingId,
    isDemoMode,
    step,
    draft,
    errors,
    photos,
    photoMessages,
    isSubmitting,
    progress,
    updateDraft,
    addFiles,
    removePhoto,
    makeCover,
    next,
    back,
    goTo,
    submit,
  };
}
