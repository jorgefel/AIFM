"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import type { PropertyPhoto } from "@/types/models";

interface PropertyGalleryProps {
  photos: PropertyPhoto[];
  name: string;
}

export function PropertyGallery({ photos, name }: PropertyGalleryProps) {
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/9] flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 text-ink-muted">
        <Camera className="h-8 w-8" />
        <p className="text-sm">Esta propiedad aún no tiene fotos</p>
      </div>
    );
  }

  const current = photos[Math.min(index, photos.length - 1)];

  return (
    <div className="space-y-3">
      <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={`${name}, foto principal`} className="h-full w-full object-cover" />
      </div>
      {photos.length > 1 && (
        <ul className="grid grid-cols-5 gap-2">
          {photos.map((photo, i) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver foto ${i + 1} de ${photos.length}`}
                aria-current={i === index}
                className={`block w-full overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
                  i === index ? "border-violet-500" : "border-transparent hover:border-violet-200"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="aspect-[4/3] w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
