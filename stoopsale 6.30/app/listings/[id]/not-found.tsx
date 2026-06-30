import Link from "next/link";
import { Tag } from "lucide-react";

export default function ListingNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <span className="mx-auto grid h-12 w-12 -rotate-6 place-items-center rounded-xl bg-paper text-muted">
        <Tag className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-4 font-display text-2xl font-extrabold">This sale isn&apos;t available</h1>
      <p className="mt-2 text-[15px] text-muted">
        It may have been taken down, or the link is wrong. Plenty of others are still on.
      </p>
      <Link
        href="/"
        className="mx-auto mt-6 inline-flex h-11 items-center rounded-full bg-sticker px-5 text-[15px] font-semibold text-sticker-ink shadow-card"
      >
        Browse sales
      </Link>
    </div>
  );
}
