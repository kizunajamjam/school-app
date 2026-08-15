"use server";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/supabase/server";
import { acceptInvitationAsGuardian, getInvitationByTokenWithSchoolName } from "@/lib/db/invitations";
import { isPast } from "@/lib/utils/time";

export async function acceptInvite(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const result = await getInvitationByTokenWithSchoolName(token);
  if (!result) {
    redirect(`/invite/${token}?error=INV_001`);
  }

  if (isPast(result.invitation.expiresAt)) {
    redirect(`/invite/${token}?error=INV_002`);
  }

  const { error } = await acceptInvitationAsGuardian(result.invitation.schoolId, user.id);
  if (error) {
    console.error("[acceptInvite]", error);
    redirect(`/invite/${token}?error=INV_004`);
  }

  redirect("/dashboard");
}
