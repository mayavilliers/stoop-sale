import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminReportRow, type AdminReport } from "@/components/admin/admin-report-row";

export const metadata = { title: "Moderation — StoopSale" };

export default async function AdminPage() {
  const supabase = await createClient(); // /admin is ADMIN-guarded in middleware

  const { data: reports } = await supabase
    .from("reports")
    .select(
      "id, reason, details, created_at, listing:sale_listings(id,title,status,is_hidden,reported_count)"
    )
    .eq("status", "OPEN")
    .order("created_at", { ascending: false });

  const open = (reports ?? []) as unknown as AdminReport[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-paper">
          <ShieldCheck className="h-4 w-4" aria-hidden />
        </span>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Moderation</h1>
      </div>
      <p className="mt-1 text-sm text-muted">
        {open.length > 0
          ? `${open.length} open report${open.length === 1 ? "" : "s"} to review`
          : "No open reports right now."}
      </p>

      {open.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-line bg-surface/60 p-12 text-center">
          <h2 className="font-display text-xl font-bold">All clear</h2>
          <p className="mx-auto mt-1 max-w-sm text-[15px] text-muted">
            Reported sales will appear here. Hidden listings stay out of browse and the map until
            you unhide them.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {open.map((report) => (
            <AdminReportRow key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
