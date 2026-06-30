import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Log in — StoopSale" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next ?? "/");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 text-[15px] text-muted">
        Log in to list a sale, save finds, and plan your route.
      </p>
      {error === "oauth" ? (
        <p className="mt-4 rounded-xl border border-sticker/30 bg-sticker/5 px-3.5 py-2.5 text-sm text-sticker">
          Google sign-in didn&apos;t complete. Try again or use email.
        </p>
      ) : null}
      <div className="mt-7">
        <AuthForm mode="login" next={next ?? "/"} />
      </div>
    </div>
  );
}
