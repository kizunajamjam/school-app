"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils/url";

export async function signup(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!displayName) {
    redirect(`/signup?next=${encodeURIComponent(next)}&error=AUTH_004`);
  }

  const supabase = await createClient();
  const appUrl = await getAppUrl();

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
    redirect(`/signup?next=${encodeURIComponent(next)}&error=AUTH_003`);
  }

  if (data.session) {
    redirect(next);
  }

  redirect(`/signup?next=${encodeURIComponent(next)}&sent=1`);
}
