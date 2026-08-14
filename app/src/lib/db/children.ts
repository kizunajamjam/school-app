import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Child, ChildWithLabels } from "@/types";

type ChildRow = {
  id: string;
  school_id: string;
  guardian_id: string;
  name: string;
  grade: string | null;
  category_id: string | null;
  class_id: string | null;
  created_at: string;
};

type NamedRelation = { name: string } | { name: string }[] | null;

function relationName(relation: NamedRelation): string | null {
  const row = Array.isArray(relation) ? relation[0] : relation;
  return row?.name ?? null;
}

function mapChild(row: ChildRow): Child {
  return {
    id: row.id,
    schoolId: row.school_id,
    guardianId: row.guardian_id,
    name: row.name,
    grade: row.grade,
    categoryId: row.category_id,
    classId: row.class_id,
    createdAt: row.created_at,
  };
}

// マスタ名まで解決した一覧。カテゴリー/クラスは未設定(null)がありうる。
const WITH_LABELS_SELECT = "*, categories(name), classes(name)";

export async function listChildren(schoolId: string): Promise<ChildWithLabels[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("children")
    .select(WITH_LABELS_SELECT)
    .eq("school_id", schoolId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    ...mapChild(row),
    categoryName: relationName(row.categories),
    className: relationName(row.classes),
  }));
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

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      ...mapChild(row),
      categoryName: relationName(row.categories),
      className: relationName(row.classes),
      guardianName: (profile?.display_name as string | undefined) ?? "不明",
    };
  });
}

export async function createChild(input: {
  schoolId: string;
  guardianId: string;
  name: string;
  grade: string | null;
  categoryId: string | null;
  classId: string | null;
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
      class_id: input.classId,
    })
    .select("*")
    .single();

  return { data: data ? mapChild(data) : null, error };
}

export async function updateChild(
  id: string,
  patch: {
    name: string;
    grade: string | null;
    categoryId: string | null;
    classId: string | null;
  },
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .update({
      name: patch.name,
      grade: patch.grade,
      category_id: patch.categoryId,
      class_id: patch.classId,
    })
    .eq("id", id)
    .select("*")
    .single();

  return { data: data ? mapChild(data) : null, error };
}

export async function deleteChild(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("children").delete().eq("id", id);
  return { error };
}
