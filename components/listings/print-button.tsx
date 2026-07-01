"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-sticker px-4 text-sm font-semibold text-sticker-ink shadow-card"
    >
      <Printer className="h-4 w-4" aria-hidden />
      Print flyer
    </button>
  );
}
