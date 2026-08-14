import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Invitation } from "@/types";

type InvitationRow = {
  id: string;
  school_id: string;
  token: string;
  created_by: string;
  expires_at: string;
  created_at: string;
};

function mapInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    schoolId: row.school_id,
    token: row.token,
    createdBy: row.created_by,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

const INVITATION_TTL_DAYS = 7;

export async function createInvitation(schoolId: string, createdBy: string) {
  const supabase = await createClient();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("invitations")
    .insert({ school_id: schoolId, created_by: createdBy, expires_at: expiresAt })
    .select("*")
    .single();

  return { data: data ? mapInvitation(data) : null, error };
}

export async function listInvitations(schoolId: string): Promise<Invitation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invitations")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  return (data ?? []).map(mapInvitation);
}

export async function deleteInvitation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("invitations").delete().eq("id", id);
  return { error };
}

// 招待受諾フローは未所属ユーザーが行うため、RLSをバイパスする admin クライアントを使う。
export async function getInvitationByTokenWithSchoolName(
  token: string,
): Promise<{ invitation: Invitation; schoolName: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("invitations")
    .select("*, schools(name)")
    .eq("token", token)
    .maybeSingle();

  if (!data) return null;
  const school = Array.isArray(data.schools) ? data.schools[0] : data.schools;

  return {
    invitation: mapInvitation(data),
    schoolName: (school?.name as string | undefined) ?? "",
  };
}

export async function acceptInvitationAsGuardian(schoolId: string, userId: string) {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("school_members")
    .select("id")
    .eq("school_id", schoolId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return { alreadyMember: true, error: null };

  const { error } = await admin
    .from("school_members")
    .insert({ school_id: schoolId, user_id: userId, role: "guardian" });

  return { alreadyMember: false, error };
}
