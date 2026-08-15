"use server";

import { redirect } from "next/navigation";

import { requireRoleForAction } from "@/lib/auth-guard";
import { upsertAttendance } from "@/lib/db/attendance";
import { deleteEvent, getEvent } from "@/lib/db/events";
import { isDeadlinePassed } from "@/lib/utils/time";
import { isErrorResult } from "@/lib/errors";
import type { AttendanceStatus } from "@/types";

export async function setAttendanceAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const childId = String(formData.get("childId") ?? "");
  const status = String(formData.get("status") ?? "undecided") as AttendanceStatus;

  const guard = await requireRoleForAction(schoolId, ["admin", "guardian"]);
  if (isErrorResult(guard)) {
    redirect(`/${schoolId}/events/${eventId}?error=${guard.code}`);
  }

  // 締切後は保護者だけ変更不可（管理者は当日の欠席連絡を代理入力できる）。
  // RLS でも弾いているが、ここで止めた方が理由の分かるメッセージを返せる。
  if (guard.role === "guardian") {
    const event = await getEvent(eventId);
    if (event && isDeadlinePassed(event.deadlineAt)) {
      redirect(`/${schoolId}/events/${eventId}?error=ATT_002`);
    }
  }

  const { error } = await upsertAttendance({
    eventId,
    childId,
    status,
    updatedBy: guard.user.id,
  });

  if (error) {
    redirect(`/${schoolId}/events/${eventId}?error=ATT_001`);
  }

  redirect(`/${schoolId}/events/${eventId}`);
}

export async function deleteEventAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");

  const guard = await requireRoleForAction(schoolId, ["admin"]);
  if (isErrorResult(guard)) {
    redirect(`/${schoolId}/events/${eventId}?error=${guard.code}`);
  }

  await deleteEvent(eventId);
  redirect(`/${schoolId}/events`);
}
