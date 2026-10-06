import { useState } from "react";
import { ImageOff, ImagePlus, Star, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MAX_PHOTOS } from "@/lib/propertyOptions";

interface PhotosStepProps {
  urls: string[];
  messages: string[];
  onAdd: (url: string) => boolean;
  onRemove: (url: string) => void;
  onMakeCover: (url: string) => void;
}

function PhotoThumb({ url, alt }: { url: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 bg-surface px-2 text-center text-xs text-ink-muted">
        <ImageOff className="h-5 w-5" aria-hidden="true" />
        No se pudo cargar la imagen
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} onError={() => setFailed(true)} className="aspect-[4/3] w-full object-cover" />
  );
}

export function PhotosStep({ urls, messages, onAdd, onRemove, onMakeCover }: PhotosStepProps) {
  const [value, setValue] = useState("");
  const isFull = urls.length >= MAX_PHOTOS;

  const add = () => {
    if (onAdd(value)) setValue("");
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-muted">
        Agrega hasta {MAX_PHOTOS} fotos pegando la dirección (https) de una imagen ya publicada en
        internet. La primera es la portada de la propiedad.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1.5 block text-sm font-medium text-ink/80">Dirección de la imagen</span>
          <input
            type="url"
            inputMode="url"
            value={value}
            disabled={isFull}
            placeholder="https://..."
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder-ink-muted/60 transition-all focus:border-violet-400 focus:bg-card focus:outline-none focus:ring-2 focus:ring-violet-500/15 disabled:opacity-60"
          />
        </label>
        <Button type="button" variant="secondary" disabled={isFull || !value.trim()} onClick={add}>
          <ImagePlus className="mr-2 h-4 w-4" />
          Agregar foto
        </Button>
      </div>

      <p className="text-xs text-ink-muted">
        {urls.length} de {MAX_PHOTOS} fotos
      </p>

      {messages.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}

      {urls.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {urls.map((url, index) => (
            <li key={url} className="group relative overflow-hidden rounded-xl border border-line bg-surface">
              <PhotoThumb url={url} alt={`Foto ${index + 1} de la propiedad`} />
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-violet-500 px-2 py-0.5 text-xs font-medium text-white">
                  Portada
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {index !== 0 ? (
                  <button
                    type="button"
                    onClick={() => onMakeCover(url)}
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
                  onClick={() => onRemove(url)}
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
