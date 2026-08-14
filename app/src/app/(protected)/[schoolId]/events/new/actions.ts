"use server";

import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth-guard";
import { createEvent } from "@/lib/db/events";
import { ERROR_MESSAGES } from "@/lib/errors";
import type { EventType } from "@/types";

export async function createEventAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  const { user } = await requireRole(schoolId, ["admin"]);

  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "practice") as EventType;
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const location = String(formData.get("location") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!title || !date || !time) {
    redirect(`/${schoolId}/events/new?error=${encodeURIComponent(ERROR_MESSAGES.EVT_002)}`);
  }

  const startsAt = new Date(`${date}T${time}:00`).toISOString();

  const { data, error } = await createEvent({
    schoolId,
    title,
    type,
    startsAt,
    location,
    note,
    createdBy: user.id,
  });

  if (error || !data) {
    redirect(`/${schoolId}/events/new?error=${encodeURIComponent(ERROR_MESSAGES.EVT_003)}`);
  }

  redirect(`/${schoolId}/events/${data.id}`);
}
