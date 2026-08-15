"use server";

import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth-guard";
import { updateEvent } from "@/lib/db/events";
import { parseEventForm } from "../../eventForm";

export async function updateEventAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  await requireRole(schoolId, ["admin"]);

  const parsed = parseEventForm(formData);
  if ("errorCode" in parsed) {
    redirect(`/${schoolId}/events/${eventId}/edit?error=${parsed.errorCode}`);
  }

  // 日時・タイトル・場所・締切が変わった場合、トリガーが保護者へ通知を作る。
  const { error } = await updateEvent(eventId, parsed);
  if (error) {
    redirect(`/${schoolId}/events/${eventId}/edit?error=EVT_003`);
  }

  redirect(`/${schoolId}/events/${eventId}`);
}
