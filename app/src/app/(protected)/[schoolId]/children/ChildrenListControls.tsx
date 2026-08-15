"use client";

import { useEffect, useRef, useState } from "react";

import {
  CHILD_SORT_KEYS,
  CHILD_SORT_LABEL,
  UNSET_FILTER,
  type ChildSortKey,
} from "@/lib/constants/children";
import type { Category, SchoolClass } from "@/types";

// 絞り込み・並び替えは GET フォームで querystring に載せる。
// サーバー側で読んで絞る＝状態をURLに持てるので、共有・再読み込みでも保たれる。
export function ChildrenListControls({
  categories,
  classes,
  categoryFilter,
  classFilter,
  sort,
  filterCount,
}: {
  categories: Category[];
  classes: SchoolClass[];
  categoryFilter: string;
  classFilter: string;
  sort: ChildSortKey;
  filterCount: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterDialogButton
        categories={categories}
        classes={classes}
        categoryFilter={categoryFilter}
        classFilter={classFilter}
        sort={sort}
        filterCount={filterCount}
      />
      <SortDialogButton sort={sort} categoryFilter={categoryFilter} classFilter={classFilter} />
    </div>
  );
}

function useDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return { ref, open, setOpen };
}

const TRIGGER_CLASS =
  "rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition active:scale-95";

const DIALOG_CLASS = "w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-0 backdrop:bg-black/40";

function FilterDialogButton({
  categories,
  classes,
  categoryFilter,
  classFilter,
  sort,
  filterCount,
}: {
  categories: Category[];
  classes: SchoolClass[];
  categoryFilter: string;
  classFilter: string;
  sort: ChildSortKey;
  filterCount: number;
}) {
  const { ref, setOpen } = useDialog();
  const active = filterCount > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={
          active
            ? "rounded-full border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition active:scale-95"
            : TRIGGER_CLASS
        }
      >
        絞り込み{active ? ` (${filterCount})` : ""}
      </button>

      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false);
        }}
        className={DIALOG_CLASS}
      >
        <form method="get" className="space-y-4 p-5">
          {/* 並び替えは維持したまま絞り込みだけ差し替える */}
          <input type="hidden" name="sort" value={sort} />
          <p className="font-semibold">絞り込み</p>

          <label className="block text-xs text-gray-500">
            カテゴリー
            <select
              name="category"
              defaultValue={categoryFilter}
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
            >
              <option value="">すべて</option>
              <option value={UNSET_FILTER}>未設定のみ</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {/* 掛け持ちがあるので「そのクラスに所属しているか」で絞る */}
          <label className="block text-xs text-gray-500">
            クラス（所属しているもので絞る）
            <select
              name="class"
              defaultValue={classFilter}
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
            >
              <option value="">すべて</option>
              <option value={UNSET_FILTER}>未所属のみ</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white transition active:scale-[0.98]"
            >
              適用する
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full py-2 text-sm text-gray-500"
            >
              キャンセル
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

function SortDialogButton({
  sort,
  categoryFilter,
  classFilter,
}: {
  sort: ChildSortKey;
  categoryFilter: string;
  classFilter: string;
}) {
  const { ref, setOpen } = useDialog();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={TRIGGER_CLASS}
      >
        並び替え: {CHILD_SORT_LABEL[sort]}
      </button>

      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) setOpen(false);
        }}
        className={DIALOG_CLASS}
      >
        <form method="get" className="space-y-4 p-5">
          {/* 絞り込みは維持したまま並び順だけ差し替える */}
          <input type="hidden" name="category" value={categoryFilter} />
          <input type="hidden" name="class" value={classFilter} />
          <p className="font-semibold">並び替え</p>

          <div className="space-y-1">
            {CHILD_SORT_KEYS.map((key) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="sort"
                  value={key}
                  defaultChecked={key === sort}
                  className="h-4 w-4 accent-emerald-600"
                />
                {CHILD_SORT_LABEL[key]}
              </label>
            ))}
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white transition active:scale-[0.98]"
            >
              適用する
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full py-2 text-sm text-gray-500"
            >
              キャンセル
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
