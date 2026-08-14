"use server";

import { redirect } from "next/navigation";

import { requireRoleForAction } from "@/lib/auth-guard";
import { upsertAttendance } from "@/lib/db/attendance";
import { deleteEvent } from "@/lib/db/events";
import { isErrorResult } from "@/lib/errors";
import type { AttendanceStatus } from "@/types";

export async function setAttendanceAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const childId = String(formData.get("childId") ?? "");
  const status = String(formData.get("status") ?? "undecided") as AttendanceStatus;

  const guard = await requireRoleForAction(schoolId, ["admin", "guardian"]);
  if (isErrorResult(guard)) {
    redirect(`/${schoolId}/events/${eventId}?error=${encodeURIComponent(guard.error)}`);
  }

  const { error } = await upsertAttendance({
    eventId,
    childId,
    status,
    updatedBy: guard.user.id,
  });

  if (error) {
    redirect(`/${schoolId}/events/${eventId}?error=${encodeURIComponent("出欠の更新に失敗しました。")}`);
  }

  redirect(`/${schoolId}/events/${eventId}`);
}

export async function deleteEventAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");

  const guard = await requireRoleForAction(schoolId, ["admin"]);
  if (isErrorResult(guard)) {
    redirect(`/${schoolId}/events/${eventId}?error=${encodeURIComponent(guard.error)}`);
  }

  await deleteEvent(eventId);
  redirect(`/${schoolId}/events`);
}
