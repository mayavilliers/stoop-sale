"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Native share sheet on mobile; copies the link on desktop. */
export function ShareButton({
  title,
  text,
  path,
  label = "Share",
  className,
}: {
  title: string;
  text?: string;
  path: string; // e.g. /listings/abc
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* user dismissed — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[15px] font-medium text-ink transition hover:bg-paper",
        className
      )}
    >
      {copied ? <Check className="h-4 w-4 text-live" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
      {copied ? "Link copied" : label}
    </button>
  );
}
