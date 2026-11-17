"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { resolvePhotoUrl } from "@/lib/resolvePhotoUrl";

interface PropertyGalleryProps {
  photos: string[];
  name: string;
}

export function PropertyGallery({ photos, name }: PropertyGalleryProps) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());

  const available = photos.filter((url) => !failed.has(url));
  const markFailed = (url: string) => setFailed((prev) => new Set(prev).add(url));

  if (available.length === 0) {
    return (
      <div className="flex aspect-[16/9] flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 text-ink-muted">
        <Camera className="h-8 w-8" />
        <p className="text-sm">Esta propiedad aún no tiene fotos</p>
      </div>
    );
  }

  const current = available[Math.min(index, available.length - 1)];

  return (
    <div className="space-y-3">
      <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvePhotoUrl(current)}
          alt={`${name}, foto principal`}
          onError={() => markFailed(current)}
          className="h-full w-full object-cover"
        />
      </div>
      {available.length > 1 && (
        <ul className="grid grid-cols-5 gap-2">
          {available.map((url, i) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver foto ${i + 1} de ${available.length}`}
                aria-current={i === index}
                className={`block w-full overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline-2 focus-visible:outline-violet-500 ${
                  i === index ? "border-violet-500" : "border-transparent hover:border-violet-200"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolvePhotoUrl(url)} alt="" onError={() => markFailed(url)} className="aspect-[4/3] w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
