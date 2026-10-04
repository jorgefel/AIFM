import { useState } from "react";
import { ImagePlus, Star, X } from "lucide-react";
import {
  ACCEPTED_PHOTO_TYPES,
  MAX_PHOTOS,
  MAX_PHOTO_MB,
} from "@/lib/propertyOptions";
import type { PhotoItem } from "@/hooks/usePropertyWizard";

interface PhotosStepProps {
  photos: PhotoItem[];
  messages: string[];
  onAdd: (files: File[]) => void;
  onRemove: (key: string) => void;
  onMakeCover: (key: string) => void;
}

export function PhotosStep({ photos, messages, onAdd, onRemove, onMakeCover }: PhotosStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const isFull = photos.length >= MAX_PHOTOS;

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-muted">
        Sube hasta {MAX_PHOTOS} fotos en JPG, PNG o WebP de máximo {MAX_PHOTO_MB} MB cada una. La
        primera foto es la portada de la propiedad.
      </p>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!isFull) onAdd(Array.from(e.dataTransfer.files));
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-within:border-violet-500 ${
          isFull
            ? "cursor-not-allowed border-line bg-surface opacity-60"
            : isDragging
              ? "border-violet-400 bg-violet-50"
              : "border-line-strong bg-surface hover:border-violet-300 hover:bg-violet-50/50"
        }`}
      >
        <ImagePlus className="h-8 w-8 text-violet-500" />
        <span className="text-sm font-medium text-ink">
          {isFull ? "Llegaste al máximo de fotos" : "Arrastra tus fotos aquí o haz clic para elegirlas"}
        </span>
        <span className="text-xs text-ink-muted">
          {photos.length} de {MAX_PHOTOS} fotos
        </span>
        <input
          type="file"
          multiple
          disabled={isFull}
          accept={ACCEPTED_PHOTO_TYPES.join(",")}
          className="sr-only"
          onChange={(e) => {
            onAdd(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </label>

      {messages.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <li
              key={photo.key}
              className="group relative overflow-hidden rounded-xl border border-line bg-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`Foto ${index + 1} de la propiedad`}
                className="aspect-[4/3] w-full object-cover"
              />
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-violet-500 px-2 py-0.5 text-xs font-medium text-white">
                  Portada
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {index !== 0 ? (
                  <button
                    type="button"
                    onClick={() => onMakeCover(photo.key)}
                    className="flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-ink hover:bg-card"
                  >
                    <Star className="h-3 w-3" />
                    Hacer portada
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => onRemove(photo.key)}
                  aria-label={`Quitar foto ${index + 1}`}
                  className="rounded-md bg-white/90 p-1 text-ink hover:bg-card"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
