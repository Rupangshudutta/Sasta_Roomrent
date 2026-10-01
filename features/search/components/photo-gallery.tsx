"use client";

import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { propertyPhotoUrl } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils/cn";

type Photo = { id: string; storage_path: string; is_primary: boolean; sort_order: number };

/** Main image + thumbnail strip, keyboard navigable, no external carousel dependency. */
export function PhotoGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const sorted = [...photos].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  const [index, setIndex] = useState(0);
  const current = sorted[index];

  if (!current) {
    return (
      <div className="rounded-card bg-surface text-muted flex aspect-[16/10] w-full flex-col items-center justify-center gap-2">
        <ImageOff className="h-8 w-8" aria-hidden />
        <p className="text-sm">No photos uploaded yet</p>
      </div>
    );
  }

  const go = (delta: number) => setIndex((i) => (i + delta + sorted.length) % sorted.length);

  return (
    <figure className="space-y-3">
      <div className="rounded-card bg-surface relative aspect-[16/10] w-full overflow-hidden">
        <Image
          key={current.id}
          src={propertyPhotoUrl(current.storage_path)}
          alt={`${title} – photo ${index + 1} of ${sorted.length}`}
          fill
          priority={index === 0}
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />
        {sorted.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
            <span className="rounded-pill bg-ink/70 absolute right-3 bottom-3 px-2.5 py-0.5 text-xs text-white">
              {index + 1} / {sorted.length}
            </span>
          </>
        ) : null}
      </div>
      {sorted.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Photo thumbnails">
          {sorted.map((photo, i) => (
            <li key={photo.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "relative h-16 w-24 overflow-hidden rounded-md border-2",
                  i === index
                    ? "border-primary"
                    : "border-transparent opacity-80 hover:opacity-100",
                )}
              >
                <Image
                  src={propertyPhotoUrl(photo.storage_path)}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </figure>
  );
}
