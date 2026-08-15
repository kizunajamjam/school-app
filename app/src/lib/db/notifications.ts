import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/server";
import type { AppNotification, NotificationType } from "@/types";

type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

function mapNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

// ヘッダーのバッジ用。全ページで表示するので React.cache でリクエスト内に1回だけにする。
export const countUnreadNotifications = cache(async (): Promise<number> => {
  const user = await getCurrentUser();
  if (!user) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  return count ?? 0;
});

export async function listNotifications(limit = 50): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map(mapNotification);
}

// RLS が自分宛てに限定しているので、条件は「未読のもの」だけでよい。
export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  return { error };
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);

  return { error };
}
