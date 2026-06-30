"use client";

import Link from "next/link";
import { useTransition } from "react";
import { EyeOff, Eye, Check, X } from "lucide-react";
import { setListingHidden, resolveReport } from "@/app/admin/actions";

export type AdminReport = {
  id: string;
  reason: string;
  details: string | null;
  created_at: string;
  listing: {
    id: string;
    title: string;
    status: string;
    is_hidden: boolean;
    reported_count: number;
  } | null;
};

const REASON_LABEL: Record<string, string> = {
  SPAM: "Spam / duplicate",
  INAPPROPRIATE: "Inappropriate",
  SCAM: "Scam",
  WRONG_LOCATION: "Wrong location",
  ALREADY_ENDED: "Already ended",
  OTHER: "Other",
};

export function AdminReportRow({ report }: { report: AdminReport }) {
  const [pending, start] = useTransition();
  const l = report.listing;

  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sticker/10 px-2.5 py-0.5 text-xs font-semibold text-sticker">
              {REASON_LABEL[report.reason] ?? report.reason}
            </span>
            {l?.is_hidden ? (
              <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-paper">
                Hidden
              </span>
            ) : null}
            {l ? (
              <span className="text-xs text-muted">{l.reported_count} report(s)</span>
            ) : null}
          </div>
          {l ? (
            <Link
              href={`/listings/${l.id}`}
              className="mt-1.5 block truncate font-display text-base font-bold hover:underline"
            >
              {l.title}
            </Link>
          ) : (
            <p className="mt-1.5 text-sm text-muted">Listing was removed.</p>
          )}
          {report.details ? (
            <p className="mt-1 text-sm text-ink/80">“{report.details}”</p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {l ? (
          l.is_hidden ? (
            <button
              onClick={() => start(() => setListingHidden(l.id, false))}
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60"
            >
              <Eye className="h-4 w-4" aria-hidden />
              Unhide
            </button>
          ) : (
            <button
              onClick={() => start(() => setListingHidden(l.id, true))}
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-sm font-medium text-paper hover:brightness-110 disabled:opacity-60"
            >
              <EyeOff className="h-4 w-4" aria-hidden />
              Hide listing
            </button>
          )
        ) : null}

        <button
          onClick={() => start(() => resolveReport(report.id, "REVIEWED"))}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-ink hover:bg-paper disabled:opacity-60"
        >
          <Check className="h-4 w-4" aria-hidden />
          Mark reviewed
        </button>
        <button
          onClick={() => start(() => resolveReport(report.id, "DISMISSED"))}
          disabled={pending}
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted hover:bg-black/5 hover:text-ink disabled:opacity-60"
        >
          <X className="h-4 w-4" aria-hidden />
          Dismiss
        </button>
      </div>
    </div>
  );
}
