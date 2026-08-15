import { requireRole } from "@/lib/auth-guard";
import { FormError } from "@/components/ui/FormError";
import { messageForCode } from "@/lib/errors";
import { SubmitButton } from "@/components/ui/SubmitButton";

import { createEventAction } from "./actions";

export default async function NewEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { schoolId } = await params;
  await requireRole(schoolId, ["admin"]);
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">イベントを作成</h2>
      <form action={createEventAction} className="space-y-4">
        <input type="hidden" name="schoolId" value={schoolId} />
        <FormError message={messageForCode(error)} />
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="title">
            イベント名
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="例: 週末練習"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="type">
            種別
          </label>
          <select
            id="type"
            name="type"
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5"
          >
            <option value="practice">練習</option>
            <option value="match">試合</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="date">
              日付
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="time">
              時刻
            </label>
            <input
              id="time"
              name="time"
              type="time"
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="location">
            場所（任意）
          </label>
          <input
            id="location"
            name="location"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="note">
            メモ（任意）
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
          />
        </div>
        <SubmitButton pendingText="作成中...">作成する</SubmitButton>
      </form>
    </div>
  );
}
