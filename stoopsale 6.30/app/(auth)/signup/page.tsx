import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Sign up — StoopSale" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next ?? "/");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">
        Sell what you&apos;ve got
      </h1>
      <p className="mt-1.5 text-[15px] text-muted">
        Create an account to post a sale and keep a list of ones you&apos;ve saved.
      </p>
      <div className="mt-7">
        <AuthForm mode="signup" next={next ?? "/"} />
      </div>
    </div>
  );
}
