import { useState, useRef } from "react";
import { ImageOff, ImagePlus, Loader2, Star, UploadCloud, X, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MAX_PHOTOS } from "@/lib/propertyOptions";
import { api } from "@/lib/api";

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

async function compressImageFile(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_DIM = 1600;
      let width = img.width;
      let height = img.height;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const mime = file.type === "image/png" ? "image/jpeg" : file.type;
      canvas.toBlob(
        (blob) => {
          resolve(blob || file);
        },
        mime,
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

export function PhotosStep({ urls, messages, onAdd, onRemove, onMakeCover }: PhotosStepProps) {
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFull = urls.length >= MAX_PHOTOS;

  const handleAddUrl = () => {
    if (onAdd(urlInput)) {
      setUrlInput("");
      setShowUrlInput(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Formato no compatible. Por favor sube una imagen JPG, PNG o WebP.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("El archivo original supera los 10MB. Elige una imagen más liviana.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setUploading(true);
      const compressedBlob = await compressImageFile(file);
      const ext = file.type === "image/png" ? "jpg" : file.name.split(".").pop() || "jpg";
      const formData = new FormData();
      formData.append("file", compressedBlob, `photo.${ext}`);

      const res = await api.post<{ url: string }>("/properties/upload-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.url) {
        onAdd(res.data.url);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const msg = axiosErr.response?.data?.detail || "No fue posible subir la imagen. Intenta de nuevo.";
      setUploadError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-medium text-ink">Fotos de la propiedad (opcional)</h3>
        <p className="text-sm text-ink-muted">
          Sube fotos directamente desde tu dispositivo o agrega un enlace. Puedes agregar hasta {MAX_PHOTOS} fotos;
          la primera será la portada.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => !isFull && !uploading && fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
          isFull
            ? "border-line bg-surface/50 opacity-60 cursor-not-allowed"
            : uploading
            ? "border-violet-400 bg-violet-50/30 cursor-wait"
            : "border-violet-300/80 bg-violet-50/20 hover:border-violet-500 hover:bg-violet-50/40 cursor-pointer"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={isFull || uploading}
          onChange={handleFileChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-violet-700">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm font-medium">Optimizando y subiendo imagen...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-violet-100 p-3 text-violet-700">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                {isFull ? "Límite de fotos alcanzado" : "Haz clic para subir una foto desde tu equipo"}
              </p>
              <p className="text-xs text-ink-muted">JPG, PNG o WebP (optimización automática a &lt;5MB)</p>
            </div>
          </div>
        )}
      </div>

      {/* Alternate URL link */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 hover:underline"
        >
          <LinkIcon className="h-3.5 w-3.5" />
          {showUrlInput ? "Ocultar opción de pegar URL" : "O pegar dirección web de imagen"}
        </button>
        <span className="text-xs text-ink-muted">
          {urls.length} de {MAX_PHOTOS} fotos
        </span>
      </div>

      {showUrlInput && (
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="mb-1.5 block text-xs font-medium text-ink/80">Dirección de la imagen (HTTPS)</span>
            <input
              type="url"
              inputMode="url"
              value={urlInput}
              disabled={isFull}
              placeholder="https://..."
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              className="w-full rounded-lg border border-line bg-card px-4 py-2 text-sm text-ink placeholder-ink-muted/60 transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/15 disabled:opacity-60"
            />
          </label>
          <Button type="button" variant="secondary" disabled={isFull || !urlInput.trim()} onClick={handleAddUrl}>
            <ImagePlus className="mr-2 h-4 w-4" />
            Agregar foto
          </Button>
        </div>
      )}

      {/* Errors and messages */}
      {(uploadError || messages.length > 0) && (
        <div role="alert" className="space-y-1 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {uploadError && <p>{uploadError}</p>}
          {messages.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      )}

      {/* Image list */}
      {urls.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {urls.map((url, index) => (
            <li key={url} className="group relative overflow-hidden rounded-xl border border-line bg-surface">
              <PhotoThumb url={url} alt={`Foto ${index + 1} de la propiedad`} />
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-violet-600 px-2 py-0.5 text-xs font-medium text-white shadow-sm">
                  Portada
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {index !== 0 ? (
                  <button
                    type="button"
                    onClick={() => onMakeCover(url)}
                    className="flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-xs font-medium text-ink hover:bg-card"
                  >
                    <Star className="h-3 w-3 text-amber-500" />
                    Hacer portada
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => onRemove(url)}
                  aria-label={`Quitar foto ${index + 1}`}
                  className="rounded-md bg-white/95 p-1 text-ink hover:bg-card"
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
