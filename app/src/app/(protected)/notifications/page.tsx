import Link from "next/link";

import { requireUser } from "@/lib/auth-guard";
import { listNotifications } from "@/lib/db/notifications";
import { formatTimestamp } from "@/lib/utils/time";

import { markAllReadAction } from "./actions";

export default async function NotificationsPage() {
  await requireUser();
  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">お知らせ</h2>
        {unread > 0 && (
          <form action={markAllReadAction}>
            <button type="submit" className="text-xs text-emerald-700 hover:underline">
              すべて既読にする
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-gray-500">お知らせはありません。</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const content = (
              <>
                <div className="flex items-start gap-2">
                  {!n.readAt && (
                    <span
                      aria-label="未読"
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                    />
                  )}
                  <div className="min-w-0">
                    <p className={`text-sm ${n.readAt ? "text-gray-600" : "font-medium"}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="mt-0.5 text-xs text-gray-500">{n.body}</p>}
                    <p className="mt-1 text-xs text-gray-400">{formatTimestamp(n.createdAt)}</p>
                  </div>
                </div>
              </>
            );

            return (
              <li
                key={n.id}
                className={`rounded-2xl p-4 shadow-sm ring-1 ring-gray-200 ${
                  n.readAt ? "bg-white" : "bg-emerald-50/40"
                }`}
              >
                {n.link ? <Link href={n.link}>{content}</Link> : content}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
