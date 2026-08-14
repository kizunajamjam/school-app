import "server-only";

import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/server";
import type { Role, School } from "@/types";

function mapSchool(row: {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}): School {
  return {
    id: row.id,
    name: row.name,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

// スクールの作成機能は持たない。単一スクール専用アプリのため、
// スクール行は運用者が Supabase 側で 1 件だけ作る
// (20260815_lock_school_creation.sql で INSERT を禁止済み)。
export async function getSchool(schoolId: string): Promise<School | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("schools").select("*").eq("id", schoolId).maybeSingle();
  return data ? mapSchool(data) : null;
}

// school_members を直接引く。RLS越しの二重チェックを避けるため admin クライアントを使う
// (呼び出し側は必ずこの結果でアクセス可否を判断してから他の操作を行うこと)。
export const getMyRole = cache(async (schoolId: string): Promise<Role | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("school_members")
    .select("role")
    .eq("school_id", schoolId)
    .eq("user_id", user.id)
    .maybeSingle();

  return (data?.role as Role | undefined) ?? null;
});

export const listMySchools = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("school_members")
    .select("role, schools(id, name, created_by, created_at)")
    .eq("user_id", user.id);

  return (data ?? [])
    .map((row) => {
      const school = Array.isArray(row.schools) ? row.schools[0] : row.schools;
      if (!school) return null;
      return {
        id: school.id as string,
        name: school.name as string,
        createdBy: school.created_by as string,
        createdAt: school.created_at as string,
        role: row.role as Role,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);
});
