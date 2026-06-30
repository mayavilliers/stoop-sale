"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Star, X, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MAX_PHOTOS = 8;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "sale-photos";

type Photo = {
  key: string;
  url: string | null;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  error?: string;
};

function extFor(type: string) {
  return type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
}

export function PhotoUploader({ initialUrls = [] }: { initialUrls?: string[] }) {
  const supabase = createClient();
  const [photos, setPhotos] = useState<Photo[]>(
    initialUrls.map((url, i) => ({
      key: `init-${i}-${url}`,
      url,
      previewUrl: url,
      status: "done",
    }))
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setFormError(null);

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setFormError(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const chosen = Array.from(files).slice(0, room);

    for (const file of chosen) {
      if (!ACCEPTED.includes(file.type)) {
        setFormError("Photos must be JPG, PNG, or WebP.");
        continue;
      }
      if (file.size > MAX_BYTES) {
        setFormError("Each photo must be 10 MB or smaller.");
        continue;
      }

      const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = URL.createObjectURL(file);
      setPhotos((p) => [...p, { key, url: null, previewUrl, status: "uploading" }]);

      try {
        const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
        if (!uid) throw new Error("not signed in");
        const path = `${uid}/${key}.${extFor(file.type)}`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        setPhotos((p) =>
          p.map((ph) => (ph.key === key ? { ...ph, url: data.publicUrl, status: "done" } : ph))
        );
      } catch {
        setPhotos((p) =>
          p.map((ph) =>
            ph.key === key ? { ...ph, status: "error", error: "Upload failed" } : ph
          )
        );
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(key: string) {
    setPhotos((p) => p.filter((ph) => ph.key !== key));
  }
  function makeCover(key: string) {
    setPhotos((p) => {
      const idx = p.findIndex((ph) => ph.key === key);
      if (idx <= 0) return p;
      const next = [...p];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  }

  const uploadedUrls = photos.filter((p) => p.status === "done" && p.url).map((p) => p.url!);

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-ink">
        Photos <span className="font-normal text-muted">— optional, up to {MAX_PHOTOS}</span>
      </span>

      {/* Hidden inputs carry the ordered, uploaded URLs into the form submit. */}
      {uploadedUrls.map((url) => (
        <input key={url} type="hidden" name="photoUrls" value={url} />
      ))}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((ph, i) => (
          <div
            key={ph.key}
            className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-paper"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ph.previewUrl} alt="" className="h-full w-full object-cover" />

            {ph.status === "uploading" ? (
              <div className="absolute inset-0 grid place-items-center bg-ink/40">
                <Loader2 className="h-5 w-5 animate-spin text-paper" aria-hidden />
              </div>
            ) : null}
            {ph.status === "error" ? (
              <div className="absolute inset-0 grid place-items-center bg-sticker/70 text-center text-[10px] font-medium text-white">
                <AlertCircle className="h-4 w-4" aria-hidden />
              </div>
            ) : null}

            {i === 0 && ph.status === "done" ? (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-paper">
                Cover
              </span>
            ) : null}

            <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
              {i !== 0 && ph.status === "done" ? (
                <button
                  type="button"
                  onClick={() => makeCover(ph.key)}
                  aria-label="Make cover photo"
                  className="grid h-7 w-7 place-items-center rounded-full bg-surface/90 text-ink shadow"
                >
                  <Star className="h-3.5 w-3.5" aria-hidden />
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => remove(ph.key)}
                aria-label="Remove photo"
                className="grid h-7 w-7 place-items-center rounded-full bg-surface/90 text-sticker shadow"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        ))}

        {photos.length < MAX_PHOTOS ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line bg-surface text-muted transition hover:border-ink hover:text-ink"
          >
            <ImagePlus className="h-6 w-6" aria-hidden />
            <span className="text-xs font-medium">Add</span>
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {formError ? <p className="text-sm text-sticker">{formError}</p> : null}
    </div>
  );
}
