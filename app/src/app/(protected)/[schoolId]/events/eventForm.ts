import "server-only";

import { jstInputToIso } from "@/lib/utils/time";
import type { ErrorCode } from "@/lib/errors";
import type { EventType } from "@/types";

type ParsedEvent = {
  title: string;
  type: EventType;
  startsAt: string;
  deadlineAt: string | null;
  location: string | null;
  note: string | null;
};

// 作成と編集で同じフォームを使うので、パースも共通化する。
// 入力欄の値は日本時間なので、サーバーのタイムゾーンに引きずられないよう明示的に変換する。
export function parseEventForm(formData: FormData): ParsedEvent | { errorCode: ErrorCode } {
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "practice") as EventType;
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");

  if (!title || !date || !time) return { errorCode: "EVT_002" };

  const deadlineDate = String(formData.get("deadlineDate") ?? "");
  const deadlineTime = String(formData.get("deadlineTime") ?? "");

  // 片方だけ入っている状態は指定ミスとして弾く（意図せず締切なしになるのを防ぐ）
  if (Boolean(deadlineDate) !== Boolean(deadlineTime)) return { errorCode: "EVT_004" };

  const startsAt = jstInputToIso(date, time);
  const deadlineAt = deadlineDate ? jstInputToIso(deadlineDate, deadlineTime) : null;

  if (deadlineAt && deadlineAt > startsAt) return { errorCode: "EVT_005" };

  return {
    title,
    type,
    startsAt,
    deadlineAt,
    location: String(formData.get("location") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim() || null,
  };
}
