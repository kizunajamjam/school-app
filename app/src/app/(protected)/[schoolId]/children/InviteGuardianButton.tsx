"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { SubmitButton } from "@/components/ui/SubmitButton";

import { createInvitationFromChildrenAction } from "./actions";

// Web Share API の有無は SSR では分からないため useSyncExternalStore で読む。
// 値は変化しないので購読は不要（noop を返す）。
const subscribeNever = () => () => {};
const getCanShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";
const getCanShareOnServer = () => false;

// 管理者用。会員(子ども)を登録できるのは保護者なので、
// 管理者側の「追加」は保護者への招待リンクを渡すことになる。
export function InviteGuardianButton({
  schoolId,
  inviteUrl,
}: {
  schoolId: string;
  inviteUrl: string | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const urlRef = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const canShare = useSyncExternalStore(subscribeNever, getCanShare, getCanShareOnServer);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // クリップボードは権限やブラウザ設定で拒否されうる。
  // 失敗しても無反応にならないよう、URL を選択状態にして手動コピーへ誘導する。
  async function copy() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("failed");
      const node = urlRef.current;
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }

  async function share() {
    if (!inviteUrl) return;
    try {
      await navigator.share({ title: "スクールへの招待", url: inviteUrl });
    } catch {
      // 共有シートのキャンセルは無視する
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="会員を追加（保護者を招待）"
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
        <div className="space-y-4 p-5">
          <div>
            <p className="font-semibold">会員を追加</p>
            <p className="mt-1 text-xs text-gray-500">
              会員の登録は保護者が行います。招待リンクを保護者に送ってください。
            </p>
          </div>

          {inviteUrl ? (
            <>
              <p
                ref={urlRef}
                className="break-all rounded-xl bg-gray-50 p-3 text-xs text-emerald-700 select-all"
              >
                {inviteUrl}
              </p>

              {copyState === "failed" && (
                <p className="text-xs text-amber-700">
                  自動コピーできませんでした。上のリンクを選択してコピーしてください。
                </p>
              )}

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={copy}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white transition active:scale-[0.98]"
                >
                  {copyState === "copied" ? "コピーしました" : "リンクをコピー"}
                </button>

                {canShare && (
                  <button
                    type="button"
                    onClick={share}
                    className="w-full rounded-xl border border-emerald-600 px-4 py-3 font-medium text-emerald-700"
                  >
                    共有する
                  </button>
                )}
              </div>

              <form action={createInvitationFromChildrenAction}>
                <input type="hidden" name="schoolId" value={schoolId} />
                <button type="submit" className="w-full py-2 text-xs text-gray-500 hover:underline">
                  新しいリンクを発行する
                </button>
              </form>
            </>
          ) : (
            <form action={createInvitationFromChildrenAction} className="space-y-2">
              <input type="hidden" name="schoolId" value={schoolId} />
              <p className="text-sm text-gray-600">
                有効な招待リンクがありません。発行してください。
              </p>
              <SubmitButton pendingText="発行中...">招待リンクを発行</SubmitButton>
            </form>
          )}

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full py-2 text-sm text-gray-500"
          >
            閉じる
          </button>
        </div>
      </dialog>
    </>
  );
}
