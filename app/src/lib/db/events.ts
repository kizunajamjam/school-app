import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { EventType, SchoolEvent } from "@/types";

type EventRow = {
  id: string;
  school_id: string;
  title: string;
  type: EventType;
  starts_at: string;
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

export async function createEvent(input: {
  schoolId: string;
  title: string;
  type: EventType;
  startsAt: string;
  location: string | null;
  note: string | null;
  createdBy: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      school_id: input.schoolId,
      title: input.title,
      type: input.type,
      starts_at: input.startsAt,
      location: input.location,
      note: input.note,
      created_by: input.createdBy,
    })
    .select("*")
    .single();

  return { data: data ? mapEvent(data) : null, error };
}

export async function updateEvent(
  id: string,
  patch: {
    title: string;
    type: EventType;
    startsAt: string;
    location: string | null;
    note: string | null;
  },
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .update({
      title: patch.title,
      type: patch.type,
      starts_at: patch.startsAt,
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
