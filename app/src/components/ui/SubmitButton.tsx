"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText,
}: {
  children: React.ReactNode;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? (pendingText ?? "処理中...") : children}
    </button>
  );
}
