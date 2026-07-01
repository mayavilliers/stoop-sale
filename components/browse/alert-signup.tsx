"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { BellRing } from "lucide-react";
import { createAlert, type AlertState } from "@/app/alerts/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 shrink-0 rounded-full bg-sticker px-5 text-[15px] font-semibold text-sticker-ink shadow-card transition hover:brightness-95 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Notify me"}
    </button>
  );
}

/**
 * Turns the "no sales nearby" dead end into a comeback: leave an email and get
 * a daily digest when sales appear in this area.
 */
export function AlertSignup({
  lat,
  lng,
  radius,
  label,
}: {
  lat: number;
  lng: number;
  radius: number;
  label?: string | null;
}) {
  const [state, formAction] = useActionState<AlertState, FormData>(createAlert, undefined);

  if (state?.ok) {
    return (
      <div className="mx-auto mt-5 max-w-md rounded-card border border-live/30 bg-live/5 px-4 py-3 text-center text-[15px] text-ink">
        You&apos;re on the list — we&apos;ll email you when sales pop up
        {label ? ` near ${label}` : " nearby"}. 🎉
      </div>
    );
  }

  return (
    <form action={formAction} className="mx-auto mt-5 max-w-md">
      <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-ink">
        <BellRing className="h-4 w-4 text-sticker" aria-hidden />
        Get an email when a sale pops up {label ? `near ${label}` : "in this area"}
      </p>
      <div className="mt-2.5 flex gap-2">
        <input type="hidden" name="lat" value={lat} />
        <input type="hidden" name="lng" value={lng} />
        <input type="hidden" name="radius" value={radius} />
        {label ? <input type="hidden" name="label" value={label} /> : null}
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-[15px] text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
          aria-label="Email for sale alerts"
        />
        <Submit />
      </div>
      {state?.error ? <p className="mt-1.5 text-sm text-terra">{state.error}</p> : null}
      <p className="mt-1.5 text-xs text-muted">One email a day at most. Unsubscribe anytime.</p>
    </form>
  );
}
