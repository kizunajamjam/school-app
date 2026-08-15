"use server";

import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth-guard";
import { createInvitation, deleteInvitation } from "@/lib/db/invitations";
import {
  createCategory,
  createClass,
  deleteCategory,
  deleteClass,
} from "@/lib/db/masters";
import type { ErrorCode } from "@/lib/errors";

export async function createInvitationAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  const { user } = await requireRole(schoolId, ["admin"]);

  const { error } = await createInvitation(schoolId, user.id);
  if (error) {
    redirect(`/${schoolId}/settings?error=INV_005`);
  }

  redirect(`/${schoolId}/settings`);
}

export async function deleteInvitationAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  const invitationId = String(formData.get("invitationId") ?? "");
  await requireRole(schoolId, ["admin"]);

  await deleteInvitation(invitationId);
  redirect(`/${schoolId}/settings`);
}

// unique (school_id, name) 違反は 23505 で返るため、重複は専用コードにする。
function masterErrorCode(error: { code?: string } | null, fallback: ErrorCode): ErrorCode {
  if (error?.code === "23505") return "MST_002";
  return fallback;
}

export async function createCategoryAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  await requireRole(schoolId, ["admin"]);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect(`/${schoolId}/settings?error=MST_001`);
  }

  const { error } = await createCategory(schoolId, name);
  if (error) {
    redirect(`/${schoolId}/settings?error=${masterErrorCode(error, "MST_003")}`);
  }

  redirect(`/${schoolId}/settings`);
}

export async function deleteCategoryAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  await requireRole(schoolId, ["admin"]);

  await deleteCategory(categoryId);
  redirect(`/${schoolId}/settings`);
}

export async function createClassAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  await requireRole(schoolId, ["admin"]);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect(`/${schoolId}/settings?error=MST_001`);
  }

  const { error } = await createClass(schoolId, name);
  if (error) {
    redirect(`/${schoolId}/settings?error=${masterErrorCode(error, "MST_004")}`);
  }

  redirect(`/${schoolId}/settings`);
}

export async function deleteClassAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  const classId = String(formData.get("classId") ?? "");
  await requireRole(schoolId, ["admin"]);

  await deleteClass(classId);
  redirect(`/${schoolId}/settings`);
}
