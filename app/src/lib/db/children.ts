import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Child, ChildWithLabels } from "@/types";

type ChildClassRow = { classes: { id: string; name: string } | { id: string; name: string }[] | null };

type ChildRow = {
  id: string;
  school_id: string;
  guardian_id: string;
  name: string;
  grade: string | null;
  category_id: string | null;
  created_at: string;
  categories?: { name: string } | { name: string }[] | null;
  child_classes?: ChildClassRow[] | null;
  profiles?: { display_name: string } | { display_name: string }[] | null;
};

function firstOf<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// 掛け持ちがあるので、クラスは常に配列で扱う。
function classesOf(row: ChildRow): { id: string; name: string }[] {
  return (row.child_classes ?? [])
    .map((link) => firstOf(link.classes))
    .filter((c): c is { id: string; name: string } => c !== null);
}

function mapChild(row: ChildRow): Child {
  return {
    id: row.id,
    schoolId: row.school_id,
    guardianId: row.guardian_id,
    name: row.name,
    grade: row.grade,
    categoryId: row.category_id,
    classIds: classesOf(row).map((c) => c.id),
    createdAt: row.created_at,
  };
}

function mapChildWithLabels(row: ChildRow): ChildWithLabels {
  return {
    ...mapChild(row),
    categoryName: firstOf(row.categories)?.name ?? null,
    classNames: classesOf(row).map((c) => c.name),
  };
}

const WITH_LABELS_SELECT = "*, categories(name), child_classes(classes(id, name))";

export async function listChildren(schoolId: string): Promise<ChildWithLabels[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("children")
    .select(WITH_LABELS_SELECT)
    .eq("school_id", schoolId)
    .order("created_at", { ascending: true });

  return (data ?? []).map(mapChildWithLabels);
}

export async function listChildrenWithGuardianName(
  schoolId: string,
): Promise<(ChildWithLabels & { guardianName: string })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("children")
    .select(`${WITH_LABELS_SELECT}, profiles!children_guardian_id_fkey(display_name)`)
    .eq("school_id", schoolId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    ...mapChildWithLabels(row),
    guardianName: firstOf(row.profiles)?.display_name ?? "不明",
  }));
}

// クラスの割り当ては入れ替え（全消し→再作成）。件数が少ないので差分計算はしない。
async function replaceChildClasses(childId: string, classIds: string[]) {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("child_classes")
    .delete()
    .eq("child_id", childId);
  if (deleteError) return { error: deleteError };

  if (classIds.length === 0) return { error: null };

  const { error } = await supabase
    .from("child_classes")
    .insert(classIds.map((classId) => ({ child_id: childId, class_id: classId })));

  return { error };
}

export async function createChild(input: {
  schoolId: string;
  guardianId: string;
  name: string;
  grade: string | null;
  categoryId: string | null;
  classIds: string[];
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .insert({
      school_id: input.schoolId,
      guardian_id: input.guardianId,
      name: input.name,
      grade: input.grade,
      category_id: input.categoryId,
    })
    .select("*")
    .single();

  if (error || !data) return { data: null, error };

  const { error: classError } = await replaceChildClasses(data.id, input.classIds);
  if (classError) return { data: null, error: classError };

  return { data: mapChild(data), error: null };
}

export async function updateChild(
  id: string,
  patch: {
    name: string;
    grade: string | null;
    categoryId: string | null;
    classIds: string[];
  },
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .update({
      name: patch.name,
      grade: patch.grade,
      category_id: patch.categoryId,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) return { data: null, error };

  const { error: classError } = await replaceChildClasses(id, patch.classIds);
  if (classError) return { data: null, error: classError };

  return { data: mapChild(data), error: null };
}

export async function deleteChild(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("children").delete().eq("id", id);
  return { error };
}
