import Link from "next/link";
import { Tag, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 -rotate-6 place-items-center rounded-md bg-sticker text-sticker-ink">
            <Tag className="h-4 w-4" aria-hidden />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">
            StoopSale
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink/80 hover:bg-black/5 sm:inline-block"
          >
            Browse
          </Link>
          {user ? (
            <>
              <Link
                href="/saved"
                className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink/80 hover:bg-black/5 sm:inline-block"
              >
                Saved
              </Link>
              <Link
                href="/my-listings"
                className="rounded-full px-3 py-2 text-sm font-medium text-ink/80 hover:bg-black/5"
              >
                My sales
              </Link>
              <Link
                href="/create"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sticker px-3.5 text-sm font-semibold text-sticker-ink shadow-card transition hover:brightness-95"
              >
                <Plus className="h-4 w-4" aria-hidden />
                List a sale
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-sm font-medium text-ink/80 hover:bg-black/5"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-9 items-center rounded-full bg-sticker px-4 text-sm font-semibold text-sticker-ink shadow-card transition hover:brightness-95"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
