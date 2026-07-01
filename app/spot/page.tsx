import { SpotForm } from "@/components/listings/spot-form";

export const metadata = { title: "Spot a sale — StoopSale" };

export default function SpotPage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Spot a sale</h1>
      <p className="mt-1.5 text-[15px] text-muted">
        Walked past a sale that isn&apos;t on the map? Pin it for everyone. Only the address is
        required — add whatever else you know.
      </p>
      <div className="mt-8">
        <SpotForm />
      </div>
    </div>
  );
}
