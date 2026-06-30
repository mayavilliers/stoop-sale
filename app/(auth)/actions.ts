"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";

export type AuthState = { error?: string } | undefined;

function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "/";
  // Only allow internal redirects.
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Email or password is incorrect." };
  }

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { name: parsed.data.name } },
  });
  if (error) {
    if (error.message.toLowerCase().includes("registered")) {
      return { error: "That email already has an account. Try logging in." };
    }
    return { error: "Could not create your account. Try again." };
  }

  // Email confirmation is OFF for MVP, so a session exists immediately.
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "";
  const next = safeNext(formData.get("next"));

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth");
  }
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
