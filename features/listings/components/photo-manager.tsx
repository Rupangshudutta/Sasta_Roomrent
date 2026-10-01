"use client";

import { ImagePlus, Star, Trash2, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { PhotoRow } from "@/features/listings/owner-queries";
import { compressImage } from "@/lib/images/compress-image";
import { createClient } from "@/lib/supabase/client";
import { PROPERTY_PHOTOS_BUCKET, propertyPhotoUrl } from "@/lib/supabase/storage";

import { deletePhotoAction, registerPhotoAction, setPrimaryPhotoAction } from "../owner-actions";
import { photoRules } from "../schema";

type PhotoManagerProps = {
  propertyId: string;
  ownerId: string;
  photos: PhotoRow[];
  maxPhotos: number;
};

type UploadItem = {
  id: string;
  name: string;
  status: "compressing" | "uploading" | "done" | "error";
  error?: string;
};

/**
 * Upload flow: pick → validate → compress in the browser → upload straight to
 * Supabase Storage (RLS checks the owner/property path) → register the row via
 * a Server Action → refresh. Each file is independent, so one bad file never
 * blocks the others (unlike the prototype, which uploaded skipped files anyway).
 */
export function PhotoManager({ propertyId, ownerId, photos, maxPhotos }: PhotoManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const remaining = Math.max(0, maxPhotos - photos.length);
  const sorted = [...photos].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );

  function updateItem(id: string, patch: Partial<UploadItem>) {
    setUploads((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setFormError(null);
    const files = Array.from(fileList);
    if (files.length > remaining) {
      setFormError(
        `You can add ${remaining} more photo${remaining === 1 ? "" : "s"} (maximum ${maxPhotos}).`,
      );
      return;
    }
    const supabase = createClient();

    await Promise.all(
      files.map(async (file) => {
        const id = crypto.randomUUID();
        setUploads((items) => [...items, { id, name: file.name, status: "compressing" }]);

        if (!(photoRules.acceptedTypes as readonly string[]).includes(file.type)) {
          updateItem(id, { status: "error", error: "Only JPG, PNG or WebP images are allowed." });
          return;
        }
        if (file.size > photoRules.maxSourceBytes) {
          updateItem(id, { status: "error", error: "Each photo must be under 5 MB." });
          return;
        }

        const compressed = await compressImage(file, {
          maxEdge: photoRules.maxEdge,
          targetBytes: photoRules.targetBytes,
        });
        const ext = compressed.compressed ? "jpg" : extensionFor(file.type);
        const storagePath = `${ownerId}/${propertyId}/${id}.${ext}`;

        updateItem(id, { status: "uploading" });
        const { error: uploadError } = await supabase.storage
          .from(PROPERTY_PHOTOS_BUCKET)
          .upload(storagePath, compressed.blob, {
            contentType: compressed.compressed ? "image/jpeg" : file.type,
            cacheControl: "31536000",
            upsert: false,
          });
        if (uploadError) {
          updateItem(id, { status: "error", error: friendlyStorageError(uploadError.message) });
          return;
        }

        const result = await registerPhotoAction({
          propertyId,
          storagePath,
          width: compressed.width || 1,
          height: compressed.height || 1,
          bytes: compressed.bytes,
        });
        if (!result.ok) {
          updateItem(id, { status: "error", error: result.message });
          return;
        }
        updateItem(id, { status: "done" });
      }),
    );

    startTransition(() => {
      router.refresh();
      setUploads((items) => items.filter((item) => item.status === "error"));
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      {formError ? <Alert tone="error">{formError}</Alert> : null}

      {sorted.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((photo) => (
            <li
              key={photo.id}
              className="group rounded-card-sm border-border bg-surface relative overflow-hidden border"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={propertyPhotoUrl(photo.storage_path)}
                  alt={photo.is_primary ? "Cover photo" : "Listing photo"}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              {photo.is_primary ? (
                <span className="rounded-pill bg-primary absolute top-2 left-2 inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold text-white">
                  <Star className="h-3 w-3 fill-current" aria-hidden /> Cover
                </span>
              ) : null}
              <div className="flex items-center justify-between gap-2 p-2">
                {!photo.is_primary ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await setPrimaryPhotoAction(photo.id, propertyId);
                        if (!result.ok) setFormError(result.message);
                        router.refresh();
                      })
                    }
                  >
                    <Star className="h-4 w-4" aria-hidden /> Make cover
                  </Button>
                ) : (
                  <span />
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:bg-danger/10"
                  disabled={pending}
                  aria-label="Remove photo"
                  onClick={() => {
                    if (!window.confirm("Remove this photo?")) return;
                    startTransition(async () => {
                      const result = await deletePhotoAction(photo.id, propertyId);
                      if (!result.ok) setFormError(result.message);
                      router.refresh();
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {uploads.length > 0 ? (
        <ul className="space-y-1 text-sm" aria-live="polite">
          {uploads.map((item) => (
            <li
              key={item.id}
              className="rounded-card-sm bg-surface flex items-center justify-between gap-3 px-3 py-2"
            >
              <span className="truncate">{item.name}</span>
              <span className={item.status === "error" ? "text-danger" : "text-muted"}>
                {item.status === "compressing" && "Compressing…"}
                {item.status === "uploading" && "Uploading…"}
                {item.status === "done" && "Uploaded"}
                {item.status === "error" && item.error}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <label
        className={`rounded-card flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-10 text-center transition ${
          remaining === 0
            ? "border-border bg-surface cursor-not-allowed opacity-60"
            : "border-primary/40 bg-primary/5 hover:border-primary"
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (remaining > 0) void handleFiles(e.dataTransfer.files);
        }}
      >
        <UploadCloud className="text-primary h-9 w-9" aria-hidden />
        <span className="font-semibold">
          {sorted.length === 0 ? "Upload property photos" : "Add more photos"}
        </span>
        <span className="text-muted text-sm">
          Click to browse or drag and drop. JPG, PNG or WebP, up to 5 MB each. {remaining} of{" "}
          {maxPhotos} slots left.
        </span>
        <span className="rounded-pill bg-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white">
          <ImagePlus className="h-4 w-4" aria-hidden /> Choose photos
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={photoRules.acceptedTypes.join(",")}
          multiple
          disabled={remaining === 0}
          className="sr-only"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </label>
      <p className="text-muted text-xs">
        Photos are compressed in your browser before upload (max 1600px). The first photo becomes
        the cover; you can change it any time.
      </p>
    </div>
  );
}

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function friendlyStorageError(message: string) {
  if (/row-level security|policy|unauthorized|403/i.test(message))
    return "You are not allowed to upload to this listing.";
  if (/exceeded|size/i.test(message)) return "The file is too large.";
  if (/mime|type/i.test(message)) return "Unsupported image type.";
  return "Upload failed. Please try again.";
}
