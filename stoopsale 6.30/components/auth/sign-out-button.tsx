import { signOut } from "@/app/(auth)/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-full px-3 py-2 text-sm font-medium text-muted hover:bg-black/5 hover:text-ink"
      >
        Log out
      </button>
    </form>
  );
}
