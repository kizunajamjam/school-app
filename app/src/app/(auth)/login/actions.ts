"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ERROR_MESSAGES } from "@/lib/errors";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      `/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(ERROR_MESSAGES.AUTH_002)}`,
    );
  }

  redirect(next);
}
