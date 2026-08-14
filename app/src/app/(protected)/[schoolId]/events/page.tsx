import Link from "next/link";

import { requireRole } from "@/lib/auth-guard";
import { listEvents } from "@/lib/db/events";
import { formatDateTimeShort, isPast } from "@/lib/utils/time";
import type { SchoolEvent } from "@/types";

const TYPE_LABEL = { practice: "練習", match: "試合" } as const;

export default async function EventsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  const { role } = await requireRole(schoolId, ["admin", "guardian"]);
  const events = await listEvents(schoolId);

  const upcoming = events.filter((e) => !isPast(e.startsAt));
  const past = events
    .filter((e) => isPast(e.startsAt))
    .slice()
    .reverse();

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

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500">今後の予定</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">
            予定はありません。
            {role === "admin" && "右上の＋から作成してください。"}
          </p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((e) => (
              <EventRow key={e.id} schoolId={schoolId} event={e} />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500">過去のイベント</h3>
          <ul className="space-y-2">
            {past.map((e) => (
              <EventRow key={e.id} schoolId={schoolId} event={e} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function EventRow({ schoolId, event }: { schoolId: string; event: SchoolEvent }) {
  return (
    <li>
      <Link
        href={`/${schoolId}/events/${event.id}`}
        className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
      >
        <div>
          <p className="font-medium">{event.title}</p>
          <p className="text-xs text-gray-500">
            {formatDateTimeShort(event.startsAt)}
            {event.location ? ` ・ ${event.location}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
          {TYPE_LABEL[event.type]}
        </span>
      </Link>
    </li>
  );
}
