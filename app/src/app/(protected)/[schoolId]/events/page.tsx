import Link from "next/link";

import { requireRole } from "@/lib/auth-guard";
import { listAttendanceForChildren } from "@/lib/db/attendance";
import { listChildren } from "@/lib/db/children";
import { listEvents } from "@/lib/db/events";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/constants/attendance";
import { formatDateTimeShort, isPast } from "@/lib/utils/time";
import type { AttendanceStatus, Child, SchoolEvent } from "@/types";

const TYPE_LABEL = { practice: "練習", match: "試合" } as const;

export default async function EventsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  const { user, role } = await requireRole(schoolId, ["admin", "guardian"]);
  const events = await listEvents(schoolId);

  // 保護者には、イベントごとに自分の子どもの回答状況を出す。
  // 未回答のイベントには attendance 行が無いので「未定」として扱う。
  let myChildren: Child[] = [];
  const statusByEvent = new Map<string, Map<string, AttendanceStatus>>();

  if (role === "guardian") {
    myChildren = (await listChildren(schoolId)).filter((c) => c.guardianId === user.id);
    const rows = await listAttendanceForChildren(myChildren.map((c) => c.id));
    for (const row of rows) {
      const forEvent = statusByEvent.get(row.eventId) ?? new Map<string, AttendanceStatus>();
      forEvent.set(row.childId, row.status);
      statusByEvent.set(row.eventId, forEvent);
    }
  }

  const upcoming = events.filter((e) => !isPast(e.startsAt));
  const past = events
    .filter((e) => isPast(e.startsAt))
    .slice()
    .reverse();

  // 未回答が残っている今後のイベント数（保護者向けの気づき用）
  const unansweredCount =
    role === "guardian" && myChildren.length > 0
      ? upcoming.filter((e) =>
          myChildren.some((c) => (statusByEvent.get(e.id)?.get(c.id) ?? "undecided") === "undecided"),
        ).length
      : 0;

  const renderRow = (event: SchoolEvent) => (
    <EventRow
      key={event.id}
      schoolId={schoolId}
      event={event}
      myChildren={myChildren}
      statuses={statusByEvent.get(event.id)}
    />
  );

  return (
    <div className="space-y-6">
      {/* 会員タブと同じく「タイトル＋右上の＋」に揃える */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">イベント</h2>
        {role === "admin" && (
          <Link
            href={`/${schoolId}/events/new`}
            aria-label="イベントを作成"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xl leading-none text-white transition active:scale-95"
          >
            +
          </Link>
        )}
      </div>

      {unansweredCount > 0 && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          未回答のイベントが {unansweredCount} 件あります。
        </p>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500">今後の予定</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">
            予定はありません。
            {role === "admin" && "右上の＋から作成してください。"}
          </p>
        ) : (
          <ul className="space-y-2">{upcoming.map(renderRow)}</ul>
        )}
      </section>

      {past.length > 0 && (
        // 過去のイベントは増える一方なので既定では畳んでおく。
        // 開閉だけなので details/summary で済ませる（クライアントJS不要）。
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-gray-500 [&::-webkit-details-marker]:hidden">
            過去のイベント
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-500">
              {past.length}件
            </span>
            <span className="text-xs text-gray-400 group-open:hidden">表示する ▾</span>
            <span className="hidden text-xs text-gray-400 group-open:inline">隠す ▴</span>
          </summary>
          <ul className="mt-3 space-y-2">{past.map(renderRow)}</ul>
        </details>
      )}
    </div>
  );
}

function EventRow({
  schoolId,
  event,
  myChildren,
  statuses,
}: {
  schoolId: string;
  event: SchoolEvent;
  // 保護者の場合のみ渡る。管理者は空配列。
  myChildren: Child[];
  statuses: Map<string, AttendanceStatus> | undefined;
}) {
  const showsMyAnswer = myChildren.length > 0;
  const isSingleChild = myChildren.length === 1;

  return (
    <li>
      <Link
        href={`/${schoolId}/events/${event.id}`}
        className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium">{event.title}</p>
            <p className="text-xs text-gray-500">
              {formatDateTimeShort(event.startsAt)}
              {event.location ? ` ・ ${event.location}` : ""}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
            {TYPE_LABEL[event.type]}
          </span>
        </div>

        {showsMyAnswer && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 pt-2">
            {myChildren.map((child) => {
              const status = statuses?.get(child.id) ?? "undecided";
              return (
                <span key={child.id} className="flex items-center gap-1.5 text-xs">
                  {/* 1人だけなら名前は自明なので出さない */}
                  {!isSingleChild && <span className="text-gray-500">{child.name}</span>}
                  <span className={`rounded-full px-2 py-0.5 ${STATUS_STYLE[status]}`}>
                    {STATUS_LABEL[status]}
                  </span>
                </span>
              );
            })}
          </div>
        )}
      </Link>
    </li>
  );
}
