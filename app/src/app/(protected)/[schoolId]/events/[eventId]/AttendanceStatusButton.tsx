"use client";

import { useEffect, useRef, useState } from "react";

import {
  ATTENDANCE_STATUSES,
  STATUS_LABEL,
  STATUS_STYLE,
} from "@/lib/constants/attendance";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { AttendanceStatus } from "@/types";

import { setAttendanceAction } from "./actions";

// 出欠バッジ → 選択ポップアップ → 確認ダイアログ、の2段構え。
// 誤タップで出欠が書き換わらないよう、確定前に必ず確認を挟む。
export function AttendanceStatusButton({
  schoolId,
  eventId,
  childId,
  childName,
  status,
}: {
  schoolId: string;
  eventId: string;
  childId: string;
  childName: string;
  status: AttendanceStatus;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AttendanceStatus | null>(null);

  // ネイティブ <dialog> を使うと Esc・フォーカストラップ・背景暗転が標準で効く。
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function close() {
    setOpen(false);
    setSelected(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`${childName} の出欠を変更（現在: ${STATUS_LABEL[status]}）`}
        className={`w-16 rounded-full py-1.5 text-xs font-medium transition active:scale-95 ${STATUS_STYLE[status]}`}
      >
        {STATUS_LABEL[status]}
      </button>

      <dialog
        ref={dialogRef}
        onClose={close}
        onClick={(e) => {
          // 背景（dialog 自身）のクリックで閉じる
          if (e.target === dialogRef.current) close();
        }}
        className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-0 backdrop:bg-black/40"
      >
        {selected === null ? (
          <div className="p-5">
            <p className="font-semibold">{childName}</p>
            <p className="mt-1 text-xs text-gray-500">変更後の出欠を選んでください。</p>

            <div className="mt-4 space-y-2">
              {ATTENDANCE_STATUSES.map((s) => {
                const isCurrent = s === status;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => setSelected(s)}
                    className={`w-full rounded-xl py-3 text-sm font-medium transition active:scale-[0.98] disabled:cursor-default disabled:opacity-50 ${STATUS_STYLE[s]}`}
                  >
                    {STATUS_LABEL[s]}
                    {isCurrent && "（現在）"}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={close}
              className="mt-4 w-full py-2 text-sm text-gray-500"
            >
              閉じる
            </button>
          </div>
        ) : (
          <form action={setAttendanceAction} className="p-5">
            <input type="hidden" name="schoolId" value={schoolId} />
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="childId" value={childId} />
            <input type="hidden" name="status" value={selected} />

            <p className="font-semibold">出欠を変更します</p>
            <p className="mt-2 text-sm text-gray-600">
              「{childName}」の出欠を
              <span className="mx-1 font-bold text-gray-900">{STATUS_LABEL[selected]}</span>
              に変更します。よろしいですか？
            </p>
            <p className="mt-1 text-xs text-gray-400">
              現在: {STATUS_LABEL[status]} → {STATUS_LABEL[selected]}
            </p>

            <div className="mt-5 space-y-2">
              <SubmitButton pendingText="変更中...">変更する</SubmitButton>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-full py-2 text-sm text-gray-500"
              >
                キャンセル
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
