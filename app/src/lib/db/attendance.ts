import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Attendance, AttendanceLog, AttendanceStatus } from "@/types";

type AttendanceRow = {
  id: string;
  event_id: string;
  child_id: string;
  status: AttendanceStatus;
  updated_by: string | null;
  updated_at: string;
};

function mapAttendance(row: AttendanceRow): Attendance {
  return {
    id: row.id,
    eventId: row.event_id,
    childId: row.child_id,
    status: row.status,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

export async function listAttendanceForEvent(eventId: string): Promise<Attendance[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("attendance").select("*").eq("event_id", eventId);
  return (data ?? []).map(mapAttendance);
}

// 子どもごとにまとめた変更履歴（新しい順）。
export async function listAttendanceLogsByChild(
  eventId: string,
): Promise<Map<string, AttendanceLog[]>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance_logs")
    .select("*, profiles(display_name)")
    .eq("event_id", eventId)
    .order("changed_at", { ascending: false });

  const byChild = new Map<string, AttendanceLog[]>();

  for (const row of data ?? []) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const log: AttendanceLog = {
      id: row.id,
      eventId: row.event_id,
      childId: row.child_id,
      status: row.status,
      changedByName: (profile?.display_name as string | undefined) ?? null,
      changedAt: row.changed_at,
    };
    const list = byChild.get(log.childId);
    if (list) list.push(log);
    else byChild.set(log.childId, [log]);
  }

  return byChild;
}

export async function upsertAttendance(input: {
  eventId: string;
  childId: string;
  status: AttendanceStatus;
  updatedBy: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance")
    .upsert(
      {
        event_id: input.eventId,
        child_id: input.childId,
        status: input.status,
        updated_by: input.updatedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id,child_id" },
    )
    .select("*")
    .single();

  return { data: data ? mapAttendance(data) : null, error };
}
