// サーバー / クライアント双方から参照するため server-only を付けないこと。

export type ChildSortKey = "created" | "name" | "category" | "class";

export const CHILD_SORT_KEYS: ChildSortKey[] = ["created", "name", "category", "class"];

export const CHILD_SORT_LABEL: Record<ChildSortKey, string> = {
  created: "登録順",
  name: "名前順",
  category: "カテゴリー順",
  class: "クラス順",
};

// 絞り込みで「未設定のものだけ」を選ぶための値。UUID と衝突しない文字列にしている。
export const UNSET_FILTER = "none";

export function parseSortKey(value: string | undefined): ChildSortKey {
  return CHILD_SORT_KEYS.includes(value as ChildSortKey) ? (value as ChildSortKey) : "created";
}
