"use server";

import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth-guard";
import { createEvent } from "@/lib/db/events";
import { parseEventForm } from "../eventForm";

export async function createEventAction(formData: FormData) {
  const schoolId = String(formData.get("schoolId") ?? "");
  const { user } = await requireRole(schoolId, ["admin"]);

  const parsed = parseEventForm(formData);
  if ("errorCode" in parsed) {
    redirect(`/${schoolId}/events/new?error=${parsed.errorCode}`);
  }

  const { data, error } = await createEvent({ ...parsed, schoolId, createdBy: user.id });
  if (error || !data) {
    redirect(`/${schoolId}/events/new?error=EVT_003`);
  }

  redirect(`/${schoolId}/events/${data.id}`);
}
