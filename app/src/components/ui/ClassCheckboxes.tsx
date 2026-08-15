import type { SchoolClass } from "@/types";

// クラスは掛け持ちがあるため複数選択。
// モバイルでは <select multiple> が扱いづらいのでチェックボックスにする。
// name を揃えているので、Server Action 側は formData.getAll("classIds") で受け取る。
export function ClassCheckboxes({
  options,
  selectedIds,
}: {
  options: SchoolClass[];
  selectedIds: string[];
}) {
  if (options.length === 0) {
    return (
      <div className="text-xs text-gray-500">
        クラス
        <p className="mt-1 text-gray-400">まだクラスが登録されていません。</p>
      </div>
    );
  }

  return (
    <fieldset>
      <legend className="text-xs text-gray-500">クラス（掛け持ち可）</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm has-checked:border-violet-500 has-checked:bg-violet-50"
          >
            <input
              type="checkbox"
              name="classIds"
              value={option.id}
              defaultChecked={selectedIds.includes(option.id)}
              className="h-4 w-4 accent-violet-600"
            />
            {option.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
