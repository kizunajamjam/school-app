import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { getCurrentUser } from "@/lib/supabase/server";
import { getMyRole } from "@/lib/db/schools";
import { createError, type ErrorResult } from "@/lib/errors";
import type { Role } from "@/types";

// ページ(Server Component)用: 権限がなければリダイレクトする。
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(
  schoolId: string,
  allowed: Role[],
): Promise<{ user: User; role: Role }> {
  const user = await requireUser();
  const role = await getMyRole(schoolId);
  if (!role || !allowed.includes(role)) {
    redirect("/dashboard");
  }
  return { user, role };
}

// Server Action 用: リダイレクトせず ErrorResult を返す。
export async function requireRoleForAction(
  schoolId: string,
  allowed: Role[],
): Promise<{ user: User; role: Role } | ErrorResult> {
  const user = await getCurrentUser();
  if (!user) return createError("AUTH_001");

  const role = await getMyRole(schoolId);
  if (!role || !allowed.includes(role)) return createError("MEM_001");

  return { user, role };
}
