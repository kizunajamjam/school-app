import { jstParts } from "@/lib/utils/time";
import type { SchoolEvent } from "@/types";

// 作成と編集で同じ入力欄を使う。event を渡すと初期値が入る。
export function EventFormFields({ event }: { event?: SchoolEvent }) {
  const start = event ? jstParts(event.startsAt) : null;
  const deadline = event?.deadlineAt ? jstParts(event.deadlineAt) : null;

  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="title">
          イベント名
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={event?.title}
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
          defaultValue={event?.type ?? "practice"}
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
            defaultValue={start?.date}
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
            defaultValue={start?.time}
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
          defaultValue={event?.location ?? ""}
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
        />
      </div>

      <fieldset className="rounded-xl bg-gray-50 p-3">
        <legend className="px-1 text-sm font-medium">出欠の締切（任意）</legend>
        <p className="mb-2 text-xs text-gray-500">
          締切を過ぎると保護者は出欠を変更できなくなります。管理者は締切後も訂正できます。
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input
            name="deadlineDate"
            type="date"
            aria-label="締切日"
            defaultValue={deadline?.date ?? ""}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5"
          />
          <input
            name="deadlineTime"
            type="time"
            aria-label="締切時刻"
            defaultValue={deadline?.time ?? ""}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5"
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">両方とも空にすると締切なしになります。</p>
      </fieldset>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="note">
          メモ（任意）
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          defaultValue={event?.note ?? ""}
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
        />
      </div>
    </>
  );
}
