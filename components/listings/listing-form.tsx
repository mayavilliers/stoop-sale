"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CATEGORIES, SALE_TYPES } from "@/lib/constants";
import type { Category, SaleType } from "@/lib/types/database.types";
import type { ListingFormState } from "@/app/listings/actions";
import { Field, Input } from "@/components/ui/input";
import { Textarea, Select, Checkbox } from "@/components/ui/textarea";
import { PhotoUploader } from "@/components/listings/photo-uploader";
import { AddressAutocomplete } from "@/components/listings/address-autocomplete";

export type ListingInitial = {
  title?: string;
  saleType?: SaleType;
  description?: string;
  categories?: Category[];
  address?: string;
  startsAt?: string;
  endsAt?: string;
  notes?: string;
  cashOnly?: boolean;
  venmoAccepted?: boolean;
  earlyBirdsOk?: boolean;
  rainDate?: string | null;
  photos?: string[];
};

function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function Buttons({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  if (mode === "edit") {
    return (
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-full bg-sticker px-6 text-[15px] font-semibold text-sticker-ink shadow-card transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    );
  }
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="submit"
        name="intent"
        value="publish"
        disabled={pending}
        className="h-11 rounded-full bg-sticker px-6 text-[15px] font-semibold text-sticker-ink shadow-card transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Posting…" : "Publish sale"}
      </button>
      <button
        type="submit"
        name="intent"
        value="draft"
        disabled={pending}
        className="h-11 rounded-full border border-line bg-surface px-6 text-[15px] font-medium text-ink transition hover:bg-paper disabled:opacity-60"
      >
        Save as draft
      </button>
    </div>
  );
}

export function ListingForm({
  mode,
  action,
  initial = {},
}: {
  mode: "create" | "edit";
  action: (state: ListingFormState, formData: FormData) => Promise<ListingFormState>;
  initial?: ListingInitial;
}) {
  const [state, formAction] = useActionState<ListingFormState, FormData>(action, undefined);
  const err = state?.fieldErrors ?? {};
  const selected = new Set(initial.categories ?? []);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state?.error ? (
        <p className="rounded-xl border border-sticker/30 bg-sticker/5 px-3.5 py-2.5 text-sm text-sticker" role="alert">
          {state.error}
        </p>
      ) : null}

      <Field label="Sale title" htmlFor="title" error={err.title}>
        <Input id="title" name="title" defaultValue={initial.title} placeholder="e.g. Greenpoint stoop sale — records & lamps" required />
      </Field>

      <Field label="Sale type" htmlFor="saleType" error={err.saleType}>
        <Select id="saleType" name="saleType" defaultValue={initial.saleType ?? ""}>
          <option value="" disabled>
            Choose a type…
          </option>
          {SALE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Description" htmlFor="description" error={err.description}>
        <Textarea
          id="description"
          name="description"
          defaultValue={initial.description}
          placeholder="What are you selling? Big items, highlights, anything worth the trip."
        />
      </Field>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-ink">What&apos;s for sale?</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <label
              key={c.value}
              className="cursor-pointer select-none rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-ink transition has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper"
            >
              <input
                type="checkbox"
                name="categories"
                value={c.value}
                defaultChecked={selected.has(c.value)}
                className="sr-only"
              />
              {c.label}
            </label>
          ))}
        </div>
        {err.categories ? <p className="text-sm text-sticker">{err.categories}</p> : null}
      </div>

      <Field label="Address" htmlFor="address" error={err.address}>
        <AddressAutocomplete
          id="address"
          name="address"
          defaultValue={initial.address}
          placeholder="Start typing your address…"
          required
        />
        <p className="mt-1 text-xs text-muted">
          Start typing and pick your address from the list so it lands in the right spot on the map.
        </p>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" htmlFor="startsAt" error={err.startsAt}>
          <Input id="startsAt" name="startsAt" type="datetime-local" defaultValue={toLocalInput(initial.startsAt)} required />
        </Field>
        <Field label="Ends" htmlFor="endsAt" error={err.endsAt}>
          <Input id="endsAt" name="endsAt" type="datetime-local" defaultValue={toLocalInput(initial.endsAt)} required />
        </Field>
      </div>

      <Field label="Seller notes (optional)" htmlFor="notes" error={err.notes}>
        <Input id="notes" name="notes" defaultValue={initial.notes} placeholder="e.g. Cash or Venmo, early birds welcome, rain date Sunday" />
      </Field>

      <PhotoUploader initialUrls={initial.photos} />

      <fieldset className="space-y-3 rounded-card border border-line bg-surface p-4">
        <legend className="px-1 text-sm font-medium text-ink">Payment & details</legend>
        <Checkbox name="cashOnly" label="Cash only" defaultChecked={initial.cashOnly} />
        <Checkbox name="venmoAccepted" label="Venmo accepted" defaultChecked={initial.venmoAccepted} />
        <Checkbox
          name="earlyBirdsOk"
          label="Early birds okay"
          defaultChecked={initial.earlyBirdsOk ?? true}
        />
      </fieldset>

      <Buttons mode={mode} />
    </form>
  );
}
