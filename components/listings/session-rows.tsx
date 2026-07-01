"use client";

import { useState } from "react";
import { Plus, X, Repeat } from "lucide-react";
import { Select } from "@/components/ui/textarea";

export type SessionInitial = { date: string; start: string; end: string };

// 30-minute increments, 6:00 AM → 10:00 PM (covers real sale hours without a huge list).
const TIME_OPTIONS: { value: string; label: string }[] = [];
for (let h = 6; h <= 22; h++) {
  for (const m of [0, 30]) {
    if (h === 22 && m === 30) continue;
    const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const hour12 = ((h + 11) % 12) + 1;
    const ampm = h < 12 ? "AM" : "PM";
    TIME_OPTIONS.push({ value, label: `${hour12}:${String(m).padStart(2, "0")} ${ampm}` });
  }
}

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

let uid = 0;

export function SessionRows({
  initial,
  initialRecurring = false,
  error,
}: {
  initial?: SessionInitial[];
  initialRecurring?: boolean;
  error?: string;
}) {
  const [rows, setRows] = useState<{ key: number; init?: SessionInitial }[]>(() =>
    (initial && initial.length ? initial : [undefined]).map((init) => ({ key: uid++, init }))
  );

  return (
    <div className="space-y-2.5">
      <span className="block text-sm font-medium text-ink">When is the sale?</span>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div
            key={row.key}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2.5"
          >
            <input
              type="date"
              name="sessionDate"
              defaultValue={row.init?.date ?? (i === 0 ? todayLocal() : "")}
              min={todayLocal()}
              required
              className="h-10 min-w-[140px] flex-1 rounded-lg border border-line bg-surface px-2.5 text-[15px] text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
              aria-label={`Sale day ${i + 1}`}
            />
            <div className="flex items-center gap-1.5">
              <Select
                name="sessionStart"
                defaultValue={row.init?.start ?? "09:00"}
                aria-label={`Start time, day ${i + 1}`}
                className="h-10 w-[108px] px-2.5 text-sm"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
              <span className="text-sm text-muted">to</span>
              <Select
                name="sessionEnd"
                defaultValue={row.init?.end ?? "15:00"}
                aria-label={`End time, day ${i + 1}`}
                className="h-10 w-[108px] px-2.5 text-sm"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            {rows.length > 1 ? (
              <button
                type="button"
                onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
                aria-label={`Remove day ${i + 1}`}
                className="ml-auto grid h-8 w-8 place-items-center rounded-full text-terra hover:bg-terra/10"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {rows.length < 7 ? (
        <button
          type="button"
          onClick={() => setRows((r) => [...r, { key: uid++ }])}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-line bg-surface px-3.5 text-sm font-medium text-ink transition hover:border-ink"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add another day
        </button>
      ) : null}

      <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-[15px] text-ink">
        <input
          type="checkbox"
          name="recurringWeekly"
          defaultChecked={initialRecurring}
          className="h-5 w-5 rounded-md border-line accent-sticker"
        />
        <span className="inline-flex items-center gap-1.5">
          <Repeat className="h-4 w-4 text-muted" aria-hidden />
          Repeats every week (same days & times)
        </span>
      </label>

      {error ? (
        <p className="text-sm text-terra" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
