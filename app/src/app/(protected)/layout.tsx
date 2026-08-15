import Link from "next/link";

import { requireUser } from "@/lib/auth-guard";
import { countUnreadNotifications } from "@/lib/db/notifications";

import { logout } from "./actions";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const unread = await countUnreadNotifications();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/dashboard" className="font-bold text-emerald-700">
          ⚽ school-app
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/notifications"
            aria-label={unread > 0 ? `お知らせ（未読 ${unread} 件）` : "お知らせ"}
            className="relative text-gray-500 hover:text-gray-700"
          >
            <span aria-hidden className="text-lg">
              🔔
            </span>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] leading-4 font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <form action={logout}>
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
              ログアウト
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-sm flex-1 px-4 py-6 lg:max-w-2xl">{children}</main>
    </div>
  );
}
