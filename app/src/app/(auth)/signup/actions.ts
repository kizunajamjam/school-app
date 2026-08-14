"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ERROR_MESSAGES } from "@/lib/errors";

export async function signup(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!displayName) {
    redirect(
      `/signup?next=${encodeURIComponent(next)}&error=${encodeURIComponent("お名前を入力してください。")}`,
    );
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${appUrl}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error("[signup]", error.status, error.code, error.message);
    redirect(
      `/signup?next=${encodeURIComponent(next)}&error=${encodeURIComponent(ERROR_MESSAGES.AUTH_003)}`,
    );
  }

  if (data.session) {
    redirect(next);
  }

  redirect(`/signup?next=${encodeURIComponent(next)}&sent=1`);
}
