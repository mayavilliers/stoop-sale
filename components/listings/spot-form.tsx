"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { spotListing, type ListingFormState } from "@/app/listings/actions";
import { SALE_TYPES } from "@/lib/constants";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/textarea";
import { AddressAutocomplete } from "@/components/listings/address-autocomplete";
import { PhotoUploader } from "@/components/listings/photo-uploader";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-full bg-sticker px-6 text-[15px] font-semibold text-sticker-ink shadow-card transition hover:brightness-95 disabled:opacity-60"
    >
      {pending ? "Pinning…" : "Pin this sale"}
    </button>
  );
}

const TIMES: { value: string; label: string }[] = [];
for (let h = 6; h <= 22; h++) {
  for (const m of [0, 30]) {
    if (h === 22 && m === 30) continue;
    const hour12 = ((h + 11) % 12) + 1;
    TIMES.push({
      value: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      label: `${hour12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`,
    });
  }
}

export function SpotForm() {
  const [state, formAction] = useActionState<ListingFormState, FormData>(spotListing, undefined);
  const err = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state?.error ? (
        <p className="rounded-xl border border-terra/30 bg-terra/5 px-3.5 py-2.5 text-sm text-terra" role="alert">
          {state.error}
        </p>
      ) : null}

      <Field label="Where is it?" htmlFor="address" error={err.address}>
        <AddressAutocomplete
          id="address"
          name="address"
          placeholder="Address or nearest corner"
          required
        />
      </Field>

      <Field label="What kind of sale? (optional)" htmlFor="saleType">
        <Select id="saleType" name="saleType" defaultValue="OTHER">
          {SALE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-ink">
          When? <span className="font-normal text-muted">— leave blank if you&apos;re not sure</span>
        </span>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2.5">
          <input
            type="date"
            name="sessionDate"
            className="h-10 min-w-[140px] flex-1 rounded-lg border border-line bg-surface px-2.5 text-[15px] text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
            aria-label="Sale date"
          />
          <div className="flex items-center gap-1.5">
            <Select name="sessionStart" defaultValue="" aria-label="Start time" className="h-10 w-[108px] px-2.5 text-sm">
              <option value="">Start</option>
              {TIMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <span className="text-sm text-muted">to</span>
            <Select name="sessionEnd" defaultValue="" aria-label="End time" className="h-10 w-[108px] px-2.5 text-sm">
              <option value="">End</option>
              {TIMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {err.sessions ? <p className="text-sm text-terra">{err.sessions}</p> : null}
        <p className="text-xs text-muted">
          If you skip this, we&apos;ll show it as &ldquo;spotted today, times unknown.&rdquo;
        </p>
      </div>

      <Field label="Anything else? (optional)" htmlFor="notes">
        <Input id="notes" name="notes" placeholder="e.g. Lots of furniture out front, looked cash-only" />
      </Field>

      <PhotoUploader />

      <SubmitButton />
    </form>
  );
}
