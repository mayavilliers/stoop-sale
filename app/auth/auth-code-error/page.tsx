import Link from "next/link";

export const metadata = { title: "Sign-in problem — StoopSale" };

export default function AuthCodeErrorPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-extrabold">That sign-in link didn&apos;t work</h1>
      <p className="mt-2 text-[15px] text-muted">
        The link may have expired or already been used. Start again and we&apos;ll get you in.
      </p>
      <Link
        href="/login"
        className="mx-auto mt-6 inline-flex h-11 items-center rounded-full bg-sticker px-5 text-[15px] font-semibold text-sticker-ink shadow-card"
      >
        Back to log in
      </Link>
    </div>
  );
}
