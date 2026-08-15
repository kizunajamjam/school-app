"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth-guard";
import { markAllNotificationsRead } from "@/lib/db/notifications";

export async function markAllReadAction() {
  await requireUser();
  // RLS が自分宛てに限定しているので、対象の絞り込みは不要。
  await markAllNotificationsRead();
  redirect("/notifications");
}
