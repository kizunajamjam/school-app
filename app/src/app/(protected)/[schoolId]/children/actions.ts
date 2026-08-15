"use server";

import { redirect } from "next/navigation";

import { requireRole, requireRoleForAction } from "@/lib/auth-guard";
import { createChild, deleteChild, updateChild } from "@/lib/db/children";
import { createInvitation } from "@/lib/db/invitations";
import { listCategories, listClasses } from "@/lib/db/masters";
import { isErrorResult } from "@/lib/errors";

// 会員一覧から招待リンクを発行する（設定画面のものと違い、この画面へ戻る）。
export async function createInvitationFromChildrenAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  const { user } = await requireRole(schoolId, ["admin"]);

  const { error } = await createInvitation(schoolId, user.id);
  if (error) {
    redirect(`/${schoolId}/children?error=INV_005`);
  }

  redirect(`/${schoolId}/children`);
}

// 他スクールのマスタIDを送り込まれないよう、自スクールの一覧に含まれるか検証する。
// カテゴリーは1件（空文字は「未設定」= null）、クラスは掛け持ちがあるので複数受け取る。
async function resolveMasterIds(
  schoolId: string,
  formData: FormData,
): Promise<{ categoryId: string | null; classIds: string[] } | null> {
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const classIds = formData
    .getAll("classIds")
    .map((v) => String(v))
    .filter(Boolean);

  const [categories, classes] = await Promise.all([
    listCategories(schoolId),
    listClasses(schoolId),
  ]);

  if (categoryId && !categories.some((c) => c.id === categoryId)) return null;
  if (classIds.some((id) => !classes.some((c) => c.id === id))) return null;

  return { categoryId, classIds: [...new Set(classIds)] };
}

export async function createChildAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  const guard = await requireRoleForAction(schoolId, ["guardian", "admin"]);
  if (isErrorResult(guard)) {
    redirect(`/${schoolId}/children?error=${guard.code}`);
  }

  const name = String(formData.get("name") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim() || null;

  if (!name) {
    redirect(`/${schoolId}/children?error=CHD_002`);
  }

  const masters = await resolveMasterIds(schoolId, formData);
  if (!masters) {
    redirect(`/${schoolId}/children?error=CHD_005`);
  }

  const { error } = await createChild({
    schoolId,
    guardianId: guard.user.id,
    name,
    grade,
    categoryId: masters.categoryId,
    classIds: masters.classIds,
  });
  if (error) {
    redirect(`/${schoolId}/children?error=CHD_003`);
  }

  redirect(`/${schoolId}/children`);
}

// 管理者はカテゴリー/クラスの割り当て、保護者は氏名・学年も含めて更新する。
// 管理者側のフォームは氏名・学年を hidden で現在値のまま送る。
export async function updateChildAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  const childId = String(formData.get("childId") ?? "");

  const guard = await requireRoleForAction(schoolId, ["guardian", "admin"]);
  if (isErrorResult(guard)) {
    redirect(`/${schoolId}/children?error=${guard.code}`);
  }

  const name = String(formData.get("name") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim() || null;

  if (!name) {
    redirect(`/${schoolId}/children?error=CHD_002`);
  }

  const masters = await resolveMasterIds(schoolId, formData);
  if (!masters) {
    redirect(`/${schoolId}/children?error=CHD_005`);
  }

  // 他人の子どもへの更新は RLS が拒否する。
  const { error } = await updateChild(childId, {
    name,
    grade,
    categoryId: masters.categoryId,
    classIds: masters.classIds,
  });
  if (error) {
    redirect(`/${schoolId}/children?error=CHD_004`);
  }

  redirect(`/${schoolId}/children`);
}

export async function deleteChildAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  const childId = String(formData.get("childId") ?? "");

  const guard = await requireRoleForAction(schoolId, ["guardian", "admin"]);
  if (isErrorResult(guard)) {
    redirect(`/${schoolId}/children?error=${guard.code}`);
  }

  // 所有者(guardian_id)以外からの削除は RLS が拒否する。
  await deleteChild(childId);
  redirect(`/${schoolId}/children`);
}
