"use server";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/supabase/server";
import { acceptInvitationAsGuardian, getInvitationByTokenWithSchoolName } from "@/lib/db/invitations";

export async function acceptInvite(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const result = await getInvitationByTokenWithSchoolName(token);
  if (!result) {
    redirect(`/invite/${token}?error=invalid`);
  }

  if (new Date(result.invitation.expiresAt).getTime() < Date.now()) {
    redirect(`/invite/${token}?error=expired`);
  }

  const { error } = await acceptInvitationAsGuardian(result.invitation.schoolId, user.id);
  if (error) {
    redirect(`/invite/${token}?error=failed`);
  }

  redirect("/dashboard");
}
