import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { EventType, SchoolEvent } from "@/types";

type EventRow = {
  id: string;
  school_id: string;
  title: string;
  type: EventType;
  starts_at: string;
  deadline_at: string | null;
  location: string | null;
  note: string | null;
  created_by: string;
  created_at: string;
};

function mapEvent(row: EventRow): SchoolEvent {
  return {
    id: row.id,
    schoolId: row.school_id,
    title: row.title,
    type: row.type,
    startsAt: row.starts_at,
    deadlineAt: row.deadline_at,
    location: row.location,
    note: row.note,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function listEvents(schoolId: string): Promise<SchoolEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("school_id", schoolId)
    .order("starts_at", { ascending: true });

  return (data ?? []).map(mapEvent);
}

export async function getEvent(eventId: string): Promise<SchoolEvent | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("id", eventId).maybeSingle();
  return data ? mapEvent(data) : null;
}

export type EventInput = {
  title: string;
  type: EventType;
  startsAt: string;
  deadlineAt: string | null;
  location: string | null;
  note: string | null;
};

export async function createEvent(input: EventInput & { schoolId: string; createdBy: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      school_id: input.schoolId,
      title: input.title,
      type: input.type,
      starts_at: input.startsAt,
      deadline_at: input.deadlineAt,
      location: input.location,
      note: input.note,
      created_by: input.createdBy,
    })
    .select("*")
    .single();

  return { data: data ? mapEvent(data) : null, error };
}

// 更新すると notify_guardians_of_event トリガーが保護者へ通知を作る
// （日時・タイトル・場所・締切のいずれかが変わった場合のみ）。
export async function updateEvent(id: string, patch: EventInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .update({
      title: patch.title,
      type: patch.type,
      starts_at: patch.startsAt,
      deadline_at: patch.deadlineAt,
      location: patch.location,
      note: patch.note,
    })
    .eq("id", id)
    .select("*")
    .single();

  return { data: data ? mapEvent(data) : null, error };
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  return { error };
}
