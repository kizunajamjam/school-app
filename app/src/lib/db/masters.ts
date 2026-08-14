import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Category, SchoolClass } from "@/types";

// カテゴリーとクラスは構造が同じ「スクール単位のマスタ」なので同じファイルにまとめる。

type MasterRow = {
  id: string;
  school_id: string;
  name: string;
  created_at: string;
};

function mapMaster(row: MasterRow) {
  return {
    id: row.id,
    schoolId: row.school_id,
    name: row.name,
    createdAt: row.created_at,
  };
}

export async function listCategories(schoolId: string): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: true });

  return (data ?? []).map(mapMaster);
}

export async function createCategory(schoolId: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ school_id: schoolId, name });
  return { error };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  return { error };
}

export async function listClasses(schoolId: string): Promise<SchoolClass[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: true });

  return (data ?? []).map(mapMaster);
}

export async function createClass(schoolId: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("classes").insert({ school_id: schoolId, name });
  return { error };
}

export async function deleteClass(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("classes").delete().eq("id", id);
  return { error };
}
