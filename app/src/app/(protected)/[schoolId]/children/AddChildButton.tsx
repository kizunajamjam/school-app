"use client";

import { useEffect, useRef, useState } from "react";

import { MasterSelect } from "@/components/ui/MasterSelect";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Category, SchoolClass } from "@/types";

import { createChildAction } from "./actions";

// 保護者用。右上の + からお子さまを登録する。
export function AddChildButton({
  schoolId,
  categories,
  classes,
}: {
  schoolId: string;
  categories: Category[];
  classes: SchoolClass[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="お子さまを追加"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xl leading-none text-white transition active:scale-95"
      >
        +
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
        className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-0 backdrop:bg-black/40"
      >
        <form action={createChildAction} className="space-y-4 p-5">
          <input type="hidden" name="schoolId" value={schoolId} />
          <p className="font-semibold">お子さまを追加</p>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="new-child-name">
              お名前
            </label>
            <input
              id="new-child-name"
              name="name"
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="new-child-grade">
              学年（任意）
            </label>
            <input
              id="new-child-grade"
              name="grade"
              placeholder="例: 小学3年"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
            />
          </div>

          <div className="flex gap-2">
            <MasterSelect
              name="categoryId"
              label="カテゴリー"
              options={categories}
              defaultValue={null}
            />
            <MasterSelect name="classId" label="クラス" options={classes} defaultValue={null} />
          </div>

          <div className="space-y-2 pt-1">
            <SubmitButton pendingText="登録中...">追加する</SubmitButton>
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
