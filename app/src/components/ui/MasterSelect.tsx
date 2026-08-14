import type { Category, SchoolClass } from "@/types";

// カテゴリー / クラスの選択欄。空文字は「未設定」= null を表す。
// サーバー・クライアント双方から使うため "use client" は付けない。
export function MasterSelect({
  name,
  label,
  options,
  defaultValue,
}: {
  name: "categoryId" | "classId";
  label: string;
  options: (Category | SchoolClass)[];
  defaultValue: string | null;
}) {
  return (
    <label className="flex-1 text-xs text-gray-500">
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
      >
        <option value="">未設定</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
}
