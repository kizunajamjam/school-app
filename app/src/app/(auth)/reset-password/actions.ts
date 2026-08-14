"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ERROR_MESSAGES } from "@/lib/errors";

export async function resetPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(ERROR_MESSAGES.AUTH_003)}`);
  }

  redirect("/dashboard");
}
