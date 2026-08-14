import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth-guard";
import { getEvent } from "@/lib/db/events";
import { listAttendanceForEvent, listAttendanceLogsByChild } from "@/lib/db/attendance";
import { listChildren, listChildrenWithGuardianName } from "@/lib/db/children";
import { FormError } from "@/components/ui/FormError";
import { STATUS_LABEL } from "@/lib/constants/attendance";
import type { AttendanceLog, AttendanceStatus, ChildWithLabels } from "@/types";

import { deleteEventAction } from "./actions";
import { AttendanceStatusButton } from "./AttendanceStatusButton";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string; eventId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { schoolId, eventId } = await params;
  const { user, role } = await requireRole(schoolId, ["admin", "guardian"]);
  const { error } = await searchParams;

  const event = await getEvent(eventId);
  if (!event || event.schoolId !== schoolId) notFound();

  const [attendance, logsByChild] = await Promise.all([
    listAttendanceForEvent(eventId),
    listAttendanceLogsByChild(eventId),
  ]);
  const attendanceByChild = new Map(attendance.map((a) => [a.childId, a.status]));

  // 管理者は全会員（保護者名つき）、保護者は自分の子どものみ。
  const rows: (ChildWithLabels & { guardianName?: string })[] =
    role === "admin"
      ? await listChildrenWithGuardianName(schoolId)
      : (await listChildren(schoolId)).filter((c) => c.guardianId === user.id);

  const counts: Record<AttendanceStatus, number> = { attending: 0, absent: 0, undecided: 0 };
  for (const r of rows) {
    counts[attendanceByChild.get(r.id) ?? "undecided"] += 1;
  }

  const date = new Date(event.startsAt);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <p className="text-xs text-gray-500">{event.type === "practice" ? "練習" : "試合"}</p>
        <h2 className="text-lg font-bold">{event.title}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {date.toLocaleString("ja-JP", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {event.location && <p className="text-sm text-gray-600">場所: {event.location}</p>}
        {event.note && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{event.note}</p>}
      </div>

      {role === "admin" && (
        <div className="flex gap-2 text-sm">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
            参加 {counts.attending}
          </span>
          <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">欠席 {counts.absent}</span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
            未定 {counts.undecided}
          </span>
        </div>
      )}

      <FormError message={error} />

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-500">
            {role === "admin" ? "出欠状況" : "お子さまの出欠"}
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            出欠バッジをタップすると変更できます（確認あり）。名前をタップすると回答履歴を表示します。
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">
            {role === "admin" ? "登録された会員がいません。" : "お子さまが登録されていません。"}
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((child) => (
              <AttendanceRow
                key={child.id}
                schoolId={schoolId}
                eventId={eventId}
                child={child}
                guardianName={child.guardianName}
                status={attendanceByChild.get(child.id) ?? "undecided"}
                logs={logsByChild.get(child.id) ?? []}
              />
            ))}
          </ul>
        )}
      </section>

      {role === "admin" && (
        <form action={deleteEventAction}>
          <input type="hidden" name="schoolId" value={schoolId} />
          <input type="hidden" name="eventId" value={eventId} />
          <button type="submit" className="text-sm text-red-600 hover:underline">
            このイベントを削除する
          </button>
        </form>
      )}
    </div>
  );
}

function AttendanceRow({
  schoolId,
  eventId,
  child,
  guardianName,
  status,
  logs,
}: {
  schoolId: string;
  eventId: string;
  child: ChildWithLabels;
  guardianName?: string;
  status: AttendanceStatus;
  logs: AttendanceLog[];
}) {
  return (
    <li className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
      <div className="flex items-start gap-3">
        {/* details/summary で JS 無しに履歴を開閉する */}
        <details className="min-w-0 flex-1">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="font-medium">
              {child.name}
              {child.grade ? `（${child.grade}）` : ""}
            </span>
            <span className="ml-1 text-xs text-gray-400">▾</span>
            {(child.categoryName || child.className || guardianName) && (
              <span className="mt-0.5 flex flex-wrap items-center gap-1 text-xs">
                {child.categoryName && (
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700">
                    {child.categoryName}
                  </span>
                )}
                {child.className && (
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-700">
                    {child.className}
                  </span>
                )}
                {guardianName && <span className="text-gray-500">保護者: {guardianName}</span>}
              </span>
            )}
          </summary>

          <div className="mt-3 border-t border-gray-100 pt-2">
            <p className="mb-1 text-xs font-semibold text-gray-500">回答履歴</p>
            {logs.length === 0 ? (
              <p className="text-xs text-gray-400">まだ回答がありません。</p>
            ) : (
              <ol className="space-y-1">
                {logs.map((log) => (
                  <li key={log.id} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="tabular-nums text-gray-400">
                      {formatDateTime(log.changedAt)}
                    </span>
                    <span className="font-medium">{STATUS_LABEL[log.status]}</span>
                    {log.changedByName && <span className="text-gray-400">{log.changedByName}</span>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </details>

        <div className="shrink-0">
          <AttendanceStatusButton
            schoolId={schoolId}
            eventId={eventId}
            childId={child.id}
            childName={child.name}
            status={status}
          />
        </div>
      </div>
    </li>
  );
}
