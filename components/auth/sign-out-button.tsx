import { signOut } from "@/app/(auth)/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="whitespace-nowrap rounded-full px-2 py-2 text-sm font-medium text-muted hover:bg-black/5 hover:text-ink sm:px-3"
      >
        Log out
      </button>
    </form>
  );
}
