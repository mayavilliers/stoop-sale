"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Flag, X } from "lucide-react";
import { submitReport, type ReportState } from "@/app/listings/interactions";

const REASONS: { value: string; label: string }[] = [
  { value: "INAPPROPRIATE", label: "Inappropriate or offensive" },
  { value: "SCAM", label: "Looks like a scam" },
  { value: "SPAM", label: "Spam or duplicate" },
  { value: "WRONG_LOCATION", label: "Wrong location" },
  { value: "ALREADY_ENDED", label: "Already ended" },
  { value: "OTHER", label: "Something else" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-full bg-sticker px-5 text-[15px] font-semibold text-sticker-ink shadow-card disabled:opacity-60"
    >
      {pending ? "Sending…" : "Submit report"}
    </button>
  );
}

export function ReportButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ReportState, FormData>(submitReport, undefined);

  // Auto-close shortly after a successful submit.
  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(() => setOpen(false), 1400);
      return () => clearTimeout(t);
    }
  }, [state?.ok]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-medium text-muted transition hover:bg-black/5 hover:text-ink"
      >
        <Flag className="h-4 w-4" aria-hidden />
        Report
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-ink/40 p-0 sm:place-items-center sm:p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Report this listing"
        >
          <div
            className="w-full rounded-t-card border border-line bg-surface p-5 shadow-pop sm:max-w-md sm:rounded-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Report this sale</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-black/5 hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {state?.ok ? (
              <p className="mt-4 rounded-xl border border-line bg-paper px-3.5 py-3 text-sm text-ink">
                Thanks — our team will take a look. You can close this now.
              </p>
            ) : (
              <form action={formAction} className="mt-4 space-y-4">
                <input type="hidden" name="listingId" value={listingId} />
                {state?.error ? (
                  <p className="rounded-xl border border-sticker/30 bg-sticker/5 px-3.5 py-2.5 text-sm text-sticker">
                    {state.error}
                  </p>
                ) : null}
                <div className="space-y-1.5">
                  <label htmlFor="reason" className="block text-sm font-medium text-ink">
                    Reason
                  </label>
                  <select
                    id="reason"
                    name="reason"
                    defaultValue="INAPPROPRIATE"
                    className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                  >
                    {REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="details" className="block text-sm font-medium text-ink">
                    Details (optional)
                  </label>
                  <textarea
                    id="details"
                    name="details"
                    rows={3}
                    maxLength={500}
                    placeholder="Anything that helps us understand the problem."
                    className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="h-11 rounded-full border border-line bg-surface px-4 text-[15px] font-medium text-ink hover:bg-paper"
                  >
                    Cancel
                  </button>
                  <SubmitButton />
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
