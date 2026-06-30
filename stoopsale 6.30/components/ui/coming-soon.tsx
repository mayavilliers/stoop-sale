import Link from "next/link";

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-extrabold">{title}</h1>
      <p className="mt-2 text-[15px] text-muted">
        This screen is wired up and protected — you reached it because you&apos;re logged in.
        The full experience lands in {phase}.
      </p>
      <Link
        href="/"
        className="mx-auto mt-6 inline-flex h-11 items-center rounded-full border border-line bg-surface px-5 text-[15px] font-medium text-ink hover:bg-paper"
      >
        Back to browse
      </Link>
    </div>
  );
}
