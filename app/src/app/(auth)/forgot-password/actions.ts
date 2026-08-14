"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/confirm?next=/reset-password`,
  });

  // メールの存在有無にかかわらず同じ表示にする(アカウント列挙対策)
  redirect("/forgot-password?sent=1");
}
